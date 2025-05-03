import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { storage } from "./storage";
import { GameManager } from "./game/gameManager";
import { z } from "zod";
import { insertUserSchema, insertGameSchema, insertMessageSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import crypto from "crypto";
import session from "express-session";
import { paymentProcessing } from "./utils/payment";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: "2023-10-16" as any,
});

// Initialize session store
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "bbg-game-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
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
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Session middleware
  app.use(sessionMiddleware);
  
  // Authentication middleware
  const authenticate = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
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
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        avatarInitials: validatedData.avatarInitials || validatedData.username.substring(0, 2).toUpperCase()
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Check password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", authenticate, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Game routes
  app.post("/api/games", authenticate, async (req, res) => {
    try {
      const validatedData = insertGameSchema.parse(req.body);
      
      // Validate max players
      if (validatedData.maxPlayers < 2 || validatedData.maxPlayers > 10) {
        return res.status(400).json({ message: "Max players must be between 2 and 10" });
      }
      
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
      
      // Calculate commission percentage (10% for stakes less than 50,000, 5% for 50,000 and above)
      const commissionPercentage = validatedData.stake >= 50000 ? 0.05 : 0.1;
      
      // Create game
      const game = await gameManager.createGame({
        ...validatedData,
        commissionPercentage
      }, req.session.userId);
      
      res.status(201).json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error(error);
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
  
  app.post("/api/games/:id/join", authenticate, async (req, res) => {
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
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Transaction routes
  // Stripe payment intent endpoint
  app.post("/api/create-payment-intent", authenticate, async (req, res) => {
    try {
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
  
  app.post("/api/transactions/withdraw", authenticate, async (req, res) => {
    try {
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
      const transactions = await storage.getUserTransactions(req.session.userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // WebSocket connection handling
  wss.on('connection', (ws) => {
    let userId: number | null = null;
    let gameId: number | null = null;
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join_game') {
          gameId = data.payload.gameId;
          
          // Get user ID from active sessions
          // This is a simplified way - in production you'd use proper WS authentication
          const user = await storage.getUser(userId || 0);
          if (!user) {
            ws.send(JSON.stringify({
              type: 'error',
              payload: {
                message: 'Unauthorized'
              }
            }));
            return;
          }
          
          userId = user.id;
          
          // Add the connection to game manager
          gameManager.addWebSocketConnection(gameId, userId, ws);
          
          // Log
          console.log(`User ${userId} joined game ${gameId}`);
        } else if (data.type === 'leave_game') {
          if (gameId && userId) {
            gameManager.removeWebSocketConnection(gameId, userId);
            gameId = null;
          }
        } else if (data.type === 'roll_stone') {
          if (gameId && userId) {
            await gameManager.rollStone(gameId, userId);
          }
        } else if (data.type === 'chat_message') {
          if (gameId && userId) {
            const messageContent = data.payload.content;
            
            // Validate message
            if (!messageContent || messageContent.trim() === '') {
              return;
            }
            
            // Create and broadcast message
            await gameManager.sendChatMessage(gameId, userId, messageContent);
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
