import { Router } from "express";
import { db } from "../db";
import { botGameSettings, botGameStatistics } from "@shared/schema";
import { eq, gte, lte } from "drizzle-orm";
import { startOfDay, endOfDay } from "date-fns";
import { z } from "zod";
import { authenticate, authenticateAdmin } from "./middleware";

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
          updatedBy: req.user.id,
        })
        .where(eq(botGameSettings.id, existingSettings.id))
        .returning();
    } else {
      // Create initial settings
      [updatedSettings] = await db.insert(botGameSettings)
        .values({
          ...validatedData,
          updatedAt: new Date(),
          updatedBy: req.user.id,
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

export default router;