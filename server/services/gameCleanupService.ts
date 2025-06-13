import { storage } from "../storage";
import { addHours } from "date-fns";

export class GameCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Start the cleanup service that runs every 5 minutes
  start() {
    if (this.cleanupInterval) {
      return; // Already running
    }

    console.log("Starting game cleanup service...");
    
    // Run cleanup immediately on start
    this.cleanupExpiredGames();
    
    // Then run every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredGames();
    }, 5 * 60 * 1000); // 5 minutes
  }

  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log("Game cleanup service stopped");
    }
  }

  // Clean up expired waiting games
  async cleanupExpiredGames() {
    try {
      const now = new Date();
      console.log(`Running game cleanup at ${now.toISOString()}`);
      
      // Get all waiting games
      const waitingGames = await storage.getWaitingGames();
      
      if (!waitingGames || waitingGames.length === 0) {
        return;
      }

      let expiredCount = 0;
      
      for (const game of waitingGames) {
        // Check if game has expired (1 hour after creation)
        const gameCreated = new Date(game.createdAt);
        const expirationTime = addHours(gameCreated, 1);
        
        if (now > expirationTime) {
          // Cancel expired game and refund stakes
          await this.cancelExpiredGame(game.id);
          expiredCount++;
          console.log(`Cancelled expired game ${game.id} (created at ${gameCreated.toISOString()})`);
        }
      }
      
      if (expiredCount > 0) {
        console.log(`Cleaned up ${expiredCount} expired waiting games`);
      }
    } catch (error) {
      console.error("Error during game cleanup:", error);
    }
  }

  // Cancel a specific expired game and refund stakes
  private async cancelExpiredGame(gameId: number) {
    try {
      // Get game details including players
      const game = await storage.getGame(gameId);
      if (!game || game.status !== 'waiting') {
        return;
      }

      // Get all players in the game
      const players = await storage.getGamePlayers(gameId);
      
      // Refund stakes to all players
      for (const player of players) {
        await storage.refundStake(player.userId, game.stake, `Game ${gameId} expired - stake refunded`);
        console.log(`Refunded ${game.stake} ${game.currency} to user ${player.userId} for expired game ${gameId}`);
      }

      // Update game status to expired
      await storage.updateGameStatus(gameId, 'expired');
      
    } catch (error) {
      console.error(`Error cancelling expired game ${gameId}:`, error);
    }
  }

  // Set expiration time for new waiting games (1 hour from now)
  static getExpirationTime(): Date {
    return addHours(new Date(), 1);
  }
}

// Create singleton instance
export const gameCleanupService = new GameCleanupService();