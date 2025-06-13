import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { 
  getMaintenanceSettings, 
  updateMaintenanceSettings 
} from "../utils/maintenance";

// Create the router
const router = Router();

// Middleware to ensure user is admin
const ensureAdmin = async (req: Request, res: Response, next: Function) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Get user by ID
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Check if user is admin - hardcoded list for now
  const ADMIN_USERNAMES = ["admin", "precious"];
  if (!ADMIN_USERNAMES.includes(user.username)) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  
  // User is admin
  next();
};

// Admin check endpoint
router.get("/check", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if user is in the admin list
    const ADMIN_USERNAMES = ["admin", "precious"];
    const isAdmin = ADMIN_USERNAMES.includes(user.username);
    
    res.json({ 
      isAdmin,
      username: user.username 
    });
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all users
router.get("/users", ensureAdmin, async (req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    
    // Format users for API response
    const formattedUsers = users.map(user => ({
      ...user,
      // Default to initials if no avatar
      avatarInitials: user.avatarInitials || user.username.substring(0, 2).toUpperCase(),
      // Add additional fields for admin view
      isActive: true, // Default all users to active for now
    }));
    
    res.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users for admin:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Get single user details
router.get("/users/:userId", ensureAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get user's transactions
    const transactions = await storage.getUserTransactions(userId);
    
    // Get user's games
    const games = await storage.getUserGames(userId);
    
    // Add avatarInitials if not present
    if (!user.avatarInitials) {
      user.avatarInitials = user.username.substring(0, 2).toUpperCase();
    }
    
    // Add isActive field for admin UI
    const userWithStatus = {
      ...user,
      isActive: true,  // Default to active for now
    };
    
    res.json({
      user: userWithStatus,
      transactions,
      games
    });
  } catch (error) {
    console.error(`Error fetching user details for admin: ${error}`);
    res.status(500).json({ message: "Error fetching user details" });
  }
});

// Update user status (activate/deactivate)
router.patch("/users/:userId/status", ensureAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: "Invalid status value" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Protect admin accounts from deactivation
    const ADMIN_USERNAMES = ["admin", "precious"];
    if (ADMIN_USERNAMES.includes(user.username) && !isActive) {
      return res.status(403).json({ message: "Cannot deactivate administrator accounts" });
    }
    
    // Update user profile with isActive status
    const updatedUser = await storage.updateUserProfile(userId, { 
      ...user, 
      isActive 
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error(`Error updating user status for admin: ${error}`);
    res.status(500).json({ message: "Error updating user status" });
  }
});

// Delete user endpoint
router.delete("/users/:userId", ensureAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Protect admin accounts from deletion
    const ADMIN_USERNAMES = ["admin", "precious"];
    if (ADMIN_USERNAMES.includes(user.username)) {
      return res.status(403).json({ message: "Cannot delete administrator accounts" });
    }
    
    // Check if deleteUser method exists in storage
    if (typeof storage.deleteUser !== 'function') {
      return res.status(501).json({ 
        message: "User deletion not implemented in storage layer. Please update your storage implementation."
      });
    }
    
    // Delete the user
    await storage.deleteUser(userId);
    
    res.json({ 
      success: true, 
      message: `User ${user.username} has been deleted successfully`
    });
  } catch (error) {
    console.error(`Error deleting user for admin: ${error}`);
    res.status(500).json({ message: "Error deleting user" });
  }
});

