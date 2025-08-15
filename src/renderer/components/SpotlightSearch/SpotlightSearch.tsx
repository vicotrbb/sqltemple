import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DatabaseConnectionConfig, DatabaseSchema } from '../../../main/database/interfaces';
import { SearchResultItem } from './SearchResultItem';
import { SearchManager, SearchResult } from './SearchManager';

interface SpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
  connections: DatabaseConnectionConfig[];
  currentConnection: DatabaseConnectionConfig | null;
  schema: DatabaseSchema | null;
  onNavigate: (item: SearchResult) => void;
}

export const SpotlightSearch: React.FC<SpotlightSearchProps> = ({
  isOpen,
  onClose,
  connections,
  currentConnection,
  schema,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchManager = useMemo(() => new SearchManager(), []);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const searchResults = await searchManager.search(query, {
          connections,
          currentConnection,
          schema,
        });
        setResults(searchResults.slice(0, 100)); // Limit results
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, connections, currentConnection, schema, searchManager]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            onNavigate(results[selectedIndex]);
            onClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center z-50 pt-20"
      onClick={onClose}
    >
      <div 
        className="bg-vscode-bg-secondary rounded-md shadow-2xl w-[600px] max-h-[500px] overflow-hidden border border-vscode-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-vscode-border">
          <svg 
            className="w-5 h-5 mr-3 text-vscode-text-tertiary" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search connections, tables, columns..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-vscode-text placeholder-vscode-text-tertiary outline-none text-lg"
          />
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-vscode-blue border-t-transparent ml-2"></div>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {results.length > 0 ? (
            results.map((item, index) => (
              <SearchResultItem
                key={item.id}
                item={item}
                isSelected={index === selectedIndex}
                query={query}
                onClick={() => {
                  onNavigate(item);
                  onClose();
                }}
              />
            ))
          ) : query.length > 0 && !loading ? (
            <div className="px-4 py-8 text-center text-vscode-text-tertiary">
              No results found for "{query}"
            </div>
          ) : query.length === 0 ? (
            <div className="px-4 py-8 text-center text-vscode-text-tertiary">
              {currentConnection ? 
                "Start typing to search..." : 
                "Connect to a database to search objects..."
              }
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-vscode-border bg-vscode-bg-tertiary">
          <div className="flex items-center justify-between text-xs text-vscode-text-tertiary">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Cancel</span>
          </div>
        </div>
      </div>
    </div>
  );
};