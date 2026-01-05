@echo off
REM Build script for Murmur with GNU toolchain (MSYS2)

echo Setting up GNU build environment...

REM Add MSYS2 UCRT64 to PATH
set "PATH=C:\msys64\ucrt64\bin;%PATH%"

REM Set LIBCLANG_PATH for bindgen
set "LIBCLANG_PATH=C:\Program Files\LLVM\bin"

REM Verify tools
echo.
echo Checking build tools...
where gcc
where dlltool
where ar
echo.

REM Build the project
echo Building Murmur with GNU toolchain...
cd /d d:\Repos\Whisper\murmur\src-tauri
cargo build --target x86_64-pc-windows-gnu

echo.
echo Build complete!
