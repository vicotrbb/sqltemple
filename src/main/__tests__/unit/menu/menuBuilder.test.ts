import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { MenuBuilder, MenuAction } from "../../../menu/menuBuilder";

jest.mock("electron");

const electronMock = require("electron") as any;

const createWindowStub = () => ({
  webContents: {
    send: jest.fn(),
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
  setFullScreen: jest.fn(),
  isFullScreen: jest.fn(() => false),
});

const getLatestTemplate = () => {
  const calls = electronMock.Menu.buildFromTemplate.mock.calls as Array<[any]>;
  const lastCall = calls[calls.length - 1];
  return lastCall ? (lastCall[0] as any[]) : [];
};

const findMenuItem = (template: any[], id: string): any | undefined => {
  for (const item of template) {
    if (item.id === id) {
      return item;
    }
    if (Array.isArray(item.submenu)) {
      const found = findMenuItem(item.submenu, id);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
};

describe("MenuBuilder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    electronMock.Menu.buildFromTemplate = jest
      .fn()
      .mockImplementation(() => electronMock.Menu);
    electronMock.Menu.setApplicationMenu = jest.fn();
  });

  it("builds and installs the application menu", () => {
    const window = createWindowStub();
    const builder = new MenuBuilder(window as any);

    const menu = builder.buildMenu();

    expect(electronMock.Menu.buildFromTemplate).toHaveBeenCalledTimes(1);
    expect(electronMock.Menu.setApplicationMenu).toHaveBeenCalledWith(menu);
  });

  it("rebuilds the menu with updated state flags", () => {
    const window = createWindowStub();
    const builder = new MenuBuilder(window as any);
    builder.buildMenu();

    builder.updateState({ isConnected: true, hasActiveQuery: true });

    const template = getLatestTemplate();
    const disconnectItem = findMenuItem(template, "database:disconnect");
    const executeItem = findMenuItem(template, "database:execute-query");

    expect(disconnectItem?.enabled).toBe(true);
    expect(executeItem?.enabled).toBe(true);
  });

  it("invokes registered actions when executed", () => {
    const window = createWindowStub();
    const builder = new MenuBuilder(window as any);
    const customAction = jest.fn();

    builder.registerAction("custom:run", customAction);
    (builder as any).executeAction("database:execute-query");
    (builder as any).executeAction("custom:run");

    expect(window.webContents.send).toHaveBeenCalledWith("menu:execute-query");
    expect(customAction).toHaveBeenCalled();
  });

  it("supports bulk action registration", () => {
    const window = createWindowStub();
    const builder = new MenuBuilder(window as any);
    const actions: MenuAction[] = [
      { id: "custom:a", handler: jest.fn() },
      { id: "custom:b", handler: jest.fn() },
    ];

    builder.registerActions(actions);
    (builder as any).executeAction("custom:a");
    (builder as any).executeAction("custom:b");

    expect(actions[0].handler).toHaveBeenCalled();
    expect(actions[1].handler).toHaveBeenCalled();
  });
});
