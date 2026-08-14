@echo off
chcp 65001 >nul
title Git-Music :: Engine Test Runner

cls
echo ==============================================================================
echo   🧪 GIT-MUSIC -- Core Engine & Parser Verification Suite
echo ==============================================================================
echo.

call npm run test

echo.
echo ==============================================================================
echo   Press any key to close this test runner window.
echo ==============================================================================
pause >nul
