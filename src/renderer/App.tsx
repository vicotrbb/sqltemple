import React, { useState, useEffect } from "react";
import { ConnectionManager } from "./components/ConnectionManager";
import { UnifiedExplorer } from "./components/UnifiedExplorer";
import { ResizeHandle } from "./components/ResizeHandle";
import { SQLEditor } from "./components/SQLEditor";
import { ResultsGrid } from "./components/ResultsGrid";
import { TabManager, QueryTab } from "./components/TabManager";
import { QueryHistory } from "./components/QueryHistory";
import { PlanVisualizer } from "./components/PlanVisualizer";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import { TitleBar } from "./components/TitleBar";
import { AISettings } from "./components/AISettings";
import { AIQueryDialog } from "./components/AIQueryDialog";
import { AIResultDialog } from "./components/AIResultDialog";
import { TableTopology } from "./components/TableTopology";
import { AboutDialog } from "./components/AboutDialog";
import { FunctionalPreferencesDialog } from "./components/FunctionalPreferencesDialog";
import ErrorBoundary from "./components/ErrorBoundary";
import { useMenuActions, useMenuState } from "./hooks/useMenuActions";
import {
  PlayIcon,
  ConnectIcon,
  HistoryIcon,
  ConnectedIcon,
} from "./components/icons/IconLibrary";
import {
  DatabaseConnectionConfig,
  DatabaseSchema,
  QueryResult,
} from "../main/database/interfaces";
import { ConfigProvider, useSettings } from "./contexts/ConfigContext";
import { useTheme } from "./hooks/useTheme";

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
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : 256;
  });
  const [isSidebarResizing, setIsSidebarResizing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConnection, setCurrentConnection] =
    useState<DatabaseConnectionConfig | null>(null);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [tabs, setTabs] = useState<QueryTab[]>([]);
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
  const { getShortcut } = useSettings();
  const { updateMenuState } = useMenuState();
  const theme = useTheme();

  useEffect(() => {
    if (tabs.length === 0) {
      createNewTab();
    }
  }, [tabs.length]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Helper function to check if shortcut matches
      const matchesShortcut = (shortcutId: string) => {
        const shortcuts = getShortcut(shortcutId);
        return shortcuts.some(shortcut => {
          const keys = shortcut.toLowerCase().split('+');
          const hasCmd = keys.includes('cmd') || keys.includes('ctrl');
          const hasShift = keys.includes('shift');
          const hasAlt = keys.includes('alt');
          const mainKey = keys.find(k => !['cmd', 'ctrl', 'shift', 'alt'].includes(k));
          
          // Special handling for function keys
          if (mainKey?.startsWith('f') && mainKey.length <= 3) {
            return hasCmd === cmdOrCtrl && 
                   hasShift === e.shiftKey && 
                   hasAlt === e.altKey &&
                   mainKey === e.key.toLowerCase();
          }
          
          return hasCmd === cmdOrCtrl && 
                 hasShift === e.shiftKey && 
                 hasAlt === e.altKey &&
                 mainKey === e.key.toLowerCase();
        });
      };

      // Tab management
      if (matchesShortcut('new-tab')) {
        e.preventDefault();
        createNewTab();
      }
      else if (matchesShortcut('close-tab')) {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
      }
      else if (matchesShortcut('duplicate-tab')) {
        e.preventDefault();
        if (activeTabId) {
          duplicateTab(activeTabId);
        }
      }
      else if (matchesShortcut('next-tab')) {
        e.preventDefault();
        navigateToNextTab();
      }
      else if (matchesShortcut('previous-tab')) {
        e.preventDefault();
        navigateToPreviousTab();
      }
      
      // Panel toggles
      else if (matchesShortcut('toggle-history')) {
        e.preventDefault();
        setShowQueryHistory(!showQueryHistory);
      }
      else if (matchesShortcut('toggle-connections')) {
        e.preventDefault();
        // Toggle connections will now just refresh the explorer
        refreshSchema();
      }
      else if (matchesShortcut('toggle-schema')) {
        e.preventDefault();
        // Toggle schema will now just refresh the explorer
        refreshSchema();
      }
      
      // Connection management
      else if (matchesShortcut('connect-database')) {
        e.preventDefault();
        setShowConnectionManager(true);
      }
      else if (matchesShortcut('disconnect-database')) {
        e.preventDefault();
        if (isConnected) {
          handleDisconnect();
        }
      }
      else if (matchesShortcut('refresh-schema')) {
        e.preventDefault();
        if (isConnected) {
          refreshSchema();
        }
      }
      
      // AI operations
      else if (matchesShortcut('create-query-ai')) {
        e.preventDefault();
        setShowAIQueryDialog(true);
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

        const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
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
        localStorage.setItem('sidebarWidth', sidebarWidth.toString());
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
    setTabs((prevTabs) => {
      const newTab: QueryTab = {
        id: `tab-${Date.now()}`,
        title: `Query ${prevTabs.length + 1}`,
        content: "",
        isDirty: false,
      };
      setActiveTabId(newTab.id);
      return [...prevTabs, newTab];
    });
  };

  const updateTabContent = (tabId: string, content: string) => {
    setTabs(
      tabs.map((tab) =>
        tab.id === tabId ? { ...tab, content, isDirty: true } : tab
      )
    );
  };

  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    } else if (newTabs.length === 0) {
      createNewTab();
    }
  };

  const duplicateTab = (tabId: string) => {
    const tabToDuplicate = tabs.find(tab => tab.id === tabId);
    if (!tabToDuplicate) return;
    
    const newTab: QueryTab = {
      id: Date.now().toString(),
      title: `${tabToDuplicate.title} (Copy)`,
      content: tabToDuplicate.content,
      isDirty: false
    };
    
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const navigateToNextTab = () => {
    if (tabs.length <= 1) return;
    
    const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTabId(tabs[nextIndex].id);
  };

  const navigateToPreviousTab = () => {
    if (tabs.length <= 1) return;
    
    const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
    const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    setActiveTabId(tabs[prevIndex].id);
  };

  const refreshSchema = async () => {
    await loadSchema();
  };

  const handleConnect = async (config: DatabaseConnectionConfig) => {
    try {
      const result = await window.api.connectDatabase(config);
      if (result.success) {
        setCurrentConnection(config);
        setIsConnected(true);
        setShowConnectionManager(false);

        await loadSchema();
      } else {
        const errorMessage = result.error || "Unknown connection error";
        let userMessage = "Connection failed";
        
        if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("ECONNREFUSED")) {
          userMessage = "Cannot reach the database server. Please check the host and port.";
        } else if (errorMessage.includes("authentication failed")) {
          userMessage = "Authentication failed. Please check your username and password.";
        } else if (errorMessage.includes("database") && errorMessage.includes("does not exist")) {
          userMessage = "The specified database does not exist.";
        } else if (errorMessage.includes("timeout")) {
          userMessage = "Connection timed out. The server may be slow or unreachable.";
        } else {
          userMessage = `Connection failed: ${errorMessage}`;
        }
        
        alert(userMessage);
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("An unexpected error occurred while connecting to the database.");
    }
  };

  const handleDisconnect = async () => {
    const result = await window.api.disconnectDatabase();
    if (result.success) {
      setIsConnected(false);
      setCurrentConnection(null);
      setSchema(null);
      setQueryResult(null);
    }
  };

  const loadSchema = async () => {
    const result = await window.api.getSchemaInfo();
    if (result.success && result.schema) {
      setSchema(result.schema);
    }
  };

  const executeQuery = async (selectedText?: string) => {
    if (isExecuting) return;

    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (!activeTab) {
      console.error("No active tab found");
      return;
    }

    const queryToExecute = selectedText || activeTab.content;
    if (!queryToExecute.trim()) {
      console.log("No query to execute");
      return;
    }

    try {
      setIsExecuting(true);
      const result = await window.api.executeQuery(queryToExecute);

      if (result.success && result.result) {
        setQueryResult(result.result);
      } else {
        const errorMessage = result.error || "Unknown error";
        let userFriendlyError = errorMessage;

        if (errorMessage.includes("syntax error")) {
          userFriendlyError = "SQL syntax error. Please check your query syntax.";
        } else if (errorMessage.includes("permission denied")) {
          userFriendlyError = "Permission denied. You don't have rights to perform this operation.";
        } else if (errorMessage.includes("relation") && errorMessage.includes("does not exist")) {
          userFriendlyError = "Table or column not found. Please check the table and column names.";
        } else if (errorMessage.includes("connection")) {
          userFriendlyError = "Database connection lost. Please reconnect and try again.";
        } else if (errorMessage.includes("timeout")) {
          userFriendlyError = "Query execution timed out. The query may be too complex.";
        }

        setQueryResult({
          columns: [],
          rows: [],
          rowCount: 0,
          duration: 0,
          error: userFriendlyError,
        });
      }
    } catch (error) {
      console.error("Error executing query:", error);
      setQueryResult({
        columns: [],
        rows: [],
        rowCount: 0,
        duration: 0,
        error: "An unexpected error occurred while executing the query",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTableClick = (tableName: string, schemaName: string) => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (activeTab) {
      const newContent =
        activeTab.content +
        (activeTab.content && !activeTab.content.endsWith("\n") ? "\n" : "") +
        `SELECT * FROM ${schemaName}.${tableName} LIMIT 100;`;
      updateTabContent(activeTab.id, newContent);
    }
  };

  const handleViewClick = (viewName: string, schemaName: string) => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (activeTab) {
      const newContent =
        activeTab.content +
        (activeTab.content && !activeTab.content.endsWith("\n") ? "\n" : "") +
        `SELECT * FROM ${schemaName}.${viewName} LIMIT 100;`;
      updateTabContent(activeTab.id, newContent);
    }
  };

  const handleQuerySelect = (query: string) => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (activeTab) {
      updateTabContent(activeTab.id, query);
    }
    setShowQueryHistory(false);
  };

  const explainQuery = async () => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (!activeTab || !activeTab.content.trim()) return;

    setIsExecuting(true);
    const result = await window.api.getQueryPlan(activeTab.content);

    if (result.success && result.plan) {
      setQueryPlan(result.plan);
      setPlanQuery(activeTab.content);
      setShowPlanVisualizer(true);
    } else {
      alert(`Failed to get query plan: ${result.error}`);
    }

    setIsExecuting(false);
  };

  const handleExplainQuery = async (selectedText: string) => {
    setAILoading(true);
    setAIError(null);
    setAIResult(null);

    try {
      const result = await window.api.aiExplainQuery(selectedText);
      if (result.success && result.result) {
        setAIResult({ type: "explain", content: result.result });
      } else {
        setAIError(result.error || "Failed to explain query");
      }
    } catch (err) {
      setAIError("Failed to explain query");
    } finally {
      setAILoading(false);
    }
  };

  const handleOptimizeQuery = async (selectedText: string) => {
    setAILoading(true);
    setAIError(null);
    setAIResult(null);

    try {
      const result = await window.api.aiOptimizeQuery(selectedText);
      if (result.success && result.result) {
        setAIResult({
          type: "optimize",
          content: result.result,
          query: selectedText,
        });
      } else {
        setAIError(result.error || "Failed to optimize query");
      }
    } catch (err) {
      setAIError("Failed to optimize query");
    } finally {
      setAILoading(false);
    }
  };

  const handleAIQueryGenerated = (query: string) => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (activeTab) {
      const newContent =
        activeTab.content +
        (activeTab.content && !activeTab.content.endsWith("\n") ? "\n\n" : "") +
        query;
      updateTabContent(activeTab.id, newContent);
    }
  };

  const handleApplyOptimizedQuery = (optimizedQuery: string) => {
    if (aiResult?.query) {
      const activeTab = tabs.find((tab) => tab.id === activeTabId);
      if (activeTab) {
        const newContent = activeTab.content.replace(
          aiResult.query,
          optimizedQuery
        );
        updateTabContent(activeTab.id, newContent);
      }
    }
    setAIResult(null);
  };

  const handleShowTopology = (tableName: string, schemaName: string) => {
    setTopologyTable({ name: tableName, schema: schemaName });
    setShowTableTopology(true);
    setRightSidebarView("topology");
  };

  const handleOpenQuery = async () => {
    try {
      const result = await window.api.openQueryFile();
      if (result.success && result.content && activeTabId) {
        updateTabContent(activeTabId, result.content);
        
        if (result.fileName) {
          setTabs(prevTabs => 
            prevTabs.map(tab => 
              tab.id === activeTabId 
                ? { ...tab, title: result.fileName!, isDirty: false }
                : tab
            )
          );
        }
      } else if (!result.canceled && result.error) {
        alert(`Failed to open file: ${result.error}`);
      }
    } catch (error) {
      console.error("Error opening file:", error);
      alert("An unexpected error occurred while opening the file.");
    }
  };

  const handleSaveQuery = async () => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (!activeTab?.content?.trim()) return;
    
    try {
      const result = await window.api.saveQueryFile(activeTab.content);
      if (result.success && result.fileName) {
        setTabs(prevTabs => 
          prevTabs.map(tab => 
            tab.id === activeTabId 
              ? { ...tab, title: result.fileName!, isDirty: false }
              : tab
          )
        );
      } else if (!result.canceled && result.error) {
        alert(`Failed to save file: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving file:", error);
      alert("An unexpected error occurred while saving the file.");
    }
  };

  const handleSaveQueryAs = async () => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (!activeTab?.content?.trim()) return;
    
    try {
      const result = await window.api.saveQueryFileAs(activeTab.content);
      if (result.success && result.fileName) {
        setTabs(prevTabs => 
          prevTabs.map(tab => 
            tab.id === activeTabId 
              ? { ...tab, title: result.fileName!, isDirty: false }
              : tab
          )
        );
      } else if (!result.canceled && result.error) {
        alert(`Failed to save file: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving file:", error);
      alert("An unexpected error occurred while saving the file.");
    }
  };

  const handleImportConnections = async () => {
    try {
      const result = await window.api.importConnections();
      if (result.success && result.connections) {
        let importedCount = 0;
        for (const connection of result.connections) {
          try {
            await window.api.saveConnection(connection);
            importedCount++;
          } catch (error) {
            console.warn("Failed to import connection:", connection.name, error);
          }
        }
        
        if (importedCount > 0) {
          alert(`Successfully imported ${importedCount} connection(s).`);
        } else {
          alert("No connections were imported. Please check the file format.");
        }
      } else if (!result.canceled && result.error) {
        alert(`Failed to import connections: ${result.error}`);
      }
    } catch (error) {
      console.error("Error importing connections:", error);
      alert("An unexpected error occurred while importing connections.");
    }
  };

  const handleExportConnections = async () => {
    try {
      const result = await window.api.exportConnections();
      if (result.success) {
        alert(`Successfully exported ${result.count} connection(s) to ${result.filePath}`);
      } else if (!result.canceled && result.error) {
        alert(`Failed to export connections: ${result.error}`);
      }
    } catch (error) {
      console.error('Error exporting connections:', error);
      alert('An unexpected error occurred while exporting connections.');
    }
  };

  const handleFind = () => {
    if (editorInstance) {
      editorInstance.getAction('actions.find')?.run();
    }
  };

  const handleReplace = () => {
    if (editorInstance) {
      editorInstance.getAction('editor.action.startFindReplaceAction')?.run();
    }
  };

  const handleFormatQuery = () => {
    if (editorInstance) {
      editorInstance.getAction('editor.action.formatDocument')?.run();
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
        const selectedText = editorInstance.getModel()?.getValueInRange(selection);
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
        const selectedText = editorInstance.getModel()?.getValueInRange(selection);
        if (selectedText?.trim()) {
          handleExplainQuery(selectedText);
        }
      } else {
        const activeTab = tabs.find(tab => tab.id === activeTabId);
        if (activeTab?.content?.trim()) {
          handleExplainQuery(activeTab.content);
        }
      }
    }
  };

  const handleAIOptimizeQuery = () => {
    if (editorInstance) {
      const selection = editorInstance.getSelection();
      if (selection && !selection.isEmpty()) {
        const selectedText = editorInstance.getModel()?.getValueInRange(selection);
        if (selectedText?.trim()) {
          handleOptimizeQuery(selectedText);
        }
      } else {
        const activeTab = tabs.find(tab => tab.id === activeTabId);
        if (activeTab?.content?.trim()) {
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
    onRefreshSchema: loadSchema,
    onExecuteQuery: () => executeQuery(),
    onExecuteSelected: handleExecuteSelected,
    onExplainQuery: explainQuery,

    onAICreateQuery: () => setShowAIQueryDialog(true),
    onAIExplainQuery: handleAIExplainQuery,
    onAIOptimizeQuery: handleAIOptimizeQuery,
    onAISettings: () => setShowPreferences(true),

    onCloseTab: () => activeTabId && closeTab(activeTabId),
    onNextTab: () => {
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
      const nextIndex = (currentIndex + 1) % tabs.length;
      if (tabs[nextIndex]) setActiveTabId(tabs[nextIndex].id);
    },
    onPreviousTab: () => {
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
      const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      if (tabs[prevIndex]) setActiveTabId(tabs[prevIndex].id);
    },

    onShowKeyboardShortcuts: () => setShowKeyboardShortcuts(true),
    onShowAbout: () => setShowAbout(true),
  });

  const [hasSelectedText, setHasSelectedText] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (editorInstance) {
      const selectionListener = editorInstance.onDidChangeCursorSelection((e: any) => {
        setHasSelectedText(!e.selection.isEmpty());
      });

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
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    updateMenuState({
      isConnected,
      hasActiveQuery: Boolean(activeTab?.content?.trim()),
      hasSelectedText,
      canUndo,
      canRedo,
    });
  }, [isConnected, activeTabId, tabs, hasSelectedText, canUndo, canRedo, updateMenuState]);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

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
            onRefresh={loadSchema}
            onTableClick={handleTableClick}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {!isConnected ? (
                  <button
                    onClick={() => setShowConnectionManager(true)}
                    className="px-4 py-1.5 bg-vscode-blue hover:bg-vscode-blue-light text-white rounded text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <ConnectIcon className="w-4 h-4" />
                    <span>Connect</span>
                  </button>
                ) : (
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
                )}
              </div>

              {isConnected && (
                <div className="flex items-center space-x-2 text-sm">
                  <ConnectedIcon className="w-4 h-4 text-vscode-green" />
                  <span className="text-vscode-text-secondary">
                    Connected to{" "}
                    <span className="text-vscode-green font-medium">
                      {currentConnection?.name}
                    </span>
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                {isConnected && (
                  <button
                    onClick={() => setShowQueryHistory(true)}
                    className="p-2 hover:bg-vscode-bg-quaternary rounded transition-colors"
                    title="Query History (⌘+H)"
                  >
                    <HistoryIcon className="w-4 h-4 text-vscode-text-secondary" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 main-content-area relative">
            <TabManager
              tabs={tabs}
              activeTabId={activeTabId}
              onTabClick={setActiveTabId}
              onTabClose={closeTab}
              onNewTab={createNewTab}
            />

            <div
              className="flex-1 min-h-0 bg-vscode-bg"
              style={{ marginBottom: showResultsPanel ? `${resultsPanelHeight}px` : '0px' }}
            >
              {activeTab && (
                <SQLEditor
                  value={activeTab.content}
                  onChange={(content) =>
                    updateTabContent(activeTab.id, content)
                  }
                  onExecute={executeQuery}
                  onExplainQuery={handleExplainQuery}
                  onOptimizeQuery={handleOptimizeQuery}
                  onEditorMount={setEditorInstance}
                  schema={schema}
                />
              )}
            </div>

            {showResultsPanel && (
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

            {showResultsPanel && (
              <div
                className="absolute bottom-0 left-0 right-0 border-t border-vscode-border overflow-hidden bg-vscode-bg-secondary"
                style={{ height: `${resultsPanelHeight}px` }}
              >
                <ResultsGrid result={queryResult} isLoading={isExecuting} />
              </div>
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
          <FunctionalPreferencesDialog onClose={() => setShowPreferences(false)} />
        )}
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
