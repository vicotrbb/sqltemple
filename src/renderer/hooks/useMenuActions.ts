import { useEffect, useCallback } from "react";

export interface MenuActionHandlers {
  onNewTab?: () => void;
  onOpenQuery?: () => void;
  onSaveQuery?: () => void;
  onSaveQueryAs?: () => void;
  onShowPreferences?: () => void;
  onImportConnections?: () => void;
  onExportConnections?: () => void;

  onFind?: () => void;
  onReplace?: () => void;
  onFormatQuery?: () => void;

  onToggleConnections?: () => void;
  onToggleSchema?: () => void;
  onToggleResults?: () => void;
  onToggleHistory?: () => void;
  onToggleAgentSidebar?: () => void;

  onConnectDatabase?: () => void;
  onDisconnectDatabase?: () => void;
  onRefreshSchema?: () => void;
  onSpotlightSearch?: () => void;
  onExecuteQuery?: () => void;
  onExecuteSelected?: () => void;
  onExplainQuery?: () => void;
  onShowTopology?: () => void;

  onAICreateQuery?: () => void;
  onAIExplainQuery?: () => void;
  onAIOptimizeQuery?: () => void;
  onAISettings?: () => void;

  onCloseTab?: () => void;
  onNextTab?: () => void;
  onPreviousTab?: () => void;

  onShowKeyboardShortcuts?: () => void;
  onShowAbout?: () => void;
}

export function useMenuActions(handlers: MenuActionHandlers) {
  useEffect(() => {
    const menuActionMap: { [key: string]: keyof MenuActionHandlers } = {
      "menu:new-tab": "onNewTab",
      "menu:open-query": "onOpenQuery",
      "menu:save-query": "onSaveQuery",
      "menu:save-query-as": "onSaveQueryAs",
      "menu:show-preferences": "onShowPreferences",
      "menu:import-connections": "onImportConnections",
      "menu:export-connections": "onExportConnections",
      "menu:find": "onFind",
      "menu:replace": "onReplace",
      "menu:format-query": "onFormatQuery",
      "menu:toggle-connections": "onToggleConnections",
      "menu:toggle-schema": "onToggleSchema",
      "menu:toggle-results": "onToggleResults",
      "menu:toggle-history": "onToggleHistory",
      "menu:toggle-agent": "onToggleAgentSidebar",
      "menu:connect-database": "onConnectDatabase",
      "menu:disconnect-database": "onDisconnectDatabase",
      "menu:refresh-schema": "onRefreshSchema",
      "menu:spotlight-search": "onSpotlightSearch",
      "menu:execute-query": "onExecuteQuery",
      "menu:execute-selected": "onExecuteSelected",
      "menu:explain-query": "onExplainQuery",
      "menu:show-topology": "onShowTopology",
      "menu:ai-create-query": "onAICreateQuery",
      "menu:ai-explain-query": "onAIExplainQuery",
      "menu:ai-optimize-query": "onAIOptimizeQuery",
      "menu:ai-settings": "onAISettings",
      "menu:close-tab": "onCloseTab",
      "menu:next-tab": "onNextTab",
      "menu:previous-tab": "onPreviousTab",
      "menu:show-keyboard-shortcuts": "onShowKeyboardShortcuts",
      "menu:show-about": "onShowAbout",
    };

    const listeners: Array<[string, (...args: any[]) => void]> = [];

    Object.entries(menuActionMap).forEach(([channel, handlerKey]) => {
      const handler = handlers[handlerKey];
      if (handler) {
        const listener = () => {
          handler();
        };
        window.api.ipcRenderer.on(channel, listener);
        listeners.push([channel, listener]);
      }
    });

    return () => {
      listeners.forEach(([channel, listener]) => {
        window.api.ipcRenderer.removeListener(channel, listener);
      });
    };
  }, [handlers]);
}

export function useMenuState() {
  const updateMenuState = useCallback(
    (state: {
      isConnected?: boolean;
      hasActiveQuery?: boolean;
      hasSelectedText?: boolean;
      canUndo?: boolean;
      canRedo?: boolean;
    }) => {
      window.api.ipcRenderer.send("update-menu-state", state);
    },
    []
  );

  return { updateMenuState };
}
