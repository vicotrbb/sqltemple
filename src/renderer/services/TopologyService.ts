export interface TopologyServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TableRelationship {
  direction: "incoming" | "outgoing";
  constraintName: string;
  sourceSchema: string;
  sourceTable: string;
  sourceColumn: string;
  targetSchema: string;
  targetTable: string;
  targetColumn: string;
  hasMore: boolean;
  children?: any;
}

export interface RelationshipNode {
  table: string;
  schema: string;
  name: string;
  relationships: TableRelationship[];
}

export class TopologyService {
  async getTableRelationships(
    schemaName: string,
    tableName: string,
    depth: number = 3
  ): Promise<TopologyServiceResult<RelationshipNode>> {
    try {
      const result = await window.api.getTableRelationships(schemaName, tableName, depth);
      if (result.success && result.relationships) {
        return { success: true, data: result.relationships };
      } else {
        return { success: false, error: result.error || "Failed to load table relationships" };
      }
    } catch (error) {
      console.error("Failed to load table relationships:", error);
      return { success: false, error: "An unexpected error occurred while loading table relationships." };
    }
  }

  generateMermaidDiagram(topology: RelationshipNode, expandedNodes: Set<string>): string {
    if (!topology) return "";

    const nodes = new Map<string, string>();
    const edges = new Set<string>();
    
    const addNode = (schema: string, table: string, isRoot: boolean = false) => {
      const key = `${schema}.${table}`;
      const nodeId = this.sanitizeNodeId(key);
      const displayName = schema === topology.schema ? table : key;
      
      if (!nodes.has(nodeId)) {
        if (isRoot) {
          nodes.set(nodeId, `${nodeId}["🎯 ${displayName}"]:::root`);
        } else {
          nodes.set(nodeId, `${nodeId}["${displayName}"]`);
        }
      }
      return nodeId;
    };

    const processRelationships = (node: RelationshipNode, nodeKey: string) => {
      const rootNodeId = addNode(node.schema, node.name, true);
      
      if (expandedNodes.has(nodeKey)) {
        node.relationships?.forEach((rel) => {
          if (rel.direction === "outgoing") {
            const targetNodeId = addNode(rel.targetSchema, rel.targetTable);
            const edgeKey = `${rootNodeId} --> ${targetNodeId} : ${rel.sourceColumn}→${rel.targetColumn}`;
            edges.add(edgeKey);
          } else {
            const sourceNodeId = addNode(rel.sourceSchema, rel.sourceTable);
            const edgeKey = `${sourceNodeId} --> ${rootNodeId} : ${rel.sourceColumn}→${rel.targetColumn}`;
            edges.add(edgeKey);
          }
        });
      }
    };

    // Process root node
    processRelationships(topology, `${topology.schema}.${topology.name}`);

    const diagram = [
      "graph TD",
      ...Array.from(nodes.values()),
      ...Array.from(edges),
      "",
      "classDef root fill:#1e40af,stroke:#3b82f6,stroke-width:3px,color:#ffffff;",
      "classDef default fill:#374151,stroke:#6b7280,stroke-width:1px,color:#ffffff;",
    ].join("\n");

    return diagram;
  }

  private sanitizeNodeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, "_");
  }
}

export const topologyService = new TopologyService();