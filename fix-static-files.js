#!/usr/bin/env node

// Fix for static file serving - copies Vite build output to expected location
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function copyDir(src, dest) {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

async function fixStaticFiles() {
  try {
    const distDir = path.join(__dirname, 'dist');
    const targetDir = path.join(__dirname, 'server', 'public');

    // Check if dist directory exists
    if (!fs.existsSync(distDir)) {
      console.log('Dist directory not found, skipping static file fix');
      return;
    }

    // Remove existing target if it exists
    if (fs.existsSync(targetDir)) {
      await fs.promises.rm(targetDir, { recursive: true, force: true });
    }

    // Create target directory
    await fs.promises.mkdir(targetDir, { recursive: true });

    // Copy all files from dist to server/public
    await copyDir(distDir, targetDir);
    console.log('Static files copied successfully from dist to server/public');
  } catch (error) {
    console.error('Error fixing static files:', error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fixStaticFiles();
}