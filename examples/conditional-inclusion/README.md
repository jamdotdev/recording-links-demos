# Conditional inclusion

A Vite + TypeScript app that installs Jam Recording Links with the
`@jam.dev/recording-links` npm package and loads the recorder only on demand.
Use this as a reference when you want fine-grained control over when the
recorder and capture scripts run, rather than loading them on every page.

This example goes beyond the dashboard snippets. It shows the SDK's lower-level
API for teams that need conditional loading.

## What it demonstrates

- Calling `jam.initialize()` with default options.
- Listening for the SDK's `loaded` event to react when each script is ready.
- Loading the recorder on a button click with `jam.loadRecorder()`, then opening
  a recording by ID with `jam.Recorder.open(recordingId)`.
- Multiple `jam:team` meta tags, so one page can serve more than one workspace.
- The `jam:blur` meta tag, which blurs matching elements during recording.

## Set your team ID

Open `index.html` and replace the `jam:team` meta tag content with your own team
ID from **Settings → Jam SDK → Connect Domain**. Keep one tag per workspace if
you serve several.

## Run it

```bash
bun install        # from the repo root, once
bun run dev --filter example-conditional-inclusion
```

## Docs

[Connect your domain](https://jam.dev/docs/custom-recording-domain)
