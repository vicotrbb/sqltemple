import {
  Menu,
  MenuItemConstructorOptions,
  app,
  shell,
  BrowserWindow,
} from "electron";

export interface MenuAction {
  id: string;
  handler: () => void;
}

export class MenuBuilder {
  private mainWindow: BrowserWindow;
  private actions: Map<string, () => void> = new Map();
  private isDarwin = process.platform === "darwin";

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

  private executeAction(actionId: string): void {
    const handler = this.actions.get(actionId);
    if (handler) {
      handler();
    } else {
      console.warn(`No handler registered for action: ${actionId}`);
    }
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
      shell.openExternal("https://github.com/yourusername/sqltemple/wiki");
    });

    this.registerAction("help:keyboard-shortcuts", () => {
      this.mainWindow.webContents.send("menu:show-keyboard-shortcuts");
    });

    this.registerAction("help:report-issue", () => {
      shell.openExternal(
        "https://github.com/yourusername/sqltemple/issues/new"
      );
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
          label: "New Query Tab",
          accelerator: "CmdOrCtrl+T",
          click: () => this.executeAction("file:new-tab"),
        },
        {
          label: "Open Query File...",
          accelerator: "CmdOrCtrl+O",
          click: () => this.executeAction("file:open-query"),
        },
        { type: "separator" },
        {
          label: "Save Query",
          accelerator: "CmdOrCtrl+S",
          click: () => this.executeAction("file:save-query"),
        },
        {
          label: "Save Query As...",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => this.executeAction("file:save-query-as"),
        },
        { type: "separator" },
        {
          label: "Import Connections...",
          click: () => this.executeAction("file:import-connections"),
        },
        {
          label: "Export Connections...",
          click: () => this.executeAction("file:export-connections"),
        },
        { type: "separator" },
        {
          label: "Preferences",
          accelerator: "CmdOrCtrl+,",
          click: () => this.executeAction("file:preferences"),
        },
        { type: "separator" },
        {
          label: this.isDarwin ? "Quit SQLTemple" : "Exit",
          accelerator: this.isDarwin ? "Cmd+Q" : "Ctrl+Q",
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
          label: "Undo",
          accelerator: "CmdOrCtrl+Z",
          click: () => this.executeAction("edit:undo"),
        },
        {
          label: "Redo",
          accelerator: this.isDarwin ? "Cmd+Shift+Z" : "Ctrl+Y",
          click: () => this.executeAction("edit:redo"),
        },
        { type: "separator" },
        {
          label: "Cut",
          accelerator: "CmdOrCtrl+X",
          click: () => this.executeAction("edit:cut"),
        },
        {
          label: "Copy",
          accelerator: "CmdOrCtrl+C",
          click: () => this.executeAction("edit:copy"),
        },
        {
          label: "Paste",
          accelerator: "CmdOrCtrl+V",
          click: () => this.executeAction("edit:paste"),
        },
        {
          label: "Select All",
          accelerator: "CmdOrCtrl+A",
          click: () => this.executeAction("edit:select-all"),
        },
        { type: "separator" },
        {
          label: "Find",
          accelerator: "CmdOrCtrl+F",
          click: () => this.executeAction("edit:find"),
        },
        {
          label: "Replace",
          accelerator: "CmdOrCtrl+H",
          click: () => this.executeAction("edit:replace"),
        },
        { type: "separator" },
        {
          label: "Format Query",
          accelerator: "CmdOrCtrl+Shift+F",
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
          label: "Toggle Connections Panel",
          accelerator: "CmdOrCtrl+1",
          click: () => this.executeAction("view:toggle-connections"),
        },
        {
          label: "Toggle Schema Explorer",
          accelerator: "CmdOrCtrl+2",
          click: () => this.executeAction("view:toggle-schema"),
        },
        {
          label: "Toggle Results Panel",
          accelerator: "CmdOrCtrl+3",
          click: () => this.executeAction("view:toggle-results"),
        },
        {
          label: "Toggle Query History",
          accelerator: "CmdOrCtrl+H",
          click: () => this.executeAction("view:toggle-history"),
        },
        { type: "separator" },
        {
          label: "Zoom In",
          accelerator: "CmdOrCtrl+Plus",
          click: () => this.executeAction("view:zoom-in"),
        },
        {
          label: "Zoom Out",
          accelerator: "CmdOrCtrl+-",
          click: () => this.executeAction("view:zoom-out"),
        },
        {
          label: "Reset Zoom",
          accelerator: "CmdOrCtrl+0",
          click: () => this.executeAction("view:reset-zoom"),
        },
        { type: "separator" },
        {
          label: "Toggle Full Screen",
          accelerator: this.isDarwin ? "Ctrl+Cmd+F" : "F11",
          click: () => this.executeAction("view:toggle-fullscreen"),
        },
        { type: "separator" },
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => this.executeAction("view:reload"),
        },
        {
          label: "Toggle Developer Tools",
          accelerator: this.isDarwin ? "Alt+Cmd+I" : "Ctrl+Shift+I",
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
          label: "Connect to Database...",
          click: () => this.executeAction("database:connect"),
        },
        {
          label: "Disconnect",
          click: () => this.executeAction("database:disconnect"),
        },
        { type: "separator" },
        {
          label: "Refresh Schema",
          accelerator: "F5",
          click: () => this.executeAction("database:refresh-schema"),
        },
        { type: "separator" },
        {
          label: "Execute Query",
          accelerator: "CmdOrCtrl+Return",
          click: () => this.executeAction("database:execute-query"),
        },
        {
          label: "Execute Selected",
          accelerator: "CmdOrCtrl+Shift+Return",
          click: () => this.executeAction("database:execute-selected"),
        },
        {
          label: "Explain Query Plan",
          accelerator: "CmdOrCtrl+E",
          click: () => this.executeAction("database:explain-query"),
        },
        { type: "separator" },
        {
          label: "Show Table Topology",
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
          label: "Create Query with AI",
          accelerator: "CmdOrCtrl+Shift+N",
          click: () => this.executeAction("ai:create-query"),
        },
        {
          label: "Explain Selected Query",
          click: () => this.executeAction("ai:explain-query"),
        },
        {
          label: "Optimize Selected Query",
          click: () => this.executeAction("ai:optimize-query"),
        },
        { type: "separator" },
        {
          label: "AI Settings...",
          click: () => this.executeAction("ai:settings"),
        },
      ],
    };
  }

  private buildWindowMenu(): MenuItemConstructorOptions {
    const submenu: MenuItemConstructorOptions[] = [
      {
        label: "Minimize",
        accelerator: "CmdOrCtrl+M",
        click: () => this.executeAction("window:minimize"),
      },
      {
        label: "Close Tab",
        accelerator: "CmdOrCtrl+W",
        click: () => this.executeAction("window:close-tab"),
      },
      { type: "separator" },
      {
        label: "Next Tab",
        accelerator: "CmdOrCtrl+Tab",
        click: () => this.executeAction("window:next-tab"),
      },
      {
        label: "Previous Tab",
        accelerator: "CmdOrCtrl+Shift+Tab",
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
          label: "Documentation",
          click: () => this.executeAction("help:documentation"),
        },
        {
          label: "Keyboard Shortcuts",
          accelerator: "CmdOrCtrl+K",
          click: () => this.executeAction("help:keyboard-shortcuts"),
        },
        { type: "separator" },
        {
          label: "Report Issue",
          click: () => this.executeAction("help:report-issue"),
        },
        {
          label: "About SQLTemple",
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
            label: "About SQLTemple",
            click: () => this.executeAction("help:about"),
          },
          { type: "separator" },
          {
            label: "Preferences...",
            accelerator: "Cmd+,",
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
