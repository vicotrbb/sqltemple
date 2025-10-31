import React, { useState, useEffect } from "react";
import { ConnectionManager } from "./components/ConnectionManager";
import { UnifiedExplorer } from "./components/UnifiedExplorer";
import { ResizeHandle } from "./components/ResizeHandle";
import { SQLEditor } from "./components/SQLEditor";
import { ResultsGrid } from "./components/ResultsGrid";
import { TabManager } from "./components/TabManager";
import { QueryHistory } from "./components/QueryHistory";
import { PlanVisualizer } from "./components/PlanVisualizer";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import { TitleBar } from "./components/TitleBar";
import { AISettings } from "./components/AISettings";
import { AIQueryDialog } from "./components/AIQueryDialog";
import { AIResultDialog } from "./components/AIResultDialog";
import { TableTopology } from "./components/TableTopology";
import { TableDetailsView } from "./components/TableDetailsView";
import { AboutDialog } from "./components/AboutDialog";
import { FunctionalPreferencesDialog } from "./components/FunctionalPreferencesDialog";
import { SpotlightSearch } from "./components/SpotlightSearch";
import { ErrorNotifications } from "./components/ErrorNotifications";
import ErrorBoundary from "./components/ErrorBoundary";
import { useMenuActions, useMenuState } from "./hooks/useMenuActions";
import {
  PlayIcon,
  ConnectIcon,
  HistoryIcon,
  ConnectedIcon,
  SearchIcon,
  SaveIcon,
  FormatIcon,
  PlusIcon,
  BrainIcon,
} from "./components/icons/IconLibrary";
import {
  DatabaseConnectionConfig,
  DatabaseSchema,
  QueryResult,
} from "../main/database/interfaces";
import { ConfigProvider, useSettings } from "./contexts/ConfigContext";
import { useTheme } from "./hooks/useTheme";
import { appService } from "./services/AppService";
import { aiService } from "./services/AIService";
import { errorService } from "./services/ErrorService";
import { AppTab, QueryTab, TableDetailsTab } from "./services/TabService";

