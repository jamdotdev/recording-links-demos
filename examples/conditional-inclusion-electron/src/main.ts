import {
  app,
  BrowserWindow,
  desktopCapturer,
  Menu,
  screen,
  session,
} from "electron";
import * as path from "path";
import { fileURLToPath } from "url";
import isDev from "electron-is-dev";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Window dimension constants
const MAIN_WINDOW_WIDTH = 1200;
const MAIN_WINDOW_HEIGHT = 800;
const RECORDER_WINDOW_WIDTH = 1000;
const RECORDER_WINDOW_HEIGHT = 700;

let mainWindow: BrowserWindow | null = null;
let recorderWindow: BrowserWindow | null = null;
let deepLinkUrl: string | null = null;

// Protocol handler for jam-electron-demo://
const PROTOCOL_SCHEME = "jam-electron-demo";

/**
 * Gets the bounds of the currently active display (where cursor is located).
 * Falls back to primary display if cursor position unavailable.
 * @returns Display bounds object with x, y, width, height
 */
function getActiveDisplayBounds() {
  const cursorPoint = screen.getCursorScreenPoint();
  const activeDisplay = screen.getDisplayNearestPoint(cursorPoint);
  return activeDisplay.workArea;
}

/**
 * Calculates centered position for a window on the active display.
 * @param windowWidth - Width of window to position
 * @param windowHeight - Height of window to position
 * @param offsetX - Optional horizontal offset from center
 * @returns Object with x and y coordinates
 */
function getCenteredPosition(
  windowWidth: number,
  windowHeight: number,
  offsetX = 0,
) {
  const displayBounds = getActiveDisplayBounds();
  return {
    x: Math.floor(
      displayBounds.x + (displayBounds.width - windowWidth) / 2 + offsetX,
    ),
    y: Math.floor(displayBounds.y + (displayBounds.height - windowHeight) / 2),
  };
}

/**
 * Creates the main application window.
 * Loads the web app from localhost in dev mode, or from web-dist in production.
 */
