@echo off
title Main Web App Deployment
cd .. && cd bhasagrid-universal
firebase deploy --only hosting --project innerorbit-bc8ce
if %errorlevel% neq 0 (
    echo ❌ Deployment FAILED - Check error above
) else (
    echo.
    echo ✅ Deployment SUCCESS
    echo.
    echo 📱 DEFAULT FIREBASE DOMAINS:
    echo    https://innerorbit-bc8ce.web.app
    echo    https://innerorbit-bc8ce.firebaseapp.com
    echo.
    echo 🌐 CUSTOM DOMAINS:
    echo    https://web.bhasagrid.com
    echo    https://www.web.bhasagrid.com
    echo    https://web.bhasagrid.in
    echo    https://www.web.bhasagrid.in
    echo.
)
pause
