import { IStorage } from "../storage";
import { RandomNumberGenerator } from "./randomGenerator";
import { BotGameManager } from "./botGameManager";
import { 
  Game, 
  GamePlayer, 
  User, 
  WebSocketMessage, 
  Message,
  InsertGame,
  InsertGamePlayer,
  InsertMessage,
  InsertTransaction,
  GameStatus
} from "@shared/schema";
import WebSocket from "ws";

interface WebSocketConnection {
  userId: number;
  ws: WebSocket;
}

export class GameManager {
  private storage: IStorage;
  private rng: RandomNumberGenerator;
  private botGameManager: BotGameManager;
  private gameWebSockets: Map<number, WebSocketConnection[]>;
  private turnTimers: Map<number, NodeJS.Timeout>;
  private readonly TURN_TIME_SECONDS = 30;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.rng = new RandomNumberGenerator();
    this.botGameManager = new BotGameManager(storage);
    this.gameWebSockets = new Map();
    this.turnTimers = new Map();
  }
  
  /**
   * Getter for the bot game manager instance
   */
  public getBotGameManager(): BotGameManager {
    return this.botGameManager;
  }

  /**
   * Create a new game and add the creator as the first player
   */
  // Bot user ID constant (non-existent user for computer players)
  private readonly BOT_USER_ID = 9999;
  
  /**
   * Create a bot player for single player games
   */
  private async createBotPlayer(gameId: number): Promise<void> {
    console.log(`Creating bot player for game ${gameId}`);
    // Get existing bot user first
    let botUser = await this.storage.getUserByUsername("Computer");
    
    if (!botUser) {
      console.log("Computer user not found, creating new one...");
      try {
        // Create the bot user
        botUser = await this.storage.createUser({
          username: "Computer",
          email: "bot@bigboysgame.com",
          password: "not-a-real-password",
          avatarInitials: "CP"
        });
        
        // Give the bot unlimited funds
        await this.storage.updateUserBalance(
          botUser.id,
          1000000
        );
      } catch (error: any) {
        // If creation fails due to duplicate username, try to get the existing user
        if (error.code === '23505' && error.constraint === 'users_username_unique') {
          console.log("Computer user already exists, fetching existing user...");
          botUser = await this.storage.getUserByUsername("Computer");
          if (!botUser) {
            throw new Error("Failed to get or create Computer user");
          }
        } else {
          throw error;
        }
      }
    } else {
      console.log("Using existing Computer user:", botUser.id);
    }
    
    // Get game to check stake
    const game = await this.storage.getGame(gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    
    // Add bot player to the game
    const turnOrder = 2; // Bot is always the second player
    await this.storage.createGamePlayer({
      gameId,
      userId: botUser.id,
      turnOrder,
    });
    
    // Create a system message
    await this.storage.createMessage({
      gameId,
      userId: botUser.id,
      content: `Computer player joined the game`,
      type: "system",
    });
  }

  async createGame(gameData: InsertGame, creatorUserId: number): Promise<Game> {
    try {
      // Create the game record
      const game = await this.storage.createGame(gameData);
      
      // Add the creator as the first player
      await this.storage.createGamePlayer({
        gameId: game.id,
        userId: creatorUserId,
        turnOrder: 1,
      });
      
      // Deduct stake from creator's balance
      const user = await this.storage.getUser(creatorUserId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const oldBalance = user.walletBalance;
      const newBalance = oldBalance - gameData.stake;
      await this.storage.updateUserBalance(creatorUserId, newBalance);
      console.log(`💸 Creator ${creatorUserId} stake deducted: ₦${oldBalance} → ₦${newBalance} (-₦${gameData.stake})`);
      
      // Create a stake transaction
      await this.storage.createTransaction({
        userId: creatorUserId,
        amount: gameData.stake,
        type: "stake",
        status: "completed",
        reference: `game-${game.id}-stake-creator`,
        description: `Stake for creating Game #${game.id}`,
        currency: gameData.currency || 'NGN'
      });
      console.log(`📝 Stake transaction created for creator ${creatorUserId}: ₦${gameData.stake}`);
      
      // Check if this is a single player game with a bot (using playWithBot flag)
      if (gameData.playWithBot === true) {
        console.log('Creating bot game for game ID:', game.id);
        
        // Add the bot player
        await this.createBotPlayer(game.id);
        
        // Start the game immediately
        await this.startGame(game.id);
        
        // Let the player manually roll - no auto-rolling for bot games
        console.log('Bot game created - waiting for player to manually roll');
      }
      
      return game;
    } catch (error) {
      console.error("Error creating game:", error);
      throw error;
    }
  }

  /**
   * Join an existing game
   */
  async joinGame(gameId: number, userId: number): Promise<GamePlayer> {
    try {
      // Get the game
      const game = await this.storage.getGame(gameId);
      if (!game) {
        throw new Error("Game not found");
      }
      
      // Check if game is waiting
      if (game.status !== "waiting") {
        throw new Error("Game is not accepting new players");
      }
      
      // Check if player already in game
      const existingPlayer = await this.storage.getGamePlayer(gameId, userId);
      if (existingPlayer) {
        return existingPlayer;
      }
      
      // Get current players
      const players = await this.storage.getGamePlayers(gameId);
      
      // Check if game is full
      if (players.length >= game.maxPlayers) {
        throw new Error("Game is full");
      }
      
      // Get the next turn order
      const turnOrder = players.length + 1;
      
      // Add player to game
      const gamePlayer = await this.storage.createGamePlayer({
        gameId,
        userId,
        turnOrder,
      });
      
      // Deduct stake from user's balance
      const user = await this.storage.getUser(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const oldBalance = user.walletBalance;
      const newBalance = oldBalance - game.stake;
      await this.storage.updateUserBalance(userId, newBalance);
      console.log(`💸 Player ${userId} stake deducted: ₦${oldBalance} → ₦${newBalance} (-₦${game.stake})`);
      
      // Create a stake transaction
      await this.storage.createTransaction({
        userId,
        amount: game.stake,
        type: "stake",
        status: "completed",
        reference: `game-${gameId}-stake-${userId}`,
        description: `Stake for joining Game #${gameId}`,
        currency: game.currency || 'NGN'
      });
      console.log(`📝 Stake transaction created for player ${userId}: ₦${game.stake}`);
      
      // Create system message
      await this.storage.createMessage({
        gameId,
        userId,
        content: `${user.username} joined the game`,
        type: "system",
      });
      
      // If game is now full, start the game
      const updatedPlayers = await this.storage.getGamePlayers(gameId);
      console.log(`Game ${gameId}: ${updatedPlayers.length}/${game.maxPlayers} players`);
      if (updatedPlayers.length === game.maxPlayers) {
        console.log(`Starting game ${gameId} - full capacity reached`);
        await this.startGame(gameId);
      }
      
      // Broadcast player joined
      await this.broadcastPlayerJoined(gameId, gamePlayer);
      
      return gamePlayer;
    } catch (error) {
      console.error("Error joining game:", error);
      throw error;
    }
  }

  /**
   * Start a game
   */
  private async startGame(gameId: number): Promise<void> {
    try {
      console.log(`Starting game ${gameId} - updating status to in_progress`);
      // Update game status
      await this.storage.updateGameStatus(gameId, "in_progress");
      
      // Get game data for broadcast
      const game = await this.storage.getGame(gameId);
      const players = await this.storage.getGamePlayers(gameId);
      
      if (!game) {
        throw new Error("Game not found");
      }
      
      // Check if this is a bot game (has a player named "Computer")
      const isBotGame = players.some(p => p.user.username === "Computer");
      
      // Only start turn timer for multiplayer games, not bot games
      if (!isBotGame) {
        this.startTurnTimer(gameId, players[0].userId);
      } else {
        console.log('Bot game detected - no turn timer started');
      }
      
      // Create system message
      await this.storage.createMessage({
        gameId,
        userId: players[0].userId,
        content: `Game has started. ${players[0].user.username}'s turn.`,
        type: "system",
      });
      
      // Broadcast game started
      await this.broadcastGameUpdate(gameId, {
        game,
        players,
        currentTurnPlayerId: players[0].userId,
        timeRemaining: this.TURN_TIME_SECONDS
      });
    } catch (error) {
      console.error("Error starting game:", error);
      throw error;
    }
  }

  /**
   * Roll a stone for the current player
   */
  async rollStone(gameId: number, userId: number): Promise<void> {
    try {
      // Get the game
      const game = await this.storage.getGame(gameId);
      if (!game) {
        throw new Error("Game not found");
      }
      
      // Check if game is in progress
      if (game.status !== "in_progress") {
        throw new Error("Game is not in progress");
      }
      
      // Get current players
      const players = await this.storage.getGamePlayers(gameId);
      
      // Find the current player's turn
      const currentPlayerIndex = players.findIndex(p => !p.hasRolled);
      if (currentPlayerIndex === -1) {
        throw new Error("All players have already rolled");
      }
      
      const currentPlayer = players[currentPlayerIndex];
      
      // Log current state for debugging
      console.log(`Roll request - Current player: ${currentPlayer.userId}, Request from: ${userId}, Bot ID: ${this.BOT_USER_ID}`);
      
      // Find the computer player if any (checking by username, not just ID)
      const computerPlayer = players.find(p => p.user.username === 'Computer');
      
      // Special handling for bot games
      const isBotGame = !!computerPlayer;
      const isHumanPlayer = players.some(p => p.userId === userId && p.user.username !== 'Computer');
      const isBotTurn = computerPlayer && currentPlayer.userId === computerPlayer.userId;
      
      // Check if it's this user's turn or special bot case
      if (currentPlayer.userId !== userId) {
        // In bot games, allow the human player to roll for the bot
        if (isBotGame && isHumanPlayer && isBotTurn) {
          console.log("Bot game: allowing human player to roll for bot");
          // We allow this to continue - human player will roll for bot
          // Important: We're changing userId to the bot's userId to make the roll work
          // Use the actual computer player ID, not the hardcoded one
          userId = computerPlayer.userId;
          
          // Auto-roll for the bot after a slight delay to make it seem like the bot is thinking
          setTimeout(() => {
            console.log('Bot is rolling automatically');
            // The bot's roll will be handled by the rollStone flow
          }, 1000);
          
        } else {
          throw new Error("It's not your turn");
        }
      }
      
      // Generate a random number for the roll
      const rolledNumber = this.rng.generateGameStoneNumber();
      
      // Update player's roll
      await this.storage.updateGamePlayerRoll(currentPlayer.id, rolledNumber);
      
      // Clear the current turn timer
      this.clearTurnTimer(gameId);
      
      // Check if all players have rolled
      const updatedPlayers = await this.storage.getGamePlayers(gameId);
      const allPlayersRolled = updatedPlayers.every(p => p.hasRolled);
      
      if (allPlayersRolled) {
        // End the game and determine winner
        await this.endGame(gameId);
      } else {
        // Move to next player's turn
        const nextPlayerIndex = currentPlayerIndex + 1;
        const nextPlayer = players[nextPlayerIndex];
        
        // Start turn timer for next player
        this.startTurnTimer(gameId, nextPlayer.userId);
        
        // Create system message
        await this.storage.createMessage({
          gameId,
          userId: currentPlayer.userId,
          content: `${currentPlayer.user.username} rolled ${rolledNumber}. ${nextPlayer.user.username}'s turn.`,
          type: "system",
        });
        
        // Broadcast game update with the roll
        await this.broadcastGameUpdate(gameId, {
          game,
          players: updatedPlayers,
          currentTurnPlayerId: nextPlayer.userId,
          rollingStoneNumber: rolledNumber,
          rolledPlayerId: currentPlayer.userId,
          timeRemaining: this.TURN_TIME_SECONDS
        });
      }
    } catch (error) {
      console.error("Error rolling stone:", error);
      
      // Send error message to the user
      this.sendErrorMessage(gameId, userId, error instanceof Error ? error.message : "Error rolling stone");
    }
  }

  /**
   * Automatically roll for a player when their turn timer expires
   */
  private async autoRoll(gameId: number, userId: number): Promise<void> {
    try {
      // Get the game
      const game = await this.storage.getGame(gameId);
      if (!game || game.status !== "in_progress") {
        return;
      }
      
      // Get current players
      const players = await this.storage.getGamePlayers(gameId);
      
      // Find the current player
      const currentPlayer = players.find(p => p.userId === userId && !p.hasRolled);
      if (!currentPlayer) {
        return;
      }
      
      // Generate a random number for the roll
      const rolledNumber = this.rng.generateGameStoneNumber();
      
      // Update player's roll
      await this.storage.updateGamePlayerRoll(currentPlayer.id, rolledNumber);
      
      // Check if all players have rolled
      const updatedPlayers = await this.storage.getGamePlayers(gameId);
      const allPlayersRolled = updatedPlayers.every(p => p.hasRolled);
      
      if (allPlayersRolled) {
        // End the game and determine winner
        await this.endGame(gameId);
      } else {
        // Find the next player who hasn't rolled
        const nextPlayer = updatedPlayers.find(p => !p.hasRolled);
        
        if (nextPlayer) {
          // Check if this is a bot game before starting turn timer
          const isBotGame = updatedPlayers.some(p => p.user.username === "Computer");
          
          // Only start turn timer for multiplayer games, not bot games
          if (!isBotGame) {
            this.startTurnTimer(gameId, nextPlayer.userId);
          }
          
          // Create system message
          await this.storage.createMessage({
            gameId,
            userId: currentPlayer.userId,
            content: `${currentPlayer.user.username} automatically rolled ${rolledNumber}. ${nextPlayer.user.username}'s turn.`,
            type: "system",
          });
          
          // Broadcast game update with the roll
          await this.broadcastGameUpdate(gameId, {
            game,
            players: updatedPlayers,
            currentTurnPlayerId: nextPlayer.userId,
            rollingStoneNumber: rolledNumber,
            rolledPlayerId: currentPlayer.userId,
            timeRemaining: this.TURN_TIME_SECONDS
          });
        }
      }
    } catch (error) {
      console.error("Error in auto roll:", error);
    }
  }

  /**
   * End a game and determine the winner
   */
  private async endGame(gameId: number): Promise<void> {
    try {
      // Get the game
      const game = await this.storage.getGame(gameId);
      if (!game) {
        throw new Error("Game not found");
      }
      
      // Get players
      const players = await this.storage.getGamePlayers(gameId);
      
      // Find the player with the highest roll
      let highestRoll = -1;
      let winnerIds: number[] = [];
      
      for (const player of players) {
        if (player.rolledNumber && player.rolledNumber > highestRoll) {
          highestRoll = player.rolledNumber;
          winnerIds = [player.userId];
        } else if (player.rolledNumber && player.rolledNumber === highestRoll) {
          winnerIds.push(player.userId);
        }
      }
      
      // Calculate prize with new commission structure
      const totalPool = game.stake * players.length;
      
      // Determine commission rate based on stake amount
      // Lower stakes: 5%, Higher stakes: 10% (you can adjust threshold as needed)
      const STAKE_THRESHOLD = 10000; // ₦10,000 threshold for higher commission
      const commissionRate = game.stake >= STAKE_THRESHOLD ? 0.10 : 0.05; // 10% for high stakes, 5% for low stakes
      
      const commission = totalPool * commissionRate;
      const prizeMoney = totalPool - commission;
      
      // Transfer commission to admin account FIRST
      const ADMIN_USER_ID = 7; // Admin account ID
      const admin = await this.storage.getUser(ADMIN_USER_ID);
      if (admin) {
        // Add commission to admin wallet
        await this.storage.updateUserBalance(
          ADMIN_USER_ID,
          admin.walletBalance + commission
        );
        
        // Create commission transaction record
        await this.storage.createTransaction({
          userId: ADMIN_USER_ID,
          amount: commission,
          type: "winnings", // Platform commission earnings
          status: "completed",
          reference: `game-${gameId}-commission`,
          description: `Platform commission from game ${gameId} (${commissionRate * 100}% of ₦${totalPool})`
        });
      }
      
      // Distribute prize (if tie, split evenly)
      const prizePerWinner = prizeMoney / winnerIds.length;
      
      for (const winnerId of winnerIds) {
        const winner = await this.storage.getUser(winnerId);
        if (winner) {
          // Update winner's balance
          await this.storage.updateUserBalance(
            winnerId,
            winner.walletBalance + prizePerWinner
          );
          
          // Create winnings transaction
          await this.storage.createTransaction({
            userId: winnerId,
            amount: prizePerWinner,
            type: "winnings",
            status: "completed",
            reference: `game-${gameId}-winnings`,
            description: `Game winnings from game ${gameId}`
          });
        }
      }
      
      // Update game as completed with winner
      let updatedGame: Game;
      
      if (winnerIds.length === 1) {
        // Single winner
        updatedGame = await this.storage.updateGameWinners(
          gameId, 
          winnerIds,
          highestRoll
        );
        
        // Create system message for winner
        const winner = players.find(p => p.userId === winnerIds[0]);
        if (winner) {
          await this.storage.createMessage({
            gameId,
            userId: winner.userId,
            content: `Game ended. ${winner.user.username} wins with a roll of ${highestRoll}!`,
            type: "system",
          });
        }
      } else {
        // Multiple winners (tie)
        updatedGame = await this.storage.updateGameStatus(gameId, "completed");
        updatedGame = await this.storage.endGame(gameId);
        
        // Create system message for tie
        const winnerNames = players
          .filter(p => winnerIds.includes(p.userId))
          .map(p => p.user.username)
          .join(" and ");
        
        await this.storage.createMessage({
          gameId,
          userId: winnerIds[0], // Use first winner for the message
          content: `Game ended. Tie between ${winnerNames} with a roll of ${highestRoll}!`,
          type: "system",
        });
      }
      
      // Broadcast game ended
      const updatedPlayers = await this.storage.getGamePlayers(gameId);
      await this.broadcastGameEnded(gameId, updatedGame, updatedPlayers);
    } catch (error) {
      console.error("Error ending game:", error);
      throw error;
    }
  }

  /**
   * Send a chat message in a game
   */
  async sendChatMessage(gameId: number, userId: number, content: string): Promise<void> {
    try {
      // Create message
      const message = await this.storage.createMessage({
        gameId,
        userId,
        content,
        type: "chat",
      });
      
      // Broadcast to all players
      await this.broadcastChatMessage(gameId, message);
    } catch (error) {
      console.error("Error sending chat message:", error);
      throw error;
    }
  }

  /**
   * Get all available games (waiting status)
   */
  async getAvailableGames(): Promise<Game[]> {
    try {
      return await this.storage.getGamesByStatus("waiting");
    } catch (error) {
      console.error("Error getting available games:", error);
      throw error;
    }
  }

  /**
   * Get all games a user is participating in
   */
  async getUserGames(userId: number): Promise<Game[]> {
    try {
      return await this.storage.getUserGames(userId);
    } catch (error) {
      console.error("Error getting user games:", error);
      throw error;
    }
  }

  /**
   * Add a WebSocket connection for a game
   */
  addWebSocketConnection(gameId: number, userId: number, ws: WebSocket): void {
    // Get existing connections for this game
    let connections = this.gameWebSockets.get(gameId) || [];
    
    // Remove any existing connection for this user
    connections = connections.filter(conn => conn.userId !== userId);
    
    // Add the new connection
    connections.push({ userId, ws });
    
    // Update the map
    this.gameWebSockets.set(gameId, connections);
  }
  
  /**
   * Get all WebSocket connections for a game
   */
  getGameConnections(gameId: number): WebSocketConnection[] {
    return this.gameWebSockets.get(gameId) || [];
  }

  /**
   * Remove a WebSocket connection for a game
   */
  removeWebSocketConnection(gameId: number, userId: number): void {
    const connections = this.gameWebSockets.get(gameId) || [];
    this.gameWebSockets.set(
      gameId,
      connections.filter(conn => conn.userId !== userId)
    );
  }

  /**
   * Start a turn timer
   */
  private startTurnTimer(gameId: number, userId: number): void {
    // Clear any existing timer for this game
    this.clearTurnTimer(gameId);
    
    // Start a new timer
    const timer = setTimeout(() => {
      this.autoRoll(gameId, userId);
    }, this.TURN_TIME_SECONDS * 1000);
    
    this.turnTimers.set(gameId, timer);
  }

  /**
   * Clear a turn timer
   */
  private clearTurnTimer(gameId: number): void {
    const timer = this.turnTimers.get(gameId);
    if (timer) {
      clearTimeout(timer);
      this.turnTimers.delete(gameId);
    }
  }

  /**
   * Broadcast a message to all players in a game
   */
  private async broadcastMessage(gameId: number, message: WebSocketMessage): Promise<void> {
    const connections = this.gameWebSockets.get(gameId) || [];
    const messageStr = JSON.stringify(message);
    
    for (const connection of connections) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageStr);
      }
    }
  }

  /**
   * Broadcast that a player joined the game
   */
  private async broadcastPlayerJoined(gameId: number, gamePlayer: GamePlayer): Promise<void> {
    const user = await this.storage.getUser(gamePlayer.userId);
    if (!user) {
      return;
    }
    
    await this.broadcastMessage(gameId, {
      type: "player_joined",
      payload: {
        player: {
          ...gamePlayer,
          user
        }
      }
    });
  }

  /**
   * Broadcast a player leaving the game
   */
  private async broadcastPlayerLeft(gameId: number, userId: number): Promise<void> {
    await this.broadcastMessage(gameId, {
      type: "player_left",
      payload: {
        userId
      }
    });
  }

  /**
   * Broadcast a chat message
   */
  private async broadcastChatMessage(gameId: number, message: Message): Promise<void> {
    await this.broadcastMessage(gameId, {
      type: "chat_message",
      payload: {
        message
      }
    });
  }

  /**
   * Broadcast game update
   */
  private async broadcastGameUpdate(gameId: number, data: any): Promise<void> {
    await this.broadcastMessage(gameId, {
      type: "game_update",
      payload: data
    });
  }

  /**
   * Broadcast game ended
   */
  private async broadcastGameEnded(gameId: number, game: Game, players: (GamePlayer & { user: User })[]): Promise<void> {
    await this.broadcastMessage(gameId, {
      type: "game_ended",
      payload: {
        game,
        players
      }
    });
  }

  /**
   * Send an error message to a specific user
   */
  private sendErrorMessage(gameId: number, userId: number, errorMessage: string): void {
    const connections = this.gameWebSockets.get(gameId) || [];
    const connection = connections.find(conn => conn.userId === userId);
    
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify({
        type: "error",
        payload: {
          message: errorMessage
        }
      }));
    }
  }
}
