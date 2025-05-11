import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { storage } from "./storage";
import { GameManager } from "./game/gameManager";
import { z } from "zod";
import * as schema from "@shared/schema";
import { insertUserSchema, insertGameSchema, insertMessageSchema, InsertGame } from "@shared/schema";
import bcrypt from "bcrypt";
import crypto from "crypto";
import session from "express-session";
import { paymentProcessing } from "./utils/payment";
import Stripe from "stripe";
import { addMinutes, addHours, addDays } from "date-fns";
import { 
  generateVerificationToken, 
  generatePasswordResetToken, 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendTransactionEmail 
} from "./utils/email";
import { db } from "./db";
import { eq } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: "2023-10-16" as any,
});

// Import the PostgreSQL session store
import { sessionStore } from "./storage";

// Configure the session middleware
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "bbg-game-secret",
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: false, // Set to false for development to work with http
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for longer session persistence
    path: '/'
  }
});

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize server
  const httpServer = createServer(app);
  
  // Initialize game manager
  const gameManager = new GameManager(storage);
  
  // Map to store voice chat rooms (roomId -> Map of peerId -> WebSocket)
  const voiceRooms = new Map<string, Map<string, WebSocket>>();
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Session middleware
  app.use(sessionMiddleware);
  
  // Debug session middleware to track session initialization
  app.use((req, res, next) => {
    // Skip logging for static assets and HMR requests to reduce noise
    if (!req.path.includes('.') && !req.path.includes('__vite')) {
      console.log(`Debug - Session check - Path: ${req.method} ${req.path} | Session ID: ${req.session.id}, User ID: ${req.session.userId || 'not logged in'}`);
    }
    next();
  });
  
  // Authentication middleware
  const authenticate = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // At this point, userId is guaranteed to exist
    next();
  };
  
  // Admin usernames - must match the ones in the client's useAdmin hook
  const ADMIN_USERNAMES = ["admin", "precious"];
  
  // Admin authentication middleware 
  const authenticateAdmin = async (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Get user by ID
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is admin
    if (!ADMIN_USERNAMES.includes(user.username)) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    // User is admin
    next();
  };
  
  // Type guard to ensure userId exists
  function ensureUserIdExists(userId: number | undefined): asserts userId is number {
    if (userId === undefined) {
      throw new Error("User ID is undefined");
    }
  }
  
  // Authentication routes
  app.post("/api/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);
      
      // Check if email verification should be skipped
      // This can be controlled by environment variable or specific test email domains
      const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === 'true';
      const testDomains = ['test.com', 'example.com', 'gmail.com']; // Add common test domains
      const isTestEmail = testDomains.some(domain => validatedData.email.endsWith(domain));
      
      // For development, we'll skip verification by default
      const shouldSkipVerification = 
        skipEmailVerification || 
        isTestEmail || 
        process.env.NODE_ENV === 'development';
      
      let verificationToken = null;
      let tokenExpiry = null;
      
      // Only generate token if we're not skipping verification
      if (!shouldSkipVerification) {
        verificationToken = generateVerificationToken();
        tokenExpiry = addDays(new Date(), 3); // Token valid for 3 days
      }
      
      // Create user with verification token (or verified status if skipping)
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        avatarInitials: validatedData.avatarInitials || validatedData.username.substring(0, 2).toUpperCase(),
        verificationToken,
        verificationTokenExpires: tokenExpiry,
        emailVerified: shouldSkipVerification // Auto-verify if skipping verification
      });
      
      // Only send verification email if not skipping verification
      if (!shouldSkipVerification) {
        await sendVerificationEmail(user.email, verificationToken as string);
        console.log('User registered, verification email sent:', user.id);
      } else {
        console.log('User registered with auto-verification (skipped email):', user.id);
      }
      
      // Remove sensitive data from response
      const { password, verificationToken: token, ...userWithoutSensitiveInfo } = user;
      
      // If verification is skipped, log the user in immediately by setting the session
      if (shouldSkipVerification) {
        req.session.userId = user.id;
        console.log(`Auto-login for verified user ${user.id}, session ID: ${req.session.id}`);
        
        res.status(201).json({ 
          ...userWithoutSensitiveInfo,
          message: "Registration successful. Email verification skipped for development."
        });
      } else {
        // Otherwise, don't log in and show verification message
        res.status(201).json({ 
          ...userWithoutSensitiveInfo,
          message: "Registration successful. Please check your email to verify your account."
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Registration error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/login", async (req, res) => {
    try {
      console.log('Login attempt with:', req.body);
      const { username, password } = req.body;
      
      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`User not found with username: ${username}`);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      console.log(`User found: ${user.id} (${user.username})`);
      
      // Check password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        console.log('Password mismatch');
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      console.log('Password match successful');
      
      // Check if user has verified their email
      if (!user.emailVerified) {
        console.log('User email not verified:', user.email);
        
        // Generate a new verification token if needed
        if (!user.verificationToken || new Date() > (user.verificationTokenExpires || new Date())) {
          console.log('Generating new verification token');
          const newVerificationToken = generateVerificationToken();
          const newTokenExpiry = addDays(new Date(), 3);
          
          // Update user with new verification token
          await storage.updateUserProfile(user.id, {
            verificationToken: newVerificationToken,
            verificationTokenExpires: newTokenExpiry
          });
          
          // Send new verification email
          await sendVerificationEmail(user.email, newVerificationToken);
        } else {
          console.log('Resending existing verification token');
          // Token is still valid, resend the existing one
          await sendVerificationEmail(user.email, user.verificationToken as string);
        }
        
        return res.status(403).json({ 
          message: "Email not verified. A new verification link has been sent to your email."
        });
      }
      
      console.log('Email verified, proceeding with login');
      
      // Set session
      req.session.userId = user.id;
      console.log(`Set session userId to ${user.id}, session ID: ${req.session.id}`);
      
      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        
        console.log(`Session saved successfully for user ${user.id}`);
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        console.log('User logged in:', user.id);
        res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/user", authenticate, async (req, res) => {
    try {
      // Since authenticate middleware ensures userId exists, we can safely use the type guard
      ensureUserIdExists(req.session.userId);
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Email verification routes - both GET (for link clicks) and POST (for API calls)
  const handleEmailVerification = async (token: string, res: Response) => {
    try {
      console.log("Handling email verification for token:", token);
      
      // Find user with this verification token
      const users = await db.select().from(schema.users).where(eq(schema.users.verificationToken, token));
      
      console.log("Users found with token:", users.length);
      
      if (users.length === 0) {
        console.log("No user found with verification token:", token);
        res.status(400).json({ message: "Invalid or expired verification token" });
        return null;
      }
      
      const user = users[0];
      console.log("User found:", user.id, user.username);
      
      // Check if token has expired
      if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
        console.log("Token expired at:", user.verificationTokenExpires);
        res.status(400).json({ message: "Verification token has expired" });
        return null;
      }
      
      console.log("Updating user to mark email as verified");
      
      // Update user to mark email as verified
      await storage.updateUserProfile(user.id, {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null
      });
      
      console.log("User successfully verified:", user.id);
      return user;
    } catch (error) {
      console.error("Email verification error:", error);
      throw error;
    }
  };
  
  // GET route for email verification (clicked from email)
  app.get("/api/verify-email/:token", async (req, res) => {
    try {
      console.log("GET verification request for token:", req.params.token);
      const { token } = req.params;
      const user = await handleEmailVerification(token, res);
      
      if (!user) {
        console.log("Verification failed in GET route - already handled");
        return; // Error already handled in the function
      }
      
      // Redirect to login page with success message
      console.log("Redirecting to login page with verified flag");
      res.redirect(`/auth?verified=true`);
    } catch (error) {
      console.error("Email verification error in GET route:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });
  
  // POST route for email verification (called from frontend)
  app.post("/api/verify-email/:token", async (req, res) => {
    try {
      console.log("POST verification request for token:", req.params.token);
      const { token } = req.params;
      const user = await handleEmailVerification(token, res);
      
      if (!user) {
        console.log("Verification failed in POST route - already handled");
        return; // Error already handled in the function
      }
      
      console.log("Sending success response for verified email");
      res.status(200).json({ 
        message: "Email verified successfully",
        verified: true
      });
    } catch (error) {
      console.error("Email verification error in POST route:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });
  
  // Resend verification email
  app.post("/api/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal if email exists for security
        return res.status(200).json({ message: "If your email is registered, you will receive a verification link" });
      }
      
      // Check if already verified
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      
      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const tokenExpiry = addDays(new Date(), 3);
      
      // Update user with new token
      await storage.updateUserProfile(user.id, {
        verificationToken,
        verificationTokenExpires: tokenExpiry
      });
      
      // Send verification email
      await sendVerificationEmail(user.email, verificationToken);
      
      res.status(200).json({ message: "Verification email has been sent" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });
  
  // Forgot password - request reset
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal if email exists for security
        return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
      }
      
      // Generate password reset token
      const resetToken = generatePasswordResetToken();
      const tokenExpiry = addHours(new Date(), 1); // Token valid for 1 hour
      
      // Update user with reset token
      await storage.updateUserProfile(user.id, {
        resetPasswordToken: resetToken,
        resetPasswordTokenExpires: tokenExpiry
      });
      
      // Send password reset email
      await sendPasswordResetEmail(user.email, resetToken);
      
      res.status(200).json({ message: "Password reset email has been sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });
  
  // Reset password with token
  app.post("/api/reset-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }
      
      // Find user with this reset token
      const users = await db.select().from(schema.users).where(eq(schema.users.resetPasswordToken, token));
      
      if (users.length === 0) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      const user = users[0];
      
      // Check if token has expired
      if (user.resetPasswordTokenExpires && new Date() > user.resetPasswordTokenExpires) {
        return res.status(400).json({ message: "Password reset token has expired" });
      }
      
      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Update user password and clear reset token
      await storage.updateUserProfile(user.id, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpires: null
      });
      
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  
  // Admin check endpoint
  app.get("/api/admin/check", authenticate, async (req, res) => {
    try {
      // Since authenticate middleware ensures userId exists, we can safely use the type guard
      ensureUserIdExists(req.session.userId);
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is in the admin list
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
  
  // Admin-only voice chat management endpoints
  
  // Get active voice channels
  app.get("/api/admin/voice/channels", authenticateAdmin, async (req, res) => {
    try {
      // Get a list of active voice rooms
      const activeRooms = Array.from(voiceRooms.keys()).map(roomId => {
        const userCount = voiceRooms.get(roomId)?.size || 0;
        return {
          roomId,
          userCount,
          createdAt: new Date().toISOString() // We would ideally store this when creating the room
        };
      });
      
      res.json(activeRooms);
    } catch (error) {
      console.error('Error getting voice channels:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Close a voice channel
  app.post("/api/admin/voice/channels/:roomId/close", authenticateAdmin, async (req, res) => {
    try {
      const { roomId } = req.params;
      const room = voiceRooms.get(roomId);
      
      if (!room) {
        return res.status(404).json({ message: "Voice channel not found" });
      }
      
      // Notify all users in the room that it's being closed
      room.forEach(clientWs => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'voice_channel_closed',
            payload: {
              roomId,
              reason: 'Closed by administrator'
            }
          }));
        }
      });
      
      // Close all connections
      room.forEach(clientWs => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close();
        }
      });
      
      // Remove the room
      voiceRooms.delete(roomId);
      
      res.json({ message: "Voice channel closed successfully" });
    } catch (error) {
      console.error('Error closing voice channel:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Game routes
  app.post("/api/games", authenticate, async (req, res) => {
    try {
      console.log('Got create game request with body:', req.body);
      
      if (!req.body || !req.body.maxPlayers || !req.body.stake) {
        return res.status(400).json({ message: "Required fields: maxPlayers, stake" });
      }

      // Since authenticate middleware ensures userId exists, we can safely use the type guard
      ensureUserIdExists(req.session.userId);

      // Validate the request data
      const validatedData = insertGameSchema.parse({
        ...req.body,
        creatorId: req.session.userId,
        // Calculate commission percentage (10% for stakes less than 50,000, 5% for 50,000 and above)
        commissionPercentage: req.body.stake >= 50000 ? 0.05 : 0.1
      });
      
      // Special handling for single player (bot) games
      const isSinglePlayerGame = req.body.playWithBot === true;
      console.log('Creating game with params:', req.body);
      
      // Validate max players (allow 1 for single player bot games)
      if ((!isSinglePlayerGame && validatedData.maxPlayers < 2) || validatedData.maxPlayers > 10) {
        return res.status(400).json({ message: "Max players must be between 2 and 10 for multiplayer games" });
      }
      
      // Ensure we set maxPlayers to 2 for bot games (1 human + 1 bot)
      if (isSinglePlayerGame && validatedData.maxPlayers === 1) {
        validatedData.maxPlayers = 2;
      }
      
      // IMPORTANT: Add the playWithBot flag from the request body to validatedData
      if (isSinglePlayerGame) {
        (validatedData as any).playWithBot = true;
        console.log('Added playWithBot flag to validatedData');
      }
      
      // Set voice chat enabled based on stake amount (>=20,000) or explicit request
      const isHighStakeGame = validatedData.stake >= 20000;
      const voiceChatEnabled = typeof req.body.voiceChatEnabled === 'boolean' 
        ? req.body.voiceChatEnabled 
        : isHighStakeGame; // Enable by default for high-stake games
      
      // Cast to proper type using intersection to avoid type errors
      const gameData = {
        ...validatedData,
        voiceChatEnabled, // Use consistent typing - Boolean not null
        playWithBot: isSinglePlayerGame // Make sure to include this flag properly
      };
      
      console.log(`Voice chat ${voiceChatEnabled ? 'enabled' : 'disabled'} for this game (stake: ${validatedData.stake})`);
      
      
      // Validate stake amount
      if (validatedData.stake < 1000) {
        return res.status(400).json({ message: "Minimum stake is ₦1,000" });
      }
      
      // Check if user has enough balance
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (user.walletBalance < validatedData.stake) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }
      
      // Create game with the validated data
      const game = await gameManager.createGame(gameData, req.session.userId);
      
      res.status(201).json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Game creation error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/games/available", authenticate, async (req, res) => {
    try {
      const games = await gameManager.getAvailableGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/games/user", authenticate, async (req, res) => {
    try {
      // Since authenticate middleware ensures userId exists, we can safely use the type guard
      ensureUserIdExists(req.session.userId);
      
      const games = await gameManager.getUserGames(req.session.userId);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/games/:id", authenticate, async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      
      // Validate game ID
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      // Get game
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Get players
      const players = await storage.getGamePlayers(gameId);
      
      // Get messages
      const messages = await storage.getGameMessages(gameId);
      
      res.json({
        game,
        players,
        messages
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Send a message in a game
  app.post("/api/games/:id/messages", authenticate, async (req, res) => {
    try {
      // Since authenticate middleware ensures userId exists, we can safely use the type guard
      ensureUserIdExists(req.session.userId);
      
      const gameId = parseInt(req.params.id);
      
      // Validate game ID
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      // Get game to check if it exists and if user is a player
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Check if user is a player in this game
      const gamePlayer = await storage.getGamePlayer(gameId, req.session.userId);
      if (!gamePlayer) {
        return res.status(403).json({ message: "You are not a player in this game" });
      }
      
      // Validate message data
      const messageSchema = z.object({
        content: z.string().min(1).max(500),
        type: z.enum(["chat", "system"]).default("chat"),
      });
      
      const validatedData = messageSchema.parse({
        content: req.body.content,
        type: req.body.type || "chat",
      });
      
      // Create message
      const message = await storage.createMessage({
        gameId,
        userId: req.session.userId,
        content: validatedData.content,
        type: validatedData.type,
      });
      
      // Broadcast message to all game players via WebSocket (if implemented)
      // This would go here...
      
      // Return the created message
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Message creation error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/games/:id/join", authenticate, async (req, res) => {
    try {
      // Since authenticate middleware ensures userId exists, we can safely use the type guard
      ensureUserIdExists(req.session.userId);

      const gameId = parseInt(req.params.id);
      
      // Validate game ID
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      // Get game
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Check if game is waiting for players
      if (game.status !== "waiting") {
        return res.status(400).json({ message: "Game is not accepting new players" });
      }
      
      // Check if user has enough balance
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (user.walletBalance < game.stake) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }
      
      // Join game
      await gameManager.joinGame(gameId, req.session.userId);
      
      res.json({ message: "Joined game successfully" });
    } catch (error) {
      console.error('Error joining game:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Transaction routes
  // Stripe payment intent endpoint
  app.post("/api/create-payment-intent", authenticate, async (req, res) => {
    try {
      // Since authenticate middleware ensures userId exists, we can safely use the type guard
      ensureUserIdExists(req.session.userId);
      
      const { amount } = req.body;

      // Validate amount
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Create a payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents/kobo
        currency: "ngn", // Nigerian Naira
        automatic_payment_methods: {
          enabled: true,
        },
        // Store user ID in metadata for reference
        metadata: {
          userId: req.session.userId.toString(),
        },
      });

      // Return the client secret to the client
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Failed to create payment intent", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Stripe webhook endpoint to handle successful payments
  app.post("/api/stripe-webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // For demo purposes, we'll skip signature verification
    // In production, you should verify the signature
    
    try {
      const event = req.body;
      
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        
        // Get the user ID from metadata
        const userId = parseInt(paymentIntent.metadata.userId);
        
        // Get payment amount in currency (Naira)
        const amount = paymentIntent.amount / 100;
        
        // Create transaction record
        const transaction = await storage.createTransaction({
          userId,
          amount,
          type: "deposit",
          status: "completed",
          reference: paymentIntent.id,
        });
        
        // Update user balance
        const user = await storage.getUser(userId);
        if (user) {
          await storage.updateUserBalance(
            userId,
            user.walletBalance + amount
          );
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Legacy deposit endpoint for demo/simulated deposits
  app.post("/api/transactions/deposit", authenticate, async (req, res) => {
    try {
      // Since authenticate middleware ensures userId exists, we can safely use the type guard
      ensureUserIdExists(req.session.userId);
      
      const { amount } = req.body;
      
      // Validate amount
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      // Process payment (mock implementation)
      const paymentResult = await paymentProcessing.processDeposit(req.session.userId, amount);
      
      if (!paymentResult.success) {
        return res.status(400).json({ message: paymentResult.message });
      }
      
      // Create transaction
      const transaction = await storage.createTransaction({
        userId: req.session.userId,
        amount,
        type: "deposit",
        status: "completed",
        reference: paymentResult.reference,
      });
      
      // Update user balance
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUserBalance(
        req.session.userId,
        user.walletBalance + amount
      );
      
      res.json({
        transaction,
        newBalance: updatedUser.walletBalance
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Demo deposit (for testing only)
  app.post("/api/transactions/demo-deposit", authenticate, async (req, res) => {
    try {
      // Since authenticate middleware ensures userId exists, we can safely use the type guard
      ensureUserIdExists(req.session.userId);
      
      const amount = 100000; // ₦100,000 demo amount
      
      // Create transaction
      const transaction = await storage.createTransaction({
        userId: req.session.userId,
        amount,
        type: "deposit",
        status: "completed",
        reference: `demo-${Date.now()}`,
      });
      
      // Update user balance
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUserBalance(
        req.session.userId,
        user.walletBalance + amount
      );
      
      res.json({
        transaction,
        newBalance: updatedUser.walletBalance,
        message: "Demo funds added successfully"
      });
    } catch (error) {
      console.error('Demo deposit error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/transactions/withdraw", authenticate, async (req, res) => {
    try {
      // Since authenticate middleware ensures userId exists, we can safely use the type guard
      ensureUserIdExists(req.session.userId);
      
      const { amount } = req.body;
      
      // Validate amount
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      // Check if user has enough balance
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (user.walletBalance < amount) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }
      
      // Process withdrawal (mock implementation)
      const withdrawalResult = await paymentProcessing.processWithdrawal(req.session.userId, amount);
      
      if (!withdrawalResult.success) {
        return res.status(400).json({ message: withdrawalResult.message });
      }
      
      // Create transaction
      const transaction = await storage.createTransaction({
        userId: req.session.userId,
        amount,
        type: "withdrawal",
        status: "completed",
        reference: withdrawalResult.reference,
      });
      
      // Update user balance
      const updatedUser = await storage.updateUserBalance(
        req.session.userId,
        user.walletBalance - amount
      );
      
      res.json({
        transaction,
        newBalance: updatedUser.walletBalance
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/transactions", authenticate, async (req, res) => {
    try {
      // Since authenticate middleware ensures userId exists, we can safely use the type guard
      ensureUserIdExists(req.session.userId);
      
      const transactions = await storage.getUserTransactions(req.session.userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Parse sessions from WebSocket upgrade requests
  wss.on('headers', (headers, req) => {
    headers.push('Set-Cookie: ' + req.headers.cookie);
  });
  
  // WebSocket connection handling
  wss.on('connection', (ws, req) => {
    let userId: number | null = null;
    let gameId: number | null = null;
    
    // Extract session and session data
    const getSessionData = () => {
      return new Promise<number | null>((resolve) => {
        sessionMiddleware(req as any, {} as any, () => {
          if ((req as any).session && (req as any).session.userId) {
            resolve((req as any).session.userId);
          } else {
            resolve(null);
          }
        });
      });
    };
    
    // Initial authentication
    getSessionData().then(sessionUserId => {
      if (sessionUserId) {
        userId = sessionUserId;
        console.log(`WebSocket authenticated for user ${userId}`);
      }
    });
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle voice chat messages
        if (data.type === 'join_voice') {
          const roomId = data.payload.roomId;
          const peerId = data.payload.peerId;
          
          console.log(`Voice chat: User ${peerId} joined room ${roomId}`);
          
          // Store these voice connections in a separate map from the game connections
          if (!voiceRooms.has(roomId)) {
            voiceRooms.set(roomId, new Map());
          }
          
          // Add this connection to voice room
          const room = voiceRooms.get(roomId);
          if (room) {
            room.set(peerId, ws);
            
            // Notify other users in the room about the new join
            room.forEach((peerWs, peerPeerId) => {
              if (peerPeerId !== peerId && peerWs.readyState === WebSocket.OPEN) {
                peerWs.send(JSON.stringify({
                  type: 'voice_user_joined',
                  payload: { roomId, peerId }
                }));
              }
            });
            
            // Confirm join to the user
            ws.send(JSON.stringify({
              type: 'voice_joined',
              payload: { roomId, peerId }
            }));
          }
          return;
        }
        
        // Handle WebRTC signaling messages for voice chat
        if (data.type === 'voice_offer' || data.type === 'voice_answer' || data.type === 'voice_ice_candidate') {
          const { roomId, peerId, targetPeerId } = data.payload;
          
          // Find the target peer in the room
          const room = voiceRooms.get(roomId);
          if (room && targetPeerId) {
            const targetWs = room.get(targetPeerId);
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
              // Forward the signaling message to the target peer
              targetWs.send(JSON.stringify(data));
              console.log(`Voice chat: Forwarded ${data.type} from ${peerId} to ${targetPeerId}`);
            }
          }
          return;
        }
        
        // Handle simple voice chat audio data
        if (data.type === 'voice_data') {
          const { roomId, peerId } = data.payload;
          
          // Find all peers in the room
          const room = voiceRooms.get(roomId);
          if (room) {
            // Broadcast to all other peers in the room
            room.forEach((peerWs, peerKey) => {
              if (peerKey !== peerId && peerWs.readyState === WebSocket.OPEN) {
                // Forward the audio data to other peers
                peerWs.send(JSON.stringify(data));
              }
            });
            console.log(`Voice chat: Broadcast voice data from ${peerId} to ${room.size - 1} peers`);
          }
          return;
        }
        
        // Handle voice chat leave
        if (data.type === 'voice_leave') {
          const { roomId, peerId } = data.payload;
          
          const room = voiceRooms.get(roomId);
          if (room) {
            // Remove this connection from the room
            room.delete(peerId);
            
            // Notify others in the room
            room.forEach((peerWs, peerPeerId) => {
              if (peerWs.readyState === WebSocket.OPEN) {
                peerWs.send(JSON.stringify({
                  type: 'voice_user_left',
                  payload: { roomId, peerId }
                }));
              }
            });
            
            // If room is empty, remove it
            if (room.size === 0) {
              voiceRooms.delete(roomId);
            }
          }
          
          console.log(`Voice chat: User ${peerId} left room ${roomId}`);
          return;
        }
        
        // Game-related messages
        if (data.type === 'join_game') {
          gameId = data.payload.gameId;
          
          // If we don't have a userId yet, try to get from the session
          if (!userId) {
            userId = await getSessionData();
          }
          
          // Check if we have a valid user
          if (!userId) {
            ws.send(JSON.stringify({
              type: 'error',
              payload: {
                message: 'Unauthorized - please login again'
              }
            }));
            return;
          }
          
          // Add the connection to game manager
          if (gameId !== null && userId !== null) {
            // We've verified both are non-null, so it's safe to assert them as numbers
            gameManager.addWebSocketConnection(gameId as number, userId as number, ws);
          }
          
          // Log
          console.log(`User ${userId} joined game ${gameId}`);
        } else if (data.type === 'leave_game') {
          if (gameId !== null && userId !== null) {
            gameManager.removeWebSocketConnection(gameId as number, userId as number);
            gameId = null;
          }
        } else if (data.type === 'roll_stone') {
          if (gameId !== null && userId !== null) {
            await gameManager.rollStone(gameId as number, userId as number);
            console.log(`User ${userId} rolled in game ${gameId}`);
          } else {
            console.log('Cannot roll: missing gameId or userId', { gameId, userId });
            
            // Try to re-authenticate
            if (!userId) {
              userId = await getSessionData();
              
              if (userId !== null && gameId !== null) {
                await gameManager.rollStone(gameId as number, userId as number);
                console.log(`Re-authenticated user ${userId} rolled in game ${gameId}`);
              }
            }
          }
        } else if (data.type === 'chat_message') {
          if (gameId !== null && userId !== null) {
            const messageContent = data.payload.content;
            
            // Validate message
            if (!messageContent || messageContent.trim() === '') {
              return;
            }
            
            // Create and broadcast message
            await gameManager.sendChatMessage(gameId as number, userId as number, messageContent);
          }
        } 
        // Handle WebRTC signaling for voice chat
        else if (['voice_offer', 'voice_answer', 'voice_ice_candidate', 'voice_leave'].includes(data.type)) {
          if (gameId !== null && userId !== null) {
            // Get the game to check if voice chat is enabled
            const game = await storage.getGame(gameId as number);
            if (!game) {
              return;
            }
            
            // Only relay voice chat messages if the game has voice chat enabled
            // Voice chat is enabled for games with stake >= 20,000
            if (game.voiceChatEnabled) {
              // The target user ID to send the signaling message to
              const targetUserId = data.payload.targetUserId;
              
              if (!targetUserId) {
                return;
              }
              
              // Find the target connection
              const connections = gameManager.getGameConnections(gameId as number);
              const targetConnection = connections.find(conn => conn.userId === targetUserId);
              
              // Send the signaling message directly to the target user
              if (targetConnection && targetConnection.ws.readyState === WebSocket.OPEN) {
                targetConnection.ws.send(JSON.stringify({
                  type: data.type,
                  payload: {
                    ...data.payload,
                    fromUserId: userId
                  }
                }));
              }
            }
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    });
    
    ws.on('close', () => {
      if (gameId && userId) {
        gameManager.removeWebSocketConnection(gameId, userId);
      }
    });
  });
  
  return httpServer;
}
