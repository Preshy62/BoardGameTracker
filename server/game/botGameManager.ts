import { IStorage } from "../storage";
import { RandomNumberGenerator } from "./randomGenerator";
import { db } from "../db";
import { 
  Game, 
  User,
  botGameSettings,
  botGameStatistics,
  InsertTransaction
} from "@shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { startOfDay, endOfDay } from "date-fns";

/**
 * Bot Game Manager
 * Handles logic specific to games against the computer/bot
 */
export class BotGameManager {
  private storage: IStorage;
  private rng: RandomNumberGenerator;
  private readonly BOT_USER_ID = 9999; // The computer player ID
  private readonly ADMIN_USER_ID = 7;  // The admin account that pays out winnings

  constructor(storage: IStorage) {
    this.storage = storage;
    this.rng = new RandomNumberGenerator();
  }

  /**
   * Check if a game is eligible to be played as a bot game
   * based on admin-configurable limits
   */
  async validateBotGameStake(stake: number, currency: string = 'NGN'): Promise<{ 
    valid: boolean;
    message?: string;
    convertedStake?: number;
  }> {
    try {
      // Get current settings
      const [settings] = await db.select().from(botGameSettings).limit(1);
      
      // If no settings found, use defaults
      const minStake = settings?.minStake || 500;
      const maxStake = settings?.maxStake || 20000;
      
      // Convert currency if needed
      let convertedStake = stake;
      if (currency !== 'NGN') {
        const conversionResult = await this.storage.convertCurrency(stake, currency, 'NGN');
        convertedStake = conversionResult.amount;
      }
      
      // Check min/max stake limits
      if (convertedStake < minStake) {
        return { 
          valid: false, 
          message: `Minimum stake for bot games is ₦${minStake}` 
        };
      }
      
      if (convertedStake > maxStake) {
        return { 
          valid: false, 
          message: `Maximum stake for bot games is ₦${maxStake}` 
        };
      }
      
      // Check if daily win limit not exceeded
      const canAcceptMoreWins = await this.canAcceptMoreWins();
      if (!canAcceptMoreWins) {
        return {
          valid: false,
          message: "Daily bot game limit reached. Please try again tomorrow."
        };
      }
      
      return { valid: true, convertedStake };
    } catch (error) {
      console.error("Error validating bot game stake:", error);
      return { valid: false, message: "An error occurred validating game stake" };
    }
  }

  /**
   * Check if we can accept more wins today based on admin-set limits
   */
  private async canAcceptMoreWins(): Promise<boolean> {
    try {
      // Get the current settings
      const [settings] = await db.select().from(botGameSettings).limit(1);
      const dailyWinLimit = settings?.dailyWinLimit || 20; // Default: 20 wins per day
      
      // Get today's stats
      const today = new Date();
      const startDay = startOfDay(today);
      const endDay = endOfDay(today);
      
      const [todayStats] = await db.select()
        .from(botGameStatistics)
        .where(
          and(
            gte(botGameStatistics.date, sql`${startDay}`),
            lte(botGameStatistics.date, sql`${endDay}`)
          )
        );
      
      // If no stats for today or wins less than limit, we can accept more
      if (!todayStats || todayStats.totalWins < dailyWinLimit) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking daily win limit:", error);
      // Default to true to allow game to continue if there's an error
      return true;
    }
  }

