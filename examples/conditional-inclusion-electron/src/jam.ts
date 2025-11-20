import {
  app,
  BrowserWindow,
  desktopCapturer,
  session,
  type Session,
} from "electron";

let recorderWindow: BrowserWindow | null = null;

type JamData = {
  recordingId: string;
  title?: string;
  // TODO - others?
};

const DEFAULT_PARSE_JAM_DATA = (url: string | URL) => {
  const urlObj = typeof url === "string" ? new URL(url) : url;
  const recordingId = urlObj.searchParams.get("jam-recording");

  if (!recordingId) {
    return null;
  }

  return {
    recordingId,
    title: urlObj.searchParams.get("jam-title") || "",
    // TODO - others? automatic `jam-` parsing?
  };
};

const DEFAULT_APPLY_JAM_DATA = (
  baseURL: string | URL,
  data: JamData | null,
) => {
  const urlObj = typeof baseURL === "string" ? new URL(baseURL) : baseURL;

  if (!data) {
    for (const key in urlObj.searchParams) {
      if (key.startsWith("jam-")) {
        urlObj.searchParams.delete(key);
      }
    }
  } else {
    urlObj.searchParams.set("jam-recording", data.recordingId);
    if (data.title) {
      urlObj.searchParams.set("jam-title", data.title);
    }
    // TODO - others?
  }

  return urlObj.href;
};

const STATE: {
  parseJamData: (url: string | URL) => JamData | null;
  applyJamData: (baseURL: string | URL, data: JamData | null) => string;
  openRecorder: (data: JamData) => BrowserWindow;
} = {
  parseJamData: DEFAULT_PARSE_JAM_DATA,
  applyJamData: DEFAULT_APPLY_JAM_DATA,
  openRecorder() {
    throw new Error("Not initialized");
  },
};

/** Parses Jam data from a given URL using the configured parser. (see #initialize) */
export function parseJamData(url: string | URL): JamData | null {
  return STATE.parseJamData(url);
}

/** Applies Jam data to a base URL using the configured applier. (see #initialize) */
export function applyJamData(
  baseURL: string | URL,
  data: JamData | null,
): string {
  return STATE.applyJamData(baseURL, data);
}

export async function initialize(config: {
  ses?: Session;
  openRecorder: (data: JamData) => BrowserWindow;
  parseJamData?: (url: string | URL) => JamData | null;
  applyJamData?: (baseURL: string | URL, data: JamData | null) => string;
}): Promise<void> {
  if (!app.isReady()) {
    return app.whenReady().then(() => initialize(config));
  }

  const { ses = session.defaultSession, parseJamData, applyJamData } = config;

  if (parseJamData) {
    STATE.parseJamData = parseJamData;
  }

  if (applyJamData) {
    STATE.applyJamData = applyJamData;
  }

  STATE.openRecorder = config.openRecorder;

  // TODO - add our CSP values (jam.dev, + in one case unsafe-inline, see below)
  //        to received headers, merging with existing CSP if present
  // Set up CSP to allow Jam recording scripts in sandboxed windows
  // NOTE: Session-based CSP is required because Electron's sandbox mode
  // ignores meta tag CSP. This must be set via onHeadersReceived.
  //
  // CSP Directives explained:
  // - script-src: 'unsafe-inline' and 'unsafe-eval' required for Jam SDK dynamic imports
  // - *.jam.dev and *.jam.test:* wildcards allow staging/testing environments
  ses.webRequest.onHeadersReceived((details, callback) => {
    const csp = [
      "default-src 'self' http://localhost:* https://localhost:*",
      "script-src 'self' http://localhost:* https://localhost:* https://*.jam.dev https://*.jam.test:*",
      "connect-src 'self' http://localhost:* https://localhost:* https://*.jam.dev https://*.jam.test:*",
      // CSUP-814: Migrate from CSS-in-JS to rm `unsafe-inline` style-src dependency
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
  ses.setDisplayMediaRequestHandler(
    (_request, callback) => {
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
}

export function openRecorder(idOrData: string | JamData) {
  const data =
    typeof idOrData === "string" ? { recordingId: idOrData } : idOrData;

  const win = STATE.openRecorder(data);

  win.focus();

  return win;
}