// Update user balance
router.post("/users/:userId/balance", ensureAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const { amount, reason } = req.body;
    if (typeof amount !== 'number') {
      return res.status(400).json({ message: "Amount must be a number" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Calculate new balance
    const newBalance = user.walletBalance + amount;
    if (newBalance < 0) {
      return res.status(400).json({ message: "Insufficient balance for deduction" });
    }
    
    // Update user balance
    const updatedUser = await storage.updateUserBalance(userId, newBalance);
    
    // Create transaction record
    const transactionType = amount >= 0 ? 'deposit' : 'withdrawal';
    const transaction = await storage.createTransaction({
      userId,
      type: transactionType,
      amount: Math.abs(amount),  // Store as positive amount
      status: 'completed',
      currency: 'NGN',  // Default currency
      description: reason || `Manual ${transactionType} by admin`,
      reference: `admin-adjustment-${Date.now()}`
    });
    
    res.json({
      user: updatedUser,
      transaction
    });
  } catch (error) {
    console.error(`Error adjusting user balance for admin: ${error}`);
    res.status(500).json({ message: "Error adjusting user balance" });
  }
});

// Maintenance mode endpoints
router.get("/maintenance", ensureAdmin, async (req: Request, res: Response) => {
  try {
    const settings = getMaintenanceSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching maintenance settings:', error);
    res.status(500).json({ message: "Failed to get maintenance settings" });
  }
});

router.post("/maintenance", ensureAdmin, async (req: Request, res: Response) => {
  try {
    const { enabled, message } = req.body;
    
    const settings = updateMaintenanceSettings({
      enabled: enabled !== undefined ? enabled : undefined,
      message: message || undefined
    });
    
    console.log(`Maintenance mode ${settings.enabled ? 'enabled' : 'disabled'} by admin user ID: ${req.session.userId}`);
    res.json(settings);
  } catch (error) {
    console.error('Error updating maintenance settings:', error);
    res.status(500).json({ message: "Failed to update maintenance settings" });
  }
});

// Monthly Lottery Management Endpoints
let lotterySettings = {
  enabled: false,
  multiplier: "2x",
  lastActivated: null as string | null,
  canActivate: true,
  activatedThisMonth: false
};

// Export function to get current lottery status
export const getCurrentLotteryStatus = () => {
  checkMonthlyReset();
  return lotterySettings;
};

// Reset lottery permission at start of new month
const checkMonthlyReset = () => {
  if (lotterySettings.lastActivated) {
    const lastDate = new Date(lotterySettings.lastActivated);
    const now = new Date();
    
    // If we're in a new month, reset permission
    if (lastDate.getMonth() !== now.getMonth() || lastDate.getFullYear() !== now.getFullYear()) {
      lotterySettings.canActivate = true;
      lotterySettings.activatedThisMonth = false;
    }
  }
};

// Get lottery status
router.get("/lottery/status", ensureAdmin, async (req: Request, res: Response) => {
  try {
    checkMonthlyReset();
    res.json(lotterySettings);
  } catch (error) {
    console.error(`Error getting lottery status: ${error}`);
    res.status(500).json({ message: "Error getting lottery status" });
  }
});

// Activate monthly lottery
router.post("/lottery/activate", ensureAdmin, async (req: Request, res: Response) => {
  try {
    checkMonthlyReset();
    
    if (!lotterySettings.canActivate) {
      return res.status(400).json({ 
        message: "Monthly lottery has already been used this month" 
      });
    }
    
    if (lotterySettings.enabled) {
      return res.status(400).json({ 
        message: "Lottery is already active" 
      });
    }
    
    const { multiplier } = req.body;
    
    // Validate multiplier
    if (!multiplier || !["2x", "3x"].includes(multiplier)) {
      return res.status(400).json({ 
        message: "Invalid multiplier. Must be 2x or 3x" 
      });
    }
    
    // Activate lottery
    lotterySettings.enabled = true;
    lotterySettings.multiplier = multiplier;
    lotterySettings.lastActivated = new Date().toISOString();
    lotterySettings.canActivate = false;
    lotterySettings.activatedThisMonth = true;
    
    res.json({
      success: true,
      message: `Monthly lottery activated with ${multiplier} multiplier`,
      activatedAt: lotterySettings.lastActivated,
      settings: lotterySettings
    });
  } catch (error) {
    console.error(`Error activating lottery: ${error}`);
    res.status(500).json({ message: "Error activating lottery" });
  }
});

// Deactivate lottery
router.post("/lottery/deactivate", ensureAdmin, async (req: Request, res: Response) => {
  try {
    if (!lotterySettings.enabled) {
      return res.status(400).json({ 
        message: "Lottery is not currently active" 
      });
    }
    
    lotterySettings.enabled = false;
    
    res.json({
      success: true,
      message: "Monthly lottery deactivated",
      settings: lotterySettings
    });
  } catch (error) {
    console.error(`Error deactivating lottery: ${error}`);
    res.status(500).json({ message: "Error deactivating lottery" });
  }
});

// Get current lottery multiplier (for game logic)
router.get("/lottery/multiplier", async (req: Request, res: Response) => {
  try {
    checkMonthlyReset();
    res.json({
      enabled: lotterySettings.enabled,
      multiplier: lotterySettings.multiplier,
      multiplierValue: lotterySettings.enabled ? 
        (lotterySettings.multiplier === "3x" ? 3 : 2) : 1
    });
  } catch (error) {
    console.error(`Error getting lottery multiplier: ${error}`);
    res.status(500).json({ message: "Error getting lottery multiplier" });
  }
});

export default router;