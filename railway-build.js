#!/usr/bin/env node

// Railway-specific build script that bypasses vite config issues
// This manually builds the frontend without relying on vite.config.ts

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Railway Build - Starting frontend build process...');

// Function to run a command and wait for completion
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: options.cwd || __dirname,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function buildFrontend() {
  try {
    // Create dist directory if it doesn't exist
    const distDir = join(__dirname, 'dist');
    const publicDir = join(distDir, 'public');
    const clientDir = join(__dirname, 'client');
    
    await fs.mkdir(distDir, { recursive: true });
    await fs.mkdir(publicDir, { recursive: true });

    console.log('Copying client files to dist/public for Railway deployment...');

    // Copy all client files to public directory
    await runCommand('cp', ['-r', `${clientDir}/.`, publicDir]);
    
    console.log('Client files copied successfully!');
    
    // Verify copy completed
    try {
      const indexPath = join(publicDir, 'index.html');
      await fs.access(indexPath);
      console.log('Build verification: index.html found at', indexPath);
      
      // List contents for debugging
      const files = await fs.readdir(publicDir);
      console.log('Files in dist/public:', files.slice(0, 10)); // Show first 10 files
      
    } catch {
      console.error('Build verification: index.html not found in', publicDir);
      process.exit(1);
    }

  } catch (error) {
    console.error('Build process failed:', error.message);
    process.exit(1);
  }
}

// Run the build
buildFrontend().catch((error) => {
  console.error('Build process failed:', error);
  process.exit(1);
});