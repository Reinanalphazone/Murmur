# Murmur

A privacy-focused voice-to-text desktop application with local AI-powered text cleanup. Murmur transcribes your speech using OpenAI's Whisper model and optionally refines the output with a local LLM, all without sending data to external servers.

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Requirements](#requirements)
- [Installation](#installation)
  - [Pre-built Binaries](#pre-built-binaries)
  - [Building from Source](#building-from-source)
- [Usage](#usage)
  - [First Run Setup](#first-run-setup)
  - [Recording and Transcription](#recording-and-transcription)
  - [AI Text Cleanup](#ai-text-cleanup)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
- [Configuration](#configuration)
  - [Audio Settings](#audio-settings)
  - [AI Settings](#ai-settings)
  - [General Settings](#general-settings)
- [Architecture](#architecture)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Development Setup](#development-setup)
  - [Building](#building)
- [Models](#models)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- **Offline Speech-to-Text**: Uses Whisper.cpp for fast, accurate transcription without internet connectivity
- **Local AI Text Cleanup**: Optionally processes transcriptions through Phi-3 Mini to remove filler words, fix grammar, and improve clarity
- **Global Hotkey**: Trigger recording from any application with a customizable keyboard shortcut
- **Auto-Paste**: Automatically paste transcribed text into the active window
- **Floating Overlay**: Minimalist overlay window showing recording status with real-time waveform visualization
- **Multiple Cleanup Modes**: Choose from basic, formal, casual, or custom cleanup styles
- **Transcription History**: Browse and search past transcriptions with SQLite-backed storage
- **System Tray Integration**: Runs quietly in the background with quick access from the system tray
- **Privacy First**: All processing happens locally on your machine

## How It Works

1. **Record**: Press the global hotkey (default: `Ctrl+Shift+Space`) to start recording
2. **Transcribe**: Murmur captures audio from your microphone and transcribes it using Whisper
3. **Cleanup** (optional): The transcription is refined by a local LLM to improve readability
4. **Paste**: The final text is automatically pasted into your active application

## Requirements

### System Requirements

- **Operating System**: Windows 10/11, macOS, or Linux
- **RAM**: 4GB minimum, 8GB recommended (for LLM cleanup feature)
- **Storage**: ~2GB for application and AI models
- **Microphone**: Any audio input device

### Build Requirements (for building from source)

- **Node.js**: v18 or later
- **Rust**: 1.70 or later
- **Visual Studio 2022 Build Tools** (Windows): With MSVC v143 toolchain
- **LLVM/Clang**: Required for bindgen code generation
- **CMake**: 3.20 or later
- **Ninja**: Build system generator

## Installation

### Pre-built Binaries

Download the latest release for your platform from the [Releases](https://github.com/newtro/Murmur/releases) page:

- **Windows**: `.msi` or `.exe` installer
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage` or `.deb` package

### Building from Source

#### Windows

1. Clone the repository:
   ```bash
   git clone https://github.com/newtro/Murmur.git
   cd Murmur/murmur
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   # For development
   dev.bat

   # For release build
   build-release.bat
   ```

   The build scripts automatically configure the MSVC environment and required toolchains.

4. Find the installer in `src-tauri/target/release/bundle/`

#### macOS / Linux

1. Clone the repository:
   ```bash
   git clone https://github.com/newtro/Murmur.git
   cd Murmur/murmur
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run tauri build
   ```

## Usage

### First Run Setup

On first launch, Murmur presents a setup wizard to configure:

1. **Audio Input Device**: Select your preferred microphone
2. **AI Models**: Download the required Whisper and LLM models
3. **Hotkey Configuration**: Set your preferred recording trigger

### Recording and Transcription

1. **Start Recording**: Press the global hotkey (default: `Ctrl+Shift+Space`)
2. **Speak**: The overlay window appears showing a waveform visualization
3. **Stop Recording**: Press the hotkey again (toggle mode) or release the key (hold mode)
4. **Receive Text**: The transcribed (and optionally cleaned) text is pasted into your active application

### AI Text Cleanup

Murmur can optionally process transcriptions through a local LLM to:

- Remove filler words (um, uh, like, you know)
- Fix grammatical errors
- Improve punctuation and formatting
- Adjust tone based on selected mode

**Cleanup Modes:**

| Mode | Description |
|------|-------------|
| Basic | Removes filler words and fixes obvious errors |
| Formal | Professional tone suitable for emails and documents |
| Casual | Conversational tone for chat and messaging |
| Custom | User-defined system prompt for specialized formatting |

### Keyboard Shortcuts

| Action | Default Shortcut |
|--------|------------------|
| Start/Stop Recording | `Ctrl+Shift+Space` |

Hotkeys can be customized in Settings > General.

## Configuration

Access settings through the system tray menu or the main application window.

### Audio Settings

- **Input Device**: Select the microphone to use for recording
- **Audio Level Monitor**: Real-time visualization of input levels

### AI Settings

- **Enable Cleanup**: Toggle LLM-based text cleanup
- **Cleanup Mode**: Select basic, formal, casual, or custom
- **Custom Prompt**: Define your own system prompt for text processing
- **Model Status**: View and manage downloaded AI models

### General Settings

- **Hotkey**: Configure the global recording trigger
- **Activation Mode**: Toggle (press to start/stop) or Hold (hold to record)
- **Auto-Paste**: Automatically paste text after transcription
- **Paste Method**: Clipboard-based or keyboard simulation
- **Restore Clipboard**: Restore previous clipboard contents after pasting
- **Overlay Position**: Set the location of the recording overlay
- **Waveform Style**: Choose between bars, circle, or line visualization
- **Start Minimized**: Launch to system tray on startup
- **Save History**: Enable transcription history logging

## Architecture

Murmur is built with a modern hybrid architecture:

```
+------------------+     +------------------+     +------------------+
|    Frontend      |     |    Tauri IPC     |     |     Backend      |
|  (Solid.js/TS)   |<--->|     Bridge       |<--->|      (Rust)      |
+------------------+     +------------------+     +------------------+
        |                                                  |
        v                                                  v
+------------------+                         +------------------+
|   Tailwind CSS   |                         |   Whisper.cpp    |
|   Reactive UI    |                         |   Llama.cpp      |
+------------------+                         |   Audio Capture  |
                                             |   SQLite         |
                                             +------------------+
```

**Frontend Stack:**
- Solid.js for reactive UI components
- TypeScript for type-safe development
- Tailwind CSS for styling
- Vite for fast development and optimized builds

**Backend Stack:**
- Tauri v2 for desktop application framework
- Rust for high-performance native code
- whisper-rs for speech-to-text (via whisper.cpp)
- llama-cpp-2 for LLM inference (via llama.cpp)
- cpal for cross-platform audio capture
- rusqlite for SQLite database operations

## Development

### Project Structure

```
murmur/
├── src/                    # Frontend source (TypeScript/Solid.js)
│   ├── components/         # UI components
│   │   ├── settings/       # Settings panels
│   │   ├── overlay/        # Recording overlay
│   │   ├── history/        # Transcription history
│   │   └── wizard/         # Setup wizard
│   ├── stores/             # State management
│   ├── lib/                # Utilities and Tauri bindings
│   └── App.tsx             # Main application component
├── src-tauri/              # Backend source (Rust)
│   ├── src/
│   │   ├── commands/       # Tauri command handlers
│   │   ├── stt/            # Speech-to-text (Whisper)
│   │   ├── llm/            # LLM integration (Llama)
│   │   ├── audio/          # Audio device handling
│   │   ├── storage/        # Database operations
│   │   ├── hotkey/         # Global hotkey management
│   │   ├── paste/          # Text pasting utilities
│   │   └── models/         # Model download management
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── public/                 # Static assets
├── package.json            # NPM configuration
├── vite.config.ts          # Vite configuration
└── tailwind.config.js      # Tailwind CSS configuration
```

### Development Setup

1. **Install Prerequisites**:
   - Node.js 18+
   - Rust 1.70+
   - Platform-specific build tools (see [Build Requirements](#build-requirements-for-building-from-source))

2. **Clone and Install**:
   ```bash
   git clone https://github.com/newtro/Murmur.git
   cd Murmur/murmur
   npm install
   ```

3. **Start Development Server**:
   ```bash
   # Windows
   dev.bat

   # macOS/Linux
   npm run tauri dev
   ```

### Building

**Development Build:**
```bash
npm run tauri dev
```

**Release Build:**
```bash
npm run tauri build
```

**Windows Release Build with Optimizations:**
```bash
build-release.bat
```

Build artifacts are located in `src-tauri/target/release/bundle/`.

## Models

Murmur uses the following AI models, stored in `%APPDATA%/murmur/models/` (Windows) or `~/.config/murmur/models/` (Linux/macOS):

| Model | File | Size | Purpose |
|-------|------|------|---------|
| Whisper Base (English) | `ggml-base.en.bin` | ~142 MB | Speech-to-text transcription |
| Phi-3 Mini 4K Instruct | `phi-3-mini-4k-instruct.Q4_K_M.gguf` | ~2.2 GB | Text cleanup and refinement |

Models are automatically downloaded on first run through the setup wizard, or can be manually downloaded from the Settings panel.

## Troubleshooting

### No Audio Input Detected

- Ensure your microphone is properly connected
- Check that the correct input device is selected in Audio Settings
- Verify microphone permissions are granted for the application

### Model Download Fails

- Check your internet connection
- Ensure sufficient disk space is available (~2.5 GB)
- Try downloading models manually and placing them in the models directory

### Hotkey Not Working

- Ensure no other application is using the same hotkey
- Try running Murmur as administrator (Windows)
- Check that the application is running (check system tray)

### Transcription Quality Issues

- Speak clearly and at a consistent volume
- Reduce background noise
- Consider using a higher-quality microphone
- Ensure the audio input level is adequate (check Audio Settings)

### High Memory Usage

- The LLM cleanup feature requires ~4GB RAM when active
- Disable AI cleanup if memory is limited
- Close other memory-intensive applications

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Murmur** - Speak freely, type accurately.
