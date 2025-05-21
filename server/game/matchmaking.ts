import { Game, User, GameStatus } from "@shared/schema";
import { storage } from "../storage";

/**
 * Enhanced matchmaking algorithm for the Big Boys Game platform
 * This algorithm pairs players based on multiple factors:
 * - Stake amount (players with similar stakes are matched)
 * - Currency preferences (matching players with the same currency)
 * - User skill level (calculated from win rate and game history)
 * - Time waiting in queue (longer wait = higher priority)
 */

export interface MatchmakingPlayer {
  user: User;
  stakeAmount: number;
  currency: string;
  joinedAt: Date;
  skillLevel?: number; // Optional skill level, calculated from player history
  preferredGameSize?: number; // Optional preferred number of players
}

export interface MatchmakingResult {
  success: boolean;
  game?: Game;
  message?: string;
  players: User[];
}

// Queue of players waiting for a match
const waitingPlayers: Map<number, MatchmakingPlayer> = new Map();

/**
 * Add a player to the matchmaking queue
 */
export async function addPlayerToQueue(
  userId: number, 
  stakeAmount: number, 
  currency: string = "NGN",
  preferredGameSize?: number
): Promise<void> {
  // Get user details
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error("User not found");
  }
  
  // Calculate skill level from user's game history
  const skillLevel = await calculatePlayerSkill(userId);
  
  // Add player to queue
  waitingPlayers.set(userId, {
    user,
    stakeAmount,
    currency,
    joinedAt: new Date(),
    skillLevel,
    preferredGameSize
  });
  
  console.log(`Player ${user.username} added to matchmaking queue. ${waitingPlayers.size} players waiting.`);
}

/**
 * Remove a player from the matchmaking queue
 */
export function removePlayerFromQueue(userId: number): boolean {
  return waitingPlayers.delete(userId);
}

/**
 * Calculate player skill level based on game history
 * Returns a score between 0-100
 */
async function calculatePlayerSkill(userId: number): Promise<number> {
  // Get player's games
  const playerGames = await storage.getUserGames(userId);
  
  if (playerGames.length === 0) {
    return 50; // Default skill level for new players
  }
  
  // Calculate win rate
  const participatedGames = playerGames.filter(game => game.status === "completed");
  
  if (participatedGames.length === 0) {
    return 50; // Default for players with no completed games
  }
  
  let wins = 0;
  
  for (const game of participatedGames) {
    // This requires some changes to the storage interface to get winners for a specific game
    // We'll approximate this for now
    const gamePlayers = await storage.getGamePlayers(game.id);
    const winnerPlayers = gamePlayers.filter(gp => gp.isWinner);
    
    if (winnerPlayers.some(wp => wp.userId === userId)) {
      wins++;
    }
  }
  
  const winRate = wins / participatedGames.length;
  
  // Adjust skill level based on win rate and number of games played
  // More games played = more accurate skill level
  const experienceFactor = Math.min(1, participatedGames.length / 10); // Caps at 10 games
  const baseSkill = winRate * 100;
  const adjustedSkill = 50 + (baseSkill - 50) * experienceFactor;
  
  return Math.round(adjustedSkill);
}

/**
 * Find optimal matches based on stake, currency, skill and wait time
 */
