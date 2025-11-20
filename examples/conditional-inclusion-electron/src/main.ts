import { app, BrowserWindow } from "electron";

import * as jam from "./jam";
import * as menu from "./menu";
import * as utils from "./utils";
import * as win from "./window";

// Window dimension constants
const MAIN_WINDOW_DIMS = { width: 1200, height: 800 };
const RECORDER_WINDOW_DIMS = { width: 1000, height: 700 };

let mainWindow: BrowserWindow | null = null;
let recorderWindow: BrowserWindow | null = null;
let deepLinkUrl: string | null = null;

// Protocol handler for jam-electron-demo://
const PROTOCOL_SCHEME = "jam-electron-demo";

// Initialize before app ready to ensure BrowserWindow
// session `webRequest` CSP handlers are installed
jam.initialize({
  openRecorder(data: { recordingId: string; title?: string }) {
    if (!recorderWindow) {
      const mainBounds = mainWindow?.getBounds();
      const position = mainBounds
        ? {
            ...RECORDER_WINDOW_DIMS,
            x:
              mainBounds.x + mainBounds.width + 10 - RECORDER_WINDOW_DIMS.width,
            y: mainBounds.y - 10,
          }
        : utils.getCenteredRect(RECORDER_WINDOW_DIMS);

      recorderWindow = win.createWindow(position);

      recorderWindow.on("closed", () => {
        recorderWindow = null;
      });
    } else if (recorderWindow.isMinimized()) {
      recorderWindow.restore();
    }

    // TODO - do a better job of merging params
    win.loadContents(recorderWindow, {
      search: `?jam-recording=${data.recordingId}&jam-title=${data.title}`,
    });

    return recorderWindow;
  },
});

app.whenReady().then(() => {
  // Register protocol scheme and set self as default protocol client
  if (!app.isDefaultProtocolClient(PROTOCOL_SCHEME)) {
    app.setAsDefaultProtocolClient(PROTOCOL_SCHEME);
  }

  menu.setupMenu();
  mainWindow = win.createWindow(utils.getCenteredRect(MAIN_WINDOW_DIMS));

  // macOS: Check if app was launched with a protocol URL
  const launchUrl =
    deepLinkUrl ??
    process.argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`));

  if (launchUrl) {
    handleDeepLink(launchUrl);
    deepLinkUrl = null;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    mainWindow = win.createWindow(utils.getCenteredRect(MAIN_WINDOW_DIMS));
    win.loadContents(mainWindow);

    if (deepLinkUrl) {
      handleDeepLink(deepLinkUrl);
      deepLinkUrl = null;
    }
  }
});

// Handle the app being launched with a protocol URL
app.on("open-url", (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// Handle second instance (Windows/Linux)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    // Windows/Linux: commandLine will contain the protocol URL
    const url = commandLine.find((arg) =>
      arg.startsWith(`${PROTOCOL_SCHEME}://`),
    );
    if (url) {
      handleDeepLink(url);
    } else if (mainWindow) {
      // Focus the existing window
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      mainWindow.focus();
    }
  });
}

/**
 * Handles deep link protocol URLs (jam-electron-demo://).
 * Opens dual windows if jam-* parameters are present, otherwise focuses main window.
 * If called before app is ready, stores URL for later handling.
 * @param url - The protocol URL to handle
 */
function handleDeepLink(url: string) {
  // If app isn't ready yet, store URL and handle it after window creation
  if (!app.isReady() || !mainWindow) {
    console.log("App not ready, storing deep link for later:", url);
    deepLinkUrl = url;
    return;
  }

  // TODO: parse the URL with Jam, have us return the stripped params?
  // Parse the URL and handle different actions
  try {
    const parsedUrl = new URL(url);
    const action = parsedUrl.hostname; // e.g., "open" in jam-electron-demo://open?recording=123
    if (action !== "open") {
      return;
    }

    const jamData = jam.parseJamData(url);
    const unJammedUrl = jam.applyJamData(url, null);

    if (!mainWindow) {
      mainWindow = win.createWindow(utils.getCenteredRect(MAIN_WINDOW_DIMS));
      win.loadContents(mainWindow, new URL(unJammedUrl));
    } else {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
    }

    // Send the URL to the renderer process
    mainWindow.webContents.send("deep-link", unJammedUrl);

    if (jamData) {
      jam.openRecorder(jamData);
    } else {
      mainWindow.focus();
    }
  } catch (err) {
    console.error("Failed to parse deep link URL:", err);
  }
}
