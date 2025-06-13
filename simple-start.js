#!/usr/bin/env node

// Production server that runs directly without TypeScript compilation
// This avoids vite config path resolution issues in Railway

import express from 'express';
import path from 'path';
import { createServer } from 'http';
import session from 'express-session';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;

console.log('Big Boys Game - Starting Production Server');
console.log('Directory:', __dirname);
console.log('Port:', PORT);

// Basic Express setup
const app = express();

// Set up basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key-railway',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple API endpoints for basic functionality
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    database: process.env.DATABASE_URL ? 'connected' : 'in-memory',
    timestamp: new Date().toISOString()
  });
});

// Serve static files if available
const staticPath = path.join(__dirname, 'dist', 'public');
app.use(express.static(staticPath, { 
  fallthrough: true,
  index: false 
}));

// Fallback to client directory if dist doesn't exist
app.use(express.static(path.join(__dirname, 'client'), { 
  fallthrough: true,
  index: false 
}));

// Catch-all route for SPA
app.get('*', (req, res) => {
  // Try to serve index.html from dist first, then client
  const indexPaths = [
    path.join(__dirname, 'dist', 'public', 'index.html'),
    path.join(__dirname, 'client', 'index.html')
  ];
  
  let served = false;
  for (const indexPath of indexPaths) {
    try {
      res.sendFile(indexPath);
      served = true;
      break;
    } catch (err) {
      continue;
    }
  }
  
  if (!served) {
    res.status(404).send('Application not found');
  }
});

// Create and start server
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Railway production server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Available' : 'Using in-memory storage'}`);
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);