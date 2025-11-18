# Conditional Inclusion - Electron App

An Electron wrapper for the Jam conditional-inclusion demo that demonstrates auto-forwarding from web to native app.

## Features

- **Electron App**: Native desktop wrapper for the conditional-inclusion demo
- **Custom URL Protocol**: Registered `jam-electron-demo://` protocol handler
- **Auto-Forward Detection**: Web app automatically attempts to launch the Electron app when visited
- **Multi-Platform**: Supports macOS, Windows, and Linux builds

## Development

### Prerequisites

- Bun package manager
- Node.js 18+

### Running in Development Mode

```bash
# Start the web app dev server (required for Electron to load content)
cd ../conditional-inclusion
bun run dev

# In another terminal, start the Electron app
cd ../conditional-inclusion-electron
bun run dev
```

The Electron app will open and load the web app from `http://localhost:5173/`.

## Building & Packaging

### Build for Current Platform

```bash
bun run package
```

### Build for Specific Platforms

```bash
# macOS
bun run package:mac

# Windows
bun run package:win

# Linux
bun run package:linux
```

Built packages will be in the `release/` directory:
- **macOS**: `.dmg` and `.zip` files
- **Windows**: `.exe` installer and portable
- **Linux**: `.AppImage` and `.deb` packages

## Testing Auto-Forward

1. **Build and install the Electron app**:
   ```bash
   bun run package:mac
   open release/mac-arm64/Jam\ Conditional\ Inclusion\ Demo.app
   ```

2. **Test the web-to-app forwarding**:
   ```bash
   cd ../conditional-inclusion
   bun run dev
   ```

3. **Open browser** to `http://localhost:5173/`

4. **Expected behavior**:
   - Browser console shows "Attempting to forward to Electron app"
   - Electron app launches (or focuses if already running)
   - If app not installed, page stays in browser with message "Electron app not detected"

## Testing Protocol Handler

Once the app is installed, test the custom URL protocol:

```bash
# macOS
open "jam-electron-demo://open?recording=abc123"

# Windows
start jam-electron-demo://open?recording=abc123

# Linux
xdg-open "jam-electron-demo://open?recording=abc123"
```

The app should launch (or focus if running) and log the received URL.

## Architecture

### Main Process (`src/main.ts`)
- Creates the Electron browser window
- Handles `jam-electron-demo://` protocol registration
- Manages deep link URL handling across platforms
- Implements single-instance locking

### Preload Script (`src/preload.ts`)
- Exposes secure `electronAPI` to renderer process
- Provides `isElectron` flag for detection
- Handles IPC communication for deep links

### Auto-Forward Script (in `../conditional-inclusion/index.html`)
- Detects if running in Electron via `window.electronAPI`
- Attempts to launch Electron app using invisible iframe
- Falls back to web version if app not installed
- Preserves URL parameters during forwarding

## Build Configuration

- **Vite**: Builds Electron main and preload scripts
- **electron-builder**: Packages for distribution
- **Protocol**: `jam-electron-demo://` registered on all platforms
- **Target**: Node 18, ES modules

## Future Enhancements (Optional)

- **Pre-caching**: Download Recording Links scripts during build and serve locally
- **Auto-updater**: Implement automatic app updates
- **App Store**: Prepare for Mac App Store and Microsoft Store distribution
