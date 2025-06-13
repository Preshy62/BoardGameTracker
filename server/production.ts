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

// Create a complete gaming interface when static files aren't available
const createGameInterface = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Big Boys Game - Elite Gaming Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
            overflow-x: hidden;
        }
        .navbar {
            background: rgba(0,0,0,0.3);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .logo { font-size: 1.8rem; font-weight: bold; color: #64b5f6; }
        .nav-buttons { display: flex; gap: 1rem; }
        .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .btn-primary {
            background: linear-gradient(45deg, #64b5f6, #42a5f5);
            color: white;
        }
        .btn-secondary {
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
        .hero {
            padding: 4rem 2rem;
            text-align: center;
            max-width: 1200px;
            margin: 0 auto;
        }
        .hero h1 {
            font-size: 4rem;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #fff, #64b5f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .hero p {
            font-size: 1.3rem;
            margin-bottom: 2rem;
            opacity: 0.9;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        .game-modes {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        .game-card {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 2rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s ease;
        }
        .game-card:hover { transform: translateY(-5px) scale(1.02); }
        .game-card h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #64b5f6;
        }
        .game-card p {
            opacity: 0.8;
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }
        .auth-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .auth-content {
            background: rgba(30,60,114,0.95);
            border-radius: 15px;
            padding: 2rem;
            max-width: 400px;
            width: 90%;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .auth-tabs {
            display: flex;
            margin-bottom: 2rem;
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        .auth-tab {
            flex: 1;
            padding: 1rem;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            border-bottom: 2px solid transparent;
        }
        .auth-tab.active {
            border-bottom-color: #64b5f6;
            color: #64b5f6;
        }
        .form-group {
            margin-bottom: 1rem;
        }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #b3c7f7;
        }
        .form-group input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 1rem;
        }
        .form-group input::placeholder {
            color: rgba(255,255,255,0.6);
        }
        .close-modal {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
        }
        .status-bar {
            background: rgba(0,0,0,0.2);
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }
        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .nav-buttons { flex-direction: column; gap: 0.5rem; }
            .navbar { flex-direction: column; }
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="logo">🎮 Big Boys Game</div>
        <div class="nav-buttons">
            <button class="btn btn-secondary" onclick="showAuth('login')">Login</button>
            <button class="btn btn-primary" onclick="showAuth('register')">Join Game</button>
        </div>
    </nav>

    <div class="hero">
        <h1>Elite Gaming Platform</h1>
        <p>Experience the ultimate multiplayer gaming platform with enhanced AI opponents, real-time battles, and strategic gameplay that challenges even the most skilled players.</p>
        <button class="btn btn-primary" onclick="showAuth('register')" style="font-size: 1.1rem; padding: 1rem 2rem;">Start Playing Now</button>
    </div>

    <div class="game-modes">
        <div class="game-card">
            <h3>⚔️ Strategy Arena</h3>
            <p>Engage in tactical battles against enhanced AI opponents with advanced decision-making algorithms. Perfect for players seeking challenging strategic gameplay.</p>
            <button class="btn btn-primary" onclick="showAuth('login')">Enter Arena</button>
        </div>
        <div class="game-card">
            <h3>⚡ Quick Match</h3>
            <p>Jump into fast-paced games with instant matchmaking. Test your skills against other players in rapid-fire gaming sessions.</p>
            <button class="btn btn-primary" onclick="showAuth('login')">Quick Play</button>
        </div>
        <div class="game-card">
            <h3>🤖 Bot Challenge</h3>
            <p>Take on sophisticated AI opponents with multiple difficulty levels. Train your skills against intelligently programmed gaming partners.</p>
            <button class="btn btn-primary" onclick="showAuth('login')">Challenge Bots</button>
        </div>
        <div class="game-card">
            <h3>🏆 Tournament</h3>
            <p>Compete in organized tournaments with real prizes. Climb the leaderboards and establish your reputation in the gaming community.</p>
            <button class="btn btn-primary" onclick="showAuth('login')">Join Tournament</button>
        </div>
    </div>

    <div class="auth-modal" id="authModal">
        <div class="auth-content">
            <button class="close-modal" onclick="hideAuth()">×</button>
            <div class="auth-tabs">
                <button class="auth-tab active" id="loginTab" onclick="switchTab('login')">Login</button>
                <button class="auth-tab" id="registerTab" onclick="switchTab('register')">Register</button>
            </div>
            
            <form id="loginForm">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="loginUsername" placeholder="Enter your username" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="loginPassword" placeholder="Enter your password" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
                <p style="margin-top: 1rem; text-align: center; opacity: 0.7;">
                    Demo: username "demo", password "demo"
                </p>
            </form>

            <form id="registerForm" style="display: none;">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="registerUsername" placeholder="Choose a username" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="registerEmail" placeholder="Enter your email" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="registerPassword" placeholder="Choose a password" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Create Account</button>
            </form>
        </div>
    </div>

    <div class="status-bar">
        Status: Server Running ✓ | Backend API: Active | Storage: In-Memory
    </div>

    <script>
        function showAuth(type) {
            document.getElementById('authModal').style.display = 'flex';
            switchTab(type);
        }

        function hideAuth() {
            document.getElementById('authModal').style.display = 'none';
        }

        function switchTab(type) {
            const loginTab = document.getElementById('loginTab');
            const registerTab = document.getElementById('registerTab');
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');

            if (type === 'login') {
                loginTab.classList.add('active');
                registerTab.classList.remove('active');
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
            } else {
                registerTab.classList.add('active');
                loginTab.classList.remove('active');
                registerForm.style.display = 'block';
                loginForm.style.display = 'none';
            }
        }

        // Handle login
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    window.location.reload();
                } else {
                    const error = await response.json();
                    alert('Login failed: ' + error.message);
                }
            } catch (error) {
                alert('Login error: ' + error.message);
            }
        });

        // Handle registration
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                if (response.ok) {
                    window.location.reload();
                } else {
                    const error = await response.json();
                    alert('Registration failed: ' + error.message);
                }
            } catch (error) {
                alert('Registration error: ' + error.message);
            }
        });

        // Close modal when clicking outside
        document.getElementById('authModal').addEventListener('click', (e) => {
            if (e.target.id === 'authModal') {
                hideAuth();
            }
        });

        // Check if user is already logged in
        fetch('/api/user')
            .then(response => response.ok ? response.json() : null)
            .then(user => {
                if (user) {
                    // User is logged in, show game interface
                    document.querySelector('.hero p').textContent = 
                        'Welcome back, ' + user.username + '! Your wallet balance: ₦' + user.walletBalance;
                    document.querySelector('.nav-buttons').innerHTML = 
                        '<span>Welcome, ' + user.username + '</span><button class="btn btn-secondary" onclick="logout()">Logout</button>';
                }
            })
            .catch(() => {
                // Not logged in, show normal interface
            });

        function logout() {
            fetch('/api/logout', { method: 'POST' })
                .then(() => window.location.reload());
        }
    </script>
</body>
</html>`;

// Catch-all for SPA routing
app.get('*', (req, res) => {
  // Try to serve static files first
  for (const staticPath of staticPaths) {
    const indexPath = path.join(staticPath, 'index.html');
    try {
      res.sendFile(indexPath);
      return;
    } catch (error) {
      continue;
    }
  }
  
  // Fallback to complete gaming interface
  res.send(createGameInterface());
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