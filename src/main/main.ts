import { app, BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";
import { StorageManager } from "./storage/StorageManager";
import { initializeIpcHandlers } from "./ipc/handlers";
import { MenuBuilder } from "./menu/menuBuilder";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let storageManager: StorageManager | null = null;
let menuBuilder: MenuBuilder | null = null;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 15, y: 15 },
    title: "SQLTemple",
    fullscreenable: true,
  });

  console.log("Loading URL:", MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    menuBuilder = null;
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("Failed to load:", errorCode, errorDescription);
    }
  );

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Page loaded successfully");
  });
};

const configureAutoUpdater = async () => {
  if (!app.isPackaged) {
    return;
  }

  autoUpdater.setFeedURL({
    provider: "github",
    owner: "victorbona",
    repo: "sqltemple",
  });

  const autoUpdateEnabled =
    await storageManager?.getSetting("autoUpdateEnabled");

  if (autoUpdateEnabled === "true") {
    autoUpdater.checkForUpdatesAndNotify();

    setInterval(
      () => {
        autoUpdater.checkForUpdatesAndNotify();
      },
      24 * 60 * 60 * 1000
    );
  }
  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for update...");
  });

  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info);
  });

  autoUpdater.on("update-not-available", (info) => {
    console.log("Update not available:", info);
  });

  autoUpdater.on("error", (err) => {
    console.log("Error in auto-updater:", err);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + " - Downloaded " + progressObj.percent + "%";
    log_message =
      log_message +
      " (" +
      progressObj.transferred +
      "/" +
      progressObj.total +
      ")";
    console.log(log_message);
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("Update downloaded:", info);
    autoUpdater.quitAndInstall();
  });
};

app.on("ready", async () => {
  storageManager = new StorageManager();
  await initializeIpcHandlers(storageManager);

  createWindow();
  await configureAutoUpdater();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (storageManager) {
      storageManager.close();
    }
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
