@echo off
echo Waiting for transit scores to complete...
timeout /t 1800 /nobreak >nul
echo.
echo Transit scores should be done! Starting grocery scores...
cd /d "%~dp0"
call node updateGroceryScores.js
echo.
echo Grocery scores complete! Starting daily living scores...
call node updateDailyLivingScores.js
echo.
echo === All scores completed! ===
pause
