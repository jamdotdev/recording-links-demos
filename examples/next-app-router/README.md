# Next.js (App Router)

A minimal Next.js App Router app that installs Jam Recording Links through the
`next/script` component in the root layout. Use this when your app uses the
`app/` directory.

This example matches the **Next.js → App Router** snippet in the Jam dashboard
under **Settings → Jam SDK → Connect Domain**.

## What it demonstrates

- The `jam:team` meta tag in the root layout `<head>`.
- Two `next/script` tags with `strategy="beforeInteractive"`, so the recorder
  and capture scripts load before the page becomes interactive.
- Buttons that log to the console, throw an error, and make a network request.

The scripts belong in the **root** `app/layout.tsx`, not a nested route layout.
`beforeInteractive` is only honored from the root layout.

## Set your team ID

Open `app/layout.tsx` and replace `JAM_TEAM_ID` in the `jam:team` meta tag with
your own team ID from **Settings → Jam SDK → Connect Domain**.

## Run it

```bash
bun install        # from the repo root, once
bun run dev --filter example-next-app-router
```

The app runs on port 3001.

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
