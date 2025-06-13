#!/usr/bin/env node

// Fix for static file serving - copies Vite build output to expected location
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fixStaticFiles() {
  try {
    const sourceDir = path.join(__dirname, 'dist');
    const targetDir = path.join(__dirname, 'server', 'public');

    // Check if source exists
    if (!fs.existsSync(sourceDir)) {
      console.log('Source directory not found, skipping static file fix');
      return;
    }

    // Copy entire dist directory to server/public
    await fs.copy(sourceDir, targetDir, { overwrite: true });
    console.log('Static files copied successfully from dist to server/public');
  } catch (error) {
    console.error('Error fixing static files:', error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fixStaticFiles();
}