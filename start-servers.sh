#!/bin/bash

echo "🚀 Starting Luganda Movies - Full Stack Application"
echo "===================================================="
echo ""

# Kill existing processes
echo "🧹 Cleaning up..."
pkill -9 -f "node server.js" 2>/dev/null
pkill -9 -f "python3 -m http.server" 2>/dev/null
pkill -9 -f "http-server" 2>/dev/null
pkill -9 -f "serve" 2>/dev/null
sleep 2
echo "   ✓ Cleanup complete"

# Start Backend
echo ""
echo "📦 Starting Backend API Server..."
cd /vercel/sandbox/server
nohup node server.js > /tmp/backend-server.log 2>&1 &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"
echo "   Port: 5000"
echo "   Log: /tmp/backend-server.log"

# Wait for backend
echo "   Waiting for backend..."
sleep 6

# Check backend
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is RUNNING"
    
    # Get database status
    DB_MODE=$(curl -s http://localhost:5000/api/health | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['database']['database'])" 2>/dev/null || echo "unknown")
    echo "   Database: $DB_MODE"
    
    # Get movie count
    MOVIE_COUNT=$(curl -s http://localhost:5000/api/luganda-movies | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('count', 0))" 2>/dev/null || echo "0")
    echo "   Movies: $MOVIE_COUNT"
else
    echo "   ❌ Backend FAILED to start"
    echo "   Check logs: tail -f /tmp/backend-server.log"
fi

# Start Frontend
echo ""
echo "🌐 Starting Frontend Web Server..."
cd /vercel/sandbox
nohup python3 -m http.server 8080 > /tmp/frontend-server.log 2>&1 &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"
echo "   Port: 8080"
echo "   Log: /tmp/frontend-server.log"

# Wait for frontend
echo "   Waiting for frontend..."
sleep 3

# Check frontend
if curl -s http://localhost:8080/ > /dev/null 2>&1; then
    echo "   ✅ Frontend is RUNNING"
else
    echo "   ❌ Frontend FAILED to start"
    echo "   Check logs: tail -f /tmp/frontend-server.log"
fi

echo ""
echo "===================================================="
echo "✅ Application Started Successfully!"
echo "===================================================="
echo ""
echo "🌐 Access Points:"
echo "   Frontend:    http://localhost:8080"
echo "   Backend API: http://localhost:5000"
echo "   API Docs:    http://localhost:5000/api-docs"
echo "   Health:      http://localhost:5000/api/health"
echo ""
echo "📊 Quick Stats:"
echo "   Movies:      $MOVIE_COUNT"
echo "   Database:    $DB_MODE"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f /tmp/backend-server.log"
echo "   Frontend: tail -f /tmp/frontend-server.log"
echo ""
echo "🛑 To Stop:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   or: ./stop-servers.sh"
echo ""
echo "===================================================="