export async function findMatches(): Promise<MatchmakingResult[]> {
  if (waitingPlayers.size < 2) {
    return []; // Not enough players to match
  }
  
  const results: MatchmakingResult[] = [];
  const matchedPlayerIds = new Set<number>();
  const players = Array.from(waitingPlayers.values());
  
  // Sort by wait time (longest wait first)
  players.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
  
  for (const player of players) {
    // Skip already matched players
    if (matchedPlayerIds.has(player.user.id)) {
      continue;
    }
    
    // Find potential match candidates
    const candidates = players.filter(p => 
      !matchedPlayerIds.has(p.user.id) && 
      p.user.id !== player.user.id &&
      p.currency === player.currency && 
      Math.abs(p.stakeAmount - player.stakeAmount) <= player.stakeAmount * 0.2 // Within 20% of stake
    );
    
    if (candidates.length === 0) {
      continue;
    }
    
    // Sort candidates by best match quality
    candidates.sort((a, b) => {
      // Calculate match score based on stake similarity, skill level and wait time
      const stakeSimA = 1 - Math.abs(a.stakeAmount - player.stakeAmount) / player.stakeAmount;
      const stakeSimB = 1 - Math.abs(b.stakeAmount - player.stakeAmount) / player.stakeAmount;
      
      const skillSimA = player.skillLevel && a.skillLevel 
        ? 1 - Math.abs(player.skillLevel - a.skillLevel) / 100 
        : 0.5;
      const skillSimB = player.skillLevel && b.skillLevel 
        ? 1 - Math.abs(player.skillLevel - b.skillLevel) / 100 
        : 0.5;
      
      const waitTimeA = (new Date().getTime() - a.joinedAt.getTime()) / 60000; // minutes
      const waitTimeB = (new Date().getTime() - b.joinedAt.getTime()) / 60000; // minutes
      const waitFactorA = Math.min(1, waitTimeA / 5); // Cap at 5 minutes
      const waitFactorB = Math.min(1, waitTimeB / 5); // Cap at 5 minutes
      
      // Calculate overall match score
      const scoreA = stakeSimA * 0.5 + skillSimA * 0.3 + waitFactorA * 0.2;
      const scoreB = stakeSimB * 0.5 + skillSimB * 0.3 + waitFactorB * 0.2;
      
      return scoreB - scoreA; // Higher score first
    });
    
    // Get the best candidate
    const match = candidates[0];
    
    // Determine game parameters (use the lower stake for fairness)
    const gameStake = Math.min(player.stakeAmount, match.stakeAmount);
    const gameCurrency = player.currency;
    
    // Determine preferred game size (default to 2 players)
    const gameSize = player.preferredGameSize || match.preferredGameSize || 2;
    
    // Find additional players if needed
    const additionalPlayers: MatchmakingPlayer[] = [];
    if (gameSize > 2) {
      // Find players with similar stakes, currency and skill level
      const moreMatches = players.filter(p => 
        !matchedPlayerIds.has(p.user.id) && 
        p.user.id !== player.user.id && 
        p.user.id !== match.user.id &&
        p.currency === gameCurrency && 
        Math.abs(p.stakeAmount - gameStake) <= gameStake * 0.2 // Within 20% of game stake
      );
      
      // Sort by best match quality (similar to above)
      moreMatches.sort((a, b) => {
        const stakeSimA = 1 - Math.abs(a.stakeAmount - gameStake) / gameStake;
        const stakeSimB = 1 - Math.abs(b.stakeAmount - gameStake) / gameStake;
        
        const skillSimA = player.skillLevel && a.skillLevel 
          ? 1 - Math.abs(player.skillLevel - a.skillLevel) / 100 
          : 0.5;
        const skillSimB = player.skillLevel && b.skillLevel 
          ? 1 - Math.abs(player.skillLevel - b.skillLevel) / 100 
          : 0.5;
        
        const waitTimeA = (new Date().getTime() - a.joinedAt.getTime()) / 60000; // minutes
        const waitTimeB = (new Date().getTime() - b.joinedAt.getTime()) / 60000; // minutes
        const waitFactorA = Math.min(1, waitTimeA / 5); // Cap at 5 minutes
        const waitFactorB = Math.min(1, waitTimeB / 5); // Cap at 5 minutes
        
        const scoreA = stakeSimA * 0.5 + skillSimA * 0.3 + waitFactorA * 0.2;
        const scoreB = stakeSimB * 0.5 + skillSimB * 0.3 + waitFactorB * 0.2;
        
        return scoreB - scoreA; // Higher score first
      });
      
      // Take up to (gameSize - 2) additional players
      additionalPlayers.push(...moreMatches.slice(0, gameSize - 2));
    }
    
    // Create game with matched players
    try {
      // Mark all players as matched
      matchedPlayerIds.add(player.user.id);
      matchedPlayerIds.add(match.user.id);
      additionalPlayers.forEach(p => matchedPlayerIds.add(p.user.id));
      
      // Get all player users
      const allPlayers = [player, match, ...additionalPlayers];
      const actualGameSize = allPlayers.length;
      
      // Create new game
      const game = await storage.createGame({
        creatorId: player.user.id,
        maxPlayers: actualGameSize,
        stake: gameStake,
        currency: gameCurrency,
        status: "waiting" as GameStatus,
        commissionPercentage: 5, // Default commission
        startTime: new Date(),
        endTime: null,
        winningNumber: null,
        voiceChatEnabled: gameStake >= 20000, // Enable voice chat for high stakes games
      });
      
      // Add all players to the game
      for (const matchedPlayer of allPlayers) {
        await storage.createGamePlayer({
          gameId: game.id,
          userId: matchedPlayer.user.id,
          rolledNumber: null,
          isWinner: false,
          hasRolled: false,
          winShare: 0
        });
      }
      
      results.push({
        success: true,
        game,
        players: allPlayers.map(p => p.user),
        message: `Successfully matched ${actualGameSize} players with ${gameCurrency} ${gameStake} stake`
      });
      
    } catch (error) {
      console.error("Error creating match:", error);
      results.push({
        success: false,
        players: [player.user, match.user, ...additionalPlayers.map(p => p.user)],
        message: `Failed to create match: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
  
  // Remove matched players from waiting queue
  for (const matchedId of matchedPlayerIds) {
    waitingPlayers.delete(matchedId);
  }
  
  return results;
}

/**
 * Get stats about current matchmaking queue
 */
export function getMatchmakingStats() {
  const playersWaiting = waitingPlayers.size;
  
  // Group by currency
  const byCurrency = new Map<string, number>();
  for (const player of waitingPlayers.values()) {
    const count = byCurrency.get(player.currency) || 0;
    byCurrency.set(player.currency, count + 1);
  }
  
  // Group by stake ranges
  const stakes = [
    { name: '0-1,000', count: 0 },
    { name: '1,000-5,000', count: 0 },
    { name: '5,000-20,000', count: 0 },
    { name: '20,000-50,000', count: 0 },
    { name: '50,000+', count: 0 }
  ];
  
  for (const player of waitingPlayers.values()) {
    const stake = player.stakeAmount;
    if (stake < 1000) stakes[0].count++;
    else if (stake < 5000) stakes[1].count++;
    else if (stake < 20000) stakes[2].count++;
    else if (stake < 50000) stakes[3].count++;
    else stakes[4].count++;
  }
  
  // Get longest wait time
  let longestWait = 0;
  for (const player of waitingPlayers.values()) {
    const waitTime = (new Date().getTime() - player.joinedAt.getTime()) / 1000; // seconds
    longestWait = Math.max(longestWait, waitTime);
  }
  
  return {
    playersWaiting,
    byCurrency: Object.fromEntries(byCurrency),
    byStakeRange: stakes,
    longestWaitSeconds: longestWait
  };
}

/**
 * Periodic matchmaking process that runs on a timer
 */
let matchmakingInterval: NodeJS.Timeout | null = null;

export function startMatchmakingProcess(intervalMs: number = 10000) {
  if (matchmakingInterval) {
    clearInterval(matchmakingInterval);
  }
  
  matchmakingInterval = setInterval(async () => {
    try {
      const matches = await findMatches();
      if (matches.length > 0) {
        console.log(`Matchmaking created ${matches.length} games`);
        for (const match of matches) {
          if (match.success) {
            console.log(`- Game #${match.game?.id}: ${match.players.length} players, ${match.message}`);
          } else {
            console.error(`- Failed match: ${match.message}`);
          }
        }
      }
    } catch (error) {
      console.error("Error in matchmaking process:", error);
    }
  }, intervalMs);
  
  console.log(`Matchmaking process started, checking for matches every ${intervalMs/1000} seconds`);
  return matchmakingInterval;
}

export function stopMatchmakingProcess() {
  if (matchmakingInterval) {
    clearInterval(matchmakingInterval);
    matchmakingInterval = null;
    console.log("Matchmaking process stopped");
    return true;
  }
  return false;
}