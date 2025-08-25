import { app, shell, BrowserWindow, ipcMain, dialog, } from "electron";
import path, { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { extractTextFromPDFsInFolder } from "./readFolder";
import * as fs from "fs";
import { autoUpdater } from "electron-updater";
import dotenv from "dotenv";
dotenv.config();
let mainWindow: BrowserWindow;
function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 500,
    height: 500,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      devTools: is.dev ? true : false,
    },
    resizable: true,
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.renomeador-guia");
  if (!is.dev) {
    autoUpdater.checkForUpdates();
    autoUpdater.downloadUpdate();

    autoUpdater.on("update-available", () => {
      console.log("Update disponível");
    });

    autoUpdater.on("update-downloaded", () => {
      autoUpdater.quitAndInstall();
    });
  }
}

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on("start-parse", (e, f) =>{
    extractTextFromPDFsInFolder(
      path.resolve(f.path),
      path.resolve(f.path + " - renomeado"),
      f.quality,
      mainWindow
    )
    }
  );
  ipcMain.on("open-folder", async (e, f) => {
    fs.readdir(f.path, (err) => {
      if (err) {
        mainWindow.webContents.send("error-open-folder", f.id);
      } else {
        shell.openPath(f.path);
      }
    });
  });
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