  /**
   * Calculate payout for a bot game based on the stone rolled
   * and configured multipliers
   */
  async calculateBotGamePayout(
    game: Game, 
    rolledNumber: number,
    playerWins: boolean
  ): Promise<{
    payout: number;
    feeAmount: number;
    description: string;
    type: 'normal' | 'double' | 'triple';
    pendingAdminApproval?: boolean;
    adminPayoutAmount?: number;
  }> {
    try {
      // Get current settings
      const [settings] = await db.select().from(botGameSettings).limit(1);
      
      const platformFeePercent = settings?.platformFeePercent || 5;
      const doubleMultiplier = settings?.doubleStoneMultiplier || 2;
      const tripleMultiplier = settings?.tripleStoneMultiplier || 3;
      
      // If player loses, no payout
      if (!playerWins) {
        return {
          payout: 0,
          feeAmount: game.stake * (platformFeePercent / 100),
          description: "Lost to the computer",
          type: 'normal'
        };
      }
      
      // Determine stone type (normal, double, triple)
      let multiplier = 2; // Base multiplier for a win
      let stoneType: 'normal' | 'double' | 'triple' = 'normal';
      let pendingAdminApproval = false;
      let adminPayoutAmount = 0;
      
      // Check if double or triple stone
      // Double stones: 500, 1000 (Special stones)
      if (rolledNumber === 500 || rolledNumber === 1000) {
        multiplier = doubleMultiplier;
        stoneType = 'double';
        pendingAdminApproval = true;
      } 
      // Triple stones: 3355, 6624 (Super stones)
      else if (rolledNumber === 3355 || rolledNumber === 6624) {
        multiplier = tripleMultiplier;
        stoneType = 'triple';
        pendingAdminApproval = true;
      }
      
      // Calculate payout and fee
      const basePayout = game.stake * multiplier;
      const feeAmount = basePayout * (platformFeePercent / 100);
      let finalPayout = basePayout - feeAmount;
      
      // For double/triple stones, 20% of the payout needs admin approval
      if (pendingAdminApproval) {
        adminPayoutAmount = finalPayout * 0.2; // 20% pending admin approval
        finalPayout = finalPayout * 0.8; // Player gets 80% immediately
      }
      
      let description = `Won against computer with a ${rolledNumber}`;
      if (stoneType === 'double') {
        description = `Won with double stone (${rolledNumber})! ${doubleMultiplier}x payout (80% auto, 20% admin approval)`;
      } else if (stoneType === 'triple') {
        description = `Won with triple stone (${rolledNumber})! ${tripleMultiplier}x payout (80% auto, 20% admin approval)`;
      }
      
      return {
        payout: finalPayout,
        feeAmount,
        description,
        type: stoneType,
        pendingAdminApproval,
        adminPayoutAmount
      };
    } catch (error) {
      console.error("Error calculating bot game payout:", error);
      // Default payout just in case
      return {
        payout: game.stake * 1.9, // Default 2x minus 5% fee
        feeAmount: game.stake * 0.1,
        description: "Won against computer",
        type: 'normal'
      };
    }
  }

  /**
   * Determine if the player wins against the bot based on
   * the configured win chance percentage
   */
  determineIfPlayerWins(): boolean {
    // Default 25% chance of winning
    const winPercentage = 25;
    
    // Generate a random number between 0-100
    const roll = Math.random() * 100;
    
    // Return true if the roll is less than the win percentage
    return roll < winPercentage;
  }

  /**
   * Process a bot game outcome - update balances,
   * create transactions, and update statistics
   */
  async processBotGameOutcome(
    gameId: number,
    userId: number,
    rolledNumber: number
  ): Promise<{
    playerWon: boolean;
    payout: number;
    description: string;
    pendingAdminApproval?: boolean;
    adminPayoutAmount?: number;
  }> {
    try {
      // Get the game details
      const game = await this.storage.getGame(gameId);
      if (!game) {
        throw new Error("Game not found");
      }
      
      // Determine if player won based on configured chance
      const playerWon = this.determineIfPlayerWins();
      
      // Calculate payout details
      const payoutDetails = await this.calculateBotGamePayout(
        game,
        rolledNumber,
        playerWon
      );
      
      // Get the player and admin users
      const player = await this.storage.getUser(userId);
      const admin = await this.storage.getUser(this.ADMIN_USER_ID);
      
      if (!player || !admin) {
        throw new Error("User or admin account not found");
      }
      
      // If player won, process the payout from admin to player
      if (playerWon && payoutDetails.payout > 0) {
        // Update player's balance
        await this.storage.updateUserBalance(
          player.id,
          player.walletBalance + payoutDetails.payout
        );
        
        // Deduct from admin's balance
        await this.storage.updateUserBalance(
          admin.id,
          admin.walletBalance - payoutDetails.payout
        );
        
        // Create winnings transaction for player
        await this.storage.createTransaction({
          userId: player.id,
          amount: payoutDetails.payout,
          type: "winnings",
          status: "completed",
          reference: `bot-game-${gameId}-winnings`,
          description: payoutDetails.description,
        });
        
        // Check if this is a special stone win with pending admin approval portion
        if (payoutDetails.pendingAdminApproval && payoutDetails.adminPayoutAmount && payoutDetails.adminPayoutAmount > 0) {
          // Create a pending transaction for the 20% that requires admin approval
          await this.storage.createTransaction({
            userId: player.id,
            amount: payoutDetails.adminPayoutAmount,
            type: "special_win_pending",
            status: "pending",
            reference: `bot-game-${gameId}-special-win-pending`,
            description: `Pending 20% special stone bonus for ${rolledNumber} (requires admin approval)`,
          });
        }
        
        // Update bot game statistics - adding the pending amount parameter
        await this.updateBotGameStatistics(
          game.stake, 
          payoutDetails.payout, 
          true, 
          payoutDetails.pendingAdminApproval ? payoutDetails.adminPayoutAmount : 0
        );
      } else {
        // Player lost, update statistics
        await this.updateBotGameStatistics(game.stake, 0, false);
      }
      
      return {
        playerWon,
        payout: playerWon ? payoutDetails.payout : 0,
        description: payoutDetails.description,
        pendingAdminApproval: payoutDetails.pendingAdminApproval,
        adminPayoutAmount: payoutDetails.adminPayoutAmount
      };
    } catch (error) {
      console.error("Error processing bot game outcome:", error);
      throw error;
    }
  }

