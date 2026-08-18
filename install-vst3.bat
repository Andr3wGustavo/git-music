@echo off
setlocal enabledelayedexpansion
title Git-Music VST3 - In-DAW Plugin Installer

echo ==============================================================================
echo   GIT-MUSIC VST3 -- Automatic DAW Plugin Installer
echo   Target: C:\Program Files\Common Files\VST3\GitMusic.vst3
echo ==============================================================================
echo.

set VST3_SYSTEM_DIR=C:\Program Files\Common Files\VST3

if not exist "%VST3_SYSTEM_DIR%" (
    echo [INFO] Creating universal VST3 directory: %VST3_SYSTEM_DIR%
    mkdir "%VST3_SYSTEM_DIR%" 2>nul
)

set SOURCE_PLUGIN=dist\vst3\GitMusic.vst3
if not exist "%SOURCE_PLUGIN%" (
    set SOURCE_PLUGIN=plugin\build\Release\git_music_plugin.vst3
)

if not exist "%SOURCE_PLUGIN%" (
    echo [INFO] Pre-compiled VST3 binary not found in dist.
    echo Running build-vst3.bat first, or using local Web Bridge...
)

echo [INSTALL] Copying GitMusic VST3 to DAW scanning path...
copy /y "%SOURCE_PLUGIN%" "%VST3_SYSTEM_DIR%\GitMusic.vst3" 2>nul

echo.
echo ==============================================================================
echo   [OK] Git-Music VST3 is installed in your DAW folder!
echo   1. Open FL Studio 21 -> Options -> Manage Plugins -> [Find Installed Plugins]
echo   2. Or open Ableton Live -> Preferences -> Plug-Ins -> Rescan
echo   3. Insert 'GitMusic' on Master Channel / Mixer Insert 0
echo ==============================================================================
echo.
pause
