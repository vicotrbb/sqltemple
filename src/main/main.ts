import { app, BrowserWindow } from "electron";
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

app.on("ready", async () => {
  storageManager = new StorageManager();
  await initializeIpcHandlers(storageManager);

  createWindow();
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
