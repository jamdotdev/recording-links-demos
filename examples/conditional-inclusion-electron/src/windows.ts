import { BrowserWindow, screen } from "electron";
import isDev from "electron-is-dev";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

type NamedWindow = "recorder" | "main" | string;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Window dimension constants
const MAIN_WINDOW_DIMS = { width: 1200, height: 800 };
const RECORDER_WINDOW_DIMS = { width: 1000, height: 700 };

// Where the built web files are located
const WEB_DIST_DIR = path.join(__dirname, "..", "web-dist");

// Local dict of named BrowserWindows
const windows = new Map<NamedWindow, BrowserWindow>();

export function findWindow(name: NamedWindow) {
  return windows.get(name);
}

export function findOrCreateWindow(name: NamedWindow): BrowserWindow {
  return findWindow(name) ?? createNamedWindow(name);
}

export function createNamedWindow(name: NamedWindow): BrowserWindow {
  if (windows.has(name)) {
    throw new Error(`Window with name "${name}" already exists.`);
  }

  let created: BrowserWindow;
  switch (name) {
    case "recorder": {
      const mainWindow = findOrCreateWindow("main");
      const mainBounds = mainWindow.getBounds();
      const position = {
        ...RECORDER_WINDOW_DIMS,
        x: mainBounds.x + mainBounds.width + 10 - RECORDER_WINDOW_DIMS.width,
        y: mainBounds.y - 10,
      };

      created = createWindow(position);
      break;
    }
    case "main": {
      created = createWindow(getCenteredRect(MAIN_WINDOW_DIMS));
      break;
    }
    default:
      throw new Error(`Unknown window name: ${name}`);
  }

  created.on("closed", () => windows.delete(name));
  windows.set(name, created);

  return created;
}

export function loadContents(
  win: BrowserWindow,
  urlOptions: { path?: string; search?: string; hash?: string } = {},
) {
  const { path: basePath = "/", search = "", hash = "" } = urlOptions;

  if (isDev) {
    win.loadURL(`http://localhost:5173${basePath}${search}${hash}`);
  } else {
    // check WEB_DIST_DIR for matching filename: (1) no extension; (2) .html; (3) .htm; (4) / (index.html)
    let filePath: string | undefined = undefined;

    for (const ext of ["", ".html", ".htm"]) {
      const fullPath = path.join(WEB_DIST_DIR, `${basePath}${ext}`);
      if (fs.existsSync(fullPath)) {
        filePath = fullPath;
        break;
      }
    }

    if (!filePath) {
      const indexPath = path.join(WEB_DIST_DIR, basePath, "index.html");
      if (fs.existsSync(indexPath)) {
        filePath = indexPath;
      } else {
        throw new Error(`File not found for path: ${basePath}`);
      }
    }

    win.loadFile(filePath, { search, hash });
  }
}

function createWindow(options?: Electron.BrowserWindowConstructorOptions) {
  return new BrowserWindow({
    ...options,
    webPreferences: {
      // TODO - DOCUMENT -- MUST BE TRUE FOR JAM!!
      // (or otherwise set CSP to allow `unsafe-inline` for style-src, +
      // `*.jam.dev* for script-, connect-, img-, font-, frame-, style-, media-src)
      // allowRunningInsecureContent: true,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      ...options?.webPreferences,
    },
  });
}

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
function getCenteredRect({
  width,
  height,
  offsetX = 0,
  offsetY = 0,
}: {
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
}) {
  const displayBounds = getActiveDisplayBounds();
  return {
    width,
    height,
    x: Math.floor(
      displayBounds.x + (displayBounds.width - width) / 2 + offsetX,
    ),
    y: Math.floor(
      displayBounds.y + (displayBounds.height - height) / 2 + offsetY,
    ),
  };
}
