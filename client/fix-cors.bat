@echo off
echo ðŸ”§ Fixing Firebase Storage CORS Configuration...

REM Check if gcloud is installed
gcloud version >nul 2>&1
if %errorlevel% neq 0 (
    echo âŒ Google Cloud SDK not found. Please install it first:
    echo    Download from: https://cloud.google.com/sdk/docs/install
    echo    Or run: winget install Google.CloudSDK
    pause
    exit /b 1
)

echo âœ… Google Cloud SDK found

REM Authenticate with Google Cloud
echo ðŸ” Authenticating with Google Cloud...
gcloud auth login --no-launch-browser
if %errorlevel% neq 0 (
    echo âŒ Authentication failed. Please try again.
    pause
    exit /b 1
)

echo âœ… Authentication successful

REM Set the Firebase project
echo ðŸŽ¯ Setting Firebase project to maploti...
gcloud config set project maploti
if %errorlevel% neq 0 (
    echo âŒ Failed to set project. Please check your permissions.
    pause
    exit /b 1
)

echo âœ… Project set successfully

REM Apply CORS configuration
echo ðŸš€ Applying CORS configuration to Firebase Storage...
gsutil cors set cors.json gs://maploti.firebasestorage.app
if %errorlevel% neq 0 (
    echo âŒ Failed to apply CORS configuration.
    pause
    exit /b 1
)

echo âœ… CORS configuration applied successfully!

REM Verify the configuration
echo ðŸ” Verifying CORS configuration...
gsutil cors get gs://maploti.firebasestorage.app
if %errorlevel% neq 0 (
    echo âŒ Failed to verify CORS configuration.
    pause
    exit /b 1
)

echo âœ… CORS configuration verified!

echo.
echo ðŸŽ‰ CORS configuration completed successfully!
echo ðŸ“ Your Firebase Storage bucket now allows requests from:
echo    â€¢ https://maploti.web.app (production)
echo    â€¢ http://localhost:3000 (local development)
echo    â€¢ http://localhost:5173 (Vite dev server)
echo    â€¢ http://127.0.0.1:3000 (alternative local)
echo    â€¢ http://127.0.0.1:5173 (alternative Vite)
echo.
echo ðŸ”„ Please clear your browser cache and try uploading images again.
pause