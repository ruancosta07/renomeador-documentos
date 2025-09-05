import { contextBridge, webUtils } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

// Custom APIs for renderer
const api = {};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", {
      ...electronAPI,
      showFilePath(file: File) {
        // It's best not to expose the full file path to the web content if
        // possible.
        const path = webUtils.getPathForFile(file);
        return path as string;
        // const path = webUtils.getPathForFile(file);
        // electronAPI.ipcRenderer.send("get-file-path", path)
      },
    });
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = {
    ...electronAPI,
    showFilePath(file: File): string {
      // It's best not to expose the full file path to the web content if
      // possible.
      const path = webUtils.getPathForFile(file);
      return path as string;
    },
  };
  // @ts-ignore (define in dts)
  window.api = api;
}
