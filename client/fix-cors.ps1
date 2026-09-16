# PowerShell script to fix Firebase Storage CORS configuration
# This script applies CORS settings to allow image uploads from your web app

Write-Host "ðŸ”§ Fixing Firebase Storage CORS Configuration..." -ForegroundColor Green

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud version --format="value(Google Cloud SDK)" 2>$null
    if ($gcloudVersion) {
        Write-Host "âœ… Google Cloud SDK found: $gcloudVersion" -ForegroundColor Green
    } else {
        throw "gcloud not found"
    }
} catch {
    Write-Host "âŒ Google Cloud SDK not found. Please install it first:" -ForegroundColor Red
    Write-Host "   Download from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Write-Host "   Or run: winget install Google.CloudSDK" -ForegroundColor Yellow
    exit 1
}

# Authenticate with Google Cloud
Write-Host "ðŸ” Authenticating with Google Cloud..." -ForegroundColor Yellow
try {
    gcloud auth login --no-launch-browser
    Write-Host "âœ… Authentication successful" -ForegroundColor Green
} catch {
    Write-Host "âŒ Authentication failed. Please try again." -ForegroundColor Red
    exit 1
}

# Set the Firebase project
Write-Host "ðŸŽ¯ Setting Firebase project to maploti..." -ForegroundColor Yellow
try {
    gcloud config set project maploti
    Write-Host "âœ… Project set successfully" -ForegroundColor Green
} catch {
    Write-Host "âŒ Failed to set project. Please check your permissions." -ForegroundColor Red
    exit 1
}

# Apply CORS configuration
Write-Host "ðŸš€ Applying CORS configuration to Firebase Storage..." -ForegroundColor Yellow
try {
    gsutil cors set cors.json gs://maploti.firebasestorage.app
    Write-Host "âœ… CORS configuration applied successfully!" -ForegroundColor Green
} catch {
    Write-Host "âŒ Failed to apply CORS configuration. Error: $_" -ForegroundColor Red
    exit 1
}

# Verify the configuration
Write-Host "ðŸ” Verifying CORS configuration..." -ForegroundColor Yellow
try {
    gsutil cors get gs://maploti.firebasestorage.app
    Write-Host "âœ… CORS configuration verified!" -ForegroundColor Green
} catch {
    Write-Host "âŒ Failed to verify CORS configuration." -ForegroundColor Red
    exit 1
}

Write-Host "ðŸŽ‰ CORS configuration completed successfully!" -ForegroundColor Green
Write-Host "ðŸ“ Your Firebase Storage bucket now allows requests from:" -ForegroundColor Cyan
Write-Host "   â€¢ https://maploti.web.app (production)" -ForegroundColor White
Write-Host "   â€¢ http://localhost:3000 (local development)" -ForegroundColor White
Write-Host "   â€¢ http://localhost:5173 (Vite dev server)" -ForegroundColor White
Write-Host "   â€¢ http://127.0.0.1:3000 (alternative local)" -ForegroundColor White
Write-Host "   â€¢ http://127.0.0.1:5173 (alternative Vite)" -ForegroundColor White
Write-Host ""
Write-Host "ðŸ”„ Please clear your browser cache and try uploading images again." -ForegroundColor Yellow