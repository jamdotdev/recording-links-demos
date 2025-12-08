import { defineConfig } from "vite";
import electron from "vite-plugin-electron";

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
    ]),
  ],
});
