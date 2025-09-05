import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI & { showFilePath: (value: File) => void };
    api: unknown;
  }
}
