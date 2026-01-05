@echo off
REM Build script for Murmur with native Whisper and LLM support

echo Setting up build environment...

REM Set up Visual Studio environment FIRST
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

REM Set LIBCLANG_PATH for bindgen
set "LIBCLANG_PATH=C:\Program Files\LLVM\bin"

REM Force CMake to use Ninja generator instead of Visual Studio
set "CMAKE_GENERATOR=Ninja"

REM Tell bindgen where to find clang headers (fixes stdbool.h not found)
set "BINDGEN_EXTRA_CLANG_ARGS=-I\"C:\Program Files\LLVM\lib\clang\21\include\" -I\"C:\Program Files (x86)\Windows Kits\10\Include\10.0.26100.0\ucrt\" -I\"C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.44.35207\include\""

REM Verify environment
echo.
echo Checking build tools...
where cl.exe
where clang
where ninja
echo.
echo LIBCLANG_PATH=%LIBCLANG_PATH%
echo BINDGEN_EXTRA_CLANG_ARGS=%BINDGEN_EXTRA_CLANG_ARGS%
echo.

REM Build the project
echo Building Murmur...
cd src-tauri
cargo clean -p llama-cpp-sys-2
cargo clean -p whisper-rs-sys
cargo build
cd ..

echo.
echo Build complete!
