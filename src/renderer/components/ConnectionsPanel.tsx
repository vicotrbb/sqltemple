import React, { useState, useEffect } from 'react';
import { DatabaseConnectionConfig } from '../../main/database/interfaces';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

interface ConnectionsPanelProps {
  currentConnection: DatabaseConnectionConfig | null;
  onConnect: (config: DatabaseConnectionConfig) => void;
  onDisconnect: () => void;
  onEdit: (config: DatabaseConnectionConfig) => void;
  onRefresh: () => void;
}

export const ConnectionsPanel: React.FC<ConnectionsPanelProps> = ({
  currentConnection,
  onConnect,
  onDisconnect,
  onEdit,
  onRefresh
}) => {
  const [connections, setConnections] = useState<DatabaseConnectionConfig[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [expandedConnections, setExpandedConnections] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    const result = await window.api.getConnections();
    if (result.success && result.connections) {
      setConnections(result.connections);
    }
  };

  const handleConnectionRightClick = (e: React.MouseEvent, conn: DatabaseConnectionConfig) => {
    e.preventDefault();
    const isConnected = currentConnection?.id === conn.id;

    const items: ContextMenuItem[] = [];

    if (isConnected) {
      items.push({
        label: 'Refresh',
        onClick: onRefresh,
        icon: (
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.5 2.5A6.5 6.5 0 0 0 1 7h1.5a5 5 0 1 1 5 5v1.5A6.5 6.5 0 0 0 13.5 2.5z"/>
            <path d="M0 7.5L3 4v7z"/>
          </svg>
        )
      });
      items.push({
        label: 'Disconnect',
        onClick: onDisconnect,
        icon: (
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M1.5 1l1-1h11l1 1v14l-1 1h-11l-1-1v-14zm1 1v12h10V2h-10zm2.5 5.5l1.5-1.5L8 6.5l1.5-1.5 1.5 1.5L9.5 8l1.5 1.5-1.5 1.5L8 9.5 6.5 11 5 9.5 6.5 8 5 6.5z"/>
          </svg>
        )
      });
    } else {
      items.push({
        label: 'Connect',
        onClick: () => onConnect(conn),
        icon: (
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M1.5 1l1-1h11l1 1v14l-1 1h-11l-1-1v-14zm1 1v12h10V2h-10zm5 3h3v1h-3v3h-1v-3h-3v-1h3v-3h1v3z"/>
          </svg>
        )
      });
    }

    items.push({ divider: true });
    
    items.push({
      label: 'Edit Connection',
      onClick: () => onEdit(conn),
      icon: (
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.23 1h-1.46L3.52 9.25l-.16.22L1 13.59 2.41 15l4.12-2.36.22-.16L15 4.23V2.77L13.23 1zM2.41 13.59l1.51-1.51.15.15 1.3 1.3.15.15-1.51 1.51-1.6-1.6zm3.83-2.06L4.47 9.76l8-8 1.77 1.77-8 8z"/>
        </svg>
      )
    });

    items.push({
      label: 'Delete Connection',
      onClick: async () => {
        if (conn.id && confirm(`Delete connection "${conn.name}"?`)) {
          await window.api.deleteConnection(conn.id);
          loadConnections();
        }
      },
      icon: (
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19c.9 0 1.652-.681 1.741-1.576l.66-6.6a.75.75 0 00-1.492-.149l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6z"/>
        </svg>
      ),
      disabled: isConnected
    });

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-vscode-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase text-vscode-text-secondary tracking-wide">Connections</h2>
          <button
            onClick={loadConnections}
            className="text-vscode-text-tertiary hover:text-vscode-text-secondary transition-colors"
            title="Refresh connections"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.5 2.5A6.5 6.5 0 0 0 1 7h1.5a5 5 0 1 1 5 5v1.5A6.5 6.5 0 0 0 13.5 2.5z"/>
              <path d="M0 7.5L3 4v7z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div
          className="flex items-center px-3 py-1 hover:bg-vscode-bg-tertiary cursor-pointer text-sm"
          onClick={() => setExpandedConnections(!expandedConnections)}
        >
          <span className="mr-1 text-vscode-text-tertiary">
            {expandedConnections ? '▼' : '▶'}
          </span>
          <svg className="w-4 h-4 mr-1 text-vscode-orange" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1.5 1l1-1h11l1 1v14l-1 1h-11l-1-1v-14zm1 1v12h10V2h-10zm5.5 2h2v1h-2v-1zm0 3h2v1h-2v-1zm0 3h2v1h-2v-1z"/>
          </svg>
          <span className="flex-1 font-medium">All Connections</span>
          <span className="text-xs text-vscode-text-tertiary">
            ({connections.length})
          </span>
        </div>

        {expandedConnections && (
          <div className="ml-3">
            {connections.map((conn) => {
              const isConnected = currentConnection?.id === conn.id;
              return (
                <div
                  key={conn.id}
                  className={`flex items-center px-3 py-1 hover:bg-vscode-bg-tertiary cursor-pointer text-sm group ${
                    isConnected ? 'text-vscode-green' : ''
                  }`}
                  onClick={() => !isConnected && onConnect(conn)}
                  onContextMenu={(e) => handleConnectionRightClick(e, conn)}
                >
                  <svg className={`w-4 h-4 mr-2 ${isConnected ? 'text-vscode-green' : 'text-vscode-text-tertiary'}`} viewBox="0 0 16 16" fill="currentColor">
                    {isConnected ? (
                      <path d="M1.5 1l1-1h11l1 1v14l-1 1h-11l-1-1v-14zm1 1v12h10V2h-10zm5 3h3v1h-3v3h-1v-3h-3v-1h3v-3h1v3z"/>
                    ) : (
                      <path d="M1.5 1l1-1h11l1 1v14l-1 1h-11l-1-1v-14zm1 1v12h10V2h-10z"/>
                    )}
                  </svg>
                  <div className="flex-1">
                    <div className="font-medium">{conn.name}</div>
                    <div className="text-xs text-vscode-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                      {conn.host}:{conn.port}/{conn.database}
                    </div>
                  </div>
                  {isConnected && (
                    <div className="w-2 h-2 bg-vscode-green rounded-full" title="Connected"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};