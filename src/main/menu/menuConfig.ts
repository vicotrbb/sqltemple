export interface MenuItemConfig {
  id: string;
  label: string;
  accelerator?: string;
  enabled?: boolean;
  visible?: boolean;
  submenu?: MenuItemConfig[];
  type?: "normal" | "separator" | "submenu" | "checkbox" | "radio";
  checked?: boolean;
  role?: any;
}

export interface MenuConfig {
  [key: string]: MenuItemConfig[];
}

export const menuConfig: MenuConfig = {
  file: [
    { id: "file:new-tab", label: "New Query Tab", accelerator: "CmdOrCtrl+T" },
    {
      id: "file:open-query",
      label: "Open Query File...",
      accelerator: "CmdOrCtrl+O",
    },
    { type: "separator", id: "separator-1", label: "" },
    { id: "file:save-query", label: "Save Query", accelerator: "CmdOrCtrl+S" },
    {
      id: "file:save-query-as",
      label: "Save Query As...",
      accelerator: "CmdOrCtrl+Shift+S",
    },
    { type: "separator", id: "separator-2", label: "" },
    { id: "file:import-connections", label: "Import Connections..." },
    { id: "file:export-connections", label: "Export Connections..." },
    { type: "separator", id: "separator-3", label: "" },
    {
      id: "file:preferences",
      label: "Preferences",
      accelerator: "CmdOrCtrl+,",
    },
    { type: "separator", id: "separator-4", label: "" },
    { id: "file:quit", label: "Exit", accelerator: "CmdOrCtrl+Q" },
  ],
  edit: [
    { id: "edit:undo", label: "Undo", accelerator: "CmdOrCtrl+Z" },
    { id: "edit:redo", label: "Redo", accelerator: "CmdOrCtrl+Shift+Z" },
    { type: "separator", id: "separator-1", label: "" },
    { id: "edit:cut", label: "Cut", accelerator: "CmdOrCtrl+X" },
    { id: "edit:copy", label: "Copy", accelerator: "CmdOrCtrl+C" },
    { id: "edit:paste", label: "Paste", accelerator: "CmdOrCtrl+V" },
    { id: "edit:select-all", label: "Select All", accelerator: "CmdOrCtrl+A" },
    { type: "separator", id: "separator-2", label: "" },
    { id: "edit:find", label: "Find", accelerator: "CmdOrCtrl+F" },
    { id: "edit:replace", label: "Replace", accelerator: "CmdOrCtrl+H" },
    { type: "separator", id: "separator-3", label: "" },
    {
      id: "edit:format-query",
      label: "Format Query",
      accelerator: "CmdOrCtrl+Shift+F",
    },
  ],
  view: [
    {
      id: "view:toggle-connections",
      label: "Toggle Connections Panel",
      accelerator: "CmdOrCtrl+1",
    },
    {
      id: "view:toggle-schema",
      label: "Toggle Schema Explorer",
      accelerator: "CmdOrCtrl+2",
    },
    {
      id: "view:toggle-results",
      label: "Toggle Results Panel",
      accelerator: "CmdOrCtrl+3",
    },
    {
      id: "view:toggle-history",
      label: "Toggle Query History",
      accelerator: "CmdOrCtrl+H",
    },
    { type: "separator", id: "separator-1", label: "" },
    { id: "view:zoom-in", label: "Zoom In", accelerator: "CmdOrCtrl+Plus" },
    { id: "view:zoom-out", label: "Zoom Out", accelerator: "CmdOrCtrl+-" },
    { id: "view:reset-zoom", label: "Reset Zoom", accelerator: "CmdOrCtrl+0" },
    { type: "separator", id: "separator-2", label: "" },
    {
      id: "view:toggle-fullscreen",
      label: "Toggle Full Screen",
      accelerator: "F11",
    },
    { type: "separator", id: "separator-3", label: "" },
    { id: "view:reload", label: "Reload", accelerator: "CmdOrCtrl+R" },
    {
      id: "view:toggle-devtools",
      label: "Toggle Developer Tools",
      accelerator: "CmdOrCtrl+Shift+I",
    },
  ],
  database: [
    { id: "database:connect", label: "Connect to Database..." },
    { id: "database:disconnect", label: "Disconnect" },
    { type: "separator", id: "separator-1", label: "" },
    { 
      id: "database:spotlight-search", 
      label: "Search Database Objects...", 
      accelerator: "CmdOrCtrl+P" 
    },
    { type: "separator", id: "separator-1b", label: "" },
    {
      id: "database:refresh-schema",
      label: "Refresh Schema",
      accelerator: "F5",
    },
    { type: "separator", id: "separator-2", label: "" },
    {
      id: "database:execute-query",
      label: "Execute Query",
      accelerator: "CmdOrCtrl+Return",
    },
    {
      id: "database:execute-selected",
      label: "Execute Selected",
      accelerator: "CmdOrCtrl+Shift+Return",
    },
    {
      id: "database:explain-query",
      label: "Explain Query Plan",
      accelerator: "CmdOrCtrl+E",
    },
    { type: "separator", id: "separator-3", label: "" },
    { id: "database:show-topology", label: "Show Table Topology" },
  ],
  ai: [
    {
      id: "ai:create-query",
      label: "Create Query with AI",
      accelerator: "CmdOrCtrl+Shift+N",
    },
    { id: "ai:explain-query", label: "Explain Selected Query" },
    { id: "ai:optimize-query", label: "Optimize Selected Query" },
    { type: "separator", id: "separator-1", label: "" },
    { id: "ai:settings", label: "AI Settings..." },
  ],
  window: [
    { id: "window:minimize", label: "Minimize", accelerator: "CmdOrCtrl+M" },
    { id: "window:close-tab", label: "Close Tab", accelerator: "CmdOrCtrl+W" },
    { type: "separator", id: "separator-1", label: "" },
    { id: "window:next-tab", label: "Next Tab", accelerator: "CmdOrCtrl+Tab" },
    {
      id: "window:previous-tab",
      label: "Previous Tab",
      accelerator: "CmdOrCtrl+Shift+Tab",
    },
  ],
  help: [
    { id: "help:documentation", label: "Documentation" },
    {
      id: "help:keyboard-shortcuts",
      label: "Keyboard Shortcuts",
      accelerator: "CmdOrCtrl+K",
    },
    { type: "separator", id: "separator-1", label: "" },
    { id: "help:report-issue", label: "Report Issue" },
    { id: "help:about", label: "About SQLTemple" },
  ],
};

