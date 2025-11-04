import React from "react";
import { ChevronRightIcon, ChevronDownIcon } from "./icons/IconLibrary";

export interface ExplorerNodeProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  iconColor?: string;
  count?: number;
  isExpanded?: boolean;
  isSelected?: boolean;
  isConnected?: boolean;
  isLoading?: boolean;
  level: number;
  onClick?: () => void;
  onDoubleClick?: (e?: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  hasChildren?: boolean;
}

export const ExplorerNode: React.FC<ExplorerNodeProps> = ({
  id: _id,
  label,
  icon,
  iconColor = "text-vscode-text-secondary",
  count,
  isExpanded = false,
  isSelected = false,
  isConnected = false,
  isLoading = false,
  level,
  onClick,
  onDoubleClick,
  onContextMenu,
  children,
  hasChildren = false,
}) => {
  const paddingLeft = level * 12; // 12px per level

  return (
    <div>
      <div
        className={`flex items-center px-3 py-1 hover:bg-vscode-bg-tertiary cursor-pointer text-sm group ${
          isSelected ? "bg-vscode-bg-quaternary" : ""
        } ${isConnected ? "text-vscode-green" : ""}`}
        style={{ paddingLeft: `${paddingLeft + 12}px` }}
        onClick={onClick}
        onDoubleClick={(e) => {
          if (onDoubleClick) {
            e.stopPropagation();
            onDoubleClick(e);
          }
        }}
        onContextMenu={onContextMenu}
      >
        {hasChildren && (
          <span className="mr-1 text-vscode-text-tertiary w-3 h-3 flex items-center justify-center">
            {isLoading ? (
              <div className="animate-spin rounded-full h-2 w-2 border border-vscode-blue border-t-transparent"></div>
            ) : isExpanded ? (
              <ChevronDownIcon size={12} />
            ) : (
              <ChevronRightIcon size={12} />
            )}
          </span>
        )}

        {!hasChildren && <span className="w-4 mr-1"></span>}

        {icon && (
          <div className={`w-4 h-4 mr-2 ${iconColor} flex-shrink-0`}>
            {icon}
          </div>
        )}

        <span className="flex-1 truncate">{label}</span>

        {count !== undefined && (
          <span className="text-xs text-vscode-text-tertiary ml-2">
            ({count})
          </span>
        )}

        {isConnected && (
          <div
            className="w-2 h-2 bg-vscode-green rounded-full ml-2 flex-shrink-0"
            title="Connected"
          ></div>
        )}
      </div>

      {isExpanded && children && <div>{children}</div>}
    </div>
  );
};
