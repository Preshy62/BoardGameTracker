// Production server for Railway deployment
// This bypasses vite config issues by serving pre-built static files

const express = require('express');
const path = require('path');
const { createServer } = require('http');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from dist/public if it exists, otherwise serve from client
const staticPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, 'dist', 'public')
  : path.join(__dirname, 'client');

console.log(`Serving static files from: ${staticPath}`);

// Static file serving
app.use(express.static(staticPath));

// API routes - import the server routes
const setupAuth = require('./server/auth.js').setupAuth;
const registerRoutes = require('./server/routes.js').registerRoutes;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for production
const session = require('express-session');
app.use(session({
  secret: process.env.SESSION_SECRET || 'railway-fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Setup authentication and routes
try {
  setupAuth(app);
  console.log('Authentication setup completed');
} catch (error) {
  console.warn('Auth setup failed, continuing without auth:', error.message);
}

try {
  registerRoutes(app);
  console.log('Routes registered successfully');
} catch (error) {
  console.warn('Route registration failed:', error.message);
}

// Catch-all handler for SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).send('Error loading application');
    }
  });
});

const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Railway production server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database available: ${process.env.DATABASE_URL ? 'Yes' : 'No (using in-memory storage)'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});