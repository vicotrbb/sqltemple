import { useState, useCallback, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

interface ColumnConfig {
  key: string;
  width: number;
  minWidth: number;
  maxWidth: number;
}

export const useColumnResize = (columns: ColumnConfig[]) => {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () => {
      const saved = localStorage.getItem("sqltemple-column-widths");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return {};
        }
      }
      return {};
    }
  );

  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const getColumnWidth = useCallback(
    (columnKey: string): number => {
      const column = columns.find((c) => c.key === columnKey);
      const baseWidth = columnWidths[columnKey] ?? column?.width ?? 120;

      if (!column) {
        return baseWidth;
      }

      return Math.min(Math.max(baseWidth, column.minWidth), column.maxWidth);
    },
    [columnWidths, columns]
  );

  const handleMouseDown = useCallback(
    (columnKey: string, event: ReactMouseEvent) => {
      event.preventDefault();
      setIsResizing(columnKey);
      setStartX(event.clientX);
      setStartWidth(getColumnWidth(columnKey));
    },
    [getColumnWidth]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const column = columns.find((c) => c.key === isResizing);
      if (!column) return;

      const deltaX = e.clientX - startX;
      const newWidth = Math.min(
        Math.max(startWidth + deltaX, column.minWidth),
        column.maxWidth
      );

      setColumnWidths((prev) => ({
        ...prev,
        [isResizing]: newWidth,
      }));
    },
    [isResizing, startX, startWidth, columns]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    localStorage.setItem(
      "sqltemple-column-widths",
      JSON.stringify(columnWidths)
    );
  }, [columnWidths]);

  return {
    columnWidths,
    getColumnWidth,
    handleMouseDown,
    isResizing,
  };
};
