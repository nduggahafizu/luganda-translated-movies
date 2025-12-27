#!/bin/bash

# CORS Testing Script for Railway Backend
# Usage: ./test-cors.sh

echo "🧪 Testing CORS Configuration for Railway Backend"
echo "=================================================="
echo ""

BACKEND_URL="https://luganda-translated-movies-production.up.railway.app"
ORIGIN="https://watch.unrulymovies.com"

echo "Backend URL: $BACKEND_URL"
echo "Origin: $ORIGIN"
echo ""

# Test 1: Health Check
echo "📍 Test 1: Health Check"
echo "----------------------"
curl -s "$BACKEND_URL/api/health" | jq '.' 2>/dev/null || curl -s "$BACKEND_URL/api/health"
echo ""
echo ""

# Test 2: OPTIONS Preflight Request
echo "📍 Test 2: CORS Preflight (OPTIONS)"
echo "-----------------------------------"
echo "Testing OPTIONS request with Origin header..."
curl -i -X OPTIONS \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  "$BACKEND_URL/api/luganda-movies/latest" 2>&1 | grep -i "access-control"
echo ""
echo ""

# Test 3: GET Request with Origin
echo "📍 Test 3: GET Request with CORS"
echo "--------------------------------"
echo "Testing GET request with Origin header..."
RESPONSE=$(curl -i -s -H "Origin: $ORIGIN" "$BACKEND_URL/api/luganda-movies/latest?limit=3")
echo "$RESPONSE" | grep -i "access-control"
echo ""
echo "Response body (first 500 chars):"
echo "$RESPONSE" | tail -n +1 | head -c 500
echo ""
echo ""

# Test 4: Check CORS Headers
echo "📍 Test 4: Verify CORS Headers"
echo "------------------------------"
HEADERS=$(curl -i -s -X OPTIONS -H "Origin: $ORIGIN" "$BACKEND_URL/api/luganda-movies/latest" | grep -i "access-control")

if echo "$HEADERS" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ Access-Control-Allow-Origin: Present"
else
    echo "❌ Access-Control-Allow-Origin: Missing"
fi

if echo "$HEADERS" | grep -q "Access-Control-Allow-Methods"; then
    echo "✅ Access-Control-Allow-Methods: Present"
else
    echo "❌ Access-Control-Allow-Methods: Missing"
fi

if echo "$HEADERS" | grep -q "Access-Control-Allow-Credentials"; then
    echo "✅ Access-Control-Allow-Credentials: Present"
else
    echo "❌ Access-Control-Allow-Credentials: Missing"
fi

echo ""
echo ""

# Test 5: Test from different origins
echo "📍 Test 5: Test Multiple Origins"
echo "--------------------------------"
for test_origin in "https://watch.unrulymovies.com" "https://unrulymovies.com" "https://www.unrulymovies.com"; do
    echo "Testing origin: $test_origin"
    RESULT=$(curl -s -X OPTIONS -H "Origin: $test_origin" "$BACKEND_URL/api/luganda-movies/latest" -w "%{http_code}" -o /dev/null)
    if [ "$RESULT" = "200" ] || [ "$RESULT" = "204" ]; then
        echo "  ✅ Status: $RESULT (OK)"
    else
        echo "  ❌ Status: $RESULT (Failed)"
    fi
done

echo ""
echo ""
echo "=================================================="
echo "🎉 CORS Testing Complete!"
echo ""
echo "Next steps:"
echo "1. If all tests pass ✅, CORS is configured correctly"
echo "2. If tests fail ❌, check Railway environment variables"
echo "3. Ensure ALLOWED_ORIGINS is set on Railway"
echo "4. Restart Railway service after setting variables"
echo "=================================================="
