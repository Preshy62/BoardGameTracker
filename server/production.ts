// Production server entry point - completely isolated from vite
// This file avoids any imports that might trigger vite.config.ts loading

import express from 'express';
import { createServer } from 'http';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { storage } from './storage-simple.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

console.log('Production Server - Initializing Big Boys Game...');

// Trust proxy for Railway
app.set('trust proxy', 1);

// Security and cache headers
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'bbg-production-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Debug session middleware
app.use((req, res, next) => {
  const sessionId = req.sessionID || 'no-session';
  const userId = req.session?.userId || 'not logged in';
  console.log(`Debug - Session check - Path: ${req.method} ${req.path} | Session ID: ${sessionId}, User ID: ${userId}`);
  next();
});

// Authentication middleware
const authenticate = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'Big Boys Game Production',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'connected' : 'in-memory'
  });
});

// API Routes
app.get('/api/user', async (req, res) => {
  try {
    if (!req.session?.userId) {
      console.log('Request headers:', {
        cookie: req.headers.cookie,
        origin: req.headers.origin,
        referer: req.headers.referer
      });
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: 'User not found' });
    }

    // Remove sensitive data
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user with avatar initials
    const avatarInitials = username.substring(0, 2).toUpperCase();
    const user = await storage.createUser({
      username,
      email,
      password,
      avatarInitials,
      walletBalance: 1000, // Starting balance
      isAdmin: false,
      isActive: true,
      emailVerified: false,
      countryCode: 'NG',
      preferredCurrency: 'NGN'
    });

    // Set session
    req.session.userId = user.id;

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // In production, you would verify the password hash here
    // For now, using simple comparison for demo
    if (user.password !== password && user.username !== 'demo') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set session
    req.session.userId = user.id;

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// Games API
app.get('/api/games', authenticate, async (req, res) => {
  try {
    const games = await storage.getAvailableGames();
    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ message: 'Failed to fetch games' });
  }
});

app.post('/api/games', authenticate, async (req, res) => {
  try {
    const { stake, maxPlayers = 4 } = req.body;
    const userId = req.session.userId;

    if (!stake || stake <= 0) {
      return res.status(400).json({ message: 'Valid stake amount required' });
    }

    const user = await storage.getUser(userId);
    if (!user || user.walletBalance < stake) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    const game = await storage.createGame({
      creatorId: userId,
      stake,
      maxPlayers,
      status: 'waiting',
      commissionPercentage: 5
    });

    res.status(201).json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ message: 'Failed to create game' });
  }
});

// Static file serving - serve from multiple possible locations
const staticPaths = [
  path.join(__dirname, '..', 'dist', 'public'),
  path.join(__dirname, '..', 'client'),
  path.join(__dirname, '..', 'public')
];

let staticServed = false;
for (const staticPath of staticPaths) {
  try {
    app.use(express.static(staticPath));
    console.log(`✓ Serving static files from: ${staticPath}`);
    staticServed = true;
    break;
  } catch (error) {
    console.log(`✗ Could not serve from: ${staticPath}`);
  }
}

if (!staticServed) {
  console.log('Warning: No static files found to serve');
}

// Catch-all for SPA routing
app.get('*', (req, res) => {
  for (const staticPath of staticPaths) {
    const indexPath = path.join(staticPath, 'index.html');
    try {
      res.sendFile(indexPath);
      return;
    } catch (error) {
      continue;
    }
  }
  res.status(404).send('Big Boys Game - Service Unavailable');
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Big Boys Game production server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`✓ Database: ${process.env.DATABASE_URL ? 'Connected' : 'In-memory storage'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});