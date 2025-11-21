import { app, BrowserWindow } from "electron";

import * as jam from "./jam";
import * as menu from "./menu";
import * as windows from "./windows";

let mainWindow: BrowserWindow | null = null;
let deepLinkUrl: string | null = null;

// Protocol handler for jam-electron-demo://
const PROTOCOL_SCHEME = "jam-electron-demo";

// Initialize before app ready to ensure BrowserWindow
// session `webRequest` CSP handlers are installed
jam.initialize({
  openRecorder(jamData) {
    const win = windows.findOrCreateWindow("recorder");
    if (win.isMinimized()) {
      win.restore();
    }

    windows.loadContents(win, jamData);

    return win;
  },
});

app.whenReady().then(() => {
  // Register protocol scheme and set self as default protocol client
  if (!app.isDefaultProtocolClient(PROTOCOL_SCHEME)) {
    app.setAsDefaultProtocolClient(PROTOCOL_SCHEME);
  }

  menu.setupMenu();

  // Immediately create and load the main window
  const win = windows.createNamedWindow("main");
  windows.loadContents(win);

  // macOS: Check if app was launched with a protocol URL
  const launchUrl =
    deepLinkUrl ??
    process.argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`));

  if (launchUrl) {
    handleDeepLink(launchUrl);
    return;
  } else {
    const win = windows.createNamedWindow("main");
    windows.loadContents(win);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (deepLinkUrl) {
    handleDeepLink(deepLinkUrl);
    return;
  }

  const found = windows.findWindow("main");

  if (found?.isMinimized()) {
    found.restore();
  } else if (!found) {
    const win = windows.createNamedWindow("main");
    windows.loadContents(win);
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
      return;
    }

    const found = windows.findWindow("main");
    if (!found) {
      throw new Error("No main window found on second instance");
    }

    if (found.isMinimized()) {
      found.restore();
    }

    found.focus();
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

  // Immediately null cached URL if execution reaches here
  deepLinkUrl = null;

  // Parse the URL and handle different actions
  try {
    const parsedUrl = new URL(url);
    const action = parsedUrl.hostname; // e.g., "open" in jam-electron-demo://open?recording=123
    if (action !== "open") {
      return;
    }

    const [unJammedUrl, recorderWindow] = jam.openUrl(parsedUrl);
    let mainWindow = windows.findWindow("main");

    if (mainWindow) {
      // Send the URL to the renderer process
      mainWindow.webContents.send("deep-link", unJammedUrl);

      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
    } else {
      mainWindow = windows.createNamedWindow("main");
      windows.loadContents(mainWindow, new URL(unJammedUrl));
    }

    (recorderWindow ?? mainWindow).focus();
  } catch (err) {
    console.error("Failed to parse deep link URL:", err);
  }
}