  /**
   * Update bot game statistics for the day
   */
  private async updateBotGameStatistics(
    stake: number,
    payout: number,
    playerWon: boolean
  ): Promise<void> {
    try {
      const today = new Date();
      const startDay = startOfDay(today);
      const endDay = endOfDay(today);
      
      // Get today's stats or create new entry
      const [todayStats] = await db.select()
        .from(botGameStatistics)
        .where(
          and(
            gte(botGameStatistics.date, sql`${startDay}`),
            lte(botGameStatistics.date, sql`${endDay}`)
          )
        );
      
      if (todayStats) {
        // Update existing stats
        await db.update(botGameStatistics)
          .set({
            totalGamesPlayed: todayStats.totalGamesPlayed + 1,
            totalWins: playerWon ? todayStats.totalWins + 1 : todayStats.totalWins,
            totalPayouts: todayStats.totalPayouts + payout,
            totalStakes: todayStats.totalStakes + stake,
            platformFees: todayStats.platformFees + (stake * 0.05), // 5% fee
          })
          .where(eq(botGameStatistics.id, todayStats.id));
      } else {
        // Create new stats for today
        await db.insert(botGameStatistics).values({
          date: today,
          totalGamesPlayed: 1,
          totalWins: playerWon ? 1 : 0,
          totalPayouts: payout,
          totalStakes: stake,
          platformFees: stake * 0.05, // 5% fee
        });
      }
    } catch (error) {
      console.error("Error updating bot game statistics:", error);
      // Non-critical operation, so we don't throw
    }
  }
  
  /**
   * Get daily bot game statistics for admin dashboard
   */
  async getDailyBotGameStatistics(date?: Date): Promise<any> {
    const targetDate = date || new Date();
    const startDay = startOfDay(targetDate);
    const endDay = endOfDay(targetDate);
    
    try {
      const [stats] = await db.select()
        .from(botGameStatistics)
        .where(
          and(
            gte(botGameStatistics.date, sql`${startDay}`),
            lte(botGameStatistics.date, sql`${endDay}`)
          )
        );
      
      return stats || {
        totalGamesPlayed: 0,
        totalWins: 0,
        totalPayouts: 0,
        totalStakes: 0,
        platformFees: 0
      };
    } catch (error) {
      console.error("Error getting bot game statistics:", error);
      return {
        totalGamesPlayed: 0,
        totalWins: 0,
        totalPayouts: 0,
        totalStakes: 0,
        platformFees: 0
      };
    }
  }
  
  /**
   * Get bot game settings for admin dashboard
   */
  async getBotGameSettings(): Promise<any> {
    try {
      const [settings] = await db.select().from(botGameSettings).limit(1);
      
      return settings || {
        dailyWinLimit: 20,
        minStake: 500,
        maxStake: 20000,
        platformFeePercent: 5,
        winChancePercent: 25,
        doubleStoneMultiplier: 2,
        tripleStoneMultiplier: 3
      };
    } catch (error) {
      console.error("Error getting bot game settings:", error);
      return {
        dailyWinLimit: 20,
        minStake: 500,
        maxStake: 20000,
        platformFeePercent: 5,
        winChancePercent: 25,
        doubleStoneMultiplier: 2,
        tripleStoneMultiplier: 3
      };
    }
  }
  
  /**
   * Update bot game settings from admin dashboard
   */
  async updateBotGameSettings(
    adminUserId: number,
    settings: {
      dailyWinLimit?: number;
      minStake?: number;
      maxStake?: number;
      platformFeePercent?: number;
      winChancePercent?: number;
      doubleStoneMultiplier?: number;
      tripleStoneMultiplier?: number;
    }
  ): Promise<any> {
    try {
      const [currentSettings] = await db.select().from(botGameSettings).limit(1);
      
      if (currentSettings) {
        // Update existing settings
        await db.update(botGameSettings)
          .set({
            ...settings,
            updatedAt: new Date(),
            updatedBy: adminUserId
          })
          .where(eq(botGameSettings.id, currentSettings.id));
          
        return await this.getBotGameSettings();
      } else {
        // Create initial settings
        await db.insert(botGameSettings).values({
          ...settings,
          updatedAt: new Date(),
          updatedBy: adminUserId
        });
        
        return await this.getBotGameSettings();
      }
    } catch (error) {
      console.error("Error updating bot game settings:", error);
      throw error;
    }
  }
}