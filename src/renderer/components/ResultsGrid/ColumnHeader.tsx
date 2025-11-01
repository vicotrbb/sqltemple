import React, { useState } from "react";
import { ColumnInfo } from "../../../main/database/interfaces";
import { getColumnTypeInfo } from "./ColumnTypeMapping";

interface ColumnMetadata extends ColumnInfo {
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isIndexed?: boolean;
  defaultValue?: string;
  maxLength?: number;
  precision?: number;
  scale?: number;
}

interface ColumnHeaderProps {
  column: ColumnMetadata;
  width: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onStatsHover: (e: React.MouseEvent) => void;
  onStatsLeave: () => void;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  column,
  width,
  onMouseDown,
  onStatsHover,
  onStatsLeave,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const typeInfo = getColumnTypeInfo(column.dataType);

  const indicators = [];

  if (column.isPrimaryKey) {
    indicators.push({
      icon: "🔑",
      label: "Primary Key",
      color: "text-yellow-500",
    });
  }
  if (column.isForeignKey) {
    indicators.push({
      icon: "🔗",
      label: "Foreign Key",
      color: "text-blue-500",
    });
  }
  if (column.isIndexed) {
    indicators.push({ icon: "📇", label: "Indexed", color: "text-green-500" });
  }
  if (!column.nullable) {
    indicators.push({ icon: "🛡️", label: "Not Null", color: "text-red-500" });
  }

  return (
    <div
      className="relative flex items-center justify-between px-4 py-2 text-left font-medium text-vscode-text border-r border-vscode-border last:border-r-0 bg-vscode-bg-quaternary"
      style={{ width, minWidth: width, maxWidth: width }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onStatsHover(e);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onStatsLeave();
      }}
    >
      <div className="flex items-center space-x-2 min-w-0 flex-1">
        <span className="text-xs">{typeInfo.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{column.name}</div>
          <div className="text-xs text-vscode-text-tertiary truncate">
            {typeInfo.displayName}
            {column.maxLength && ` (${column.maxLength})`}
            {column.precision &&
              column.scale &&
              ` (${column.precision},${column.scale})`}
          </div>
        </div>

        {indicators.length > 0 && (
          <div className="flex space-x-1">
            {indicators.map((indicator, index) => (
              <span
                key={index}
                className={`text-xs ${indicator.color}`}
                title={indicator.label}
              >
                {indicator.icon}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-vscode-blue ${
          isHovered ? "bg-vscode-blue bg-opacity-50" : ""
        }`}
        onMouseDown={onMouseDown}
      />
    </div>
  );
};
