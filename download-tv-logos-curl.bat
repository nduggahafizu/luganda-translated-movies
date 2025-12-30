@echo off
REM Batch script to download Uganda TV station logos using curl with browser user-agent
setlocal
set UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
set OUTDIR=assets\tv-logos
if not exist %OUTDIR% mkdir %OUTDIR%

curl -A %UA% -L -o %OUTDIR%\ntv-uganda.png https://upload.wikimedia.org/wikipedia/commons/f/f8/NTV_Uganda_logo.png
curl -A %UA% -L -o %OUTDIR%\nbs-tv.png https://upload.wikimedia.org/wikipedia/en/d/d7/NBS_Television_logo.png
curl -A %UA% -L -o %OUTDIR%\ubc-tv.png https://upload.wikimedia.org/wikipedia/en/6/6f/Uganda_Broadcasting_Corporation_logo.png
curl -A %UA% -L -o %OUTDIR%\bukedde-tv.png https://upload.wikimedia.org/wikipedia/commons/2/2e/Bukedde_TV_logo.png
curl -A %UA% -L -o %OUTDIR%\urban-tv.png https://upload.wikimedia.org/wikipedia/commons/2/2a/Urban_TV_Uganda_logo.png
curl -A %UA% -L -o %OUTDIR%\spark-tv.png https://upload.wikimedia.org/wikipedia/commons/7/7d/Spark_TV_Uganda_logo.png
curl -A %UA% -L -o %OUTDIR%\tv-west.png https://upload.wikimedia.org/wikipedia/commons/2/2c/TV_West_Uganda_logo.png
curl -A %UA% -L -o %OUTDIR%\salt-tv.png https://saltmedia.ug/images/logo.png
curl -A %UA% -L -o %OUTDIR%\tv-east.png https://upload.wikimedia.org/wikipedia/commons/7/7e/TV_East_Uganda_logo.png
curl -A %UA% -L -o %OUTDIR%\bbs-tv.png https://upload.wikimedia.org/wikipedia/commons/2/2d/BBS_Television_logo.png
curl -A %UA% -L -o %OUTDIR%\tv-north.png https://upload.wikimedia.org/wikipedia/commons/6/6a/TV_North_Uganda_logo.png
curl -A %UA% -L -o %OUTDIR%\wan-luo-tv.png https://upload.wikimedia.org/wikipedia/commons/2/2b/Wan_Luo_TV_logo.png

echo All logo downloads attempted.
pause
