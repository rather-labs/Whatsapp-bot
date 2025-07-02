#!/bin/bash

# Blockchain Server Startup Script

echo "🚀 Starting Blockchain Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ Created .env file from template"
        echo "⚠️  Please edit .env file with your configuration before starting the server"
        exit 1
    else
        echo "❌ env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
fi

# Check if database exists, if not it will be created automatically
echo "💾 Checking database..."

# Start the server
echo "🌐 Starting blockchain server..."
echo "📊 Server will be available at: http://localhost:${BLOCKCHAIN_PORT:-3002}"
echo "🔗 Health check: http://localhost:${BLOCKCHAIN_PORT:-3002}/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start 