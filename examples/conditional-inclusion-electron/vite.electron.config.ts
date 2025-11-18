import { defineConfig } from "vite";
import { resolve } from "path";
import { builtinModules } from "module";

export default defineConfig({
  build: {
    outDir: "dist",
    lib: {
      entry: {
        main: resolve(__dirname, "src/main.ts"),
        preload: resolve(__dirname, "src/preload.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "electron",
        "electron-is-dev",
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
      ],
      output: {
        entryFileNames: "[name].js",
      },
    },
    minify: false,
    target: "node18",
    emptyOutDir: false,
  },
});
