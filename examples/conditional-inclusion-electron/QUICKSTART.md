# Jam for Electron - Integration Quickstart

## 1. Install SDK

```bash
npm install @jam.dev/recording-links
```

Peer dependency: `electron` (already in your app)

---

## 2. Initialize Jam Electron (Required)

Initialize the SDK in your main process before `app.whenReady()`:

```typescript
import { app, BrowserWindow } from 'electron';
import * as jam from '@jam.dev/recording-links/electron';

jam.initialize({
  openRecorderWindow(session) {
    return new BrowserWindow({
      width: 1000,
      height: 700,
      webPreferences: {
        allowRunningInsecureContent: true,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });
  },
  async loadRecorderPage(win, data) {
    // Load your app with jam-* query parameters
    await win.loadURL(`https://my-app.com${data.search}`);
  },
});
```

**What this does:**
- Installs display media request handler for screen capture
- Configures window creation and content loading for recorder
- Manages recorder window lifecycle per session

---

## 3. Handle Incoming Jam Links (Recommended)

**Register your app's protocol** (if not already done):

Add to your `package.json` electron-builder config:

```json
{
  "build": {
    "protocols": {
      "name": "my-app",
      "schemes": ["myapp"]
    }
  }
}
```

**Wire up protocol handlers** to open Jam recordings:

```typescript
import { app } from 'electron';
import * as jam from '@jam.dev/recording-links/electron';

// macOS: Handle protocol URLs
app.on('open-url', (event, url) => {
  event.preventDefault();
  const [cleanUrl, recorderWindow] = jam.openUrl(url);

  if (recorderWindow) {
    recorderWindow.focus();
  }
  // cleanUrl has jam-* params removed for your main window
});

// Windows/Linux: Handle second instance
app.on('second-instance', (event, commandLine) => {
  const url = commandLine.find(arg => arg.startsWith('myapp://'));
  if (url) {
    const [cleanUrl, recorderWindow] = jam.openUrl(url);
    if (recorderWindow) {
      recorderWindow.focus();
    }
  }
});
```

**Result:** Links like `myapp://open?jam-recording=abc123` will launch your app and open the recorder.

---

## 4. Enable In-App Recording (Optional)

Add a menu item to trigger recordings from within your app:

```typescript
import { Menu } from 'electron';
import * as jam from '@jam.dev/recording-links/electron';

const template = [
  {
    label: 'Help',
    submenu: [
      {
        label: 'Report a Bug',
        click: () => {
          jam.openRecorder('your-recording-id-here');
        },
      },
    ],
  },
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template));
```

**Test:** Click "Report a Bug" → Recorder window opens and screen capture starts.

---

## What Jam Recording Links Enables for Your Electron App

Users can report bugs with one click:

- From your app menu → Instant screen recording starts
- From Jam Recording Links (via Slack, email) → App launches and recording begins
- Zero configuration of screen capture or window management

## What the SDK Provides

### Session Management

- Injects CSP headers allowing `*.jam.dev` domains
- Enables dynamic script loading for Jam SDK components

### Window Architecture

- Creates separate recorder window when `jam-*` query parameters detected
- Maintains main window alongside recorder (multi-window pattern)
- Auto-focuses or reuses existing recorder window if already open
- Prevents main window from closing when recorder opens

### Screen Capture

- Filters capture sources to exclude recorder window (prevents recursive capture)
- Auto-excludes DevTools windows from source list
- Implements source selection strategy: prefer app windows, then screens
- Configures `desktopCapturer` with appropriate permissions

### Protocol Integration

- Parses `yourapp://open?jam-recording=ID` format URLs
- Routes protocol requests to dual-window opener
- Handles cross-platform differences (macOS `open-url` vs Windows/Linux `second-instance`)
- Validates and extracts `jam-*` query parameters

### Developer Configuration

**You provide:**

- **Protocol scheme**: Your app's custom URL scheme (e.g., "notion", "slack")
- **Web URLs**: Dev server (e.g., `http://localhost:3000`) and production path
- **Recording IDs**: Which Jam recording to open for bug reports (coming soon: dynamic values via API)
- **Trigger UI**: Where to place menu items or buttons in your app

**SDK handles everything else.**
