#!/bin/bash

echo "🚀 Pushing Big Boys Game to GitHub..."
echo "Repository: https://github.com/Preshy62/big-boys-game.git"
echo ""

# Add all files
echo "📁 Adding all files..."
git add .

# Create commit
echo "💾 Creating commit..."
git commit -m "🎮 Complete Big Boys Game platform with monthly lottery, voice chat, mobile responsive design, and admin dashboard"

# Add remote origin
echo "🔗 Connecting to GitHub repository..."
git remote add origin https://github.com/Preshy62/big-boys-game.git

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Success! Your Big Boys Game is now live on GitHub!"
echo "🌐 View it at: https://github.com/Preshy62/big-boys-game"