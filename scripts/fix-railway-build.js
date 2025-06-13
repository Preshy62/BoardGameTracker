#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix the build structure for Railway deployment
function fixBuildStructure() {
  const distPath = path.resolve(__dirname, '..', 'dist');
  const publicPath = path.resolve(distPath, 'public');
  
  console.log('Fixing build structure for Railway...');
  
  if (!fs.existsSync(publicPath)) {
    console.log('Public directory not found, creating symlink to dist');
    // Create a symlink or copy the files
    try {
      fs.symlinkSync(distPath, publicPath);
      console.log('Created symlink from dist to public');
    } catch (error) {
      console.log('Symlink failed, copying files instead');
      // If symlink fails, copy the built files to the expected location
      const buildFiles = fs.readdirSync(distPath).filter(file => 
        file !== 'index.js' && file !== 'public'
      );
      
      if (!fs.existsSync(publicPath)) {
        fs.mkdirSync(publicPath, { recursive: true });
      }
      
      buildFiles.forEach(file => {
        const srcPath = path.join(distPath, file);
        const destPath = path.join(publicPath, file);
        if (fs.statSync(srcPath).isDirectory()) {
          fs.cpSync(srcPath, destPath, { recursive: true });
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      });
      console.log('Copied build files to public directory');
    }
  }
  
  console.log('Build structure fixed for Railway deployment');
}

fixBuildStructure();