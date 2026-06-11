# HTML

A plain static page that installs Jam Recording Links with three lines in the
`<head>`. Use this when your site is hand-written HTML or any framework where
you control the document head directly.

This example matches the **HTML** snippet in the Jam dashboard under
**Settings → Jam SDK → Connect Domain**.

## What it demonstrates

- The `<meta name="jam:team">` tag that ties the page to your Jam workspace.
- The `recorder.js` and `capture.js` module scripts that load the recorder and
  capture console logs, network requests, and device info.
- Buttons that log to the console, throw an error, and make a network request,
  so you can confirm those show up in the resulting Jam.

## Set your team ID

Open `index.html` and replace `JAM_TEAM_ID` in the `jam:team` meta tag with your
own team ID. Find it in the Jam dashboard under
**Settings → Jam SDK → Connect Domain** (the snippet there has your ID filled
in already).

## Run it

```bash
bun install        # from the repo root, once
bun run dev --filter example-html
```

The dev server prints a local URL (port 5180).

## Validate end to end

1. In the Jam dashboard, open **Settings → Jam SDK → Connect Domain**, paste your
   local URL, and click **Verify**. The domain shows as Installed.
2. Go to **Recording Links**, create a link pointing at the connected domain,
   and open it.
3. Record a short session, clicking the three buttons on the page.
4. Open the resulting Jam. The console logs, the thrown error, and the network
   request all appear in the DevTools panel.

## Docs

[Connect your domain](https://jam.dev/docs/custom-recording-domain)
