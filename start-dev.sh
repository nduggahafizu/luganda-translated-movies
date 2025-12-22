#!/bin/bash

# Luganda Movies - Development Server Startup Script
# This script starts both backend and frontend servers

echo "🚀 Starting Luganda Movies Development Servers"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if servers are already running
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Backend server already running on port 5000${NC}"
else
    echo -e "${BLUE}📦 Starting Backend Server (Port 5000)...${NC}"
    cd server && node server.js > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
    cd ..
fi

sleep 2

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Frontend server already running on port 3000${NC}"
else
    echo -e "${BLUE}🌐 Starting Frontend Server (Port 3000)...${NC}"
    FRONTEND_PORT=3000 node frontend-server.js > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✅ All servers started successfully!${NC}"
echo "=============================================="
echo ""
echo "📍 Access Points:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5000"
echo "   API Docs:  http://localhost:5000/api-docs"
echo "   Health:    http://localhost:5000/api/health"
echo ""
echo "📝 Logs:"
echo "   Backend:   tail -f /tmp/backend.log"
echo "   Frontend:  tail -f /tmp/frontend.log"
echo ""
echo "🛑 To stop servers:"
echo "   ./stop-dev.sh"
echo "   or: pkill -f 'node server.js' && pkill -f 'node frontend-server.js'"
echo ""
