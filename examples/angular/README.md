# Angular

An Angular app that installs Jam Recording Links with the
`@jam.dev/recording-links` npm package, initialized once from the root
component. Use this when you'd rather install Jam as a dependency than add
script tags to your HTML.

This example matches the **Angular** snippet in the Jam dashboard under
**Settings → Jam SDK → Connect Domain**.

## What it demonstrates

- Installing `@jam.dev/recording-links` and calling `jam.initialize({ teamId })`
  once in `ngOnInit`.
- Wrapping the call in `ngZone.runOutsideAngular` so the SDK's listeners don't
  trigger Angular change detection.
- The `data-jam-blur` attribute, which blurs an element during recording.
- Buttons that log to the console, throw an error, and make a network request.

Unlike the script-tag examples, the SDK loads the recorder lazily. The recorder
and capture scripts download only when someone opens the page through a
Recording Link, so `window.jam` won't exist on a normal page view.

## Set your team ID

Open `src/app/app.component.ts` and replace `JAM_TEAM_ID` in the
`jam.initialize` call with your own team ID from
**Settings → Jam SDK → Connect Domain**.

## Run it

```bash
bun install        # from the repo root, once
bun run dev --filter example-angular
```

The app runs on port 4200.

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
