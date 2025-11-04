import React, { useState, useEffect, useRef, useCallback } from "react";
import mermaid from "mermaid";
import { topologyService, RelationshipNode } from "../services/TopologyService";

interface TableTopologyProps {
  schemaName: string;
  tableName: string;
  onClose?: () => void;
  isModal?: boolean;
}

let mermaidInitialized = false;

const initializeMermaid = () => {
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        primaryColor: "#1e1e1e",
        primaryTextColor: "#cccccc",
        primaryBorderColor: "#3c3c3c",
        lineColor: "#5a5a5a",
        secondaryColor: "#252526",
        tertiaryColor: "#2d2d30",
        background: "#1e1e1e",
        mainBkg: "#252526",
        secondBkg: "#2d2d30",
        tertiaryBkg: "#3c3c3c",
        secondaryBorderColor: "#5a5a5a",
        tertiaryBorderColor: "#6a6a6a",
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        fontSize: "14px",
      },
      flowchart: {
        htmlLabels: true,
        curve: "basis",
        padding: 20,
      },
    });
    mermaidInitialized = true;
  }
};

export const TableTopology: React.FC<TableTopologyProps> = ({
  schemaName,
  tableName,
  onClose,
  isModal = false,
}) => {
  const [topology, setTopology] = useState<RelationshipNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [showInModal, setShowInModal] = useState(isModal);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mermaidRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initializeMermaid();
  }, []);

  useEffect(() => {
    loadInitialTopology();
  }, [loadInitialTopology]);

  useEffect(() => {
    if (topology && mermaidRef.current) {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }

      renderTimeoutRef.current = setTimeout(() => {
        renderMermaidDiagram();
      }, 100);
    }

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [expandedNodes, renderMermaidDiagram, topology]);

  const loadInitialTopology = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await topologyService.getTableRelationships(
      schemaName,
      tableName,
      3
    );
    if (result.success && result.data) {
      setTopology(result.data);
    } else {
      setError(result.error || "Failed to load table relationships");
    }
    setLoading(false);
  }, [schemaName, tableName]);

  const updateNodeRelationships = useCallback(
    (node: any, targetKey: string, newData: any): boolean => {
      if (node.table === targetKey) {
        node.relationships = newData.relationships;
        return true;
      }

      if (node.relationships) {
        for (const rel of node.relationships) {
          if (
            rel.children &&
            updateNodeRelationships(rel.children, targetKey, newData)
          ) {
            return true;
          }
        }
      }

      return false;
    },
    []
  );

  const loadMoreRelationships = useCallback(
    async (nodeKey: string, nodeSchema: string, nodeName: string) => {
      setLoadingNodes((prev) => new Set(prev).add(nodeKey));

      try {
        const result = await topologyService.getTableRelationships(
          nodeSchema,
          nodeName,
          3
        );
        if (result.success && result.data) {
          setTopology((prevTopology) => {
            if (!prevTopology) return prevTopology;

            const newTopology = JSON.parse(JSON.stringify(prevTopology));
            updateNodeRelationships(newTopology, nodeKey, result.data);
            return newTopology;
          });

          setExpandedNodes((prev) => new Set(prev).add(nodeKey));
        } else {
          console.error("Failed to load more relationships:", result.error);
        }
      } catch (err) {
        console.error("Failed to load more relationships:", err);
      } finally {
        setLoadingNodes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(nodeKey);
          return newSet;
        });
      }
    },
    [updateNodeRelationships]
  );

  const generateMermaidCode = useCallback(
    (
      node: RelationshipNode,
      visitedNodes: Set<string> = new Set(),
      depth: number = 0
    ): string => {
      const lines: string[] = [];

      if (depth === 0) {
        lines.push("graph TD");
        lines.push(
          `  ${sanitizeNodeId(node.table)}[${sanitizeLabel(
            node.name
          )}<br/>${sanitizeLabel(node.schema)}]`
        );
        lines.push(
          `  style ${sanitizeNodeId(
            node.table
          )} fill:#0e639c,stroke:#1177bb,color:#fff`
        );
      }

      visitedNodes.add(node.table);

      for (const rel of node.relationships) {
        const sourceKey = `${rel.sourceSchema}.${rel.sourceTable}`;
        const targetKey = `${rel.targetSchema}.${rel.targetTable}`;
        const sourceId = sanitizeNodeId(sourceKey);
        const targetId = sanitizeNodeId(targetKey);

        if (!visitedNodes.has(sourceKey) && sourceKey !== node.table) {
          lines.push(
            `  ${sourceId}[${sanitizeLabel(rel.sourceTable)}<br/>${sanitizeLabel(
              rel.sourceSchema
            )}]`
          );
          visitedNodes.add(sourceKey);
        }
        if (!visitedNodes.has(targetKey) && targetKey !== node.table) {
          lines.push(
            `  ${targetId}[${sanitizeLabel(rel.targetTable)}<br/>${sanitizeLabel(
              rel.targetSchema
            )}]`
          );
          visitedNodes.add(targetKey);
        }

        const label = `${sanitizeLabel(rel.sourceColumn)} → ${sanitizeLabel(
          rel.targetColumn
        )}`;
        if (rel.direction === "outgoing") {
          lines.push(`  ${sourceId} -->|${label}| ${targetId}`);
        } else {
          lines.push(`  ${sourceId} -->|${label}| ${targetId}`);
          lines.push(
            `  style ${sourceId} fill:#16825d,stroke:#1ea271,color:#fff`
          );
        }

        if (
          rel.hasMore &&
          !expandedNodes.has(targetKey) &&
          !loadingNodes.has(targetKey)
        ) {
          const expandId = `expand_${targetId}`;
          lines.push(`  ${targetId} --> ${expandId}[+]`);
          lines.push(
            `  style ${expandId} fill:#3c3c3c,stroke:#5a5a5a,color:#fff,cursor:pointer`
          );
          lines.push(
            `  click ${expandId} expandNode_${sanitizeNodeId(targetKey)}`
          );
        }

        if (rel.children && expandedNodes.has(targetKey)) {
          const childLines = generateMermaidCode(
            rel.children,
            visitedNodes,
            depth + 1
          );
          lines.push(
            ...childLines
              .split("\n")
              .filter((line) => line && !line.startsWith("graph"))
          );
        }
      }
      return lines.join("\n");
    },
    [expandedNodes, loadingNodes, sanitizeLabel, sanitizeNodeId]
  );

  const sanitizeNodeId = useCallback((id: string): string => {
    return id.replace(/[^a-zA-Z0-9_]/g, "_");
  }, []);

  const sanitizeLabel = useCallback((label: string): string => {
    return label
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\|/g, "&#124;")
      .replace(/\{/g, "&#123;")
      .replace(/\}/g, "&#125;")
      .replace(/\[/g, "&#91;")
      .replace(/\]/g, "&#93;")
      .replace(/\(/g, "&#40;")
      .replace(/\)/g, "&#41;");
  }, []);

  const renderMermaidDiagram = useCallback(async () => {
    if (!mermaidRef.current || !topology) return;

    try {
      const mermaidCode = generateMermaidCode(topology);

      mermaidRef.current.innerHTML = "";

      const containerDiv = document.createElement("div");
      containerDiv.className = "mermaid";
      containerDiv.textContent = mermaidCode;
      mermaidRef.current.appendChild(containerDiv);

      initializeMermaid();

      await mermaid.run({
        querySelector: ".mermaid",
      });

      topology.relationships.forEach((rel) => {
        const targetKey =
          rel.direction === "outgoing"
            ? `${rel.targetSchema}.${rel.targetTable}`
            : `${rel.sourceSchema}.${rel.sourceTable}`;

        if (rel.hasMore && !expandedNodes.has(targetKey)) {
          (window as any)[`expandNode_${sanitizeNodeId(targetKey)}`] = () => {
            const [schema, table] = targetKey.split(".");
            loadMoreRelationships(targetKey, schema, table);
          };
        }
      });

      setError(null);
    } catch (err) {
      console.error("Mermaid rendering error:", err);
      if (!error) {
        setError("Failed to render diagram. Please click retry.");
      }
    }
  }, [
    error,
    expandedNodes,
    generateMermaidCode,
    loadMoreRelationships,
    sanitizeNodeId,
    topology,
  ]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prevZoom) => Math.min(Math.max(prevZoom * delta, 0.1), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleRetry = async () => {
    setError(null);
    if (topology) {
      await renderMermaidDiagram();
    } else {
      await loadInitialTopology();
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-vscode-blue border-t-transparent"></div>
            <span className="text-vscode-text">Loading table topology...</span>
          </div>
        </div>
      );
    }

    if (error && !topology) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-vscode-red mb-4">{error}</div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-vscode-button-bg hover:bg-vscode-button-hover text-vscode-button-text rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-2 border-b border-vscode-border">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium">Topology: {tableName}</h3>
            {!isModal && (
              <button
                onClick={() => setShowInModal(true)}
                className="p-1 hover:bg-vscode-bg-tertiary rounded transition-colors"
                title="Open in modal"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M3 1h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H3z" />
                  <path d="M12 8H8V4h1v3h3v1z" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={resetView}
              className="p-1 hover:bg-vscode-bg-tertiary rounded transition-colors"
              title="Reset view"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0z" />
                <path d="M8 5a.5.5 0 0 1 .5.5v2.793l1.146 1.147a.5.5 0 0 1-.707.707l-1.293-1.293A.5.5 0 0 1 7.5 8.5v-3A.5.5 0 0 1 8 5z" />
              </svg>
            </button>
            <span className="text-xs text-vscode-text-tertiary">
              {Math.round(zoom * 100)}%
            </span>
            {error && topology && (
              <button
                onClick={handleRetry}
                className="px-2 py-1 text-xs bg-vscode-yellow bg-opacity-20 hover:bg-opacity-30 text-vscode-yellow rounded transition-colors"
              >
                Retry Render
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-vscode-bg-tertiary rounded transition-colors"
                title="Close"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.647 3.646.708.708L8 8.707z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative bg-vscode-bg cursor-move"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            ref={mermaidRef}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center",
              transition: isDragging ? "none" : "transform 0.1s",
            }}
          />
        </div>

        <div className="p-2 border-t border-vscode-border text-xs text-vscode-text-tertiary">
          <p>
            💡 Blue: Current table and outgoing references | Green: Incoming
            references
          </p>
          <p>
            🖱️ Scroll to zoom | Drag to pan | Click "+" to expand relationships
          </p>
        </div>
      </div>
    );
  };

  if (showInModal && !isModal) {
    return (
      <>
        {renderContent()}
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 modal-backdrop">
          <div className="bg-vscode-bg-secondary rounded-md shadow-2xl w-[90vw] h-[85vh] overflow-hidden border border-vscode-border animate-fadeIn">
            <TableTopology
              schemaName={schemaName}
              tableName={tableName}
              onClose={() => setShowInModal(false)}
              isModal={true}
            />
          </div>
        </div>
      </>
    );
  }

  return renderContent();
};
