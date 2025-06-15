import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { runMigration } from "./utils/migrate-email-fields";
import { initializeEmailTransport } from "./utils/email";
import { addTransactionDescriptionField } from "./migrations/add-transaction-description";
import { maintenanceMiddleware } from "./utils/maintenance";

// Create test users function for development
async function createTestUsers() {
  try {
    const testUsers = [
      {
        username: "demo",
        email: "demo@bigboysgame.com",
        password: "demo123",
        avatarInitials: "DM",
        isAdmin: false,
        balance: 500000
      },
      {
        username: "admin",
        email: "admin@bigboysgame.com",
        password: "admin123",
        avatarInitials: "AD",
        isAdmin: true,
        balance: 500000
      },
      {
        username: "Jane",
        email: "jane@bigboysgame.com",
        password: "12345678",
        avatarInitials: "JD",
        isAdmin: false,
        balance: 500000
      }
    ];

    for (const testUser of testUsers) {
      console.log(`Checking if ${testUser.username} user exists...`);
      const existingUser = await storage.getUserByUsername(testUser.username);
      
      if (existingUser) {
        console.log(`${testUser.username} user already exists, updating balance and verification...`);
        
        // Update balance to 500,000 if less
        if (existingUser.walletBalance < 500000) {
          await storage.updateUserBalance(existingUser.id, 500000);
          console.log(`Updated ${testUser.username} balance to ₦500,000`);
        }
        
        // Verify email and set admin status
        const updates: any = { emailVerified: true };
        if (testUser.isAdmin) {
          updates.isAdmin = true;
          console.log(`${testUser.username} set as admin`);
        }
        await storage.updateUserProfile(existingUser.id, updates);
        console.log(`${testUser.username} email verified automatically`);
        continue;
      }
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(testUser.password, saltRounds);
      
      console.log(`Creating ${testUser.username} user...`);
      
      // Create user based on the schema
      const user = await storage.createUser({
        username: testUser.username,
        email: testUser.email,
        password: hashedPassword,
        avatarInitials: testUser.avatarInitials,
      });
      
      console.log(`${testUser.username} user created with ID:`, user.id);
      
      // Give them initial funds
      console.log(`Adding initial funds to ${testUser.username} user...`);
      await storage.updateUserBalance(user.id, testUser.balance);
      
      // Set admin status and verify email for test users
      const updates: any = { emailVerified: true };
      if (testUser.isAdmin) {
        updates.isAdmin = true;
        console.log(`${testUser.username} set as admin`);
      }
      await storage.updateUserProfile(user.id, updates);
      console.log(`${testUser.username} email verified automatically`);
      
      console.log(`${testUser.username} user created successfully with ID:`, user.id);
    }
  } catch (error) {
    console.error("Failed to create test users:", error);
  }
}

const app = express();

// Serve static files FIRST (including music files)
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    }
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply maintenance mode middleware
app.use(maintenanceMiddleware);

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
  let server: any;
  try {
    // Skip database migrations when using in-memory storage
    log("Using in-memory storage - skipping database migrations", "startup");
    
    // Initialize email transport
    log("Initializing email transport...", "startup");
    await initializeEmailTransport();
    
    // Create demo user for testing
    await createTestUsers();
    
    server = await registerRoutes(app);

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
  } catch (error) {
    log(`Failed to start the server: ${error}`, "startup");
    console.error("Server startup error:", error);
    process.exit(1);
    return;
  }

  // Start the server
  if (server) {
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
  } else {
    log("Failed to initialize server", "startup");
    process.exit(1);
  }
})();
