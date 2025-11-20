import { BrowserWindow } from "electron";
import isDev from "electron-is-dev";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEB_DIST_DIR = path.join(__dirname, "..", "web-dist");

// TODO - factory function? allow us to override things like preload (or add preloads)
export function createWindow(
  options?: Electron.BrowserWindowConstructorOptions,
) {
  return new BrowserWindow({
    ...options,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      ...options?.webPreferences,
    },
  });
}

export function loadContents(
  win: BrowserWindow,
  urlOptions: { path?: string; search?: string; hash?: string } = {},
) {
  const { path: basePath = "/", search = "", hash = "" } = urlOptions;

  if (isDev) {
    win.loadURL(`http://localhost:5173${basePath}${search}${hash}`);
  } else {
    // check WEB_DIRST_DIR for matching filename: (1) no extension; (2) .html; (3) .htm; (4) / (index.html)
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
