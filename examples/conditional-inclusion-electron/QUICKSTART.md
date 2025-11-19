# Jam for Electron - Integration Quickstart

## 1. Install SDK

- `npm install @jam.dev/recording-links`
- Peer dependency: `electron` (already in your app)

---

## 2. Initialize Jam Electron

**Operations performed:**

- Configures session CSP to allow Jam domains
- Installs screen capture source filter (excludes recorder window)
- Exposes API handle to open recording windows (managed separately from your app windows)

**Where:** `src/main/index.ts`, called once at app startup

---

## 3. Handle Incoming Jam Links (Recommended)

**Register Protocol (if needed):**

- Add to `electron-builder` config:
  - `protocols.schemes: ["yourapp"]`
  - Enables `yourapp://open?jam-recording=ID`
- **Skip if** your app already has a custom protocol handler
- **Ensure** query parameters are preserved from incoming links and passed to the SDK

**Wire Handler:**

- Use Jam Electron SDK API handle to route incoming URLs
- Hook into `app.on('open-url')` (macOS) and `app.on('second-instance')` (Windows/Linux)

**Result:**

- Jam links from browser/Slack/email open your app
- Dual windows launch automatically

---

## 4. Enable In-App Recording (Optional)

**Add Menu Item:**

- Call Jam Electron SDK API handle to open recorder from menu item click handler (or any user-triggered action)
- Common placement: Help menu or user menu

**Test:**

- Click menu item → Recorder window opens
- Both windows visible → Screen capture starts

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
