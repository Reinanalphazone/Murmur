$ErrorActionPreference = 'Continue'
$env:LIBCLANG_PATH = 'C:\Program Files\LLVM\bin'
# Use Visual Studio 2022 generator - explicitly set instance to avoid VS 2026 Insiders
$env:CMAKE_GENERATOR = 'Visual Studio 17 2022'
$env:CMAKE_GENERATOR_INSTANCE = 'C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools'

# Get Visual Studio environment
$vsPath = 'C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build'
Push-Location $vsPath
$output = cmd /c 'vcvars64.bat && set' 2>&1
Pop-Location

# Parse and set environment variables
$output | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

# Find MSVC and Windows SDK paths for bindgen
$vsToolsPath = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC"
$msvcVersion = (Get-ChildItem $vsToolsPath | Sort-Object Name -Descending | Select-Object -First 1).Name
$msvcInclude = "$vsToolsPath\$msvcVersion\include"

$sdkPath = "C:\Program Files (x86)\Windows Kits\10\Include"
$sdkVersion = (Get-ChildItem $sdkPath | Where-Object { $_.Name -match '^\d+' } | Sort-Object Name -Descending | Select-Object -First 1).Name
$ucrtInclude = "$sdkPath\$sdkVersion\ucrt"

# Set bindgen clang args to find headers
$env:BINDGEN_EXTRA_CLANG_ARGS = "-I`"$msvcInclude`" -I`"$ucrtInclude`""
Write-Host "MSVC Include: $msvcInclude"
Write-Host "UCRT Include: $ucrtInclude"
Write-Host "BINDGEN_EXTRA_CLANG_ARGS: $env:BINDGEN_EXTRA_CLANG_ARGS"

# Build
Set-Location 'd:\Repos\Whisper\murmur\src-tauri'
Write-Host 'Starting cargo build...'
cargo build --release 2>&1
Write-Host 'Build finished with exit code:' $LASTEXITCODE
