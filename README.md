# Jam Recording Links Demo

This repo is a collection of examples of how to get started with Jam's Recording
Links.

## Development

To run the demo apps locally, you can use the following commands:

```bash
bun install # install all deps
bun run dev # start all example apps
```

This will start local development servers for all example apps; you can then
open them in your browser at the URLs reported in your terminal.

You can also build and start the example apps in production mode with:

```bash
bun run build # build all example apps
bun run start # start all example apps
```

To run a specific example app, you can `cd` into its directory, or use:

```bash
bun run dev --filter <example-name>
```
