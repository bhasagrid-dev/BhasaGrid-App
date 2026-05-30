@echo off
title Download Portal Deployment
cd .. && cd download-portal
firebase deploy --only hosting --project innerorbit-portal
if %errorlevel% neq 0 (
    echo ❌ Deployment FAILED - Check error above
) else (
    echo.
    echo ✅ Deployment SUCCESS
    echo.
    echo 📱 DEFAULT FIREBASE DOMAINS:
    echo    https://innerorbit-portal.web.app
    echo    https://innerorbit-portal.firebaseapp.com
    echo.
    echo 🌐 CUSTOM DOMAINS:
    echo    https://bhasagrid.com
    echo    https://www.bhasagrid.com
    echo    https://bhasagrid.in
    echo    https://www.bhasagrid.in
    echo.
)
pause
