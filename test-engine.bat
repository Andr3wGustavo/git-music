@echo off
setlocal enabledelayedexpansion
title Git-Music - Engine Test Runner

cls
echo ==============================================================================
echo   GIT-MUSIC -- Core Engine and Parser Verification Suite
echo ==============================================================================
echo.

call npm run test

echo.
echo ==============================================================================
echo   Test run completed. Press any key to exit.
echo ==============================================================================
pause >nul
