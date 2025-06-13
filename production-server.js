#!/usr/bin/env node

// Direct production server without any build dependencies
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('Starting Big Boys Game - Production Server');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory if it exists
try {
  app.use(express.static(join(__dirname, 'public')));
} catch (e) {
  console.log('No public directory found, skipping static files');
}

// Import and setup the server routes
try {
  const { registerRoutes } = await import('./server/routes.js');
  await registerRoutes(app);
  console.log('Server routes registered successfully');
} catch (error) {
  console.log('Failed to import compiled routes, trying TypeScript directly...');
  
  try {
    // Use dynamic import to load tsx and run TypeScript server
    const { spawn } = await import('child_process');
    
    console.log('Starting server with tsx...');
    const server = spawn('node', ['--loader', 'tsx/esm', 'server/index.ts'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: process.env.PORT || '5000'
      }
    });
    
    server.on('error', (err) => {
      console.error('Server startup failed:', err);
      process.exit(1);
    });
    
    server.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      process.exit(code);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => server.kill('SIGTERM'));
    process.on('SIGINT', () => server.kill('SIGINT'));
    
    return; // Exit this script, let tsx handle the server
    
  } catch (tsxError) {
    console.error('Failed to start with tsx:', tsxError);
    process.exit(1);
  }
}

// If we get here, start the Express server directly
const port = parseInt(process.env.PORT || '5000', 10);
app.listen(port, '0.0.0.0', () => {
  console.log(`Big Boys Game server running on port ${port}`);
});