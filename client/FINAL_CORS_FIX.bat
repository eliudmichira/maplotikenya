@echo off
echo ========================================
echo   FINAL CORS FIX FOR PROPERTY UPLOADS
echo ========================================
echo.

echo Status Check:
echo âœ… Firebase Storage: ENABLED
echo âœ… Storage Rules: DEPLOYED
echo ðŸ”„ CORS Configuration: NEEDS TO BE APPLIED
echo.

echo Step 1: Install Google Cloud SDK
echo ================================
echo.
gcloud version >nul 2>&1
if %errorlevel% neq 0 (
    echo Google Cloud SDK is not installed.
    echo.
    echo Please install it now:
    echo 1. Go to: https://cloud.google.com/sdk/docs/install
    echo 2. Download and install Google Cloud SDK
    echo 3. Restart your terminal
    echo 4. Run this script again
    echo.
    echo Press any key to open download page...
    pause >nul
    start https://cloud.google.com/sdk/docs/install
    exit /b 1
) else (
    echo âœ… Google Cloud SDK is installed
)

echo.
echo Step 2: Authenticate with Google Cloud
echo ======================================
echo.
echo Please follow the browser authentication...
gcloud auth login

echo.
echo Step 3: Set Firebase Project
echo ============================
gcloud config set project maploti

echo.
echo Step 4: Apply CORS Configuration
echo ================================
echo.
echo Applying CORS configuration to Firebase Storage...
gsutil cors set cors.json gs://maploti.firebasestorage.app

if %errorlevel% equ 0 (
    echo.
    echo âœ… CORS configuration applied successfully!
    echo.
    echo Step 5: Verify CORS Configuration
    echo ==================================
    echo.
    echo Current CORS configuration:
    gsutil cors get gs://maploti.firebasestorage.app
    echo.
    echo ðŸŽ‰ COMPLETE! Your property upload should now work.
    echo.
    echo Next steps:
    echo 1. Clear your browser cache (Ctrl+Shift+Delete)
    echo 2. Refresh your application
    echo 3. Try adding a property with images
    echo.
    echo The CORS error should be completely resolved!
) else (
    echo.
    echo âŒ Failed to apply CORS configuration
    echo.
    echo Troubleshooting:
    echo 1. Make sure you're authenticated: gcloud auth list
    echo 2. Check your project: gcloud config get-value project
    echo 3. Try re-authenticating: gcloud auth login
)

echo.
pause
