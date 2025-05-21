import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { botGameSettings, botGameStatistics } from "@shared/schema";
import { eq, gte, lte, and, sql } from "drizzle-orm";
import { startOfDay, endOfDay } from "date-fns";
import { z } from "zod";

// Extend Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
      };
    }
  }
}

// Authentication middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Check if user is admin
  const result = await db.execute(
    sql`SELECT is_admin FROM users WHERE id = ${req.session.userId}`
  );
  const row = result.rows ? result.rows[0] : null;
  const user = row ? { is_admin: row.is_admin } : null;
  
  if (!user || !user.is_admin) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  
  // Add user information to request
  req.user = { id: req.session.userId };
  next();
};

const router = Router();

// Schema for validating bot game settings updates
const updateSettingsSchema = z.object({
  dailyWinLimit: z.number().int().min(0).max(1000),
  minStake: z.number().min(0),
  maxStake: z.number().min(500),
  platformFeePercent: z.number().min(0).max(100),
  winChancePercent: z.number().min(1).max(100),
  doubleStoneMultiplier: z.number().min(1),
  tripleStoneMultiplier: z.number().min(1),
});

// Get bot game settings - admin only
router.get("/settings", authenticateAdmin, async (req, res) => {
  try {
    // Get the current settings, or return defaults if none exist
    const [settings] = await db.select().from(botGameSettings).limit(1);
    
    if (settings) {
      return res.json(settings);
    }
    
    // Return default values if no settings exist
    return res.json({
      dailyWinLimit: 20,
      minStake: 500,
      maxStake: 20000,
      platformFeePercent: 5,
      winChancePercent: 25,
      doubleStoneMultiplier: 2,
      tripleStoneMultiplier: 3,
    });
  } catch (error) {
    console.error("Error fetching bot game settings:", error);
    res.status(500).json({ message: "Failed to fetch bot game settings" });
  }
});

// Update bot game settings - admin only
router.post("/settings", authenticateAdmin, async (req, res) => {
  try {
    // Validate request body
    const validatedData = updateSettingsSchema.parse(req.body);
    
    // Check if settings already exist
    const [existingSettings] = await db.select().from(botGameSettings).limit(1);
    
    let updatedSettings;
    
    if (existingSettings) {
      // Update existing settings
      [updatedSettings] = await db.update(botGameSettings)
        .set({
          ...validatedData,
          updatedAt: new Date(),
          updatedBy: req.session.userId,
        })
        .where(eq(botGameSettings.id, existingSettings.id))
        .returning();
    } else {
      // Create initial settings
      [updatedSettings] = await db.insert(botGameSettings)
        .values({
          ...validatedData,
          updatedAt: new Date(),
          updatedBy: req.session.userId,
        })
        .returning();
    }
    
    res.json(updatedSettings);
  } catch (error) {
    console.error("Error updating bot game settings:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid settings data", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: "Failed to update bot game settings" });
  }
});

// Get daily bot game statistics - admin only
router.get("/stats", authenticateAdmin, async (req, res) => {
  try {
    // Get date param from query or use current date
    const dateParam = req.query.date ? new Date(req.query.date as string) : new Date();
    
    // Get statistics for the specified date
    const stats = await db.select()
      .from(botGameStatistics)
      .where(
        and(
          gte(botGameStatistics.date, startOfDay(dateParam)),
          lte(botGameStatistics.date, endOfDay(dateParam))
        )
      )
      .limit(1);
    
    if (stats.length > 0) {
      return res.json(stats[0]);
    }
    
    // Return zeros if no stats exist for the date
    return res.json({
      date: dateParam,
      totalGamesPlayed: 0,
      totalWins: 0,
      totalPayouts: 0,
      totalStakes: 0,
      platformFees: 0,
    });
  } catch (error) {
    console.error("Error fetching bot game statistics:", error);
    res.status(500).json({ message: "Failed to fetch bot game statistics" });
  }
});

