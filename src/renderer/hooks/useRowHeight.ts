import { useState, useEffect } from "react";

export const ROW_HEIGHT_MIN = 20;
export const ROW_HEIGHT_MAX = 100;
const DEFAULT_ROW_HEIGHT = 32;

const clampRowHeight = (value: number) =>
  Math.min(Math.max(value, ROW_HEIGHT_MIN), ROW_HEIGHT_MAX);

export const useRowHeight = () => {
  const [rowHeight, setRowHeight] = useState(() => {
    const saved = localStorage.getItem("sqltemple-row-height");
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!Number.isNaN(parsed)) {
        return clampRowHeight(parsed);
      }
    }
    return DEFAULT_ROW_HEIGHT;
  });

  const adjustRowHeight = (delta: number) => {
    setRowHeight((prev) => clampRowHeight(prev + delta));
  };

  const setRowHeightDirect = (height: number) => {
    setRowHeight(clampRowHeight(height));
  };

  useEffect(() => {
    localStorage.setItem("sqltemple-row-height", rowHeight.toString());
  }, [rowHeight]);

  return {
    rowHeight,
    adjustRowHeight,
    setRowHeight: setRowHeightDirect,
  };
};
