@echo off
REM Build script for Murmur in release mode

echo Setting up MSVC build environment...

REM Set up Visual Studio environment
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
if errorlevel 1 (
    echo Failed to set up Visual Studio environment
    exit /b 1
)

REM Set LIBCLANG_PATH for bindgen
set "LIBCLANG_PATH=C:\Program Files\LLVM\bin"

REM Use Visual Studio 2022 generator - explicitly set instance to avoid VS 2026 Insiders
set "CMAKE_GENERATOR=Visual Studio 17 2022"
set "CMAKE_GENERATOR_INSTANCE=C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools"

REM Set bindgen clang args for MSVC headers
for /f "delims=" %%i in ('dir /b /ad /o-n "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC"') do set "MSVC_VER=%%i" & goto :gotmsvc
:gotmsvc
for /f "delims=" %%i in ('dir /b /ad /o-n "C:\Program Files (x86)\Windows Kits\10\Include" 2^>nul ^| findstr /r "^10\."') do set "SDK_VER=%%i" & goto :gotsdk
:gotsdk

set "MSVC_INCLUDE=C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\%MSVC_VER%\include"
set "UCRT_INCLUDE=C:\Program Files (x86)\Windows Kits\10\Include\%SDK_VER%\ucrt"
set "BINDGEN_EXTRA_CLANG_ARGS=-I"%MSVC_INCLUDE%" -I"%UCRT_INCLUDE%""

echo MSVC Include: %MSVC_INCLUDE%
echo UCRT Include: %UCRT_INCLUDE%
echo.
echo Building Murmur in release mode...
echo.

cd /d d:\Repos\Whisper\murmur\src-tauri
cargo build --release 2>&1

echo.
echo Build complete!
