import {
  app,
  BrowserWindow,
  desktopCapturer,
  type DesktopCapturerSource,
  type DisplayMediaRequestHandlerHandlerRequest,
  session,
  type Session,
  webContents,
  type WebFrameMain,
} from "electron";

type DisplayMediaRequestHandler = (
  request: DisplayMediaRequestHandlerHandlerRequest,
  callback: DisplayMediaRequestHandlerCallback,
) => void | Promise<void>;

type DisplayMediaRequestHandlerCallback = (streams: {
  video?: WebFrameMain | { id: string; name: string } | undefined;
  audio?: "loopback" | "loopbackWithMute" | WebFrameMain | undefined;
  enableLocalEcho?: boolean | undefined;
}) => void | Promise<void>;

const STATE: {
  defaultSession: Session | null;
  windows: Map<Session, BrowserWindow>;
  openRecorderWindow(ses: Session): BrowserWindow;
  loadRecorderPage(win: BrowserWindow, data: IJamData): Promise<void>;
} = {
  defaultSession: null,
  windows: new Map<Session, BrowserWindow>(),
  openRecorderWindow() {
    throw new Error("Not initialized");
  },
  loadRecorderPage() {
    throw new Error("Not initialized");
  },
};

const DEFAULT_DISPLAY_MEDIA_REQUEST_HANDLER = (
  request: DisplayMediaRequestHandlerHandlerRequest,
  callback: DisplayMediaRequestHandlerCallback,
) => {
  const frame = request.frame;
  const contents = frame ? webContents.fromFrame(frame) : null;
  const win = contents ? BrowserWindow.fromWebContents(contents) : null;

  if (isJamRecorder(win)) {
    desktopCapturer
      .getSources({ types: ["screen", "window"] })
      .then((sources) => handleDisplayMediaRequest(sources, callback, win))
      .catch((error) => {
        console.error("Error getting desktop sources:", error);
        callback({});
      });
  }
};

/**
 * Initialize the Jam SDK for Electron.
 *
 * @example Basic setup
 * ```typescript
 * import { app, BrowserWindow } from 'electron';
 * import * as jam from '@jam.dev/recording-links/electron';
 *
 * jam.initialize({
 *   openRecorderWindow(session) {
 *     return new BrowserWindow({
 *       width: 1000,
 *       height: 700,
 *       webPreferences: {
 *         allowRunningInsecureContent: true,
 *         nodeIntegration: false,
 *         contextIsolation: true,
 *         sandbox: true,
 *       },
 *     });
 *   },
 *   async loadRecorderPage(win, data) {
 *     await win.loadURL(`https://my-app.com${data.searchParams.toString()}`);
 *   },
 * });
 * ```
 *
 * @example Multi-session app with custom display media handler
 * ```typescript
 * import { session, desktopCapturer, BrowserWindow } from 'electron';
 * import * as jam from '@jam.dev/recording-links/electron';
 *
 * jam.initialize({
 *   defaultDisplayMediaRequestHandler: null, // Use custom handler per session
 *   openRecorderWindow(ses) {
 *     const win = new BrowserWindow({
 *       width: 1000,
 *       height: 700,
 *       webPreferences: {
 *         allowRunningInsecureContent: true,
 *         nodeIntegration: false,
 *         contextIsolation: true,
 *         sandbox: true,
 *       },
 *     });
 *     win.on('closed', () => console.log('Recorder closed'));
 *     return win;
 *   },
 *   async loadRecorderPage(win, data) {
 *     const recordingId = data.searchParams.get('jam-recording');
 *     await win.loadURL(`https://my-app.com/recorder?id=${recordingId}`);
 *   },
 * });
 *
 * // Install handler on a specific session
 * const mySession = session.fromPartition('persist:my-session');
 * mySession.setDisplayMediaRequestHandler(async (request, callback) => {
 *   const frame = request.frame;
 *   const win = frame ? BrowserWindow.fromWebContents(frame.webContents) : null;
 *
 *   if (jam.isJamRecorder(win)) {
 *     const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] });
 *     jam.handleDisplayMediaRequest(sources, callback, win);
 *   } else {
 *     // Your app's default behavior
 *     callback({});
 *   }
 * });
 * ```
 */
