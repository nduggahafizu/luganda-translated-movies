Param(
    [string]$NetlifySite = 'https://watch.unrulymovies.com',
    [string]$RailwayApi = 'https://luganda-translated-movies-production.up.railway.app'
)

Write-Output "Checking Netlify-hosted site: $NetlifySite/api/health"
try {
    $resp = Invoke-WebRequest -Uri "$NetlifySite/api/health" -Method Head -UseBasicParsing -ErrorAction Stop
    Write-Output $resp.StatusCode
} catch {
    Write-Output "Netlify check failed: $_"
}

Write-Output "`nChecking direct Railway backend: $RailwayApi/api/health"
try {
    $resp = Invoke-WebRequest -Uri "$RailwayApi/api/health" -Method Head -UseBasicParsing -ErrorAction Stop
    Write-Output $resp.StatusCode
} catch {
    Write-Output "Railway check failed: $_"
}

Write-Output "`nIf both return 200, proxy and backend are reachable."
