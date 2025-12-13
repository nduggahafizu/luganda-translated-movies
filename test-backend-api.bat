@echo off
echo ========================================
echo   Testing Luganda Movies Backend API
echo ========================================
echo.

echo [TEST 1] Health Check
echo ----------------------------------------
curl -X GET http://localhost:5000/api/health
echo.
echo.

echo [TEST 2] Fetch Movies - Page 1
echo ----------------------------------------
curl -X GET "http://localhost:5000/api/movies/fetch?page=1&limit=5"
echo.
echo.

echo [TEST 3] Fetch Movies - With Filters
echo ----------------------------------------
curl -X GET "http://localhost:5000/api/movies/fetch?page=1&limit=5&sort=latest&category=action"
echo.
echo.

echo [TEST 4] Search Movies
echo ----------------------------------------
curl -X GET "http://localhost:5000/api/movies/fetch?page=1&search=fast"
echo.
echo.

echo [TEST 5] Get Trending Movies
echo ----------------------------------------
curl -X GET http://localhost:5000/api/movies/trending/now
echo.
echo.

echo [TEST 6] Create Playlist
echo ----------------------------------------
curl -X POST http://localhost:5000/api/playlist/create ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"My Favorites\"}" ^
  -c cookies.txt
echo.
echo.

echo [TEST 7] Get All Playlists
echo ----------------------------------------
curl -X GET http://localhost:5000/api/playlist/user/all ^
  -b cookies.txt
echo.
echo.

echo [TEST 8] Update Watch Progress
echo ----------------------------------------
curl -X POST http://localhost:5000/api/watch-progress/update ^
  -H "Content-Type: application/json" ^
  -d "{\"movieId\":\"test_movie_123\",\"currentTime\":300,\"duration\":7200}" ^
  -b cookies.txt
echo.
echo.

echo [TEST 9] Get Watch Progress
echo ----------------------------------------
curl -X GET http://localhost:5000/api/watch-progress/test_movie_123 ^
  -b cookies.txt
echo.
echo.

echo [TEST 10] Get All Watch Progress
echo ----------------------------------------
curl -X GET http://localhost:5000/api/watch-progress/user/all ^
  -b cookies.txt
echo.
echo.

echo ========================================
echo   Testing Complete!
echo ========================================
echo.
echo Check the output above for any errors.
echo If you see JSON responses, the API is working!
echo.
pause
