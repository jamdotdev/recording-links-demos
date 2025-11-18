import { app, BrowserWindow, protocol, session } from "electron";
import * as path from "path";
import { fileURLToPath } from "url";
import isDev from "electron-is-dev";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let recorderWindow: BrowserWindow | null = null;
let deepLinkUrl: string | null = null;

// Protocol handler for jam-electron-demo://
const PROTOCOL_SCHEME = "jam-electron-demo";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Load the web app
  if (isDev) {
    // In development, load from the conditional-inclusion dev server
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from the built web app
    const webDistPath = path.join(__dirname, "..", "web-dist", "index.html");
    mainWindow.loadFile(webDistPath);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // If we received a deep link before the window was ready, handle it now
  if (deepLinkUrl) {
    handleDeepLink(deepLinkUrl);
    deepLinkUrl = null;
  }
}

function createRecorderWindow(url: string) {
  console.log("Creating/focusing recorder window with URL:", url);

  // If recorder window already exists, focus it and reload with new URL
  if (recorderWindow) {
    if (recorderWindow.isMinimized()) {
      recorderWindow.restore();
    }
    recorderWindow.focus();
    recorderWindow.loadURL(url);
    return;
  }

  // Create new recorder window
  recorderWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Load the URL with jam parameters
  recorderWindow.loadURL(url);
  recorderWindow.webContents.openDevTools();

  recorderWindow.on("closed", () => {
    recorderWindow = null;
  });
}

function handleDeepLink(url: string) {
  console.log("Deep link received:", url);

  // Parse the URL and handle different actions
  try {
    const parsedUrl = new URL(url);
    const action = parsedUrl.hostname; // e.g., "open" in jam-electron-demo://open?recording=123
    const params = Object.fromEntries(parsedUrl.searchParams);

    console.log("Deep link action:", action, "params:", params);

    // Filter jam-* parameters
    const jamParams = Object.entries(params)
      .filter(([key]) => key.startsWith("jam-"))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const hasJamParams = Object.keys(jamParams).length > 0;

    console.log("Jam parameters detected:", hasJamParams);
    if (hasJamParams) {
      console.log("Jam params:", jamParams);
    }

    // Dual-window logic: handle jam-* parameters
    if (hasJamParams) {
      // Ensure main window exists
      if (!mainWindow) {
        createWindow();
      }

      // Construct URL with jam parameters for recorder window
      const baseUrl = isDev ? "http://localhost:5173" : "file://" + path.join(__dirname, "..", "web-dist", "index.html");
      const queryString = parsedUrl.search; // Includes the leading '?'
      const hash = parsedUrl.hash; // Includes the leading '#'
      const recorderUrl = isDev
        ? `${baseUrl}${queryString}${hash}`
        : `${baseUrl}${queryString}${hash}`;

      console.log("Opening recorder window with URL:", recorderUrl);
      createRecorderWindow(recorderUrl);
    } else {
      // No jam params: just focus main window
      if (!mainWindow) {
        deepLinkUrl = url;
        return;
      }

      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();

      // Send the URL to the renderer process
      mainWindow.webContents.send("deep-link", url);
    }
  } catch (err) {
    console.error("Failed to parse deep link URL:", err);
  }
}

// Register protocol handler
function setupProtocol() {
  // Set as default protocol client for jam-electron-demo://
  if (!app.isDefaultProtocolClient(PROTOCOL_SCHEME)) {
    app.setAsDefaultProtocolClient(PROTOCOL_SCHEME);
  }
}

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
  app.on("second-instance", (event, commandLine) => {
    // Windows/Linux: commandLine will contain the protocol URL
    const url = commandLine.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`));
    if (url) {
      handleDeepLink(url);
    }

    // Focus the existing window
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  // Set up CSP to allow Jam recording scripts in sandboxed windows
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = [
      "default-src 'self' http://localhost:* https://localhost:*",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://localhost:* https://js.jam.dev https://js.jam.test",
      "connect-src 'self' http://localhost:* https://localhost:* https://*.jam.dev https://*.jam.test wss://*.jam.dev wss://*.jam.test",
      "style-src 'self' 'unsafe-inline' http://localhost:* https://localhost:*",
      "img-src 'self' data: http://localhost:* https://localhost:* https://*.jam.dev https://*.jam.test",
      "font-src 'self' data: http://localhost:* https://localhost:*",
      "frame-src 'self' https://*.jam.dev https://*.jam.test",
      "worker-src 'self' blob: http://localhost:* https://localhost:*",
      "media-src 'self' blob: http://localhost:* https://localhost:* https://*.jam.dev https://*.jam.test",
    ].join("; ");

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [csp],
      },
    });
  });

  setupProtocol();
  createWindow();

  // macOS: Check if app was launched with a protocol URL
  if (process.platform === "darwin") {
    const argv = process.argv;
    const protocolUrl = argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`));
    if (protocolUrl) {
      handleDeepLink(protocolUrl);
    }
  }

  // Windows/Linux: Check command line args
  if (process.platform === "win32" || process.platform === "linux") {
    const protocolUrl = process.argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`));
    if (protocolUrl) {
      handleDeepLink(protocolUrl);
    }
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
