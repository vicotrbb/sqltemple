import React, { useState } from "react";
import { ColumnInfo } from "../../../main/database/interfaces";

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

  const badges: { label: string; className: string; title: string }[] = [];

  if (column.isPrimaryKey) {
    badges.push({
      label: "PK",
      title: "Primary Key",
      className:
        "border-vscode-blue text-vscode-blue bg-vscode-blue bg-opacity-10",
    });
  }
  if (column.isForeignKey) {
    badges.push({
      label: "FK",
      title: "Foreign Key",
      className:
        "border-vscode-green text-vscode-green bg-vscode-green bg-opacity-10",
    });
  }
  if (column.isIndexed) {
    badges.push({
      label: "IDX",
      title: "Indexed",
      className:
        "border-vscode-border text-vscode-text-secondary bg-vscode-bg-secondary",
    });
  }
  if (!column.nullable) {
    badges.push({
      label: "NOT NULL",
      title: "Non-nullable",
      className:
        "border-vscode-red text-vscode-red bg-vscode-red bg-opacity-10",
    });
  }

  return (
    <div
      className="relative flex items-center justify-between px-3 text-left font-medium text-vscode-text border-r border-vscode-border last:border-r-0 bg-vscode-bg-quaternary h-full"
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
      <div className="min-w-0 flex-1 h-full">
        <div className="flex items-center gap-2 min-w-0 h-full py-2">
          <div className="truncate font-medium text-sm leading-tight">
            {column.name}
          </div>
          {badges.length > 0 && (
            <div className="flex gap-1 overflow-hidden">
              {badges.map((badge, index) => (
                <span
                  key={`${badge.label}-${index}`}
                  title={badge.title}
                  className={`px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide border rounded whitespace-nowrap ${badge.className}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>
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
