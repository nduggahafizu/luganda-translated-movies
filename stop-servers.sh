#!/bin/bash

echo "🛑 Stopping All Servers..."
echo "=========================="

pkill -f "node server.js"
pkill -f "python3 -m http.server"
pkill -f "http-server"
pkill -f "serve"

sleep 2

echo "✅ All servers stopped"
echo "=========================="
