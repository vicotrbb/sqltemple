import React, { useRef, useEffect } from 'react';
import Editor, { Monaco, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useSettings } from '../contexts/SettingsContext';

// Configure Monaco to use local files instead of CDN
loader.config({ monaco });

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: (selectedText?: string) => void;
  onExplainQuery?: (selectedText: string) => void;
  onOptimizeQuery?: (selectedText: string) => void;
  onEditorMount?: (editor: any) => void;
  schema?: any; // We'll type this properly later
}

export const SQLEditor: React.FC<SQLEditorProps> = ({ value, onChange, onExecute, onExplainQuery, onOptimizeQuery, onEditorMount, schema }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const { getShortcut } = useSettings();

  const parseKeybinding = (keys: string, monaco: Monaco): number | null => {
    const parts = keys.split('+').map(p => p.trim());
    let result = 0;

    for (const part of parts) {
      const lowerPart = part.toLowerCase();
      switch (lowerPart) {
        case 'cmd':
        case 'ctrl':
          result |= monaco.KeyMod.CtrlCmd;
          break;
        case 'alt':
          result |= monaco.KeyMod.Alt;
          break;
        case 'shift':
          result |= monaco.KeyMod.Shift;
          break;
        case 'enter':
          result |= monaco.KeyCode.Enter;
          break;
        default:
          // Handle single letter keys
          if (part.length === 1) {
            const keyCode = part.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0) + monaco.KeyCode.KeyA;
            result |= keyCode;
          }
      }
    }

    return result || null;
  };

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Call the onEditorMount callback if provided
    if (onEditorMount) {
      onEditorMount(editor);
    }

    // Add execute shortcut with custom keybinding
    const executeKeys = getShortcut('execute-query');
    const keybinding = executeKeys.length > 0 ? parseKeybinding(executeKeys[0], monaco) : null;
    
    editor.addAction({
      id: 'execute-query',
      label: 'Execute Query',
      keybindings: keybinding ? [keybinding] : [],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: (ed) => {
        const selection = ed.getModel()?.getValueInRange(ed.getSelection()!);
        if (selection && selection.trim()) {
          // Execute only the selected text
          onExecute(selection);
        } else {
          // Execute the entire content
          onExecute();
        }
      }
    });

    // Add execute selection action
    editor.addAction({
      id: 'execute-selection',
      label: 'Execute Selection',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.6,
      precondition: 'editorHasSelection',
      run: (ed) => {
        const selection = ed.getModel()?.getValueInRange(ed.getSelection()!);
        if (selection && selection.trim()) {
          onExecute(selection);
        }
      }
    });

    // Add AI context menu actions with keyboard shortcuts
    if (onExplainQuery) {
      const explainKeys = getShortcut('explain-query-ai');
      editor.addAction({
        id: 'explain-query-ai',
        label: 'Explain Query with AI',
        contextMenuGroupId: '9_ai',
        contextMenuOrder: 1,
        keybindings: explainKeys.length > 0 && parseKeybinding(explainKeys[0], monaco) ? [parseKeybinding(explainKeys[0], monaco)!] : [],
        run: (ed) => {
          const selection = ed.getModel()?.getValueInRange(ed.getSelection()!);
          if (selection && selection.trim()) {
            onExplainQuery(selection);
          } else {
            // If no selection, use the entire content
            const fullContent = ed.getModel()?.getValue();
            if (fullContent && fullContent.trim()) {
              onExplainQuery(fullContent);
            }
          }
        }
      });
    }

    if (onOptimizeQuery) {
      const optimizeKeys = getShortcut('optimize-query-ai');
      editor.addAction({
        id: 'optimize-query-ai',
        label: 'Optimize Query with AI',
        contextMenuGroupId: '9_ai',
        contextMenuOrder: 2,
        keybindings: optimizeKeys.length > 0 && parseKeybinding(optimizeKeys[0], monaco) ? [parseKeybinding(optimizeKeys[0], monaco)!] : [],
        run: (ed) => {
          const selection = ed.getModel()?.getValueInRange(ed.getSelection()!);
          if (selection && selection.trim()) {
            onOptimizeQuery(selection);
          } else {
            // If no selection, use the entire content
            const fullContent = ed.getModel()?.getValue();
            if (fullContent && fullContent.trim()) {
              onOptimizeQuery(fullContent);
            }
          }
        }
      });
    }

    // Register SQL completion provider
    registerSQLCompletionProvider(monaco, schema);
  };

  const registerSQLCompletionProvider = (monaco: Monaco, schema?: any) => {
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const suggestions: monaco.languages.CompletionItem[] = [];
        
        // SQL Keywords
        const sqlKeywords = [
          'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP',
          'ALTER', 'TABLE', 'INDEX', 'VIEW', 'TRIGGER', 'PROCEDURE', 'FUNCTION',
          'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'ON', 'AS', 'AND',
          'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'GROUP', 'BY', 'HAVING',
          'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'DISTINCT',
          'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'
        ];

        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        // Add keywords
        sqlKeywords.forEach(keyword => {
          suggestions.push({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range
          });
        });

        // Add schema-based suggestions if available
        if (schema) {
          // Add table names
          schema.schemas?.forEach((schemaInfo: any) => {
            schemaInfo.tables?.forEach((table: any) => {
              suggestions.push({
                label: table.name,
                kind: monaco.languages.CompletionItemKind.Struct,
                insertText: table.name,
                detail: `Table in ${schemaInfo.name}`,
                range: range
              });

              // Add columns
              table.columns?.forEach((column: any) => {
                suggestions.push({
                  label: `${table.name}.${column.name}`,
                  kind: monaco.languages.CompletionItemKind.Field,
                  insertText: `${table.name}.${column.name}`,
                  detail: column.dataType,
                  range: range
                });
              });
            });
          });
        }

        return { suggestions };
      }
    });
  };

  useEffect(() => {
    if (monacoRef.current && schema) {
      registerSQLCompletionProvider(monacoRef.current, schema);
    }
  }, [schema]);

  return (
    <Editor
      height="100%"
      defaultLanguage="sql"
      theme="vs-dark"
      value={value}
      onChange={(value) => onChange(value || '')}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        formatOnPaste: true,
        formatOnType: true
      }}
    />
  );
};