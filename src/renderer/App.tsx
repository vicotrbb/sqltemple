import React, { useState, useEffect } from "react";
import { ConnectionManager } from "./components/ConnectionManager";
import { ConnectionsPanel } from "./components/ConnectionsPanel";
import { SchemaExplorer } from "./components/SchemaExplorer";
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
import {
  DatabaseConnectionConfig,
  DatabaseSchema,
  QueryResult,
} from "../main/database/interfaces";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";

const AppContent: React.FC = () => {
  const [showConnectionManager, setShowConnectionManager] = useState(false);
  const [showQueryHistory, setShowQueryHistory] = useState(false);
  const [showPlanVisualizer, setShowPlanVisualizer] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showAIQueryDialog, setShowAIQueryDialog] = useState(false);
  const [showTableTopology, setShowTableTopology] = useState(false);
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
  const [sidebarView, setSidebarView] = useState<"connections" | "schema">(
    "connections"
  );
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
  const [resultsPanelHeight, setResultsPanelHeight] = useState(256); // 256px = h-64 in tailwind
  const [isResizing, setIsResizing] = useState(false);
  const { getShortcut } = useSettings();

  // Initialize with one tab
  useEffect(() => {
    if (tabs.length === 0) {
      createNewTab();
    }
  }, [tabs.length]);

  // Global keyboard shortcuts (non-editor specific)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // New Tab (Cmd/Ctrl + T)
      if (cmdOrCtrl && e.key === "t") {
        e.preventDefault();
        createNewTab();
      }

      // Close Tab (Cmd/Ctrl + W)
      else if (cmdOrCtrl && e.key === "w") {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
      }

      // Toggle History (Cmd/Ctrl + H)
      else if (cmdOrCtrl && e.key === "h") {
        e.preventDefault();
        setShowQueryHistory(!showQueryHistory);
      }

      // AI: Create Query with AI (Cmd/Ctrl + Shift + N)
      else if (cmdOrCtrl && e.shiftKey && e.key === "N") {
        e.preventDefault();
        setShowAIQueryDialog(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTabId, showQueryHistory]);

  // Handle panel resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const container = document.querySelector(".main-content-area");
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;

      // Limit the height between 100px and 80% of container height
      const minHeight = 100;
      const maxHeight = containerRect.height * 0.8;

      setResultsPanelHeight(
        Math.min(Math.max(newHeight, minHeight), maxHeight)
      );
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.body.classList.remove("resizing");
    };

    if (isResizing) {
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
      document.body.classList.add("resizing");
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

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

  const handleConnect = async (config: DatabaseConnectionConfig) => {
    const result = await window.api.connectDatabase(config);
    if (result.success) {
      setCurrentConnection(config);
      setIsConnected(true);
      setShowConnectionManager(false);

      // Load schema
      await loadSchema();
    } else {
      alert(`Connection failed: ${result.error}`);
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
    // Prevent multiple simultaneous executions
    if (isExecuting) return;

    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (!activeTab) {
      console.error("No active tab found");
      return;
    }

    // Use selected text if provided, otherwise use full content
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
        setQueryResult({
          columns: [],
          rows: [],
          rowCount: 0,
          duration: 0,
          error: result.error || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error executing query:", error);
      setQueryResult({
        columns: [],
        rows: [],
        rowCount: 0,
        duration: 0,
        error: "Failed to execute query",
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

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  return (
    <div className="flex flex-col h-screen bg-vscode-bg text-vscode-text font-sans text-base">
      {/* Title Bar */}
      <TitleBar
        currentConnection={currentConnection}
        currentFile={activeTab?.title}
      />

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <div className="w-64 bg-vscode-bg-secondary border-r border-vscode-border flex-shrink-0 flex flex-col">
          {/* Sidebar Tabs */}
          <div className="flex border-b border-vscode-border">
            <button
              className={`flex-1 px-3 py-2 text-xs font-medium uppercase tracking-wide transition-colors ${
                sidebarView === "connections"
                  ? "text-vscode-text border-b-2 border-vscode-blue"
                  : "text-vscode-text-secondary hover:text-vscode-text"
              }`}
              onClick={() => setSidebarView("connections")}
            >
              Connections
            </button>
            <button
              className={`flex-1 px-3 py-2 text-xs font-medium uppercase tracking-wide transition-colors ${
                sidebarView === "schema"
                  ? "text-vscode-text border-b-2 border-vscode-blue"
                  : "text-vscode-text-secondary hover:text-vscode-text"
              }`}
              onClick={() => setSidebarView("schema")}
            >
              Explorer
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 min-h-0">
            {sidebarView === "connections" ? (
              <ConnectionsPanel
                currentConnection={currentConnection}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onEdit={(config) => {
                  setEditingConnection(config);
                  setShowConnectionManager(true);
                }}
                onRefresh={loadSchema}
              />
            ) : (
              <SchemaExplorer
                schema={schema}
                onTableClick={handleTableClick}
                onViewClick={handleViewClick}
                onRefresh={loadSchema}
                onShowTopology={handleShowTopology}
              />
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="bg-vscode-bg-tertiary border-b border-vscode-border px-4 py-2">
            <div className="flex items-center space-x-3">
              {!isConnected ? (
                <button
                  onClick={() => setShowConnectionManager(true)}
                  className="px-4 py-1.5 bg-vscode-blue hover:bg-vscode-blue-light text-white rounded text-sm font-medium transition-colors"
                >
                  Connect
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-1.5 bg-vscode-bg-quaternary hover:bg-vscode-red hover:bg-opacity-20 rounded text-sm font-medium transition-colors border border-vscode-border"
                  >
                    Disconnect
                  </button>
                  <span style={{ fontSize: "12px", color: "#969696" }}>
                    Connected to:{" "}
                    <span style={{ color: "#4ec9b0", fontWeight: 500 }}>
                      {currentConnection?.name}
                    </span>
                  </span>
                </>
              )}

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
                <span style={{ fontSize: "18px" }}>▶</span>
                <span>Run</span>
                <span style={{ fontSize: "11px", opacity: 0.7 }}>
                  ({getShortcut("execute-query")[0] || "⌘+↵"})
                </span>
              </button>

              {isConnected && (
                <>
                  <button
                    onClick={() => setShowQueryHistory(true)}
                    className="px-4 py-1.5 bg-vscode-bg-quaternary hover:bg-vscode-bg border border-vscode-border rounded text-sm font-medium transition-colors"
                  >
                    History
                  </button>

                  <button
                    onClick={explainQuery}
                    disabled={isExecuting}
                    className="px-4 py-1.5 bg-vscode-purple bg-opacity-20 hover:bg-opacity-30 border border-vscode-purple border-opacity-30 rounded text-sm font-medium transition-colors disabled:bg-vscode-bg-quaternary disabled:border-vscode-border disabled:text-vscode-text-tertiary disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <span>Explain</span>
                    <span style={{ fontSize: "11px", opacity: 0.7 }}>
                      ({getShortcut("explain-query")[0] || "⌘+E"})
                    </span>
                  </button>
                </>
              )}

              <button
                onClick={() => setShowKeyboardShortcuts(true)}
                className="px-4 py-1.5 bg-vscode-bg-quaternary hover:bg-vscode-bg border border-vscode-border rounded text-sm font-medium transition-colors"
                title="Keyboard Shortcuts"
              >
                ⌨️
              </button>

              <div className="h-4 w-px bg-vscode-border"></div>

              <button
                onClick={() => setShowAIQueryDialog(true)}
                className="px-4 py-1.5 bg-vscode-blue bg-opacity-20 hover:bg-opacity-30 border border-vscode-blue border-opacity-30 rounded text-sm font-medium transition-colors flex items-center gap-2"
                title="Create Query with AI"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M11.25 1h-1.5L8 3.75 6.25 1h-1.5L3 3.75 1.25 1H0v.75l2.75 3.5L0 8.75v.75h1.25L3 6.75 4.75 9.5h1.5L8 6.75 9.75 9.5h1.5L13 6.75l1.75 2.75H16v-.75l-2.75-3.5L16 1.75V1h-1.25L13 3.75 11.25 1zM8 5.25L6.25 3h3.5L8 5.25z" />
                </svg>
                Create Query
              </button>

              <button
                onClick={() => setShowAISettings(true)}
                className="px-4 py-1.5 bg-vscode-bg-quaternary hover:bg-vscode-bg border border-vscode-border rounded text-sm font-medium transition-colors"
                title="AI Settings"
              >
                ⚙️ AI
              </button>
            </div>
          </div>

          {/* Editor and Results */}
          <div className="flex-1 flex flex-col min-h-0 main-content-area relative">
            {/* Tab Manager */}
            <TabManager
              tabs={tabs}
              activeTabId={activeTabId}
              onTabClick={setActiveTabId}
              onTabClose={closeTab}
              onNewTab={createNewTab}
            />

            {/* Editor */}
            <div
              className="flex-1 min-h-0 bg-vscode-bg"
              style={{ marginBottom: `${resultsPanelHeight}px` }}
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

            {/* Resize Handle */}
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

            {/* Results Panel */}
            <div
              className="absolute bottom-0 left-0 right-0 border-t border-vscode-border overflow-hidden bg-vscode-bg-secondary"
              style={{ height: `${resultsPanelHeight}px` }}
            >
              <ResultsGrid result={queryResult} isLoading={isExecuting} />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Topology */}
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

        {/* Connection Manager Modal */}
        {showConnectionManager && (
          <ConnectionManager
            onConnect={handleConnect}
            onClose={() => setShowConnectionManager(false)}
          />
        )}

        {/* Query History Modal */}
        {showQueryHistory && (
          <QueryHistory
            connectionId={currentConnection?.id}
            onQuerySelect={handleQuerySelect}
            onClose={() => setShowQueryHistory(false)}
          />
        )}

        {/* Plan Visualizer Modal */}
        {showPlanVisualizer && queryPlan && (
          <PlanVisualizer
            plan={queryPlan}
            query={planQuery}
            onClose={() => setShowPlanVisualizer(false)}
          />
        )}

        {/* Keyboard Shortcuts Modal */}
        {showKeyboardShortcuts && (
          <KeyboardShortcuts onClose={() => setShowKeyboardShortcuts(false)} />
        )}

        {/* AI Settings Modal */}
        {showAISettings && (
          <AISettings onClose={() => setShowAISettings(false)} />
        )}

        {/* AI Query Dialog */}
        {showAIQueryDialog && (
          <AIQueryDialog
            onClose={() => setShowAIQueryDialog(false)}
            onQueryGenerated={handleAIQueryGenerated}
          />
        )}

        {/* AI Result Dialog */}
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
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
};

export default App;