export interface MenuState {
  isConnected: boolean;
  hasActiveQuery: boolean;
  hasSelectedText: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

export function getMenuItemEnabled(itemId: string, state: MenuState): boolean {
  const enabledWhenConnected = [
    "database:disconnect",
    "database:refresh-schema",
    "database:execute-query",
    "database:execute-selected",
    "database:explain-query",
    "database:show-topology",
    "ai:explain-query",
    "ai:optimize-query",
  ];

  const enabledWhenDisconnected = ["database:connect"];

  const enabledWithActiveQuery = [
    "file:save-query",
    "file:save-query-as",
    "database:execute-query",
    "database:explain-query",
  ];

  const enabledWithSelectedText = [
    "database:execute-selected",
    "ai:explain-query",
    "ai:optimize-query",
  ];

  if (enabledWhenConnected.includes(itemId)) {
    return state.isConnected;
  }

  if (enabledWhenDisconnected.includes(itemId)) {
    return !state.isConnected;
  }

  if (enabledWithActiveQuery.includes(itemId)) {
    return state.hasActiveQuery;
  }

  if (enabledWithSelectedText.includes(itemId)) {
    return state.hasSelectedText;
  }

  if (itemId === "edit:undo") return state.canUndo;
  if (itemId === "edit:redo") return state.canRedo;

  return true;
}
