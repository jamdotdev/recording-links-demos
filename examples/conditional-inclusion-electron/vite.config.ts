import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    electron([
      {
        // Main process entry point
        entry: "src/main.ts",
        vite: {
          build: {
            outDir: "dist",
            rollupOptions: {
              external: ["electron"],
            },
          },
        },
      },
      {
        // Preload script entry point
        entry: "src/preload.ts",
        vite: {
          build: {
            outDir: "dist",
            rollupOptions: {
              external: ["electron"],
            },
          },
        },
        onstart(options) {
          // Notify the Electron App to reload the page
          options.reload();
        },
      },
    ]),
  ],
  build: {
    outDir: "dist",
  },
});
