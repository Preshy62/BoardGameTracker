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
    const viteOutDir = path.join(__dirname, 'dist', 'public');
    const targetDir = path.join(__dirname, 'server', 'public');

    // Check if Vite output exists
    if (!fs.existsSync(viteOutDir)) {
      console.log('Vite build output not found at dist/public, skipping static file fix');
      return;
    }

    // Remove existing target if it exists
    if (fs.existsSync(targetDir)) {
      await fs.promises.rm(targetDir, { recursive: true, force: true });
    }

    // Copy Vite build output to server/public
    await copyDir(viteOutDir, targetDir);
    console.log('Static files copied successfully from dist/public to server/public');
  } catch (error) {
    console.error('Error fixing static files:', error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fixStaticFiles();
}