const AppContent: React.FC = () => {
  const [showConnectionManager, setShowConnectionManager] = useState(false);
  const [showQueryHistory, setShowQueryHistory] = useState(false);
  const [showPlanVisualizer, setShowPlanVisualizer] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showAIQueryDialog, setShowAIQueryDialog] = useState(false);
  const [showTableTopology, setShowTableTopology] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [rightSidebarView, setRightSidebarView] = useState<"topology" | null>(
    null
  );
  const [topologyTable, setTopologyTable] = useState<{
    name: string;
    schema: string;
  } | null>(null);
  const [aiResult, setAIResult] = useState<{
    type: "explain" | "optimize";
    content: string;
    query?: string;
  } | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("sidebarWidth");
    return saved ? parseInt(saved, 10) : 256;
  });
  const [isSidebarResizing, setIsSidebarResizing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConnection, setCurrentConnection] =
    useState<DatabaseConnectionConfig | null>(null);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [tabs, setTabs] = useState<AppTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryPlan, setQueryPlan] = useState<any>(null);
  const [planQuery, setPlanQuery] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<DatabaseConnectionConfig | null>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [resultsPanelHeight, setResultsPanelHeight] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const [connections, setConnections] = useState<DatabaseConnectionConfig[]>(
    []
  );
  const { getShortcut } = useSettings();
  const { updateMenuState } = useMenuState();
  const theme = useTheme();

  // Initialize app service with callbacks
  useEffect(() => {
    appService.setCallbacks({
      onConnectionChange: (connection, connected) => {
        setCurrentConnection(connection);
        setIsConnected(connected);
      },
      onSchemaChange: (newSchema) => {
        setSchema(newSchema);
      },
      onQueryResult: (result) => {
        setQueryResult(result);
        setIsExecuting(false);
      },
      onQueryPlan: (plan, query) => {
        setQueryPlan(plan);
        setPlanQuery(query);
        setShowPlanVisualizer(true);
        setIsExecuting(false);
      },
      onError: (error) => {
        alert(error);
        setIsExecuting(false);
      },
      onSuccess: (message) => {
        alert(message);
      },
      onTabsChange: (newTabs, newActiveTabId) => {
        setTabs(newTabs);
        setActiveTabId(newActiveTabId);
      },
      onActiveTabChange: (tabId) => {
        setActiveTabId(tabId);
      },
    });

    appService.initialize();
  }, []);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    const connections = await appService.loadConnections();
    setConnections(connections);
  };

  const handleSpotlightAction = async (item: any) => {
    const { executeAction } = await import(
      "./components/SpotlightSearch/actionHandlers"
    );
    executeAction(item, {
      onTableClick: handleTableClick,
      onViewClick: handleViewClick,
      onConnect: handleConnect,
      editorInstance,
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.contentEditable === "true";

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      const matchesShortcut = (shortcutId: string) => {
        const shortcuts = getShortcut(shortcutId);
        return shortcuts.some((shortcut) => {
          const keys = shortcut.toLowerCase().split("+");
          const hasCmd = keys.includes("cmd") || keys.includes("ctrl");
          const hasShift = keys.includes("shift");
          const hasAlt = keys.includes("alt");
          const mainKey = keys.find(
            (k) => !["cmd", "ctrl", "shift", "alt"].includes(k)
          );

          if (mainKey?.startsWith("f") && mainKey.length <= 3) {
            return (
              hasCmd === cmdOrCtrl &&
              hasShift === e.shiftKey &&
              hasAlt === e.altKey &&
              mainKey === e.key.toLowerCase()
            );
          }

          return (
            hasCmd === cmdOrCtrl &&
            hasShift === e.shiftKey &&
            hasAlt === e.altKey &&
            mainKey === e.key.toLowerCase()
          );
        });
      };

      if (matchesShortcut("open-spotlight")) {
        e.preventDefault();
        setShowSpotlight(true);
        return;
      }

      if (matchesShortcut("create-query-ai")) {
        e.preventDefault();
        setShowAIQueryDialog(true);
        return;
      }

      if (isInputFocused) {
        return;
      }

      if (matchesShortcut("new-tab")) {
        e.preventDefault();
        createNewTab();
      } else if (matchesShortcut("close-tab")) {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
      } else if (matchesShortcut("duplicate-tab")) {
        e.preventDefault();
        if (activeTabId) {
          duplicateTab(activeTabId);
        }
      } else if (matchesShortcut("next-tab")) {
        e.preventDefault();
        navigateToNextTab();
      } else if (matchesShortcut("previous-tab")) {
        e.preventDefault();
        navigateToPreviousTab();
      } else if (matchesShortcut("toggle-history")) {
        e.preventDefault();
        setShowQueryHistory(!showQueryHistory);
      } else if (matchesShortcut("toggle-connections")) {
        e.preventDefault();
        refreshSchema();
      } else if (matchesShortcut("toggle-schema")) {
        e.preventDefault();
        refreshSchema();
      } else if (matchesShortcut("connect-database")) {
        e.preventDefault();
        setShowConnectionManager(true);
      } else if (matchesShortcut("disconnect-database")) {
        e.preventDefault();
        if (isConnected) {
          handleDisconnect();
        }
      } else if (matchesShortcut("refresh-schema")) {
        e.preventDefault();
        if (isConnected) {
          refreshSchema();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTabId, showQueryHistory, isConnected, getShortcut]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const container = document.querySelector(".main-content-area");
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const newHeight = containerRect.bottom - e.clientY;

        const minHeight = 100;
        const maxHeight = containerRect.height * 0.8;

        setResultsPanelHeight(
          Math.min(Math.max(newHeight, minHeight), maxHeight)
        );
      }

      if (isSidebarResizing) {
        const newWidth = e.clientX;
        const minWidth = 200;
        const maxWidth = 600;

        const constrainedWidth = Math.min(
          Math.max(newWidth, minWidth),
          maxWidth
        );
        setSidebarWidth(constrainedWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.body.classList.remove("resizing");
      }

      if (isSidebarResizing) {
        setIsSidebarResizing(false);
        localStorage.setItem("sidebarWidth", sidebarWidth.toString());
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.body.classList.remove("resizing");
      }
    };

    if (isResizing || isSidebarResizing) {
      document.body.style.cursor = isResizing ? "ns-resize" : "ew-resize";
      document.body.style.userSelect = "none";
      document.body.classList.add("resizing");
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, isSidebarResizing, sidebarWidth]);

  const createNewTab = () => {
    appService.createNewTab();
  };

  const closeTab = (tabId: string) => {
    appService.closeTab(tabId);
  };

  const duplicateTab = (tabId: string) => {
    appService.duplicateTab(tabId);
  };

  const navigateToNextTab = () => {
    appService.navigateToNextTab();
  };

  const navigateToPreviousTab = () => {
    appService.navigateToPreviousTab();
  };

  const refreshSchema = async () => {
    await appService.loadSchema();
  };

  const handleConnect = async (config: DatabaseConnectionConfig) => {
    const success = await appService.connectToDatabase(config);
    if (success) {
      setShowConnectionManager(false);
      await loadConnections();
    }
  };

  const handleDisconnect = async () => {
    await appService.disconnectFromDatabase();
  };

  const executeQuery = async (selectedText?: string) => {
    if (isExecuting) return;

    setIsExecuting(true);
    await appService.executeQuery(selectedText);
  };

  const handleTableClick = (tableName: string, schemaName: string) => {
    const query = `SELECT * FROM ${schemaName}.${tableName} LIMIT 100;`;
    appService.addQueryToActiveTab(query);
  };

  const handleOpenTableDetails = (tableName: string, schemaName: string) => {
    appService.openTableDetailsTab(schemaName, tableName);
  };

  const handleViewClick = (viewName: string, schemaName: string) => {
    const query = `SELECT * FROM ${schemaName}.${viewName} LIMIT 100;`;
    appService.addQueryToActiveTab(query);
  };

  const handleQuerySelect = (query: string) => {
    const activeTab = appService.getActiveTab();
    if (activeTab && activeTab.type === "query") {
      appService.updateTabContent(activeTab.id, query);
    }
    setShowQueryHistory(false);
  };

  const explainQuery = async () => {
    setIsExecuting(true);
    await appService.explainQuery();
  };

  const handleExplainQuery = async (selectedText: string) => {
    setAILoading(true);
    setAIError(null);
    setAIResult(null);

    const result = await appService.explainQueryWithAI(selectedText);
    if (result) {
      setAIResult({ type: "explain", content: result });
    } else {
      setAIError("Failed to explain query");
    }
    setAILoading(false);
  };

  const handleOptimizeQuery = async (selectedText: string) => {
    setAILoading(true);
    setAIError(null);
    setAIResult(null);

    const result = await appService.optimizeQueryWithAI(selectedText);
    if (result) {
      setAIResult({
        type: "optimize",
        content: result.optimizedQuery,
        query: result.originalQuery,
      });
    } else {
      setAIError("Failed to optimize query");
    }
    setAILoading(false);
  };

  const handleAIQueryGenerated = (query: string) => {
    appService.addQueryToActiveTabWithNewlines(query);
  };

  const handleApplyOptimizedQuery = (optimizedQuery: string) => {
    if (aiResult?.query) {
      appService.replaceQueryInActiveTab(aiResult.query, optimizedQuery);
    }
    setAIResult(null);
  };

  const handleShowTopology = (tableName: string, schemaName: string) => {
    setTopologyTable({ name: tableName, schema: schemaName });
    setShowTableTopology(true);
    setRightSidebarView("topology");
  };

  const handleOpenQuery = async () => {
    await appService.openQueryFile();
  };

  const handleOpenSqlInNewTab = (sql: string, title?: string) => {
    const tabId = appService.createNewTab(title);
    appService.updateTabContent(tabId, sql);
    appService.setActiveTab(tabId);
  };

  const handleSaveQuery = async () => {
    await appService.saveQueryFile();
  };

  const handleSaveQueryAs = async () => {
    await appService.saveQueryFileAs();
  };

  const handleImportConnections = async () => {
    await appService.importConnections();
  };

  const handleExportConnections = async () => {
    await appService.exportConnections();
  };

  const handleFind = () => {
    if (editorInstance) {
      editorInstance.getAction("actions.find")?.run();
    }
  };

  const handleReplace = () => {
    if (editorInstance) {
      editorInstance.getAction("editor.action.startFindReplaceAction")?.run();
    }
  };

  const handleFormatQuery = () => {
    if (editorInstance) {
      editorInstance.getAction("editor.action.formatDocument")?.run();
    }
  };

  const [showResultsPanel, setShowResultsPanel] = useState(true);
  const handleToggleResults = () => {
    setShowResultsPanel(!showResultsPanel);
  };

  const handleExecuteSelected = () => {
    if (editorInstance) {
      const selection = editorInstance.getSelection();
      if (selection && !selection.isEmpty()) {
        const selectedText = editorInstance
          .getModel()
          ?.getValueInRange(selection);
        if (selectedText?.trim()) {
          executeQuery(selectedText);
        }
      }
    }
  };

  const handleAIExplainQuery = () => {
    if (editorInstance) {
      const selection = editorInstance.getSelection();
      if (selection && !selection.isEmpty()) {
        const selectedText = editorInstance
          .getModel()
          ?.getValueInRange(selection);
        if (selectedText?.trim()) {
          handleExplainQuery(selectedText);
        }
      } else {
        const activeTab = appService.getActiveTab();
        if (
          activeTab &&
          activeTab.type === "query" &&
          activeTab.content?.trim()
        ) {
          handleExplainQuery(activeTab.content);
        }
      }
    }
  };

  const handleAIOptimizeQuery = () => {
    if (editorInstance) {
      const selection = editorInstance.getSelection();
      if (selection && !selection.isEmpty()) {
        const selectedText = editorInstance
          .getModel()
          ?.getValueInRange(selection);
        if (selectedText?.trim()) {
          handleOptimizeQuery(selectedText);
        }
      } else {
        const activeTab = appService.getActiveTab();
        if (
          activeTab &&
          activeTab.type === "query" &&
          activeTab.content?.trim()
        ) {
          handleOptimizeQuery(activeTab.content);
        }
      }
    }
  };

  useMenuActions({
    onNewTab: createNewTab,
    onOpenQuery: handleOpenQuery,
    onSaveQuery: handleSaveQuery,
    onSaveQueryAs: handleSaveQueryAs,
    onImportConnections: handleImportConnections,
    onExportConnections: handleExportConnections,
    onShowPreferences: () => setShowPreferences(true),

    onFind: handleFind,
    onReplace: handleReplace,
    onFormatQuery: handleFormatQuery,

    onToggleConnections: () => refreshSchema(),
    onToggleSchema: () => refreshSchema(),
    onToggleResults: handleToggleResults,
    onToggleHistory: () => setShowQueryHistory(!showQueryHistory),

    onConnectDatabase: () => setShowConnectionManager(true),
    onDisconnectDatabase: handleDisconnect,
    onRefreshSchema: () => appService.loadSchema(),
    onSpotlightSearch: () => setShowSpotlight(true),
    onExecuteQuery: () => executeQuery(),
    onExecuteSelected: handleExecuteSelected,
    onExplainQuery: explainQuery,

    onAICreateQuery: () => setShowAIQueryDialog(true),
    onAIExplainQuery: handleAIExplainQuery,
    onAIOptimizeQuery: handleAIOptimizeQuery,
    onAISettings: () => setShowPreferences(true),

    onCloseTab: () => activeTabId && appService.closeTab(activeTabId),
    onNextTab: () => appService.navigateToNextTab(),
    onPreviousTab: () => appService.navigateToPreviousTab(),

    onShowKeyboardShortcuts: () => setShowKeyboardShortcuts(true),
    onShowAbout: () => setShowAbout(true),
  });

  const [hasSelectedText, setHasSelectedText] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const activeTab = appService.getActiveTab();
  const activeQueryTab =
    activeTab && activeTab.type === "query" ? activeTab : null;
  const activeDetailsTab =
    activeTab && activeTab.type === "table-details" ? activeTab : null;
  const isQueryTabActive = Boolean(activeQueryTab);
  const shouldShowResultsPanel = showResultsPanel && isQueryTabActive;

  useEffect(() => {
    if (editorInstance) {
      const selectionListener = editorInstance.onDidChangeCursorSelection(
        (e: any) => {
          setHasSelectedText(!e.selection.isEmpty());
        }
      );

      const modelListener = editorInstance.onDidChangeModelContent(() => {
        setCanUndo(editorInstance.getModel()?.canUndo() || false);
        setCanRedo(editorInstance.getModel()?.canRedo() || false);
      });

      return () => {
        selectionListener.dispose();
        modelListener.dispose();
      };
    }
  }, [editorInstance]);

  useEffect(() => {
    updateMenuState({
      isConnected,
      hasActiveQuery: Boolean(activeQueryTab?.content?.trim()),
      hasSelectedText,
      canUndo,
      canRedo,
    });
  }, [
    isConnected,
    activeTabId,
    tabs,
    hasSelectedText,
    canUndo,
    canRedo,
    activeQueryTab?.content,
    updateMenuState,
  ]);

  return (
    <div className="flex flex-col h-screen bg-vscode-bg text-vscode-text font-sans text-base">
      <TitleBar
        currentConnection={currentConnection}
        currentFile={activeTab?.title}
      />

      <div className="flex flex-1 min-h-0">
        <div
          className="bg-vscode-bg-secondary border-r border-vscode-border flex-shrink-0 flex flex-col relative"
          style={{ width: `${sidebarWidth}px` }}
        >
          <UnifiedExplorer
            currentConnection={currentConnection}
            schema={schema}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onEdit={(config) => {
              setEditingConnection(config);
              setShowConnectionManager(true);
            }}
            onRefresh={() => appService.loadSchema()}
            onTableClick={handleTableClick}
            onTableDoubleClick={handleOpenTableDetails}
            onViewClick={handleViewClick}
            onShowTopology={handleShowTopology}
            onShowConnectionManager={() => setShowConnectionManager(true)}
          />

          <ResizeHandle
            direction="horizontal"
            className="absolute top-0 right-0 bottom-0"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsSidebarResizing(true);
            }}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-vscode-bg-tertiary border-b border-vscode-border px-4 py-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                {!isConnected ? (
                  <button
                    onClick={() => setShowConnectionManager(true)}
                    className="px-4 py-1.5 bg-vscode-blue hover:bg-vscode-blue-light text-white rounded text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <ConnectIcon className="w-4 h-4" />
                    <span>Connect</span>
                  </button>
                ) : isQueryTabActive ? (
                  <button
                    onClick={async () => {
                      if (!isConnected || isExecuting) return;
                      await executeQuery();
                    }}
                    disabled={!isConnected || isExecuting}
                    className={`px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-2 ${
                      isConnected && !isExecuting
                        ? "bg-vscode-green hover:opacity-90 text-vscode-bg"
                        : "bg-vscode-bg-quaternary text-vscode-text-tertiary cursor-not-allowed"
                    }`}
                  >
                    <PlayIcon className="w-4 h-4" />
                    <span>Run</span>
                    <span className="text-xs opacity-70">
                      ({getShortcut("execute-query")[0] || "⌘+↵"})
                    </span>
                  </button>
                ) : activeDetailsTab ? (
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-medium text-vscode-text">
                      Table Details
                    </span>
                    <span className="text-xs text-vscode-text-tertiary truncate">
                      {activeDetailsTab.schema}.{activeDetailsTab.table}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-vscode-text-secondary">
                    Ready
                  </span>
                )}
              </div>

              {isConnected && (
                <div className="hidden md:flex items-center space-x-2 text-sm">
                  <ConnectedIcon className="w-4 h-4 text-vscode-green" />
                  <span className="text-vscode-text-secondary truncate">
                    Connected to{" "}
                    <span className="text-vscode-green font-medium">
                      {currentConnection?.name}
                    </span>
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <button
                  onClick={createNewTab}
                  className="p-2 hover:bg-vscode-bg-quaternary rounded transition-colors"
                  title="New Tab (⌘+T)"
                >
                  <PlusIcon className="w-4 h-4 text-vscode-text-secondary" />
                </button>

                {isQueryTabActive && (
                  <>
                    <button
                      onClick={handleSaveQuery}
                      disabled={!activeQueryTab?.content?.trim()}
                      className={`p-2 rounded transition-colors ${
                        activeQueryTab?.content?.trim()
                          ? "hover:bg-vscode-bg-quaternary text-vscode-text-secondary"
                          : "text-vscode-text-tertiary cursor-not-allowed"
                      }`}
                      title="Save Query (⌘+S)"
                    >
                      <SaveIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleFormatQuery}
                      disabled={!activeQueryTab?.content?.trim()}
                      className={`p-2 rounded transition-colors ${
                        activeQueryTab?.content?.trim()
                          ? "hover:bg-vscode-bg-quaternary text-vscode-text-secondary"
                          : "text-vscode-text-tertiary cursor-not-allowed"
                      }`}
                      title="Format Query (⇧⌥F)"
                    >
                      <FormatIcon className="w-4 h-4" />
                    </button>

                    <div className="w-px h-4 bg-vscode-border" />
                  </>
                )}

                <button
                  onClick={() => setShowSpotlight(true)}
                  className="p-2 hover:bg-vscode-bg-quaternary rounded transition-colors"
                  title="Search Database Objects (⌘+P)"
                >
                  <SearchIcon className="w-4 h-4 text-vscode-text-secondary" />
                </button>

                {isConnected && isQueryTabActive && (
                  <button
                    onClick={() => setShowQueryHistory(true)}
                    className="p-2 hover:bg-vscode-bg-quaternary rounded transition-colors"
                    title="Query History (⌘+H)"
                  >
                    <HistoryIcon className="w-4 h-4 text-vscode-text-secondary" />
                  </button>
                )}

                {isQueryTabActive && (
                  <button
                    onClick={() => setShowAIQueryDialog(true)}
                    className="p-2 hover:bg-vscode-bg-quaternary rounded transition-colors"
                    title="Create Query with AI (⌘⇧N)"
                  >
                    <BrainIcon className="w-4 h-4 text-vscode-text-secondary" />
                  </button>
                )}
              </div>
            </div>

            {isConnected && (
              <div className="md:hidden flex items-center space-x-2 text-xs text-vscode-text-secondary mt-2">
                <ConnectedIcon className="w-3 h-3 text-vscode-green" />
                <span className="truncate">
                  Connected to{" "}
                  <span className="text-vscode-green font-medium">
                    {currentConnection?.name}
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col min-h-0 main-content-area relative">
            <TabManager
              tabs={tabs}
              activeTabId={activeTabId}
              onTabClick={(tabId) => appService.setActiveTab(tabId)}
              onTabClose={(tabId) => appService.closeTab(tabId)}
              onNewTab={() => appService.createNewTab()}
            />

            {isQueryTabActive ? (
              <>
                <div
                  className="flex-1 min-h-0 bg-vscode-bg"
                  style={{
                    marginBottom: shouldShowResultsPanel
                      ? `${resultsPanelHeight}px`
                      : "0px",
                  }}
                >
                  {activeQueryTab && (
                    <SQLEditor
                      value={activeQueryTab.content}
                      onChange={(content) =>
                        appService.updateTabContent(activeQueryTab.id, content)
                      }
                      onExecute={executeQuery}
                      onExplainQuery={handleExplainQuery}
                      onOptimizeQuery={handleOptimizeQuery}
                      onExplainQueryPlan={explainQuery}
                      onEditorMount={setEditorInstance}
                      schema={schema}
                    />
                  )}
                </div>

                {shouldShowResultsPanel && (
                  <div
                    className="absolute left-0 right-0 h-1 cursor-ns-resize hover:bg-vscode-blue transition-colors z-10 resize-handle"
                    style={{ bottom: `${resultsPanelHeight}px` }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsResizing(true);
                    }}
                  >
                    <div className="absolute inset-x-0 -top-1 -bottom-1" />
                  </div>
                )}

                {shouldShowResultsPanel && (
                  <div
                    className="absolute bottom-0 left-0 right-0 border-t border-vscode-border overflow-hidden bg-vscode-bg-secondary"
                    style={{ height: `${resultsPanelHeight}px` }}
                  >
                    <ResultsGrid result={queryResult} isLoading={isExecuting} />
                  </div>
                )}
              </>
            ) : activeDetailsTab ? (
              <div className="flex-1 min-h-0 bg-vscode-bg overflow-hidden">
                <TableDetailsView
                  schema={activeDetailsTab.schema}
                  table={activeDetailsTab.table}
                  connectionName={currentConnection?.name || ""}
                  onOpenInEditor={handleOpenSqlInNewTab}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0 bg-vscode-bg" />
            )}
          </div>
        </div>

        {rightSidebarView === "topology" && topologyTable && (
          <div className="w-96 bg-vscode-bg-secondary border-l border-vscode-border flex-shrink-0">
            <TableTopology
              schemaName={topologyTable.schema}
              tableName={topologyTable.name}
              onClose={() => {
                setRightSidebarView(null);
                setTopologyTable(null);
              }}
            />
          </div>
        )}

        {showConnectionManager && (
          <ConnectionManager
            onConnect={handleConnect}
            onClose={() => {
              setShowConnectionManager(false);
              setEditingConnection(null);
            }}
            editingConnection={editingConnection}
          />
        )}

        {showQueryHistory && (
          <QueryHistory
            connectionId={currentConnection?.id}
            onQuerySelect={handleQuerySelect}
            onClose={() => setShowQueryHistory(false)}
          />
        )}

        {showPlanVisualizer && queryPlan && (
          <PlanVisualizer
            plan={queryPlan}
            query={planQuery}
            onClose={() => setShowPlanVisualizer(false)}
          />
        )}

        {showKeyboardShortcuts && (
          <KeyboardShortcuts onClose={() => setShowKeyboardShortcuts(false)} />
        )}

        {showAISettings && (
          <AISettings onClose={() => setShowAISettings(false)} />
        )}

        {showAIQueryDialog && (
          <AIQueryDialog
            onClose={() => setShowAIQueryDialog(false)}
            onQueryGenerated={handleAIQueryGenerated}
          />
        )}

        {(aiResult || aiLoading || aiError) && (
          <AIResultDialog
            title={
              aiResult?.type === "explain"
                ? "Query Explanation"
                : "Optimized Query"
            }
            content={aiResult?.content || ""}
            onClose={() => {
              setAIResult(null);
              setAIError(null);
            }}
            onApply={
              aiResult?.type === "optimize"
                ? handleApplyOptimizedQuery
                : undefined
            }
            loading={aiLoading}
            error={aiError}
          />
        )}

        {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}

        {showPreferences && (
          <FunctionalPreferencesDialog
            onClose={() => setShowPreferences(false)}
          />
        )}

        {showSpotlight && (
          <SpotlightSearch
            isOpen={showSpotlight}
            onClose={() => setShowSpotlight(false)}
            connections={connections}
            currentConnection={currentConnection}
            schema={schema}
            onNavigate={handleSpotlightAction}
          />
        )}

        <ErrorNotifications />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <AppContent />
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
