#!/bin/bash

# Big Boys Game - Railway Deployment Script
# This script prepares the application for Railway deployment

echo "🚀 Preparing Big Boys Game for Railway deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "Checking Railway authentication..."
railway login

# Check if we're in a Railway project
if ! railway status &> /dev/null; then
    echo "Creating new Railway project..."
    railway init
fi

# Build the application
echo "Building application..."
npm run build

# Deploy to Railway
echo "Deploying to Railway..."
railway up

echo "✅ Deployment initiated!"
echo ""
echo "Next steps:"
echo "1. Go to Railway dashboard: https://railway.app/dashboard"
echo "2. Add PostgreSQL service to your project"
echo "3. Set environment variables from .env.railway file"
echo "4. Your app will be available at the Railway-provided URL"
echo ""
echo "Environment variables to set in Railway dashboard:"
echo "- SESSION_SECRET"
echo "- STRIPE_SECRET_KEY & VITE_STRIPE_PUBLIC_KEY"
echo "- PAYSTACK_SECRET_KEY & VITE_PAYSTACK_PUBLIC_KEY"
echo "- AGORA_APP_ID & VITE_AGORA_APP_ID"
echo "- EMAIL settings (optional)"