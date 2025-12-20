# Currently Running Servers

## ✅ Active Servers

### 1. Backend API Server
- **Status:** ✅ Running
- **Port:** 5000
- **URL:** http://localhost:5000
- **Process ID:** 3451
- **Command:** `node server.js`
- **Directory:** `/vercel/sandbox/server`

**Endpoints:**
- Root: http://localhost:5000/
- Health: http://localhost:5000/api/health
- API Docs: http://localhost:5000/api-docs
- Movies: http://localhost:5000/api/luganda-movies
- VJs: http://localhost:5000/api/vjs

### 2. Frontend Web Server
- **Status:** ✅ Running
- **Port:** 8000
- **URL:** http://localhost:8000
- **Process ID:** 5056
- **Command:** `python3 -m http.server 8000`
- **Directory:** `/vercel/sandbox`

**Pages:**
- Homepage: http://localhost:8000/
- Movies: http://localhost:8000/movies.html
- About: http://localhost:8000/about.html
- Contact: http://localhost:8000/contact.html
- Uganda TV: http://localhost:8000/uganda-tv.html

---

## How to Stop Servers

### Stop Backend Server
```bash
kill 3451
# Or find and kill by name:
pkill -f "node server.js"
```

### Stop Frontend Server
```bash
kill 5056
# Or find and kill by name:
pkill -f "python3 -m http.server"
```

### Stop All Servers
```bash
pkill -f "node server.js"
pkill -f "python3 -m http.server"
```

---

## How to Restart Servers

### Restart Backend
```bash
cd /vercel/sandbox/server
node server.js &
```

### Restart Frontend
```bash
cd /vercel/sandbox
python3 -m http.server 8000 &
```

---

## Server Logs

### Backend Logs
```bash
# View real-time logs
tail -f /vercel/sandbox/.blackbox/tmp/shell_tool_ef13a2437b53.log
```

### Frontend Logs
```bash
# View real-time logs
tail -f /vercel/sandbox/.blackbox/tmp/shell_tool_433dfc830811.log
```

---

## Health Check

Run this command to verify both servers are responding:
```bash
echo "Backend:" && curl -s http://localhost:5000/ | grep -o '"message":"[^"]*"' && \
echo "Frontend:" && curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8000/
```

Expected output:
```
Backend: "message":"Welcome to Luganda Movies API"
Frontend: HTTP 200
```

---

**Last Updated:** December 20, 2025
