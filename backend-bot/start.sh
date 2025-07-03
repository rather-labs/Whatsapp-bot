#!/bin/bash

# Start the WhatsApp bot server
echo "🚀 Starting WhatsApp Bot Server..."
echo "📁 Using modular architecture"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Please create a .env file with your configuration"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
echo "🎯 Starting server.js..."
echo "📱 WhatsApp Bot with Modular Architecture"
echo "🔗 Server will be available at: http://localhost:${PORT:-3001}"
echo ""

nodemon server.js 