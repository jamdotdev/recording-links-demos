# Conditional Inclusion - Electron App

An Electron wrapper for the Jam conditional-inclusion demo that demonstrates auto-forwarding from web to native app.

## Features

- **Electron App**: Native desktop wrapper for the conditional-inclusion demo
- **Dual-Window Architecture**: Automatically opens separate main and recorder windows when Jam parameters detected
- **Custom URL Protocol**: Registered `jam-electron-demo://` protocol handler
- **Auto-Forward Detection**: Web app automatically attempts to launch the Electron app when visited
- **Infinite Loop Prevention**: Smart detection prevents recursive forwarding
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

## Testing Dual-Window Architecture

Test the dual-window functionality with Jam recording parameters:

```bash
# macOS - This will open TWO windows
open "jam-electron-demo://open?jam-recording=XhC17WY"

# Windows
start jam-electron-demo://open?jam-recording=XhC17WY

# Linux
xdg-open "jam-electron-demo://open?jam-recording=XhC17WY"
```

**Expected behavior:**
- **Main Window**: Opens at `http://localhost:5173` (base app)
- **Recorder Window**: Opens at `http://localhost:5173?jam-recording=XhC17WY` (with Jam UI)

The app detects `jam-*` query parameters and automatically creates both windows.

### Testing from Browser

1. Start dev server: `cd ../conditional-inclusion && bun run dev`
2. Visit in browser: `http://localhost:5173?jam-recording=XhC17WY`
3. Auto-forward triggers → Two Electron windows open

See `TESTING.md` for comprehensive end-to-end testing instructions.

## Architecture

### Dual-Window System

The app manages exactly **two window types**:

1. **Main Window** (`mainWindow`)
   - Always loads base URL: `http://localhost:5173` (dev) or `file://...` (production)
   - Standard app interface
   - Created on app launch

2. **Recorder Window** (`recorderWindow`)
   - Only created when `jam-*` query parameters detected
   - Loads URL with Jam parameters: `http://localhost:5173?jam-recording=XhC17WY`
   - Hosts Jam recording UI and scripts
   - Reused if already exists (focus + reload)

### Main Process (`src/main.ts`)

- **Window Management**: Creates and manages main + recorder windows
- **Protocol Handler**: Processes `jam-electron-demo://` URLs
- **Parameter Detection**: Filters and detects `jam-*` query parameters
- **URL Construction**: Builds proper URLs for dev/production modes
- **Single-Instance Locking**: Prevents multiple app instances

**Key Logic Flow:**
```
Protocol URL received → Parse parameters → Check for jam-* params
├─ Has jam-* → Create main window (if needed) + recorder window
└─ No jam-* → Focus/create main window only
```

### Preload Script (`src/preload.ts`)
- Exposes secure `electronAPI` to renderer process
- Provides `isElectron` flag for detection
- Handles IPC communication for deep links

### Auto-Forward Script (in `../conditional-inclusion/index.html`)

**Critical Features:**
- **Electron Detection**: Checks `window.electronAPI.isElectron` - skips if already in Electron
- **Loop Prevention**: Checks if current URL has `jam-*` params - skips if in recorder context
- **Protocol Trigger**: Uses invisible iframe to attempt `jam-electron-demo://` launch
- **Fallback**: Stays on web page if app not installed
- **Parameter Preservation**: Forwards full query string and hash

**Prevention of Infinite Loop:**
```javascript
// Skips forwarding if page already has jam-* parameters
const hasJamParams = Array.from(params.keys()).some(key => key.startsWith('jam-'));
if (hasJamParams) return;  // Already in recorder window!
```

## Build Configuration

- **Vite**: Builds Electron main and preload scripts
- **electron-builder**: Packages for distribution
- **Protocol**: `jam-electron-demo://` registered on all platforms
- **Target**: Node 18, ES modules

## Future Enhancements (Optional)

- **Pre-caching**: Download Recording Links scripts during build and serve locally
- **Auto-updater**: Implement automatic app updates
- **App Store**: Prepare for Mac App Store and Microsoft Store distribution
