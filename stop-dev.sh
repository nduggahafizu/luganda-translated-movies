#!/bin/bash

# Luganda Movies - Stop Development Servers Script

echo "🛑 Stopping Luganda Movies Development Servers"
echo "=============================================="
echo ""

# Stop backend server
if pgrep -f "node server.js" > /dev/null; then
    echo "📦 Stopping Backend Server..."
    pkill -f "node server.js"
    echo "✅ Backend stopped"
else
    echo "⚠️  Backend server not running"
fi

# Stop frontend server
if pgrep -f "node frontend-server.js" > /dev/null; then
    echo "🌐 Stopping Frontend Server..."
    pkill -f "node frontend-server.js"
    echo "✅ Frontend stopped"
else
    echo "⚠️  Frontend server not running"
fi

echo ""
echo "=============================================="
echo "✅ All servers stopped"
echo "=============================================="
echo ""
