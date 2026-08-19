@echo off
setlocal enabledelayedexpansion
title Git-Music VST3 - C++ Native Build & Packaging

echo ==============================================================================
echo   GIT-MUSIC VST3 PLUGIN -- C++20 Native Compiler & Packager
echo   FL Studio 21, Ableton Live, Reaper Native VST3 Target
echo ==============================================================================
echo.

REM 1. Locate CMake in PATH or Common Visual Studio / Program Files Paths
set CMAKE_BIN=cmake
where cmake >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\CMake\bin\cmake.exe" (
        set CMAKE_BIN="C:\Program Files\CMake\bin\cmake.exe"
    ) else if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe" (
        set CMAKE_BIN="C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe"
    ) else if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2019\Community\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe" (
        set CMAKE_BIN="%ProgramFiles(x86)%\Microsoft Visual Studio\2019\Community\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe"
    ) else (
        echo [WARNING] CMake binary not found in standard paths.
        echo Please install CMake or Visual Studio with C++ Desktop Development.
        echo.
        echo For now, the Web Cockpit and Daemon run 100%% via start-git-music.bat
        pause
        exit /b 0
    )
)

echo [1/3] Configuring C++20 VST3 project with CMake...
if not exist "plugin\build" mkdir "plugin\build"
cd plugin\build

%CMAKE_BIN% .. -DCMAKE_BUILD_TYPE=Release
if %errorlevel% neq 0 (
    echo [ERROR] CMake configuration failed.
    cd ..\..
    pause
    exit /b 1
)

echo.
echo [2/3] Compiling GitMusic.vst3 64-bit binary...
%CMAKE_BIN% --build . --config Release
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed.
    cd ..\..
    pause
    exit /b 1
)

echo.
echo [3/3] Packaging VST3 Bundle...
cd ..\..
if not exist "dist\vst3" mkdir "dist\vst3"
copy /y "plugin\build\Release\git_music_plugin.vst3" "dist\vst3\GitMusic.vst3" 2>nul

echo.
echo ==============================================================================
echo   [SUCCESS] GitMusic.vst3 built successfully!
echo   Run install-vst3.bat (as Admin) to deploy directly to FL Studio / Ableton.
echo ==============================================================================
pause
