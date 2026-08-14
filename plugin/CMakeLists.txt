cmake_minimum_required(VERSION 3.20)
project(GitMusicPlugin VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Include plugin directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Source files
set(PLUGIN_SOURCES
    src/GitMusicProcessor.cpp
    src/IPCBridge.cpp
    src/WebViewContainer.cpp
)

# Shared library target (VST3 / CLAP compatible binary)
add_library(git_music_plugin SHARED
    ${PLUGIN_SOURCES}
)

target_include_directories(git_music_plugin PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)

target_compile_definitions(git_music_plugin PRIVATE
    GIT_MUSIC_VERSION="${PROJECT_VERSION}"
    NOMINMAX
    WIN32_LEAN_AND_MEAN
)

# Set output target properties
set_target_properties(git_music_plugin PROPERTIES
    PREFIX ""
    SUFFIX ".vst3"
)

message(STATUS "Configured GitMusicPlugin for C++20 VST3/CLAP target with embedded WebView container.")
