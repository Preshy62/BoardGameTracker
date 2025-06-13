#!/usr/bin/env node

// Production start script for Railway deployment
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';

// Fix __dirname and __filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set NODE_ENV to production
process.env.NODE_ENV = 'production';

// Import and start the server
try {
  const serverPath = resolve(__dirname, 'dist', 'index.js');
  await import(serverPath);
} catch (error) {
  console.error('Failed to start production server:', error);
  process.exit(1);
}