// Validate bot game stake
router.post("/validate-stake", authenticate, async (req, res) => {
  try {
    const { stake, currency } = req.body;
    
    if (!stake) {
      return res.status(400).json({ message: "Stake amount is required" });
    }
    
    // Get current settings
    const [settings] = await db.select().from(botGameSettings).limit(1);
    
    const minStake = settings?.minStake || 500;
    const maxStake = settings?.maxStake || 20000;
    
    // Convert currency if needed
    if (currency && currency !== 'NGN') {
      // This would need currency conversion logic
      // For now, just check against the limits directly
    }
    
    // Check min/max stake limits
    if (stake < minStake) {
      return res.status(400).json({ 
        valid: false, 
        message: `Minimum stake for bot games is ₦${minStake}` 
      });
    }
    
    if (stake > maxStake) {
      return res.status(400).json({ 
        valid: false, 
        message: `Maximum stake for bot games is ₦${maxStake}` 
      });
    }
    
    // Check if daily win limit already reached
    const today = new Date();
    const [todayStats] = await db.select()
      .from(botGameStatistics)
      .where(
        and(
          gte(botGameStatistics.date, startOfDay(today)),
          lte(botGameStatistics.date, endOfDay(today))
        )
      );
    
    const dailyWinLimit = settings?.dailyWinLimit || 20;
    
    if (todayStats && todayStats.totalWins >= dailyWinLimit) {
      return res.status(400).json({
        valid: false,
        message: "Daily bot game limit reached. Please try again tomorrow."
      });
    }
    
    res.json({ valid: true });
  } catch (error) {
    console.error("Error validating bot game stake:", error);
    res.status(500).json({ message: "Failed to validate stake" });
  }
});

// Get all pending special stone bonuses - admin only
router.get("/pending-approvals", authenticateAdmin, async (req, res) => {
  try {
    // Fetch all pending special stone bonus transactions
    const pendingBonuses = await db.query.transactions.findMany({
      where: (transactions, { eq, and }) => and(
        eq(transactions.type, "special_win_pending"),
        eq(transactions.status, "pending"),
      ),
      with: {
        user: true
      },
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)]
    });
    
    res.json(pendingBonuses);
  } catch (error) {
    console.error("Error fetching pending special stone bonuses:", error);
    res.status(500).json({ message: "Failed to fetch pending bonus approvals" });
  }
});

// Approve a special stone bonus - admin only
router.post("/approve-bonus/:transactionId", authenticateAdmin, async (req, res) => {
  try {
    const transactionId = parseInt(req.params.transactionId);
    if (isNaN(transactionId)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }
    
    // Get the pending transaction
    const [pendingTransaction] = await db.select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.id, transactionId),
          eq(schema.transactions.type, "special_win_pending"),
          eq(schema.transactions.status, "pending")
        )
      );
    
    if (!pendingTransaction) {
      return res.status(404).json({ message: "Pending bonus transaction not found" });
    }
    
    // Get user and admin
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, pendingTransaction.userId)
    });
    
    const admin = await db.query.users.findFirst({
      where: eq(schema.users.id, req.user!.id)
    });
    
    if (!user || !admin) {
      return res.status(404).json({ message: "User or admin not found" });
    }
    
    // Update transaction to completed
    await db.update(schema.transactions)
      .set({
        status: "completed",
        description: `${pendingTransaction.description} - Approved by admin on ${new Date().toLocaleDateString()}`
      })
      .where(eq(schema.transactions.id, transactionId));
    
    // Update user balance
    const newUserBalance = user.walletBalance + pendingTransaction.amount;
    await db.update(schema.users)
      .set({ walletBalance: newUserBalance })
      .where(eq(schema.users.id, user.id));
    
    // Deduct from admin balance
    const newAdminBalance = admin.walletBalance - pendingTransaction.amount;
    await db.update(schema.users)
      .set({ walletBalance: newAdminBalance })
      .where(eq(schema.users.id, admin.id));
    
    // Create admin transaction record
    await db.insert(schema.transactions)
      .values({
        userId: admin.id,
        amount: -pendingTransaction.amount,
        type: "admin_bonus_payout",
        status: "completed",
        reference: `special-stone-bonus-${transactionId}`,
        description: `Special stone bonus payout for ${user.username} (Transaction #${transactionId})`,
        currency: pendingTransaction.currency || "NGN"
      });
    
    // Update bot game statistics to remove from pending payouts
    const today = new Date();
    const [todayStats] = await db.select()
      .from(botGameStatistics)
      .where(
        and(
          gte(botGameStatistics.date, startOfDay(today)),
          lte(botGameStatistics.date, endOfDay(today))
        )
      );
    
    if (todayStats) {
      await db.update(botGameStatistics)
        .set({
          pendingPayouts: todayStats.pendingPayouts - pendingTransaction.amount,
          totalPayouts: todayStats.totalPayouts + pendingTransaction.amount
        })
        .where(eq(botGameStatistics.id, todayStats.id));
    }
    
    // Send notification email to user
    // This can be implemented later
    
    res.json({ success: true, message: "Special stone bonus approved and credited to player" });
  } catch (error) {
    console.error("Error approving special stone bonus:", error);
    res.status(500).json({ message: "Failed to approve bonus" });
  }
});

export default router;