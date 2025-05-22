import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { runMigration } from "./utils/migrate-email-fields";
import { initializeEmailTransport } from "./utils/email";
import { addTransactionDescriptionField } from "./migrations/add-transaction-description";
import { maintenanceMiddleware } from "./utils/maintenance";

// Create a demo user function for testing
async function createDemoUser() {
  try {
    // Check if demo user already exists
    console.log("Checking if demo user exists...");
    const existingUser = await storage.getUserByUsername("demo");
    if (existingUser) {
      console.log("Demo user already exists");
      return;
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
  } catch (error) {
    console.error("Failed to create demo user:", error);
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
    // Run database migrations
    log("Running database migrations...", "startup");
    const migrationResult = await runMigration();
    if (!migrationResult) {
      log("Database migration failed. Proceeding with caution...", "startup");
    }
    
    // Run transaction description field migration
    await addTransactionDescriptionField();
    
    // Initialize email transport
    log("Initializing email transport...", "startup");
    await initializeEmailTransport();
    
    // Create demo user for testing
    await createDemoUser();
    
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
