import React, { useState, useEffect } from 'react';
import { ForeignKeyRelationship, RelationshipManager } from './RelationshipManager';

interface RelationshipTooltipProps {
  value: any;
  relationship: ForeignKeyRelationship;
  position: { x: number; y: number };
  visible: boolean;
}

export const RelationshipTooltip: React.FC<RelationshipTooltipProps> = ({ 
  value, 
  relationship, 
  position, 
  visible 
}) => {
  const [relatedData, setRelatedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (visible && value && relationship) {
      setLoading(true);
      RelationshipManager.getRelatedData(value, relationship)
        .then(setRelatedData)
        .finally(() => setLoading(false));
    } else {
      setRelatedData(null);
    }
  }, [visible, value, relationship]);
  
  if (!visible) return null;
  
  return (
    <div 
      className="absolute z-50 bg-vscode-bg border border-vscode-border rounded shadow-lg p-3 min-w-80 max-w-96"
      style={{ left: position.x, top: position.y }}
    >
      <div className="font-semibold mb-2 text-vscode-text">
        {relationship.referencedSchema}.{relationship.referencedTable}.{relationship.referencedColumn}
      </div>
      
      {loading ? (
        <div className="flex items-center text-vscode-text-secondary">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vscode-blue mr-2"></div>
          Loading...
        </div>
      ) : relatedData ? (
        <div className="space-y-1 text-sm max-h-48 overflow-auto">
          {Object.entries(relatedData).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-2">
              <span className="font-medium text-vscode-text truncate">{key}:</span>
              <span className="text-vscode-text-secondary truncate max-w-48" title={String(value)}>
                {value === null || value === undefined ? (
                  <span className="italic">NULL</span>
                ) : (
                  String(value)
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-vscode-text-secondary text-sm">No related data found</div>
      )}
    </div>
  );
};