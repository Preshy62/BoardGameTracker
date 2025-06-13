#!/usr/bin/env node

// Ultra-simple production start that avoids all config issues
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('Big Boys Game - Starting Production Server');
console.log('Directory:', __dirname);
console.log('Port:', process.env.PORT);

// Start the server using Node.js directly with the TypeScript loader
const args = [
  '--loader', 'tsx/esm',
  '--no-warnings',
  'server/index.ts'
];

console.log('Executing: node', args.join(' '));

const server = spawn('node', args, {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || '5000',
    // Fix the dirname issue for vite.config.ts
    PWD: __dirname,
    INIT_CWD: __dirname
  }
});

server.on('error', (error) => {
  console.error('Server startup error:', error.message);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.kill('SIGINT');
});