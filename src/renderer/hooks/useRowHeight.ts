import { useState, useEffect } from 'react';

export const useRowHeight = () => {
  const [rowHeight, setRowHeight] = useState(() => {
    const saved = localStorage.getItem('sqltemple-row-height');
    return saved ? parseInt(saved) : 32;
  });

  const adjustRowHeight = (delta: number) => {
    setRowHeight(prev => {
      const newHeight = Math.min(Math.max(prev + delta, 20), 100);
      return newHeight;
    });
  };

  const setRowHeightDirect = (height: number) => {
    setRowHeight(Math.min(Math.max(height, 20), 100));
  };

  useEffect(() => {
    localStorage.setItem('sqltemple-row-height', rowHeight.toString());
  }, [rowHeight]);

  return { 
    rowHeight, 
    adjustRowHeight, 
    setRowHeight: setRowHeightDirect 
  };
};