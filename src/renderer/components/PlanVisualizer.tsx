import React, { useState } from "react";

interface PlanNode {
  "Node Type": string;
  "Relation Name"?: string;
  Alias?: string;
  "Total Cost": number;
  "Plan Rows": number;
  "Plan Width": number;
  "Actual Total Time"?: number;
  "Actual Rows"?: number;
  "Actual Loops"?: number;
  Plans?: PlanNode[];
  [key: string]: any;
}

interface PlanVisualizerProps {
  plan: any;
  query: string;
  onClose: () => void;
}

export const PlanVisualizer: React.FC<PlanVisualizerProps> = ({
  plan,
  query,
  onClose,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"tree" | "raw" | "analysis">("tree");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!plan || !Array.isArray(plan) || plan.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-vscode-text-secondary">
          No execution plan available
        </div>
      </div>
    );
  }

  const planData = plan[0];
  const rootNode = planData.Plan;

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const result = await window.api.aiAnalyzePlan(query, plan);
      if (result.success && result.result) {
        setAnalysis(result.result);
        setViewMode("analysis" as any);
      } else {
        setError(result.error || "Failed to analyze plan");
      }
    } catch (error) {
      console.error("Failed to analyze plan:", error);
      setError("Failed to analyze plan");
    } finally {
      setAnalyzing(false);
    }
  };

  const formatTime = (time?: number) => {
    if (time === undefined) return "N/A";
    return `${time.toFixed(3)}ms`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getNodeColor = (node: PlanNode) => {
    const nodeType = node["Node Type"];
    if (nodeType.includes("Scan")) return "text-vscode-blue";
    if (nodeType.includes("Join")) return "text-vscode-green";
    if (nodeType.includes("Sort")) return "text-vscode-yellow";
    if (nodeType.includes("Aggregate")) return "text-vscode-purple";
    return "text-vscode-text-secondary";
  };

  const renderNode = (
    node: PlanNode,
    depth: number = 0,
    nodeId: string = "0"
  ): React.ReactElement => {
    const hasChildren = node.Plans && node.Plans.length > 0;
    const isExpanded = expandedNodes.has(nodeId);

    return (
      <div key={nodeId} className="mb-2">
        <div
          className={`flex items-start p-3 rounded hover:bg-vscode-bg-tertiary cursor-pointer transition-colors`}
          style={{ marginLeft: depth > 0 ? `${depth * 2}rem` : 0 }}
          onClick={() => hasChildren && toggleNode(nodeId)}
        >
          {hasChildren && (
            <span className="mr-2 text-vscode-text-tertiary">
              {isExpanded ? "▼" : "▶"}
            </span>
          )}

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${getNodeColor(node)}`}>
                {node["Node Type"]}
              </span>
              {node["Relation Name"] && (
                <span className="text-vscode-text-secondary">
                  on {node["Relation Name"]}
                  {node["Alias"] &&
                    node["Alias"] !== node["Relation Name"] &&
                    ` (${node["Alias"]})`}
                </span>
              )}
            </div>

            <div className="mt-1 text-sm text-vscode-text-secondary space-x-4">
              <span>Cost: {node["Total Cost"].toFixed(2)}</span>
              <span>Rows: {formatNumber(node["Plan Rows"])}</span>
              {node["Actual Total Time"] !== undefined && (
                <>
                  <span>Time: {formatTime(node["Actual Total Time"])}</span>
                  <span>
                    Actual Rows: {formatNumber(node["Actual Rows"] || 0)}
                  </span>
                </>
              )}
            </div>

            <div className="mt-1 text-xs text-vscode-text-tertiary">
              {Object.entries(node).map(([key, value]) => {
                if (
                  [
                    "Node Type",
                    "Plans",
                    "Total Cost",
                    "Plan Rows",
                    "Plan Width",
                    "Actual Total Time",
                    "Actual Rows",
                    "Actual Loops",
                    "Relation Name",
                    "Alias",
                  ].includes(key) ||
                  value === null ||
                  value === undefined ||
                  (typeof value === "object" && !Array.isArray(value))
                ) {
                  return null;
                }
                return (
                  <span key={key} className="mr-3">
                    {key}: {JSON.stringify(value)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.Plans!.map((child, index) =>
              renderNode(child, depth + 1, `${nodeId}-${index}`)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-vscode-bg-secondary rounded-md shadow-2xl w-[1000px] max-h-[85vh] overflow-hidden border border-vscode-border animate-fadeIn">
        <div className="px-6 py-4 border-b border-vscode-border bg-vscode-bg-tertiary">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium text-vscode-text">
              Query Execution Plan
            </h2>
            <button
              onClick={onClose}
              className="text-vscode-text-secondary hover:text-vscode-text transition-colors text-xl"
            >
              ✕
            </button>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode("tree")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === "tree"
                    ? "bg-vscode-blue text-white"
                    : "bg-vscode-bg-quaternary text-vscode-text hover:bg-vscode-bg"
                }`}
              >
                Tree View
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === "raw"
                    ? "bg-vscode-blue text-white"
                    : "bg-vscode-bg-quaternary text-vscode-text hover:bg-vscode-bg"
                }`}
              >
                Raw JSON
              </button>
              {analysis && (
                <button
                  onClick={() => setViewMode("analysis")}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    viewMode === "analysis"
                      ? "bg-vscode-blue text-white"
                      : "bg-vscode-bg-quaternary text-vscode-text hover:bg-vscode-bg"
                  }`}
                >
                  AI Analysis
                </button>
              )}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-3 py-1 text-sm bg-vscode-green hover:bg-vscode-green-hover text-white rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M11.25 1h-1.5L8 3.75 6.25 1h-1.5L3 3.75 1.25 1H0v.75l2.75 3.5L0 8.75v.75h1.25L3 6.75 4.75 9.5h1.5L8 6.75 9.75 9.5h1.5L13 6.75l1.75 2.75H16v-.75l-2.75-3.5L16 1.75V1h-1.25L13 3.75 11.25 1zM8 5.25L6.25 3h3.5L8 5.25z" />
                  </svg>
                  Analyze with AI
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {viewMode === "tree" ? (
            <>
              {planData["Execution Time"] && (
                <div className="mb-4 p-3 bg-vscode-bg-tertiary rounded border border-vscode-border">
                  <div className="text-sm space-y-1">
                    <div>
                      Planning Time: {formatTime(planData["Planning Time"])}
                    </div>
                    <div>
                      Execution Time: {formatTime(planData["Execution Time"])}
                    </div>
                    <div>
                      Total Time:{" "}
                      {formatTime(
                        planData["Planning Time"] + planData["Execution Time"]
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="border border-vscode-border rounded p-4 bg-vscode-bg">
                {renderNode(rootNode)}
              </div>

              <div className="mt-4 text-xs text-vscode-text-tertiary bg-vscode-bg-tertiary rounded p-3 border border-vscode-border">
                <p>💡 Click on nodes with children to expand/collapse</p>
                <p className="mt-1">
                  <span className="text-vscode-text-secondary">
                    Node colors:
                  </span>
                  <span className="text-vscode-blue ml-2">Scans</span>
                  <span className="text-vscode-green ml-2">Joins</span>
                  <span className="text-vscode-yellow ml-2">Sorts</span>
                  <span className="text-vscode-purple ml-2">Aggregates</span>
                </p>
              </div>
            </>
          ) : viewMode === "raw" ? (
            <div className="bg-vscode-bg rounded border border-vscode-border p-4">
              <pre className="text-sm font-mono text-vscode-text overflow-x-auto">
                {JSON.stringify(plan, null, 2)}
              </pre>
            </div>
          ) : viewMode === "analysis" && analysis ? (
            <div className="bg-vscode-bg rounded border border-vscode-border p-4">
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm text-vscode-text">
                  {analysis}
                </div>
              </div>
            </div>
          ) : null}

          {error && (
            <div className="mt-4 p-3 bg-vscode-bg-tertiary border border-vscode-red rounded">
              <p className="text-vscode-red text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
