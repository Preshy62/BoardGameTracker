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

// Check for built static files and serve them
const builtPath = path.join(__dirname, 'dist', 'public');
const clientPath = path.join(__dirname, 'client');

// Log which paths exist for debugging
console.log('Checking for built files at:', builtPath);
console.log('Checking for client files at:', clientPath);

// Try to determine if we have built files
const fs = await import('fs');
let hasBuiltFiles = false;
try {
  await fs.promises.access(builtPath);
  hasBuiltFiles = true;
  console.log('Found built files, serving from dist/public');
} catch {
  console.log('No built files found, serving from client directory');
}

// Serve static files based on what's available
if (hasBuiltFiles) {
  app.use(express.static(builtPath));
} else {
  app.use(express.static(clientPath));
}

// Catch-all route for SPA
app.get('*', async (req, res) => {
  const indexPath = hasBuiltFiles 
    ? path.join(builtPath, 'index.html')
    : path.join(clientPath, 'index.html');
  
  try {
    res.sendFile(indexPath);
  } catch (err) {
    console.error('Error serving index.html:', err);
    res.status(404).send(`
      <html>
        <head><title>Application Error</title></head>
        <body>
          <h1>Application Error</h1>
          <p>Could not load the application. This might be a build issue.</p>
          <p>Built files available: ${hasBuiltFiles}</p>
          <p>Attempted path: ${indexPath}</p>
        </body>
      </html>
    `);
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