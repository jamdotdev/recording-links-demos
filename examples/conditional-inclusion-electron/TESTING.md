# End-to-End Testing Guide

## Milestone 4: Complete Jam Recording Workflow

### Prerequisites
1. Packaged Electron app installed
2. Dev servers running

### Test Procedure

#### Step 1: Start Dev Servers
```bash
# Terminal 1: Start web app dev server
cd examples/conditional-inclusion
bun run dev
# Should start on http://localhost:5173

# Terminal 2: (Optional) Start Electron in dev mode for debugging
cd examples/conditional-inclusion-electron
bun run dev
```

#### Step 2: Trigger Auto-Forward
1. Open browser to: `http://localhost:5173?jam-recording=XhC17WY`
2. **Expected**: Auto-forward script attempts to launch Electron app

#### Step 3: Verify Dual Windows
**Expected behavior:**
- ✅ Electron app launches (or focuses if running)
- ✅ **Two windows appear:**
  - **Main Window**: Loads `http://localhost:5173` (base app)
  - **Recorder Window**: Loads `http://localhost:5173?jam-recording=XhC17WY` (with Jam params)

#### Step 4: Verify Jam Scripts Load
1. Focus the **Recorder Window**
2. Open DevTools (should open automatically in dev mode)
3. Go to **Network tab**
4. **Expected**: See requests to Jam CDN:
   - `recorder.js` loaded from remote server
   - `capture.js` loaded from remote server
   - Check `jam.dev` or Jam CDN domain in network requests

#### Step 5: Verify Jam UI
1. In Recorder Window, look for Jam recording UI
2. **Expected**:
   - Recording interface appears
   - Jam branding/UI elements visible
   - Recording controls available

#### Step 6: Test Screen Recording
1. Click to initiate a screen recording in the Recorder Window
2. Select a screen/window to record (macOS will prompt for permissions)
3. Perform some actions
4. Stop the recording
5. **Expected**:
   - Recording captures successfully
   - Recording preview appears
   - Option to submit/save recording

#### Step 7: Submit Recording
1. Submit the recording to Jam
2. **Expected**:
   - Recording uploads successfully
   - No CORS or network errors
   - Jam confirmation received

### Success Criteria

- ✅ Auto-forward triggers from browser
- ✅ Two windows open (main + recorder)
- ✅ Recorder window loads with `?jam-recording=XhC17WY`
- ✅ Jam scripts load from remote CDN (visible in Network tab)
- ✅ Jam UI renders correctly
- ✅ Can initiate screen recording
- ✅ Recording completes without errors
- ✅ Can submit recording to Jam

### Troubleshooting

**App doesn't launch:**
- Verify app is installed/packaged
- Check protocol is registered: `defaults read com.jam.conditional-inclusion-electron` (macOS)
- Try direct protocol: `open "jam-electron-demo://open?jam-recording=test"`

**Only one window appears:**
- Check Electron console logs for jam parameter detection
- Verify URL has `jam-` prefix: `?jam-recording=XhC17WY`
- Check `createRecorderWindow()` is being called

**Jam scripts don't load:**
- Check network connectivity
- Verify Jam CDN URLs in DevTools Network tab
- Check for CORS errors in Console

**Recording fails:**
- Grant screen recording permissions in System Preferences (macOS)
- Check Electron app has necessary entitlements
- Verify Jam API key/team configuration

## Testing Without Browser Auto-Forward

You can also test directly by triggering the protocol:

```bash
# macOS
open "jam-electron-demo://open?jam-recording=XhC17WY"

# Windows
start jam-electron-demo://open?jam-recording=XhC17WY

# Linux
xdg-open "jam-electron-demo://open?jam-recording=XhC17WY"
```

This should immediately open both windows without needing the browser.
