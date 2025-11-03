import { jest } from "@jest/globals";

export const mockBrowserWindow = {
  loadURL: jest.fn(),
  on: jest.fn(),
  webContents: {
    openDevTools: jest.fn(),
    on: jest.fn(),
    send: jest.fn(),
    executeJavaScript: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    cut: jest.fn(),
    copy: jest.fn(),
    paste: jest.fn(),
    selectAll: jest.fn(),
    reload: jest.fn(),
    toggleDevTools: jest.fn(),
    zoomLevel: 0,
  },
  show: jest.fn(),
  hide: jest.fn(),
  close: jest.fn(),
  minimize: jest.fn(),
  maximize: jest.fn(),
  restore: jest.fn(),
  isMinimized: jest.fn(() => false),
  isMaximized: jest.fn(() => false),
  isFullScreen: jest.fn(() => false),
  setFullScreen: jest.fn(),
  setTitle: jest.fn(),
  getTitle: jest.fn(() => "Test Window"),
};

export const mockApp = {
  getPath: jest.fn((name: string) => {
    switch (name) {
      case "userData":
        return "/tmp/test-userdata";
      case "temp":
        return "/tmp";
      case "home":
        return "/tmp/home";
      default:
        return "/tmp";
    }
  }),
  isPackaged: false,
  on: jest.fn(),
  quit: jest.fn(),
  getName: jest.fn(() => "SQLTemple Test"),
  getVersion: jest.fn(() => "0.0.1-test"),
};

export const mockDialog = {
  showOpenDialog: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      filePaths: ["/tmp/test-file.sql"],
    })
  ),
  showSaveDialog: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      filePath: "/tmp/saved-file.sql",
    })
  ),
  showMessageBox: jest.fn(() =>
    Promise.resolve({
      response: 0,
      checkboxChecked: false,
    })
  ),
  showErrorBox: jest.fn(),
};

export const mockIpcMain = {
  handle: jest.fn(),
  on: jest.fn(),
  removeHandler: jest.fn(),
  removeAllListeners: jest.fn(),
};

export const mockMenu = {
  setApplicationMenu: jest.fn(),
  buildFromTemplate: jest.fn(() => mockMenu),
  popup: jest.fn(),
};

export const BrowserWindow = jest.fn(() => mockBrowserWindow);
export const app = mockApp;
export const dialog = mockDialog;
export const ipcMain = mockIpcMain;
export const Menu = mockMenu;

export const shell = {
  openExternal: jest.fn(),
  showItemInFolder: jest.fn(),
};

export const clipboard = {
  writeText: jest.fn(),
  readText: jest.fn(() => "mocked clipboard text"),
};

export const nativeTheme = {
  shouldUseDarkColors: false,
  on: jest.fn(),
};
