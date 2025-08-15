import React from 'react';
import { SearchResult } from './SearchManager';

interface SearchResultItemProps {
  item: SearchResult;
  isSelected: boolean;
  query: string;
  onClick: () => void;
}

interface HighlightedTextProps {
  text: string;
  highlight: string;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <span key={index} className="bg-vscode-yellow bg-opacity-30 text-vscode-text font-medium">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};

const getIcon = (type: string) => {
  switch (type) {
    case 'connection':
      return (
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <path d="M1 3v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2zm2-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm1 2v1h8V4H4zm0 3v1h8V7H4zm0 3v1h4v-1H4z" />
        </svg>
      );
    case 'schema':
      return (
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <path d="M1.5 1l1-1h11l1 1v3l-1 1v8l-1 1h-11l-1-1v-11zm1 1v10h10v-8h-10v-2zm0-1h10v1h-10z" />
        </svg>
      );
    case 'table':
      return (
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <path d="M14 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6.5L14 5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H3v12h10V4.5z" />
        </svg>
      );
    case 'view':
      return (
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h11A1.5 1.5 0 0 1 15 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-11zM2.5 2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-11z" />
          <path d="M7.5 5.5a.5.5 0 0 0-1 0v5a.5.5 0 0 0 1 0v-5zm2 0a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0v-3zm2 0a.5.5 0 0 0-1 0v1a.5.5 0 0 0 1 0v-1z" />
        </svg>
      );
    case 'column':
      return (
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <path d="M3.5 2v12h9V2h-9zm1 1h7v10h-7V3z" />
        </svg>
      );
    case 'function':
      return (
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <path d="M8 1a2 2 0 0 0-2 2v4H3a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v-4a2 2 0 0 0 2-2V5h4a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H8z" />
        </svg>
      );
    case 'procedure':
      return (
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z" />
          <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917z" />
        </svg>
      );
  }
};

const getIconColor = (type: string) => {
  switch (type) {
    case 'connection': return 'text-vscode-purple';
    case 'schema': return 'text-vscode-yellow';
    case 'table': return 'text-vscode-blue';
    case 'view': return 'text-vscode-green';
    case 'column': return 'text-vscode-text-tertiary';
    case 'function': return 'text-vscode-purple';
    case 'procedure': return 'text-vscode-orange';
    default: return 'text-vscode-text-secondary';
  }
};

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  item,
  isSelected,
  query,
  onClick,
}) => {
  return (
    <div
      className={`flex items-center px-4 py-3 cursor-pointer border-l-2 transition-colors ${
        isSelected 
          ? 'bg-vscode-blue bg-opacity-20 border-l-vscode-blue' 
          : 'border-l-transparent hover:bg-vscode-bg-tertiary'
      }`}
      onClick={onClick}
    >
      <div className={`mr-3 ${getIconColor(item.type)}`}>
        {getIcon(item.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-vscode-text font-medium">
          <HighlightedText text={item.name} highlight={query} />
        </div>
        {item.path.length > 0 && (
          <div className="text-sm text-vscode-text-secondary">
            {item.path.join(' › ')}
          </div>
        )}
      </div>
      
      <div className="text-xs text-vscode-text-tertiary uppercase">
        {item.type}
      </div>
    </div>
  );
};