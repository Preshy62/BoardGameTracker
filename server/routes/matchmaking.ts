import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { 
  addPlayerToQueue, 
  removePlayerFromQueue, 
  getMatchmakingStats, 
  startMatchmakingProcess, 
  stopMatchmakingProcess,
  findMatches
} from '../game/matchmaking';

const router = Router();

// Middleware to ensure user is authenticated
const authenticate = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Join the matchmaking queue
router.post('/join', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      stake: z.number().min(100).max(1000000),
      currency: z.string().default("NGN"),
      preferredGameSize: z.number().min(2).max(10).optional()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Invalid request",
        errors: result.error.format() 
      });
    }

    const { stake, currency, preferredGameSize } = result.data;
    const userId = req.session.userId;

    // Check if the user has enough balance
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.walletBalance < stake) {
      return res.status(400).json({ 
        message: "Insufficient funds",
        required: stake,
        available: user.walletBalance
      });
    }

    // Add player to queue
    await addPlayerToQueue(userId, stake, currency, preferredGameSize);

    res.status(200).json({ 
      message: "Joined matchmaking queue", 
      position: (await getMatchmakingStats()).playersWaiting
    });
  } catch (error) {
    console.error("Error joining matchmaking:", error);
    res.status(500).json({ 
      message: "Failed to join matchmaking queue",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Leave the matchmaking queue
router.post('/leave', authenticate, (req, res) => {
  try {
    const userId = req.session.userId;
    const removed = removePlayerFromQueue(userId);

    if (removed) {
      res.status(200).json({ message: "Left matchmaking queue" });
    } else {
      res.status(404).json({ message: "You are not in the matchmaking queue" });
    }
  } catch (error) {
    console.error("Error leaving matchmaking:", error);
    res.status(500).json({ 
      message: "Failed to leave matchmaking queue",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get matchmaking statistics
router.get('/stats', (req, res) => {
  try {
    const stats = getMatchmakingStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error getting matchmaking stats:", error);
    res.status(500).json({ 
      message: "Failed to get matchmaking statistics",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Force matchmaking (admin only)
router.post('/force-match', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const matches = await findMatches();
    
    res.status(200).json({ 
      matches: matches.map(m => ({
        success: m.success,
        gameId: m.game?.id,
        players: m.players.length,
        message: m.message
      }))
    });
  } catch (error) {
    console.error("Error forcing matchmaking:", error);
    res.status(500).json({ 
      message: "Failed to force matchmaking",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Start matchmaking process (admin only)
router.post('/start-process', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const schema = z.object({
      intervalMs: z.number().min(1000).max(60000).default(10000)
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Invalid request",
        errors: result.error.format() 
      });
    }

    const { intervalMs } = result.data;
    
    const interval = startMatchmakingProcess(intervalMs);
    
    res.status(200).json({ 
      message: `Matchmaking process started with interval ${intervalMs}ms`,
      intervalSeconds: intervalMs / 1000
    });
  } catch (error) {
    console.error("Error starting matchmaking process:", error);
    res.status(500).json({ 
      message: "Failed to start matchmaking process",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Stop matchmaking process (admin only)
router.post('/stop-process', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const stopped = stopMatchmakingProcess();
    
    if (stopped) {
      res.status(200).json({ message: "Matchmaking process stopped" });
    } else {
      res.status(400).json({ message: "Matchmaking process was not running" });
    }
  } catch (error) {
    console.error("Error stopping matchmaking process:", error);
    res.status(500).json({ 
      message: "Failed to stop matchmaking process",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;