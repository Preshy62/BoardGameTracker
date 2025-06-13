#!/usr/bin/env node

// Fix for static file serving - copies Vite build output to expected location
const fs = require('fs-extra');
const path = require('path');

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

if (require.main === module) {
  fixStaticFiles();
}

module.exports = { fixStaticFiles };