import {
  app,
  BrowserWindow,
  desktopCapturer,
  session,
  type Session,
} from "electron";

let recorderWindow: BrowserWindow | null = null;

const STATE: {
  openRecorder: (data: JamData) => BrowserWindow;
} = {
  openRecorder() {
    throw new Error("Not initialized");
  },
};

export async function initialize(config: {
  ses?: Session;
  openRecorder: (data: JamData) => BrowserWindow;
}): Promise<void> {
  if (!app.isReady()) {
    return app.whenReady().then(() => initialize(config));
  }

  const { ses = session.defaultSession } = config;

  STATE.openRecorder = config.openRecorder;

  // TODO - add our CSP values (jam.dev, + in one case unsafe-inline, see below)
  //        to received headers, merging with existing CSP if present
  // Set up CSP to allow Jam recording scripts in sandboxed windows
  // NOTE: Session-based CSP is required because Electron's sandbox mode
  // ignores meta tag CSP. This must be set via onHeadersReceived.
  //
  // TODO - probably queue this registration with a `setTimeout`,
  // so their handlers take precedence
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

export function openRecorder(init: string | JamData) {
  const data =
    typeof init === "string" ? new JamData({ recordingId: init }) : init;

  const win = STATE.openRecorder(data);

  win.focus();

  return win;
}

/**
 * Syntactic sugar for opening the recorder from a URL.
 * Returns a tuple of the un-jammed URL and the recorder window, if opened.
 */
export function openUrl(url: string | URL): [string, BrowserWindow | null] {
  const parsed = typeof url === "string" ? new URL(url) : url;
  const jamParams = new URLSearchParams();

  for (const key in parsed.searchParams) {
    if (key.startsWith("jam-")) {
      // @ts-expect-error - we know the `get` will not be null
      jamParams.set(key, parsed.searchParams.get(key));
      parsed.searchParams.delete(key);
    }
  }

  return [
    parsed.href,
    jamParams.has("recordingId") ? openRecorder(new JamData(jamParams)) : null,
  ];
}

class JamData {
  private recordingId: string;
  private title: string | null;

  get searchParams(): URLSearchParams {
    const params = new URLSearchParams();
    params.set("jam-recording", this.recordingId);
    if (this.title) {
      params.set("jam-title", this.title);
    }
    return params;
  }

  get search(): string {
    const search = this.searchParams.toString();
    return search ? `?${search}` : "";
  }

  constructor(
    init: URLSearchParams | { recordingId: string; title?: string | null },
  ) {
    if (init instanceof URLSearchParams) {
      const recordingId = init.get("jam-recording");
      if (!recordingId) {
        throw new Error("Missing jam-recording parameter");
      }

      this.recordingId = recordingId;
      this.title = init.get("jam-title");
    } else {
      this.recordingId = init.recordingId;
      this.title = init.title || null;
    }
  }
}
