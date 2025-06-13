#!/usr/bin/env node

// Production start script for Railway deployment
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Fix __dirname and __filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set required environment variables
process.env.NODE_ENV = 'production';
process.env.PWD = process.env.PWD || __dirname;
process.env.INIT_CWD = process.env.INIT_CWD || __dirname;

// Set default port if not provided
if (!process.env.PORT) {
  process.env.PORT = '5000';
}

// Import and start the server with proper error handling
try {
  console.log('Starting production server...');
  console.log('Current directory:', __dirname);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Port:', process.env.PORT);
  
  // Import the server directly
  await import('./dist/index.js');
} catch (error) {
  console.error('Failed to start production server:', error);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack
  });
  
  // Try alternative approach - use tsx to run the TypeScript file directly
  console.log('Attempting fallback with tsx...');
  try {
    const { spawn } = await import('child_process');
    const server = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    server.on('error', (err) => {
      console.error('Fallback server failed:', err);
      process.exit(1);
    });
    
    server.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      process.exit(code);
    });
  } catch (fallbackError) {
    console.error('Fallback approach failed:', fallbackError);
    process.exit(1);
  }
}