export async function initialize(config: {
  /**
   * The session upon which we will install Jam's display media request handler.
   * If your app uses multiple sessions, please install a handler on each session
   * for which Jam is installed; then in your handler, call
   * `jam.handleDisplayMediaRequest(request, callback)`.
   *
   * @default session.defaultSession
   */
  defaultSession?: Session | undefined;
  /**
   * Jam.js for Electron requires setting a display media request handler,
   * which defines the app's implementation for
   * `navigator.mediaDevices.getDisplayMedia(...)` calls.
   *
   * By default, we use:
   *
   * ```
   * defaultSession.setDisplayMediaRequestHandler(
   *   (request, callback) => {
   *     if (request.frame.url === "https://jam.dev") {
   *       jam.handleDisplayMediaRequest(sources, callback);
   *     }
   *   }),
   *   { useSystemPicker: true },
   * );
   * ```
   *
   * If your app manages multiple sessions, or sets its own display media
   * request handler on the session, set this to `null` and either:
   *
   * - Select the default `source` and call the `callback` yourself; or
   * - Call `jam.handleDisplayMediaRequest(sources, callback)` in your handler
   *   when the request originates from a Jam-originating frame
   */
  defaultDisplayMediaRequestHandler?: DisplayMediaRequestHandler | null;
  /**
   * A function that takes one argument (a `Session` object) and opens a
   * BrowserWindow we will use for recording.
   *
   * The window will be cached for reuse; when calling `loadRecorder`, Jam will
   * only call this function if a previously-opened Recorder window for this
   * session has been closed.
   */
  openRecorderWindow(ses: Session): BrowserWindow;
  /**
   * A function that takes two arguments—a `BrowserWindow` (opened by
   * `openRecorderWindow`) and an `IJamData` object used to route the window
   * to the proper recorder configuration.
   */
  loadRecorderPage(win: BrowserWindow, data: IJamData): Promise<void>;
}): Promise<void> {
  if (!app.isReady()) {
    return app.whenReady().then(() => initialize(config));
  }

  const {
    defaultSession = session.defaultSession,
    defaultDisplayMediaRequestHandler = DEFAULT_DISPLAY_MEDIA_REQUEST_HANDLER,
  } = config;

  STATE.defaultSession = defaultSession;
  STATE.openRecorderWindow = config.openRecorderWindow;
  STATE.loadRecorderPage = config.loadRecorderPage;

  // Set up screen capture source selection
  if (defaultDisplayMediaRequestHandler) {
    defaultSession.setDisplayMediaRequestHandler(
      defaultDisplayMediaRequestHandler,
      // Use macOS system picker UI. Set to false to use programmatic auto-selection only.
      { useSystemPicker: true },
    );
  }
}

/**
 * Opens a Jam recorder window for the given recording ID or data.
 *
 * @param init - Recording ID string, data object, or URLSearchParams
 * @param ses - Optional session (defaults to defaultSession from initialize)
 * @returns The recorder BrowserWindow
 *
 * @example
 * ```typescript
 * import * as jam from '@jam.dev/recording-links/electron';
 *
 * // Open by recording ID
 * jam.openRecorder('abc123');
 *
 * // Open with title
 * jam.openRecorder({ recordingId: 'abc123', title: 'Bug Report' });
 *
 * // Open with URLSearchParams (from protocol handler)
 * const params = new URLSearchParams('jam-recording=abc123&jam-title=Bug+Report');
 * jam.openRecorder(params);
 * ```
 */
export function openRecorder(
  init: string | JamData | ConstructorParameters<typeof JamData>[0],
  ses?: Session,
) {
  const browserSession = ses ?? STATE.defaultSession;
  if (browserSession === null) {
    throw new Error("Cannot open recorder: no `session` found or provided");
  }

  let win = STATE.windows.get(browserSession);
  if (!win) {
    win = STATE.openRecorderWindow(browserSession);

    STATE.windows.set(browserSession, win);
    win.on("close", () => STATE.windows.delete(browserSession));
  }

  const data =
    typeof init === "string"
      ? new JamData({ recordingId: init })
      : init instanceof JamData
        ? init
        : new JamData(init);

  STATE.loadRecorderPage(win, data);

  if (win.isMinimized()) {
    win.restore();
  }

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

  for (const [key, value] of parsed.searchParams.entries()) {
    if (key.startsWith("jam-")) {
      jamParams.set(key, value);
      parsed.searchParams.delete(key);
    }
  }

  return [
    parsed.href,
    jamParams.has("jam-recording")
      ? openRecorder(new JamData(jamParams))
      : null,
  ];
}

/**
 * Data structure representing Jam recording parameters.
 */
export interface IJamData {
  /** Jam recording ID */
  readonly recordingId: string;
  /** Optional recording title */
  readonly title: string | undefined | null;
  /** URLSearchParams containing jam-* query parameters */
  readonly searchParams: URLSearchParams;
  /** Query string with leading '?' (or empty string if no params) */
  readonly search: string;
}

class JamData implements IJamData {
  readonly recordingId: string;
  readonly title: string | undefined | null;

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

export function isJamRecorder(win: BrowserWindow | null) {
  for (const recorderWindow of STATE.windows.values()) {
    if (recorderWindow === win) {
      return true;
    }
  }

  return false;
}

export function handleDisplayMediaRequest(
  sources: DesktopCapturerSource[],
  callback: DisplayMediaRequestHandlerCallback,
  requester?: BrowserWindow | null,
) {
  // Filter out the requester window and DevTools to prevent recursive capture
  const requesterId = requester?.getMediaSourceId();
  const validSources = sources.filter((source) => {
    // Filter out DevTools windows
    if (source.name.includes("DevTools")) {
      return false;
    }

    // Filter out the requester window
    if (source.id === requesterId) {
      return false;
    }

    return true;
  });

  // CSUP-822 (& CSUP-821): Implement a handshake with the requester frame,
  // where we send `DesktopCapturerSource` data over IPC; display a selection
  // UI in the frame; and communicate the selected source ID over IPC in order
  // to call the callback.

  // For now, we select a window by default with the following preference:
  //
  // 1. First app window (type === 'window', excluding recorder)
  // 2. First screen
  // 3. Any first valid source

  const appWindow = validSources.find((s) => s.id.startsWith("window:"));
  const screen = validSources.find((s) => s.id.startsWith("screen:"));
  const selectedSource = appWindow || screen || validSources[0];

  if (selectedSource) {
    callback({ video: selectedSource, audio: "loopback" });
  } else {
    callback({});
  }
}
