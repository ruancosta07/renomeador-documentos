import { app, shell, BrowserWindow, ipcMain, dialog } from "electron";
export let mainWindow: BrowserWindow;
// import "./readFolder";
import "./parsePdfToJpg";
app.commandLine.appendSwitch("--no-sandbox");
app.commandLine.appendSwitch("--disable-setuid-sandbox");

import path, { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
const iconPath = join(__dirname, "../../resources/icon.png");
import * as fs from "fs";
import { autoUpdater } from "electron-updater";
import dotenv from "dotenv";
import fspromises from "fs/promises";
dotenv.config();

import os from "os";
import { queue, worker, closeOcrPool } from "./parsePdfToJpg";
type PendingFolder = {
  folderPath: string;
  files: string[];
  tmpDir: string;
  outputFolder: string;
  length: number;
};
const pendingFolders = new Map<string, PendingFolder>();
let folderRoundRobin: string[] = [];
let rrIndex = 0;

async function scheduleEnqueue(): Promise<void> {
  // Build round-robin keys if empty
  folderRoundRobin = Array.from(pendingFolders.keys());
  if (folderRoundRobin.length === 0) return;
  // Interleave across folders until all pending files are scheduled
  let madeProgress = true;
  while (madeProgress) {
    madeProgress = false;
    for (let i = 0; i < folderRoundRobin.length; i++) {
      const key = folderRoundRobin[rrIndex % folderRoundRobin.length];
      rrIndex++;
      const pf = pendingFolders.get(key);
      if (!pf) continue;
      const file = pf.files.shift();
      if (!file) {
        pendingFolders.delete(key);
        folderRoundRobin = Array.from(pendingFolders.keys());
        if (folderRoundRobin.length === 0) return;
        continue;
      }
      madeProgress = true;
      await queue.add(
        "pdf-to-jpg",
        {
          folderPath: pf.folderPath,
          filePath: file,
          tmpDir: pf.tmpDir,
          length: pf.length,
          outputFolder: pf.outputFolder,
        },
        { removeOnComplete: { count: 5000 }, removeOnFail: { count: 1000 } }
      );
    }
  }
}
function createWindow(): void {
  // Create the browser window.
  app.commandLine.appendSwitch("--no-sandbox");
  mainWindow = new BrowserWindow({
    width: 500,
    height: 500,
    show: false,
    autoHideMenuBar: true,
    icon: iconPath,
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
  // Configure private GitHub token for autoUpdater (if provided)
  if (process.env.GH_TOKEN) {
    // electron-updater expects Authorization: token <token>
    autoUpdater.requestHeaders = {
      Authorization: `token ${process.env.GH_TOKEN}`,
    };
  }
  if (!is.dev) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  autoUpdater.on("update-available", () => {
    ipcMain.emit("update", "Update disponível");
    autoUpdater.downloadUpdate();
  });

  autoUpdater.on("update-downloaded", () => {
    const result = dialog.showMessageBoxSync({
      type: "question",
      buttons: ["Reiniciar", "Mais tarde"],
      defaultId: 0,
      message: "Atualização pronta. Deseja reiniciar agora?",
    });

    if (result === 0) autoUpdater.quitAndInstall();
  });

  app.on("browser-window-created", (_: any, window: any) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.on("start-parse", async (_e, f) => {
    const allFiles = await fspromises.readdir(f.path);
    const pdfFiles = allFiles
      .filter((name) => name.toLowerCase().endsWith(".pdf"))
      .map((name) => path.join(f.path, name));
    const tmpDir = await fspromises.mkdtemp(path.join(os.tmpdir(), "pdf-ocr-"));
    const outputFolder = f.path + " - renomeado";
    await fspromises.mkdir(outputFolder, { recursive: true });
    // reset erros.txt at start of a new folder processing
    try {
      await fspromises.writeFile(path.join(outputFolder, "erros.txt"), "", "utf8");
    } catch {}

    pendingFolders.set(f.path, {
      folderPath: f.path,
      files: pdfFiles,
      tmpDir,
      outputFolder,
      length: pdfFiles.length,
    });
    await scheduleEnqueue();
  });

  // IPC test
  // ipcMain.on("start-parse", async (e, f) => {

  //   const limit = plimit(8);
  //   const files = fs
  //     .readdirSync(path.resolve(f.path))
  //     .filter((f) => f.endsWith(".pdf"));
  //   const tmpDir = await fspromises.mkdtemp(path.join(os.tmpdir(), "pdf-ocr-"))
  //   const outputFolder = f.path + " - renomeado"
  //   await fspromises.mkdir(outputFolder, {recursive:true})
  //   await Promise.all(files.map((fi)=> {
  //     const filePath = path.join(f.path, fi)
  //     return limit(()=> pdfToJpeg({ filePath, tmpDir, outputFolder, length:files.length}))
  //   }))
  //   // for (const file of files) {
  //   //   const filePath = path.join(f.path, file)
  //   //   await pdfToJpeg({ filePath, tmpDir, outputFolder});
  //   // }
  //   const imageFiles = (await fspromises.readdir(tmpDir)).filter((f)=> f.endsWith(".jpg"))

  //   for (const file of imageFiles){
  //     const filePath = path.join(tmpDir, file)
  //     queue.add("extract", {filePath, tmpDir, outputFolder, length:files.length, pdfPath:path.join(f.path)})
  //   }

  //   // extractTextFromPDFsInFolder(
  //   //   path.resolve(f.path),
  //   //   path.resolve(f.path + " - renomeado"),
  //   //   f.quality,
  //   //   mainWindow
  //   // );
  // });
  ipcMain.on("open-folder", async (_e, f) => {
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
    worker.close(true)
    closeOcrPool().catch(() => {});
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
