import React from 'react';

interface TitleBarProps {
  currentConnection: any;
  currentFile?: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({ currentConnection, currentFile }) => {
  const title = currentFile || 'SQLTemple';
  const subtitle = currentConnection ? `${currentConnection.name} - ${currentConnection.database}` : 'No connection';

  return (
    <div className="h-8 bg-vscode-bg-tertiary border-b border-vscode-border flex items-center justify-center relative draggable">
      <div className="absolute left-3 w-20" />
      
      <div className="text-center">
        <span className="text-sm text-vscode-text">{title}</span>
        <span className="text-xs text-vscode-text-secondary ml-2">— {subtitle}</span>
      </div>
      
      <div className="absolute right-3 w-20" />
    </div>
  );
};