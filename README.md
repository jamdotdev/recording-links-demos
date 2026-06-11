# Jam Recording Links demos

Runnable examples of how to add [Jam Recording Links](https://jam.dev/docs/custom-recording-domain)
to your site. Each example installs the Jam SDK a different way and mirrors one
of the snippets in the Jam dashboard under **Settings → Jam SDK → Connect Domain**,
so you can copy a working setup straight into your own app.

## Examples

| Example | Install method | Dashboard snippet | Best for |
|---|---|---|---|
| [`html`](examples/html) | `<script>` tags in `<head>` | HTML | Hand-written HTML or any framework where you control the document head |
| [`next-app-router`](examples/next-app-router) | `next/script`, `beforeInteractive` | Next.js → App Router | Next.js apps using the `app/` directory |
| [`next-pages-router`](examples/next-pages-router) | `next/script` in `_document` | Next.js → Page Router | Next.js apps using the `pages/` directory |
| [`angular`](examples/angular) | `@jam.dev/recording-links` npm package | Angular | Installing Jam as a dependency instead of script tags |
| [`gtm`](examples/gtm) | Google Tag Manager Custom HTML tag | Google Tag Manager | Managing scripts through GTM |
| [`conditional-inclusion`](examples/conditional-inclusion) | npm package, recorder loaded on demand | (advanced) | Fine-grained control over when the recorder loads |
| [`conditional-inclusion-electron`](examples/conditional-inclusion-electron) | npm package, Electron wrapper | (advanced) | Forwarding from web to a native Electron app |

Each example's README explains what it demonstrates, how to swap in your own
team ID, how to run it, and how to validate it end to end.

## Get your team ID

Every example needs your Jam team ID. Find it in the dashboard under
**Settings → Jam SDK → Connect Domain**, where the snippet has your ID filled in
already. The examples ship with a `JAM_TEAM_ID` placeholder to replace.

## Run the examples

```bash
bun install   # install all deps
bun run dev   # start every example app
```

This starts a local dev server for each example and prints its URL.

Build and serve in production mode with:

```bash
bun run build
bun run start
```

Run a single example with:

```bash
bun run dev --filter <example-name>   # e.g. example-html
```

## Validate end to end

Once an example is running, connect it to your workspace and confirm captures
work:

1. In the Jam dashboard, open **Settings → Jam SDK → Connect Domain**, paste the
   example's local URL, and click **Verify**. The domain shows as Installed.
2. Go to **Recording Links**, create a link pointing at the connected domain,
   and open it.
3. Record a short session, clicking the buttons on the page.
4. Open the resulting Jam. The console logs, the thrown error, and the network
   request appear in the DevTools panel.
