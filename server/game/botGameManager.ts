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
   * and configured multipliers (including monthly lottery)
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
    lotteryActive?: boolean;
    lotteryMultiplier?: number;
  }> {
    try {
      // Get current settings
      const [settings] = await db.select().from(botGameSettings).limit(1);
      
      // Import lottery settings from admin routes
      const adminRoutes = await import('../routes/admin');
      const lotteryStatus = adminRoutes.getCurrentLotteryStatus();
      const monthlyLotteryActive = lotteryStatus.enabled;
      const monthlyMultiplier = lotteryStatus.enabled ? 
        (lotteryStatus.multiplier === "3x" ? 3 : 2) : 1;
      
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
      
      // Check if special multiplier stones (BOT GAMES ONLY)
      // 500 = 2x multiplier, 1000 = 3x multiplier, 3355 = 3x multiplier, 6624 = 3x multiplier
      // Apply monthly lottery bonus if active
      if (rolledNumber === 500) {
        multiplier = doubleMultiplier; // Base 2x for 500
        if (monthlyLotteryActive) {
          multiplier = doubleMultiplier * monthlyMultiplier; // Apply lottery bonus
        }
        stoneType = 'double';
        pendingAdminApproval = true;
      } 
      else if (rolledNumber === 1000 || rolledNumber === 3355 || rolledNumber === 6624) {
        multiplier = tripleMultiplier; // Base 3x for 1000, 3355, 6624
        if (monthlyLotteryActive) {
          multiplier = tripleMultiplier * monthlyMultiplier; // Apply lottery bonus
        }
        stoneType = 'triple';
        pendingAdminApproval = true;
      }
      
      // Calculate payout and fee
      const basePayout = game.stake * multiplier;
      const feeAmount = basePayout * (platformFeePercent / 100);
      let finalPayout = basePayout - feeAmount;
      
      // For double/triple stones, 80% goes to player, 20% goes to admin
      if (pendingAdminApproval) {
        adminPayoutAmount = finalPayout * 0.2; // 20% goes to admin account
        finalPayout = finalPayout * 0.8; // Player gets 80% as winnings
      }
      
      let description = `Won against computer with a ${rolledNumber}`;
      if (stoneType === 'double') {
        if (monthlyLotteryActive) {
          description = `Won with double stone (${rolledNumber})! ${doubleMultiplier}x × ${monthlyMultiplier}x LOTTERY = ${multiplier}x total payout! (80% auto, 20% admin approval)`;
        } else {
          description = `Won with double stone (${rolledNumber})! ${doubleMultiplier}x payout (80% auto, 20% admin approval)`;
        }
      } else if (stoneType === 'triple') {
        if (monthlyLotteryActive) {
          description = `Won with triple stone (${rolledNumber})! ${tripleMultiplier}x × ${monthlyMultiplier}x LOTTERY = ${multiplier}x total payout! (80% auto, 20% admin approval)`;
        } else {
          description = `Won with triple stone (${rolledNumber})! ${tripleMultiplier}x payout (80% auto, 20% admin approval)`;
        }
      }
      
      return {
        payout: finalPayout,
        feeAmount,
        description,
        type: stoneType,
        pendingAdminApproval,
        adminPayoutAmount,
        lotteryActive: monthlyLotteryActive,
        lotteryMultiplier: monthlyLotteryActive ? monthlyMultiplier : undefined
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
    // Updated to 45% chance of winning for better player experience
    const winPercentage = 45;
    
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
        
        // Check if this is a special stone win - credit 20% to admin account immediately
        if (payoutDetails.pendingAdminApproval && payoutDetails.adminPayoutAmount && payoutDetails.adminPayoutAmount > 0) {
          // Credit 20% to admin account
          await this.storage.updateUserBalance(
            admin.id,
            admin.walletBalance + payoutDetails.adminPayoutAmount
          );
          
          // Create admin transaction for the 20% share
          await this.storage.createTransaction({
            userId: this.ADMIN_USER_ID,
            amount: payoutDetails.adminPayoutAmount,
            type: "winnings",
            status: "completed",
            reference: `bot-game-${gameId}-admin-share`,
            description: `Admin 20% share from special stone ${rolledNumber} in game ${gameId}`,
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
        // Player lost - credit their stake to admin account
        await this.storage.updateUserBalance(
          admin.id,
          admin.walletBalance + game.stake
        );
        
        // Create transaction record for admin receiving the lost stake
        await this.storage.createTransaction({
          userId: this.ADMIN_USER_ID,
          amount: game.stake,
          type: "winnings",
          status: "completed",
          reference: `bot-game-${gameId}-admin-stake`,
          description: `Received stake from lost bot game ${gameId}`,
        });
        
        // Update statistics
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
    playerWon: boolean,
    pendingAmount: number = 0
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
            pendingPayouts: todayStats.pendingPayouts + pendingAmount
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
          platformFees: stake * 0.05, // 5% fee,
          pendingPayouts: pendingAmount
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