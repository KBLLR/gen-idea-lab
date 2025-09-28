#!/bin/bash

# Project Idea Lab Deployment Script
echo "🚀 Deploying Project Idea Lab to production..."

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if .env.production exists
if [[ ! -f ".env.production" ]]; then
    echo "⚠️  Warning: .env.production file not found"
    echo "   Please create it with your production environment variables"
    echo "   You can use .env.example as a template"
fi

echo "✅ Build completed!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your production environment variables in .env.production"
echo "2. Deploy to your hosting platform (see deployment options below)"
echo ""
echo "🌐 Deployment Options:"
echo ""
echo "Option 1 - Cloudflare Pages (Recommended):"
echo "  1. Push to GitHub"
echo "  2. Connect repository to Cloudflare Pages"
echo "  3. Set build command: npm run build"
echo "  4. Set output directory: dist"
echo "  5. Add environment variables from .env.production"
echo ""
echo "Option 2 - Railway:"
echo "  npm install -g @railway/cli"
echo "  railway login"
echo "  railway init"
echo "  railway up"
echo ""
echo "Option 3 - Vercel:"
echo "  npm install -g vercel"
echo "  vercel"
echo ""
echo "Don't forget to:"
echo "• Update OAuth app callback URLs to use your domain"
echo "• Set up SSL certificate (automatic with Cloudflare)"
echo "• Configure DNS records to point to your hosting platform"