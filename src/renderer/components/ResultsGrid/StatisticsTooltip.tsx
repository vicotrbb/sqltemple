import React, { useMemo } from "react";
import { ColumnInfo } from "../../../main/database/interfaces";
import {
  ColumnStatsCalculator,
  ColumnStatistics,
} from "./ColumnStatsCalculator";

interface StatisticsTooltipProps {
  column: ColumnInfo | null;
  data: any[];
  position: { x: number; y: number };
  visible: boolean;
}

export const StatisticsTooltip: React.FC<StatisticsTooltipProps> = ({
  column,
  data,
  position,
  visible,
}) => {
  if (!visible || !column) {
    return null;
  }

  const stats = useMemo(
    () => ColumnStatsCalculator.calculateStats(data || [], column.dataType),
    [data, column?.dataType]
  );

  const safeCount = stats.count || 0;
  const nullRatio = safeCount > 0 ? (stats.nullCount / safeCount) * 100 : 0;

  return (
    <div
      className="absolute z-50 bg-vscode-bg border border-vscode-border rounded shadow-lg p-3 min-w-64"
      style={{ left: position.x, top: position.y }}
    >
      <div className="font-semibold mb-2 text-vscode-text">
        {column.name} Statistics
      </div>
      <div className="space-y-1 text-sm text-vscode-text">
        <div className="flex justify-between">
          <span>Count:</span>
          <span className="text-vscode-text-secondary">
            {stats.count.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Null:</span>
          <span className="text-vscode-text-secondary">
            {stats.nullCount.toLocaleString()} ({nullRatio.toFixed(1)}%)
          </span>
        </div>
        <div className="flex justify-between">
          <span>Unique:</span>
          <span className="text-vscode-text-secondary">
            {stats.uniqueCount.toLocaleString()}
          </span>
        </div>

        {stats.sum !== undefined && (
          <>
            <div className="border-t border-vscode-border pt-1 mt-2">
              <div className="flex justify-between">
                <span>Sum:</span>
                <span className="text-vscode-text-secondary">
                  {stats.sum.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg:</span>
                <span className="text-vscode-text-secondary">
                  {stats.avg?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Min:</span>
                <span className="text-vscode-text-secondary">{stats.min}</span>
              </div>
              <div className="flex justify-between">
                <span>Max:</span>
                <span className="text-vscode-text-secondary">{stats.max}</span>
              </div>
              <div className="flex justify-between">
                <span>Median:</span>
                <span className="text-vscode-text-secondary">
                  {stats.median?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Std Dev:</span>
                <span className="text-vscode-text-secondary">
                  {stats.stdDev?.toFixed(2)}
                </span>
              </div>
            </div>
          </>
        )}

        {stats.avgLength !== undefined && (
          <div className="border-t border-vscode-border pt-1 mt-2">
            <div className="flex justify-between">
              <span>Avg Length:</span>
              <span className="text-vscode-text-secondary">
                {stats.avgLength.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Min Length:</span>
              <span className="text-vscode-text-secondary">
                {stats.minLength}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Max Length:</span>
              <span className="text-vscode-text-secondary">
                {stats.maxLength}
              </span>
            </div>
          </div>
        )}

        {stats.dateRange && (
          <div className="border-t border-vscode-border pt-1 mt-2">
            <div className="flex justify-between">
              <span>Range:</span>
              <span className="text-vscode-text-secondary text-xs">
                {stats.dateRange}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
