import {
  Menu,
  MenuItemConstructorOptions,
  app,
  shell,
  BrowserWindow,
} from "electron";
import { MenuState, getMenuItemEnabled } from "./menuConfig";

export interface MenuAction {
  id: string;
  handler: () => void;
}

export class MenuBuilder {
  private mainWindow: BrowserWindow;
  private actions: Map<string, () => void> = new Map();
  private isDarwin = process.platform === "darwin";
  private menuState: MenuState = {
    isConnected: false,
    hasActiveQuery: false,
    hasSelectedText: false,
    canUndo: false,
    canRedo: false,
  };

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.registerDefaultActions();
  }

  public buildMenu(): Menu {
    const template = this.isDarwin
      ? this.buildDarwinTemplate()
      : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    return menu;
  }

  public registerAction(id: string, handler: () => void): void {
    this.actions.set(id, handler);
  }

  public registerActions(actions: MenuAction[]): void {
    actions.forEach((action) => {
      this.registerAction(action.id, action.handler);
    });
  }

  public updateState(state: Partial<MenuState>): void {
    this.menuState = { ...this.menuState, ...state };
    this.buildMenu();
  }

  private executeAction(actionId: string): void {
    const handler = this.actions.get(actionId);
    if (handler) {
      handler();
    } else {
      console.warn(`No handler registered for action: ${actionId}`);
    }
  }

  private isEnabled(itemId: string): boolean {
    return getMenuItemEnabled(itemId, this.menuState);
  }

  private registerDefaultActions(): void {
    this.registerAction("file:new-tab", () => {
      this.mainWindow.webContents.send("menu:new-tab");
    });

    this.registerAction("file:open-query", () => {
      this.mainWindow.webContents.send("menu:open-query");
    });

    this.registerAction("file:save-query", () => {
      this.mainWindow.webContents.send("menu:save-query");
    });

    this.registerAction("file:save-query-as", () => {
      this.mainWindow.webContents.send("menu:save-query-as");
    });

    this.registerAction("file:preferences", () => {
      this.mainWindow.webContents.send("menu:show-preferences");
    });

    this.registerAction("file:import-connections", () => {
      this.mainWindow.webContents.send("menu:import-connections");
    });

    this.registerAction("file:export-connections", () => {
      this.mainWindow.webContents.send("menu:export-connections");
    });

    this.registerAction("edit:undo", () => {
      this.mainWindow.webContents.undo();
    });

    this.registerAction("edit:redo", () => {
      this.mainWindow.webContents.redo();
    });

    this.registerAction("edit:cut", () => {
      this.mainWindow.webContents.cut();
    });

    this.registerAction("edit:copy", () => {
      this.mainWindow.webContents.copy();
    });

    this.registerAction("edit:paste", () => {
      this.mainWindow.webContents.paste();
    });

    this.registerAction("edit:select-all", () => {
      this.mainWindow.webContents.selectAll();
    });

    this.registerAction("edit:find", () => {
      this.mainWindow.webContents.send("menu:find");
    });

    this.registerAction("edit:replace", () => {
      this.mainWindow.webContents.send("menu:replace");
    });

    this.registerAction("edit:format-query", () => {
      this.mainWindow.webContents.send("menu:format-query");
    });

    this.registerAction("view:toggle-connections", () => {
      this.mainWindow.webContents.send("menu:toggle-connections");
    });

    this.registerAction("view:toggle-schema", () => {
      this.mainWindow.webContents.send("menu:toggle-schema");
    });

    this.registerAction("view:toggle-results", () => {
      this.mainWindow.webContents.send("menu:toggle-results");
    });

    this.registerAction("view:toggle-history", () => {
      this.mainWindow.webContents.send("menu:toggle-history");
    });

    this.registerAction("view:toggle-agent", () => {
      this.mainWindow.webContents.send("menu:toggle-agent");
    });

    this.registerAction("view:zoom-in", () => {
      this.mainWindow.webContents.zoomLevel += 0.5;
    });

    this.registerAction("view:zoom-out", () => {
      this.mainWindow.webContents.zoomLevel -= 0.5;
    });

    this.registerAction("view:reset-zoom", () => {
      this.mainWindow.webContents.zoomLevel = 0;
    });

    this.registerAction("view:toggle-fullscreen", () => {
      this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
    });

    this.registerAction("view:reload", () => {
      this.mainWindow.webContents.reload();
    });

    this.registerAction("view:toggle-devtools", () => {
      this.mainWindow.webContents.toggleDevTools();
    });

    this.registerAction("database:connect", () => {
      this.mainWindow.webContents.send("menu:connect-database");
    });

    this.registerAction("database:disconnect", () => {
      this.mainWindow.webContents.send("menu:disconnect-database");
    });

    this.registerAction("database:refresh-schema", () => {
      this.mainWindow.webContents.send("menu:refresh-schema");
    });

    this.registerAction("database:execute-query", () => {
      this.mainWindow.webContents.send("menu:execute-query");
    });

    this.registerAction("database:execute-selected", () => {
      this.mainWindow.webContents.send("menu:execute-selected");
    });

    this.registerAction("database:explain-query", () => {
      this.mainWindow.webContents.send("menu:explain-query");
    });

    this.registerAction("database:show-topology", () => {
      this.mainWindow.webContents.send("menu:show-topology");
    });

    this.registerAction("ai:create-query", () => {
      this.mainWindow.webContents.send("menu:ai-create-query");
    });

    this.registerAction("ai:explain-query", () => {
      this.mainWindow.webContents.send("menu:ai-explain-query");
    });

    this.registerAction("ai:optimize-query", () => {
      this.mainWindow.webContents.send("menu:ai-optimize-query");
    });

    this.registerAction("ai:settings", () => {
      this.mainWindow.webContents.send("menu:ai-settings");
    });

    this.registerAction("window:minimize", () => {
      this.mainWindow.minimize();
    });

    this.registerAction("window:close-tab", () => {
      this.mainWindow.webContents.send("menu:close-tab");
    });

    this.registerAction("window:next-tab", () => {
      this.mainWindow.webContents.send("menu:next-tab");
    });

    this.registerAction("window:previous-tab", () => {
      this.mainWindow.webContents.send("menu:previous-tab");
    });

    this.registerAction("help:documentation", () => {
      shell.openExternal("https://github.com/vicotrbb/sqltemple/wiki");
    });

    this.registerAction("help:keyboard-shortcuts", () => {
      this.mainWindow.webContents.send("menu:show-keyboard-shortcuts");
    });

    this.registerAction("help:report-issue", () => {
      shell.openExternal("https://github.com/vicotrbb/sqltemple/issues/new");
    });

    this.registerAction("help:about", () => {
      this.mainWindow.webContents.send("menu:show-about");
    });
  }

  private buildFileMenu(): MenuItemConstructorOptions {
    return {
      label: "File",
      submenu: [
        {
          id: "file:new-tab",
          label: "New Query Tab",
          accelerator: "CmdOrCtrl+T",
          enabled: this.isEnabled("file:new-tab"),
          click: () => this.executeAction("file:new-tab"),
        },
        {
          id: "file:open-query",
          label: "Open Query File...",
          accelerator: "CmdOrCtrl+O",
          enabled: this.isEnabled("file:open-query"),
          click: () => this.executeAction("file:open-query"),
        },
        { type: "separator" },
        {
          id: "file:save-query",
          label: "Save Query",
          accelerator: "CmdOrCtrl+S",
          enabled: this.isEnabled("file:save-query"),
          click: () => this.executeAction("file:save-query"),
        },
        {
          id: "file:save-query-as",
          label: "Save Query As...",
          accelerator: "CmdOrCtrl+Shift+S",
          enabled: this.isEnabled("file:save-query-as"),
          click: () => this.executeAction("file:save-query-as"),
        },
        { type: "separator" },
        {
          id: "file:import-connections",
          label: "Import Connections...",
          enabled: this.isEnabled("file:import-connections"),
          click: () => this.executeAction("file:import-connections"),
        },
        {
          id: "file:export-connections",
          label: "Export Connections...",
          enabled: this.isEnabled("file:export-connections"),
          click: () => this.executeAction("file:export-connections"),
        },
        { type: "separator" },
        {
          id: "file:preferences",
          label: "Preferences",
          accelerator: "CmdOrCtrl+,",
          enabled: this.isEnabled("file:preferences"),
          click: () => this.executeAction("file:preferences"),
        },
        { type: "separator" },
        {
          id: "file:quit",
          label: this.isDarwin ? "Quit SQLTemple" : "Exit",
          accelerator: this.isDarwin ? "Cmd+Q" : "Ctrl+Q",
          enabled: this.isEnabled("file:quit"),
          click: () => app.quit(),
        },
      ],
    };
  }

  private buildEditMenu(): MenuItemConstructorOptions {
    return {
      label: "Edit",
      submenu: [
        {
          id: "edit:undo",
          label: "Undo",
          accelerator: "CmdOrCtrl+Z",
          enabled: this.isEnabled("edit:undo"),
          click: () => this.executeAction("edit:undo"),
        },
        {
          id: "edit:redo",
          label: "Redo",
          accelerator: this.isDarwin ? "Cmd+Shift+Z" : "Ctrl+Y",
          enabled: this.isEnabled("edit:redo"),
          click: () => this.executeAction("edit:redo"),
        },
        { type: "separator" },
        {
          id: "edit:cut",
          label: "Cut",
          accelerator: "CmdOrCtrl+X",
          enabled: this.isEnabled("edit:cut"),
          click: () => this.executeAction("edit:cut"),
        },
        {
          id: "edit:copy",
          label: "Copy",
          accelerator: "CmdOrCtrl+C",
          enabled: this.isEnabled("edit:copy"),
          click: () => this.executeAction("edit:copy"),
        },
        {
          id: "edit:paste",
          label: "Paste",
          accelerator: "CmdOrCtrl+V",
          enabled: this.isEnabled("edit:paste"),
          click: () => this.executeAction("edit:paste"),
        },
        {
          id: "edit:select-all",
          label: "Select All",
          accelerator: "CmdOrCtrl+A",
          enabled: this.isEnabled("edit:select-all"),
          click: () => this.executeAction("edit:select-all"),
        },
        { type: "separator" },
        {
          id: "edit:find",
          label: "Find",
          accelerator: "CmdOrCtrl+F",
          enabled: this.isEnabled("edit:find"),
          click: () => this.executeAction("edit:find"),
        },
        {
          id: "edit:replace",
          label: "Replace",
          accelerator: "CmdOrCtrl+H",
          enabled: this.isEnabled("edit:replace"),
          click: () => this.executeAction("edit:replace"),
        },
        { type: "separator" },
        {
          id: "edit:format-query",
          label: "Format Query",
          accelerator: "CmdOrCtrl+Shift+F",
          enabled: this.isEnabled("edit:format-query"),
          click: () => this.executeAction("edit:format-query"),
        },
      ],
    };
  }

  private buildViewMenu(): MenuItemConstructorOptions {
    return {
      label: "View",
      submenu: [
        {
          id: "view:toggle-connections",
          label: "Toggle Connections Panel",
          accelerator: "CmdOrCtrl+1",
          enabled: this.isEnabled("view:toggle-connections"),
          click: () => this.executeAction("view:toggle-connections"),
        },
        {
          id: "view:toggle-schema",
          label: "Toggle Schema Explorer",
          accelerator: "CmdOrCtrl+2",
          enabled: this.isEnabled("view:toggle-schema"),
          click: () => this.executeAction("view:toggle-schema"),
        },
        {
          id: "view:toggle-results",
          label: "Toggle Results Panel",
          accelerator: "CmdOrCtrl+3",
          enabled: this.isEnabled("view:toggle-results"),
          click: () => this.executeAction("view:toggle-results"),
        },
        {
          id: "view:toggle-history",
          label: "Toggle Query History",
          accelerator: "CmdOrCtrl+H",
          enabled: this.isEnabled("view:toggle-history"),
          click: () => this.executeAction("view:toggle-history"),
        },
        {
          id: "view:toggle-agent",
          label: "Toggle Agent Sidebar",
          accelerator: "CmdOrCtrl+L",
          enabled: this.isEnabled("view:toggle-agent"),
          click: () => this.executeAction("view:toggle-agent"),
        },
        { type: "separator" },
        {
          id: "view:zoom-in",
          label: "Zoom In",
          accelerator: "CmdOrCtrl+Plus",
          enabled: this.isEnabled("view:zoom-in"),
          click: () => this.executeAction("view:zoom-in"),
        },
        {
          id: "view:zoom-out",
          label: "Zoom Out",
          accelerator: "CmdOrCtrl+-",
          enabled: this.isEnabled("view:zoom-out"),
          click: () => this.executeAction("view:zoom-out"),
        },
        {
          id: "view:reset-zoom",
          label: "Reset Zoom",
          accelerator: "CmdOrCtrl+0",
          enabled: this.isEnabled("view:reset-zoom"),
          click: () => this.executeAction("view:reset-zoom"),
        },
        { type: "separator" },
        {
          id: "view:toggle-fullscreen",
          label: "Toggle Full Screen",
          accelerator: this.isDarwin ? "Ctrl+Cmd+F" : "F11",
          enabled: this.isEnabled("view:toggle-fullscreen"),
          click: () => this.executeAction("view:toggle-fullscreen"),
        },
        { type: "separator" },
        {
          id: "view:reload",
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          enabled: this.isEnabled("view:reload"),
          click: () => this.executeAction("view:reload"),
        },
        {
          id: "view:toggle-devtools",
          label: "Toggle Developer Tools",
          accelerator: this.isDarwin ? "Alt+Cmd+I" : "Ctrl+Shift+I",
          enabled: this.isEnabled("view:toggle-devtools"),
          click: () => this.executeAction("view:toggle-devtools"),
        },
      ],
    };
  }

  private buildDatabaseMenu(): MenuItemConstructorOptions {
    return {
      label: "Database",
      submenu: [
        {
          id: "database:connect",
          label: "Connect to Database...",
          enabled: this.isEnabled("database:connect"),
          click: () => this.executeAction("database:connect"),
        },
        {
          id: "database:disconnect",
          label: "Disconnect",
          enabled: this.isEnabled("database:disconnect"),
          click: () => this.executeAction("database:disconnect"),
        },
        { type: "separator" },
        {
          id: "database:refresh-schema",
          label: "Refresh Schema",
          accelerator: "F5",
          enabled: this.isEnabled("database:refresh-schema"),
          click: () => this.executeAction("database:refresh-schema"),
        },
        { type: "separator" },
        {
          id: "database:execute-query",
          label: "Execute Query",
          accelerator: "CmdOrCtrl+Return",
          enabled: this.isEnabled("database:execute-query"),
          click: () => this.executeAction("database:execute-query"),
        },
        {
          id: "database:execute-selected",
          label: "Execute Selected",
          accelerator: "CmdOrCtrl+Shift+Return",
          enabled: this.isEnabled("database:execute-selected"),
          click: () => this.executeAction("database:execute-selected"),
        },
        {
          id: "database:explain-query",
          label: "Explain Query Plan",
          accelerator: "CmdOrCtrl+E",
          enabled: this.isEnabled("database:explain-query"),
          click: () => this.executeAction("database:explain-query"),
        },
        { type: "separator" },
        {
          id: "database:show-topology",
          label: "Show Table Topology",
          enabled: this.isEnabled("database:show-topology"),
          click: () => this.executeAction("database:show-topology"),
        },
      ],
    };
  }

  private buildAIMenu(): MenuItemConstructorOptions {
    return {
      label: "AI Assistant",
      submenu: [
        {
          id: "ai:create-query",
          label: "Create Query with AI",
          accelerator: "CmdOrCtrl+Shift+N",
          enabled: this.isEnabled("ai:create-query"),
          click: () => this.executeAction("ai:create-query"),
        },
        {
          id: "ai:explain-query",
          label: "Explain Selected Query",
          enabled: this.isEnabled("ai:explain-query"),
          click: () => this.executeAction("ai:explain-query"),
        },
        {
          id: "ai:optimize-query",
          label: "Optimize Selected Query",
          enabled: this.isEnabled("ai:optimize-query"),
          click: () => this.executeAction("ai:optimize-query"),
        },
        { type: "separator" },
        {
          id: "ai:settings",
          label: "AI Settings...",
          enabled: this.isEnabled("ai:settings"),
          click: () => this.executeAction("ai:settings"),
        },
      ],
    };
  }

  private buildWindowMenu(): MenuItemConstructorOptions {
    const submenu: MenuItemConstructorOptions[] = [
      {
        id: "window:minimize",
        label: "Minimize",
        accelerator: "CmdOrCtrl+M",
        enabled: this.isEnabled("window:minimize"),
        click: () => this.executeAction("window:minimize"),
      },
      {
        id: "window:close-tab",
        label: "Close Tab",
        accelerator: "CmdOrCtrl+W",
        enabled: this.isEnabled("window:close-tab"),
        click: () => this.executeAction("window:close-tab"),
      },
      { type: "separator" },
      {
        id: "window:next-tab",
        label: "Next Tab",
        accelerator: "CmdOrCtrl+Tab",
        enabled: this.isEnabled("window:next-tab"),
        click: () => this.executeAction("window:next-tab"),
      },
      {
        id: "window:previous-tab",
        label: "Previous Tab",
        accelerator: "CmdOrCtrl+Shift+Tab",
        enabled: this.isEnabled("window:previous-tab"),
        click: () => this.executeAction("window:previous-tab"),
      },
    ];

    if (this.isDarwin) {
      submenu.push(
        { type: "separator" },
        {
          label: "Bring All to Front",
          role: "front",
        }
      );
    }

    return {
      label: "Window",
      submenu,
    };
  }

  private buildHelpMenu(): MenuItemConstructorOptions {
    return {
      label: "Help",
      submenu: [
        {
          id: "help:documentation",
          label: "Documentation",
          enabled: this.isEnabled("help:documentation"),
          click: () => this.executeAction("help:documentation"),
        },
        {
          id: "help:keyboard-shortcuts",
          label: "Keyboard Shortcuts",
          accelerator: "CmdOrCtrl+K",
          enabled: this.isEnabled("help:keyboard-shortcuts"),
          click: () => this.executeAction("help:keyboard-shortcuts"),
        },
        { type: "separator" },
        {
          id: "help:report-issue",
          label: "Report Issue",
          enabled: this.isEnabled("help:report-issue"),
          click: () => this.executeAction("help:report-issue"),
        },
        {
          id: "help:about",
          label: "About SQLTemple",
          enabled: this.isEnabled("help:about"),
          click: () => this.executeAction("help:about"),
        },
      ],
    };
  }

  private buildDarwinTemplate(): MenuItemConstructorOptions[] {
    return [
      {
        label: "SQLTemple",
        submenu: [
          {
            id: "help:about",
            label: "About SQLTemple",
            enabled: this.isEnabled("help:about"),
            click: () => this.executeAction("help:about"),
          },
          { type: "separator" },
          {
            id: "file:preferences",
            label: "Preferences...",
            accelerator: "Cmd+,",
            enabled: this.isEnabled("file:preferences"),
            click: () => this.executeAction("file:preferences"),
          },
          { type: "separator" },
          { role: "services", submenu: [] },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      this.buildFileMenu(),
      this.buildEditMenu(),
      this.buildViewMenu(),
      this.buildDatabaseMenu(),
      this.buildAIMenu(),
      this.buildWindowMenu(),
      this.buildHelpMenu(),
    ];
  }

  private buildDefaultTemplate(): MenuItemConstructorOptions[] {
    return [
      this.buildFileMenu(),
      this.buildEditMenu(),
      this.buildViewMenu(),
      this.buildDatabaseMenu(),
      this.buildAIMenu(),
      this.buildWindowMenu(),
      this.buildHelpMenu(),
    ];
  }
}
