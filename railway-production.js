#!/usr/bin/env node

// Railway Production Server - bypasses vite.config.ts issues
// Spawns tsx server in isolated process to avoid config conflicts

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Railway Production - Starting Big Boys Game server...');

const PORT = process.env.PORT || 8080;

// Environment setup to avoid vite config loading
const serverEnv = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: PORT,
  // Prevent vite from being loaded
  VITE_CONFIG_PATH: '',
  NO_VITE: 'true'
};

console.log(`Starting backend server on port ${PORT}...`);

// Start tsx server with production entry point (avoids vite config)
const tsxServer = spawn('npx', ['tsx', 'server/production.ts'], {
  stdio: 'inherit',
  env: serverEnv,
  cwd: __dirname
});

// Handle server events
tsxServer.on('error', (error) => {
  console.error('Server startup failed:', error.message);
  process.exit(1);
});

tsxServer.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  if (code !== 0) {
    console.error('Server crashed, exiting...');
  }
  process.exit(code);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down server...');
  tsxServer.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down server...');
  tsxServer.kill('SIGINT');
});

// Keep process alive
process.on('exit', (code) => {
  console.log(`Production process exiting with code ${code}`);
});