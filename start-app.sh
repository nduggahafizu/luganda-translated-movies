#!/bin/bash

echo "🚀 Starting Luganda Movies Application"
echo "======================================"
echo ""

# Kill any existing servers
echo "🧹 Cleaning up existing processes..."
pkill -f "node server.js" 2>/dev/null
pkill -f "python3 -m http.server" 2>/dev/null
sleep 2

# Start Backend
echo ""
echo "📦 Starting Backend Server..."
cd /vercel/sandbox/server
node server.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"
echo "   Port: 5000"

# Wait for backend to start
echo "   Waiting for backend to start..."
sleep 5

# Check backend health
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running"
else
    echo "   ⚠️  Backend may not be ready yet"
fi

# Start Frontend
echo ""
echo "🌐 Starting Frontend Server..."
cd /vercel/sandbox
python3 -m http.server 8080 > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"
echo "   Port: 8080"

# Wait for frontend to start
sleep 2

# Check frontend
if curl -s http://localhost:8080/ > /dev/null 2>&1; then
    echo "   ✅ Frontend is running"
else
    echo "   ⚠️  Frontend may not be ready yet"
fi

echo ""
echo "======================================"
echo "🎉 Application Started!"
echo "======================================"
echo "Frontend:  http://localhost:8080"
echo "Backend:   http://localhost:5000"
echo "API Docs:  http://localhost:5000/api-docs"
echo "Health:    http://localhost:5000/api/health"
echo "======================================"
echo ""
echo "Backend PID:  $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop servers:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  or: pkill -f 'node server.js' && pkill -f 'python3 -m http.server'"
echo ""
echo "Logs:"
echo "  Backend:  tail -f /tmp/backend.log"
echo "  Frontend: tail -f /tmp/frontend.log"
echo ""