function createWindow() {
  const position = getCenteredPosition(MAIN_WINDOW_WIDTH, MAIN_WINDOW_HEIGHT);

  mainWindow = new BrowserWindow({
    width: MAIN_WINDOW_WIDTH,
    height: MAIN_WINDOW_HEIGHT,
    x: position.x,
    y: position.y,
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

/**
 * Creates or focuses the recorder window with jam-* parameters.
 * Reuses existing window if already open, otherwise creates a new one.
 * Positions window offset from main window for dual-window visibility.
 * @param url - The URL to load in the recorder window (includes jam-* params)
 */
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

  // Position recorder window offset from center (to right of main window)
  const offsetX = MAIN_WINDOW_WIDTH / 2 + 50;
  const position = getCenteredPosition(
    RECORDER_WINDOW_WIDTH,
    RECORDER_WINDOW_HEIGHT,
    offsetX,
  );

  // Create new recorder window
  recorderWindow = new BrowserWindow({
    width: RECORDER_WINDOW_WIDTH,
    height: RECORDER_WINDOW_HEIGHT,
    x: position.x,
    y: position.y,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Load the URL with jam parameters
  recorderWindow.loadURL(url);

  recorderWindow.on("closed", () => {
    recorderWindow = null;
  });
}

/**
 * Handles deep link protocol URLs (jam-electron-demo://).
 * Opens dual windows if jam-* parameters are present, otherwise focuses main window.
 * @param url - The protocol URL to handle
 */
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
      const baseUrl = isDev
        ? "http://localhost:5173"
        : "file://" + path.join(__dirname, "..", "web-dist", "index.html");
      const queryString = parsedUrl.search; // Includes the leading '?'
      const hash = parsedUrl.hash; // Includes the leading '#'
      const recorderUrl = `${baseUrl}${queryString}${hash}`;

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

// Create application menu
function setupMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS app menu
    ...(process.platform === "darwin"
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    // Edit menu
    {
      label: "Edit",
      submenu: [
        { role: "undo" as const },
        { role: "redo" as const },
        { type: "separator" as const },
        { role: "cut" as const },
        { role: "copy" as const },
        { role: "paste" as const },
        { role: "selectAll" as const },
      ],
    },
    // View menu
    {
      label: "View",
      submenu: [
        { role: "reload" as const },
        { role: "forceReload" as const },
        { role: "toggleDevTools" as const },
        { type: "separator" as const },
        { role: "resetZoom" as const },
        { role: "zoomIn" as const },
        { role: "zoomOut" as const },
        { type: "separator" as const },
        { role: "togglefullscreen" as const },
      ],
    },
    // Help menu
    {
      label: "Help",
      submenu: [
        {
          label: "Report a Bug 🍓",
          click: () => {
            // handleDeepLink(`${PROTOCOL_SCHEME}://open?jam-recording=XhC17WY`); // aidan dev
            handleDeepLink(`${PROTOCOL_SCHEME}://open?jam-recording=HGWzdWc`); // prod
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
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
    const url = commandLine.find((arg) =>
      arg.startsWith(`${PROTOCOL_SCHEME}://`),
    );
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
  // NOTE: Session-based CSP is required because Electron's sandbox mode
  // ignores meta tag CSP. This must be set via onHeadersReceived.
  //
  // CSP Directives explained:
  // - script-src: 'unsafe-inline' and 'unsafe-eval' required for Jam SDK dynamic imports
  // - *.jam.dev and *.jam.test:* wildcards allow staging/testing environments
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = [
      "default-src 'self' http://localhost:* https://localhost:*",
      "script-src 'self' http://localhost:* https://localhost:* https://*.jam.dev https://*.jam.test:*",
      "connect-src 'self' http://localhost:* https://localhost:* https://*.jam.dev https://*.jam.test:*",
      // TODO - can we put `unsafe-inline` _only_ on style-src for Jam windows?
      "style-src 'self' 'unsafe-inline' http://localhost:* https://localhost:*",
      "img-src 'self' data: http://localhost:* https://localhost:* https://*.jam.dev https://*.jam.test:*",
      "font-src 'self' data: http://localhost:* https://localhost:*",
      "frame-src 'self' https://*.jam.dev https://*.jam.test:*",
      "worker-src 'self' blob: http://localhost:* https://localhost:*",
      "media-src 'self' blob: http://localhost:* https://localhost:* https://*.jam.dev https://*.jam.test:*",
    ].join("; ");

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [csp],
      },
    });
  });

  // Set up screen capture source selection
  session.defaultSession.setDisplayMediaRequestHandler(
    (request, callback) => {
      desktopCapturer
        .getSources({ types: ["screen", "window"] })
        .then((sources) => {
          console.log(
            "Available sources:",
            sources.map((s) => ({ id: s.id, name: s.name })),
          );

          // Get recorder window title for filtering
          const recorderTitle = recorderWindow?.getTitle();
          console.log("Recorder window title:", recorderTitle);

          // Filter out the recorder window and DevTools to prevent recursive capture
          const validSources = sources.filter((source) => {
            // Filter out DevTools windows
            if (source.name.includes("DevTools")) {
              return false;
            }

            // Filter out the recorder window by title
            if (recorderTitle && source.name === recorderTitle) {
              console.log(
                "Filtering out recorder window:",
                source.name,
                source.id,
              );
              return false;
            }

            return true;
          });

          console.log(
            "Valid sources after filtering:",
            validSources.map((s) => ({ id: s.id, name: s.name })),
          );

          // Selection strategy (preference to app windows):
          // 1. First app window (type === 'window', excluding recorder)
          // 2. First screen
          // 3. Any first valid source

          const appWindow = validSources.find((s) =>
            s.id.startsWith("window:"),
          );
          const screen = validSources.find((s) => s.id.startsWith("screen:"));
          const selectedSource = appWindow || screen || validSources[0];

          if (selectedSource) {
            console.log("Selected source:", selectedSource.name);
            callback({ video: selectedSource, audio: "loopback" });
          } else {
            console.error("No valid sources available for capture");
            callback({});
          }
        })
        .catch((error) => {
          console.error("Error getting desktop sources:", error);
          callback({});
        });
    },
    // Use macOS system picker UI. Set to false to use programmatic auto-selection only.
    { useSystemPicker: true },
  );

  setupProtocol();
  setupMenu();
  createWindow();

  // macOS: Check if app was launched with a protocol URL
  if (process.platform === "darwin") {
    const argv = process.argv;
    const protocolUrl = argv.find((arg) =>
      arg.startsWith(`${PROTOCOL_SCHEME}://`),
    );
    if (protocolUrl) {
      handleDeepLink(protocolUrl);
    }
  }

  // Windows/Linux: Check command line args
  if (process.platform === "win32" || process.platform === "linux") {
    const protocolUrl = process.argv.find((arg) =>
      arg.startsWith(`${PROTOCOL_SCHEME}://`),
    );
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
