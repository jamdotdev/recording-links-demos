# Next.js (Pages Router)

A minimal Next.js Pages Router app that installs Jam Recording Links through the
`next/script` component in `pages/_document.tsx`. Use this when your app uses the
`pages/` directory.

This example matches the **Next.js → Page Router** snippet in the Jam dashboard
under **Settings → Jam SDK → Connect Domain**.

## What it demonstrates

- The `jam:team` meta tag in the custom `Document` head.
- Two `next/script` tags with `strategy="beforeInteractive"`, which Next renders
  as deferred module scripts in the document body.
- Buttons that log to the console, throw an error, and make a network request.

The scripts belong in `pages/_document.tsx`, which renders once for every page.

## Set your team ID

Open `pages/_document.tsx` and replace `JAM_TEAM_ID` in the `jam:team` meta tag
with your own team ID from **Settings → Jam SDK → Connect Domain**.

## Run it

```bash
bun install        # from the repo root, once
bun run dev --filter example-next-pages-router
```

The app runs on port 3002.

## Validate end to end

1. In the Jam dashboard, open **Settings → Jam SDK → Connect Domain**, paste
   your local URL, and click **Verify**. The domain shows as Installed.
2. Go to **Recording Links**, create a link pointing at the connected domain,
   and open it.
3. Record a short session, clicking the three buttons on the page.
4. Open the resulting Jam. The console logs, the thrown error, and the network
   request all appear in the DevTools panel.

## Docs

[Connect your domain](https://jam.dev/docs/custom-recording-domain)
