import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { GameStatus } from "@shared/schema";

// Create a demo user function for testing
async function createDemoUser() {
  try {
    // Check if demo user already exists
    console.log("Checking if demo user exists...");
    const existingUser = await storage.getUserByUsername("demo");
    if (existingUser) {
      console.log("Demo user already exists");
      return existingUser;
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("demo123", saltRounds);
    
    console.log("Creating demo user...");
    
    // Create user based on the schema
    const user = await storage.createUser({
      username: "demo",
      email: "demo@bigboysgame.com",
      password: hashedPassword,
      avatarInitials: "DM",
    });
    
    console.log("Demo user created with ID:", user.id);
    
    // Give them some initial funds
    console.log("Adding initial funds to demo user...");
    await storage.updateUserBalance(user.id, 200000); // ₦200,000
    
    console.log("Demo user created successfully with ID:", user.id);
    
    return user;
  } catch (error) {
    console.error("Failed to create demo user:", error);
    return null;
  }
}

// Create demo games for animation testing
async function createDemoGames() {
  try {
    console.log("Creating demo games for animation testing...");
    
    // Create computer player if not exists
    let computerUser = await storage.getUserByUsername("Computer");
    if (!computerUser) {
      const hashedPassword = await bcrypt.hash("computer123", 10);
      computerUser = await storage.createUser({
        username: "Computer",
        email: "computer@bigboysgame.com",
        password: hashedPassword,
        avatarInitials: "PC",
      });
      console.log("Computer user created with ID:", computerUser.id);
    }
    
    // Get the demo user
    const demoUser = await storage.getUserByUsername("demo");
    if (!demoUser) {
      console.error("Demo user not found, cannot create demo games");
      return;
    }
    
    // Create demo game for animation testing
    const existingGame2 = await storage.getGame(2);
    if (!existingGame2) {
      console.log("Creating animation demo game #2");
      
      // Create game first with basic info
      const game = await storage.createGame({
        creatorId: demoUser.id,
        maxPlayers: 2,
        stake: 2000,
        commissionPercentage: 0.05,
      });
      
      // Then update it with the completed status and winner info
      await storage.updateGame(game.id, {
        status: "completed" as GameStatus,
        endedAt: new Date(),
        winnerId: computerUser.id,
        winningNumber: 21
      });
      
      // Create players - we can manually set fields in the DB
      const demoPlayer = await storage.createGamePlayer({
        gameId: game.id,
        userId: demoUser.id,
        turnOrder: 1,
      });
      
      // Update with rolled number
      await storage.updateGamePlayerRoll(demoPlayer.id, 17);
      
      const computerPlayer = await storage.createGamePlayer({
        gameId: game.id,
        userId: computerUser.id,
        turnOrder: 2,
      });
      
      // Update with rolled number
      await storage.updateGamePlayerRoll(computerPlayer.id, 21);
      
      // Create messages
      await storage.createMessage({
        gameId: 2,
        userId: demoUser.id,
        content: "Watch the ball animation in this demo!",
        type: "chat"
      });
      
      console.log("Animation demo game #2 created successfully");
    } else {
      console.log("Animation demo game #2 already exists");
    }
  } catch (error) {
    console.error("Failed to create demo games:", error);
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Create demo user for testing
  await createDemoUser();
  
  // Create demo games for animation testing
  await createDemoGames();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
