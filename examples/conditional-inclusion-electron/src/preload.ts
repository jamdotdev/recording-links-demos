import { contextBridge, ipcRenderer } from "electron";

// Expose a secure API to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Listen for deep link events from the main process
  onDeepLink: (callback: (url: string) => void) => {
    ipcRenderer.on("deep-link", (_event, url) => callback(url));
  },

  // Notify that we're running in Electron
  isElectron: true,

  // Get platform info
  platform: process.platform,
});

// Log that preload script has loaded
console.log("Preload script loaded");
