@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
set "LIBCLANG_PATH=C:\Program Files\LLVM\bin"
set "CMAKE_GENERATOR=Ninja"
cd /d d:\Repos\Whisper\murmur\src-tauri
cargo clean -p whisper-rs-sys 2>NUL
cargo clean -p llama-cpp-sys-2 2>NUL
cargo build 2>&1
