#!/bin/bash

# Big Boys Game - Production Build and Deploy Script
# This script prepares the application for hosting on GoDaddy or similar platforms

echo "🚀 Starting Big Boys Game production build process..."

# Step 1: Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf client/dist/

# Step 2: Install dependencies
echo "📦 Installing production dependencies..."
npm ci --production=false

# Step 3: Build the frontend
echo "🎨 Building frontend application..."
npm run build

# Step 4: Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed! dist directory not found."
    exit 1
fi

if [ ! -d "client/dist" ]; then
    echo "❌ Frontend build failed! client/dist directory not found."
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""
echo "📁 Generated files:"
echo "  - dist/index.js (Server bundle)"
echo "  - client/dist/ (Frontend assets)"
echo ""
echo "🔧 Next steps for GoDaddy deployment:"
echo "1. Upload the entire project folder to your GoDaddy server"
echo "2. Install Node.js on your GoDaddy server (if not available)"
echo "3. Set up your environment variables from .env.production"
echo "4. Run: npm install --production"
echo "5. Run: node dist/index.js"
echo ""
echo "💡 Alternative: Use PM2 for process management:"
echo "   npm install -g pm2"
echo "   pm2 start ecosystem.config.js --env production"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"