import React, { useState, useEffect } from 'react';
import { DatabaseConnectionConfig } from '../../main/database/interfaces';

interface ConnectionManagerProps {
  onConnect: (config: DatabaseConnectionConfig) => void;
  onClose: () => void;
}

export const ConnectionManager: React.FC<ConnectionManagerProps> = ({ onConnect, onClose }) => {
  const [connections, setConnections] = useState<DatabaseConnectionConfig[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [isNewConnection, setIsNewConnection] = useState(false);
  const [formData, setFormData] = useState<Partial<DatabaseConnectionConfig>>({
    name: '',
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false
  });

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    const result = await window.api.getConnections();
    if (result.success && result.connections) {
      setConnections(result.connections);
    }
  };

  const handleSave = async () => {
    const config: DatabaseConnectionConfig = {
      ...formData as DatabaseConnectionConfig,
      id: selectedConnectionId || undefined
    };

    const result = await window.api.saveConnection(config);
    if (result.success) {
      await loadConnections();
      setIsNewConnection(false);
      setSelectedConnectionId(result.id || null);
    }
  };

  const handleConnect = async () => {
    let config: DatabaseConnectionConfig;
    
    if (selectedConnectionId) {
      const connection = connections.find(c => c.id === selectedConnectionId);
      if (!connection) return;
      config = connection;
    } else if (isNewConnection) {
      config = formData as DatabaseConnectionConfig;
    } else {
      return;
    }

    onConnect(config);
  };

  const handleDelete = async () => {
    if (!selectedConnectionId) return;
    
    const result = await window.api.deleteConnection(selectedConnectionId);
    if (result.success) {
      await loadConnections();
      setSelectedConnectionId(null);
    }
  };

  const selectConnection = (connection: DatabaseConnectionConfig) => {
    setSelectedConnectionId(connection.id || null);
    setFormData(connection);
    setIsNewConnection(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-vscode-bg-secondary rounded-md shadow-2xl w-[700px] max-h-[85vh] overflow-hidden border border-vscode-border animate-fadeIn">
        <div className="px-6 py-4 border-b border-vscode-border bg-vscode-bg-tertiary">
          <h2 className="text-lg font-medium text-vscode-text">Database Connections</h2>
        </div>
        
        <div className="flex h-[500px]">
          <div className="w-1/3 border-r border-vscode-border overflow-y-auto bg-vscode-bg">
            <div className="p-2">
              <button
                onClick={() => {
                  setIsNewConnection(true);
                  setSelectedConnectionId(null);
                  setFormData({
                    name: '',
                    type: 'postgres',
                    host: 'localhost',
                    port: 5432,
                    database: '',
                    username: '',
                    password: '',
                    ssl: false
                  });
                }}
                className="w-full px-3 py-2 bg-vscode-blue hover:bg-vscode-blue-light text-white rounded text-sm font-medium transition-colors"
              >
                New Connection
              </button>
            </div>
            
            <div className="px-2">
              {connections.map(conn => (
                <div
                  key={conn.id}
                  onClick={() => selectConnection(conn)}
                  className={`p-3 cursor-pointer rounded-md mb-1 transition-colors ${
                    selectedConnectionId === conn.id
                      ? 'bg-vscode-bg-tertiary border border-vscode-blue'
                      : 'hover:bg-vscode-bg-tertiary border border-transparent'
                  }`}
                >
                  <div className="font-medium text-vscode-text">{conn.name}</div>
                  <div className="text-xs text-vscode-text-secondary">
                    {conn.host}:{conn.port}/{conn.database}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 p-6 bg-vscode-bg-secondary">
            {(selectedConnectionId || isNewConnection) && (
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-vscode-text-secondary mb-1">
                    Connection Name
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-vscode-bg text-vscode-text rounded border border-vscode-border focus:border-vscode-blue focus:outline-none transition-colors"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-vscode-text-secondary mb-1">
                      Host
                      <span className="text-xs text-vscode-text-tertiary ml-2">(without https://)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.host || ''}
                      onChange={e => {
                        const host = e.target.value;
                        setFormData({ ...formData, host });
                        // Auto-enable SSL for common cloud providers
                        if (host.includes('supabase.co') || 
                            host.includes('amazonaws.com') || 
                            host.includes('azure.com') ||
                            host.includes('digitalocean.com')) {
                          setFormData(prev => ({ ...prev, ssl: true }));
                        }
                      }}
                      className="w-full px-3 py-2 bg-vscode-bg text-vscode-text rounded border border-vscode-border focus:border-vscode-blue focus:outline-none transition-colors"
                      placeholder="e.g., localhost or db.supabase.co"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-vscode-text-secondary mb-1">
                      Port
                    </label>
                    <input
                      type="number"
                      value={formData.port || ''}
                      onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-vscode-bg text-vscode-text rounded border border-vscode-border focus:border-vscode-blue focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-vscode-text-secondary mb-1">
                    Database
                  </label>
                  <input
                    type="text"
                    value={formData.database || ''}
                    onChange={e => setFormData({ ...formData, database: e.target.value })}
                    className="w-full px-3 py-2 bg-vscode-bg text-vscode-text rounded border border-vscode-border focus:border-vscode-blue focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-vscode-text-secondary mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username || ''}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-vscode-bg text-vscode-text rounded border border-vscode-border focus:border-vscode-blue focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-vscode-text-secondary mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-vscode-bg text-vscode-text rounded border border-vscode-border focus:border-vscode-blue focus:outline-none transition-colors"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ssl"
                    checked={formData.ssl || false}
                    onChange={e => setFormData({ ...formData, ssl: e.target.checked })}
                    className="mr-2 cursor-pointer accent-vscode-blue"
                  />
                  <label htmlFor="ssl" className="text-sm text-vscode-text-secondary cursor-pointer">
                    Use SSL
                  </label>
                </div>
              </form>
            )}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-vscode-border flex justify-between bg-vscode-bg-tertiary">
          <div>
            {selectedConnectionId && !isNewConnection && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-vscode-red bg-opacity-20 hover:bg-opacity-30 text-vscode-red border border-vscode-red border-opacity-30 rounded text-sm font-medium transition-colors"
              >
                Delete
              </button>
            )}
          </div>
          
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-vscode-bg-quaternary hover:bg-vscode-bg text-vscode-text border border-vscode-border rounded text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            
            {(selectedConnectionId || isNewConnection) && (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-vscode-blue hover:bg-vscode-blue-light text-white rounded text-sm font-medium transition-colors"
                >
                  Save
                </button>
                
                <button
                  onClick={handleConnect}
                  className="px-4 py-2 bg-vscode-green hover:opacity-90 text-vscode-bg rounded text-sm font-medium transition-colors"
                >
                  Connect
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};