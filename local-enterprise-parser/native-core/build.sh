#!/bin/bash
# Build script for native core library
# Compiles C++ pattern matcher into a shared library

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building native core library..."

# Detect platform
case "$(uname -s)" in
    Linux*)     PLATFORM="linux"; SHARED_EXT="so" ;;
    Darwin*)    PLATFORM="macos"; SHARED_EXT="dylib" ;;
    MINGW*|MSYS*|CYGWIN*)  PLATFORM="windows"; SHARED_EXT="dll" ;;
    *)          echo "Unsupported platform"; exit 1 ;;
esac

echo "Detected platform: $PLATFORM"

# Compiler flags
CXXFLAGS="-std=c++20 -O3 -Wall -Wextra -pedantic"
INCLUDES="-I."
SOURCES="native_core.cpp"

# Output library name
LIB_NAME="libnative_core"

case "$PLATFORM" in
    linux)
        echo "Compiling for Linux..."
        g++ $CXXFLAGS $INCLUDES -shared -fPIC -o "${LIB_NAME}.${SHARED_EXT}" $SOURCES
        ;;
    macos)
        echo "Compiling for macOS..."
        clang++ $CXXFLAGS $INCLUDES -dynamiclib -o "${LIB_NAME}.${SHARED_EXT}" $SOURCES
        ;;
    windows)
        echo "Compiling for Windows..."
        g++ $CXXFLAGS $INCLUDES -shared -o "${LIB_NAME}.${SHARED_EXT}" $SOURCES
        ;;
esac

echo "Build complete: ${LIB_NAME}.${SHARED_EXT}"
echo ""
echo "To use this library:"
echo "  Linux:   export LD_LIBRARY_PATH=\$PWD:\$LD_LIBRARY_PATH"
echo "  macOS:   export DYLD_LIBRARY_PATH=\$PWD:\$DYLD_LIBRARY_PATH"
echo "  Windows: Ensure ${LIB_NAME}.${SHARED_EXT} is in PATH"
