# Google Tag Manager

A static page that loads Jam Recording Links through a Google Tag Manager (GTM)
Custom HTML tag instead of inline script tags. Use this when you manage scripts
through GTM rather than editing your site's HTML.

This example matches the **Google Tag Manager** snippet in the Jam dashboard
under **Settings → Jam SDK → Connect Domain**.

## What it demonstrates

- A page whose only Jam-related markup is the standard GTM container bootstrap.
  The Jam snippet is delivered by GTM at runtime, not written into the page.
- Buttons that log to the console, throw an error, and make a network request,
  once the GTM tag has loaded the Jam scripts.

Because the Jam scripts come from GTM, this example needs a real GTM container
to fully run. The page ships with a placeholder container ID (`GTM-XXXXXXX`).

## Set it up

1. Replace `GTM-XXXXXXX` in `index.html` with your own GTM container ID.
2. In your GTM container, create a **Custom HTML** tag and paste the
   **Google Tag Manager** snippet from
   **Settings → Jam SDK → Connect Domain** (it has your team ID filled in).
3. Set the tag to fire on **All Pages**.
4. Publish the container.

The snippet dynamically imports the same `recorder.js` and `capture.js` modules
the other examples load directly, with a guard so it runs once per page and
logs an error if the import fails.

## Run it

```bash
bun install        # from the repo root, once
bun run dev --filter example-gtm
```

The dev server prints a local URL (port 5181).

## Validate end to end

1. With your container published, open **Settings → Jam SDK → Connect Domain**,
   paste your local URL, and click **Verify**. The domain shows as Installed.
2. Go to **Recording Links**, create a link pointing at the connected domain,
   and open it.
3. Record a short session, clicking the three buttons on the page.
4. Open the resulting Jam. The console logs, the thrown error, and the network
   request all appear in the DevTools panel.

## Docs

[Connect your domain](https://jam.dev/docs/custom-recording-domain)
