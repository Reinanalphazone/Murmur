@echo off
REM Build script for Murmur with MSVC toolchain

echo Setting up MSVC build environment...

REM Set up Visual Studio environment
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
if errorlevel 1 (
    echo Failed to set up Visual Studio environment
    exit /b 1
)

REM Set LIBCLANG_PATH for bindgen
set "LIBCLANG_PATH=C:\Program Files\LLVM\bin"

REM Force Ninja generator to avoid Visual Studio version detection issues
set "CMAKE_GENERATOR=Ninja"

REM Set bindgen include paths for MSVC
set "BINDGEN_EXTRA_CLANG_ARGS=-IC:\Program Files\LLVM\lib\clang\21\include -IC:\Program Files (x86)\Windows Kits\10\Include\10.0.26100.0\ucrt -IC:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.44.35207\include"

echo.
echo Environment configured:
echo LIBCLANG_PATH=%LIBCLANG_PATH%
echo CMAKE_GENERATOR=%CMAKE_GENERATOR%
echo.

REM Verify tools are available
echo Checking build tools...
where cl.exe
where cmake
where ninja
echo.

REM Clean and rebuild
echo Building Murmur with MSVC...
cd /d d:\Repos\Whisper\murmur\src-tauri
cargo clean -p whisper-rs-sys
cargo clean -p llama-cpp-sys-2
cargo build

echo.
echo Build complete!
pause
