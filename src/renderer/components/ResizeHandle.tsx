import React from 'react';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  direction: 'horizontal' | 'vertical';
  className?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onMouseDown,
  direction,
  className = ''
}) => {
  const baseClasses = direction === 'horizontal' 
    ? 'w-1 cursor-ew-resize hover:bg-vscode-blue transition-colors'
    : 'h-1 cursor-ns-resize hover:bg-vscode-blue transition-colors';

  return (
    <div
      className={`${baseClasses} ${className}`}
      onMouseDown={onMouseDown}
    >
      <div 
        className={direction === 'horizontal' ? 'absolute inset-y-0 -left-1 -right-1' : 'absolute inset-x-0 -top-1 -bottom-1'}
      />
    </div>
  );
};