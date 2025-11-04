import React, { useRef, useEffect } from "react";
import Editor, { Monaco, loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { useSettings, useConfig } from "../contexts/ConfigContext";
import { useEditorConfig } from "../hooks/useEditorConfig";

loader.config({ monaco });

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: (selectedText?: string) => void;
  onExplainQuery?: (selectedText: string) => void;
  onOptimizeQuery?: (selectedText: string) => void;
  onExplainQueryPlan?: (selectedText?: string) => void;
  onEditorMount?: (editor: any) => void;
  schema?: any;
}

export const SQLEditor: React.FC<SQLEditorProps> = ({
  value,
  onChange,
  onExecute,
  onExplainQuery,
  onOptimizeQuery,
  onExplainQueryPlan,
  onEditorMount,
  schema,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const completionProviderRef = useRef<monaco.IDisposable | null>(null);
  const { getShortcut } = useSettings();
  const { config } = useConfig();
  useEditorConfig(editorRef.current);

  useEffect(() => {
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
      }

      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  const parseKeybinding = (keys: string, monaco: Monaco): number | null => {
    const parts = keys.split("+").map((p) => p.trim());
    let modifiers = 0;
    let keyCode = 0;

    for (const part of parts) {
      const lowerPart = part.toLowerCase();
      switch (lowerPart) {
        case "cmd":
        case "ctrl":
          modifiers |= monaco.KeyMod.CtrlCmd;
          break;
        case "alt":
          modifiers |= monaco.KeyMod.Alt;
          break;
        case "shift":
          modifiers |= monaco.KeyMod.Shift;
          break;
        case "enter":
          keyCode = monaco.KeyCode.Enter;
          break;
        default:
          if (part.length === 1) {
            const char = part.toUpperCase();
            if (char >= "A" && char <= "Z") {
              keyCode =
                char.charCodeAt(0) - "A".charCodeAt(0) + monaco.KeyCode.KeyA;
            }
          }
      }
    }

    return keyCode !== 0 ? modifiers | keyCode : null;
  };

  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    if (onEditorMount) {
      onEditorMount(editor);
    }

    const executeKeys = getShortcut("execute-query");
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const shortcut =
      executeKeys.find((key) =>
        isMac
          ? key.toLowerCase().includes("cmd")
          : key.toLowerCase().includes("ctrl")
      ) || executeKeys[0];
    const keybinding = shortcut ? parseKeybinding(shortcut, monaco) : null;

    editor.addAction({
      id: "execute-query",
      label: "Execute Query",
      keybindings: keybinding
        ? [keybinding]
        : [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.5,
      run: (ed) => {
        const selection = ed.getModel()?.getValueInRange(ed.getSelection()!);
        if (selection && selection.trim()) {
          onExecute(selection);
        } else {
          onExecute();
        }
      },
    });

    const executeSelectionKeys = getShortcut("execute-selection");
    const selectionShortcut =
      executeSelectionKeys.find((key) =>
        isMac
          ? key.toLowerCase().includes("cmd")
          : key.toLowerCase().includes("ctrl")
      ) || executeSelectionKeys[0];
    const executeSelectionKeybinding = selectionShortcut
      ? parseKeybinding(selectionShortcut, monaco)
      : null;

    editor.addAction({
      id: "execute-selection",
      label: "Execute Selection",
      keybindings: executeSelectionKeybinding
        ? [executeSelectionKeybinding]
        : [],
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.6,
      precondition: "editorHasSelection",
      run: (ed) => {
        const selection = ed.getModel()?.getValueInRange(ed.getSelection()!);
        if (selection && selection.trim()) {
          onExecute(selection);
        }
      },
    });

    if (onExplainQuery) {
      const explainKeys = getShortcut("explain-query-ai");
      const explainShortcut =
        explainKeys.find((key) =>
          isMac
            ? key.toLowerCase().includes("cmd")
            : key.toLowerCase().includes("ctrl")
        ) || explainKeys[0];
      const explainKeybinding = explainShortcut
        ? parseKeybinding(explainShortcut, monaco)
        : null;

      editor.addAction({
        id: "explain-query-ai",
        label: "Explain Query with AI",
        contextMenuGroupId: "9_ai",
        contextMenuOrder: 1,
        keybindings: explainKeybinding ? [explainKeybinding] : [],
        run: (ed) => {
          const selection = ed.getModel()?.getValueInRange(ed.getSelection()!);
          if (selection && selection.trim()) {
            onExplainQuery(selection);
          } else {
            const fullContent = ed.getModel()?.getValue();
            if (fullContent && fullContent.trim()) {
              onExplainQuery(fullContent);
            }
          }
        },
      });
    }

    if (onOptimizeQuery) {
      const optimizeKeys = getShortcut("optimize-query-ai");
      const optimizeShortcut =
        optimizeKeys.find((key) =>
          isMac
            ? key.toLowerCase().includes("cmd")
            : key.toLowerCase().includes("ctrl")
        ) || optimizeKeys[0];
      const optimizeKeybinding = optimizeShortcut
        ? parseKeybinding(optimizeShortcut, monaco)
        : null;

      editor.addAction({
        id: "optimize-query-ai",
        label: "Optimize Query with AI",
        contextMenuGroupId: "9_ai",
        contextMenuOrder: 2,
        keybindings: optimizeKeybinding ? [optimizeKeybinding] : [],
        run: (ed) => {
          const selection = ed.getModel()?.getValueInRange(ed.getSelection()!);
          if (selection && selection.trim()) {
            onOptimizeQuery(selection);
          } else {
            const fullContent = ed.getModel()?.getValue();
            if (fullContent && fullContent.trim()) {
              onOptimizeQuery(fullContent);
            }
          }
        },
      });
    }

    // Clear editor shortcut
    const clearKeys = getShortcut("clear-editor");
    const clearShortcut =
      clearKeys.find((key) =>
        isMac
          ? key.toLowerCase().includes("cmd")
          : key.toLowerCase().includes("ctrl")
      ) || clearKeys[0];
    const clearKeybinding = clearShortcut
      ? parseKeybinding(clearShortcut, monaco)
      : null;

    editor.addAction({
      id: "clear-editor",
      label: "Clear Editor",
      keybindings: clearKeybinding ? [clearKeybinding] : [],
      contextMenuGroupId: "navigation",
      contextMenuOrder: 2.0,
      run: (ed) => {
        ed.setValue("");
        ed.focus();
      },
    });

    // Explain Query Plan action
    if (onExplainQueryPlan) {
      const explainPlanKeys = getShortcut("explain-query");
      const explainPlanShortcut =
        explainPlanKeys.find((key) =>
          isMac
            ? key.toLowerCase().includes("cmd")
            : key.toLowerCase().includes("ctrl")
        ) || explainPlanKeys[0];
      const explainPlanKeybinding = explainPlanShortcut
        ? parseKeybinding(explainPlanShortcut, monaco)
        : null;

      editor.addAction({
        id: "explain-query-plan",
        label: "Explain Query Plan",
        contextMenuGroupId: "navigation",
        contextMenuOrder: 1.7,
        keybindings: explainPlanKeybinding ? [explainPlanKeybinding] : [],
        run: (ed) => {
          const selection = ed.getModel()?.getValueInRange(ed.getSelection()!);
          if (selection && selection.trim()) {
            onExplainQueryPlan(selection);
          } else {
            onExplainQueryPlan();
          }
        },
      });
    }

    // Focus editor shortcut
    const focusKeys = getShortcut("focus-editor");
    const focusShortcut =
      focusKeys.find((key) =>
        isMac
          ? key.toLowerCase().includes("cmd")
          : key.toLowerCase().includes("ctrl")
      ) || focusKeys[0];
    const focusKeybinding = focusShortcut
      ? parseKeybinding(focusShortcut, monaco)
      : null;

    editor.addAction({
      id: "focus-editor",
      label: "Focus Editor",
      keybindings: focusKeybinding ? [focusKeybinding] : [],
      run: (ed) => {
        ed.focus();
      },
    });

    registerSQLCompletionProvider(monaco, schema);
  };

  const registerSQLCompletionProvider = (monaco: Monaco, schema?: any) => {
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
    }

    completionProviderRef.current =
      monaco.languages.registerCompletionItemProvider("sql", {
        provideCompletionItems: (model, position) => {
          const suggestions: monaco.languages.CompletionItem[] = [];

          const sqlKeywords = [
            "SELECT",
            "FROM",
            "WHERE",
            "INSERT",
            "UPDATE",
            "DELETE",
            "CREATE",
            "DROP",
            "ALTER",
            "TABLE",
            "INDEX",
            "VIEW",
            "TRIGGER",
            "PROCEDURE",
            "FUNCTION",
            "JOIN",
            "INNER",
            "LEFT",
            "RIGHT",
            "FULL",
            "OUTER",
            "ON",
            "AS",
            "AND",
            "OR",
            "NOT",
            "IN",
            "EXISTS",
            "BETWEEN",
            "LIKE",
            "GROUP",
            "BY",
            "HAVING",
            "ORDER",
            "ASC",
            "DESC",
            "LIMIT",
            "OFFSET",
            "UNION",
            "ALL",
            "DISTINCT",
            "COUNT",
            "SUM",
            "AVG",
            "MIN",
            "MAX",
            "CASE",
            "WHEN",
            "THEN",
            "ELSE",
            "END",
          ];

          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          sqlKeywords.forEach((keyword) => {
            suggestions.push({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword,
              range: range,
            });
          });

          if (schema) {
            schema.schemas?.forEach((schemaInfo: any) => {
              schemaInfo.tables?.forEach((table: any) => {
                suggestions.push({
                  label: table.name,
                  kind: monaco.languages.CompletionItemKind.Struct,
                  insertText: table.name,
                  detail: `Table in ${schemaInfo.name}`,
                  range: range,
                });

                table.columns?.forEach((column: any) => {
                  suggestions.push({
                    label: `${table.name}.${column.name}`,
                    kind: monaco.languages.CompletionItemKind.Field,
                    insertText: `${table.name}.${column.name}`,
                    detail: column.dataType,
                    range: range,
                  });
                });
              });
            });
          }

          return { suggestions };
        },
      });
  };

  useEffect(() => {
    if (monacoRef.current && schema) {
      registerSQLCompletionProvider(monacoRef.current, schema);
    }
  }, [schema]);

  const theme =
    config.appearance.theme === "light" ||
    (config.appearance.theme === "system" &&
      !window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "vs"
      : "vs-dark";

  return (
    <Editor
      height="100%"
      defaultLanguage="sql"
      theme={theme}
      value={value}
      onChange={(value) => onChange(value || "")}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: config.appearance.fontSize,
        fontFamily: config.appearance.fontFamily,
        lineNumbers: config.editor.showLineNumbers ? "on" : "off",
        wordWrap: config.editor.wordWrap ? "on" : "off",
        tabSize: config.editor.tabSize,
        insertSpaces: config.editor.insertSpaces,
        renderWhitespace: config.editor.showWhitespace ? "all" : "none",
        folding: config.editor.enableCodeFolding,
        renderLineHighlight: config.editor.highlightActiveLine ? "all" : "none",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        suggestOnTriggerCharacters: config.editor.autoComplete,
        quickSuggestions: config.editor.autoComplete,
        acceptSuggestionOnEnter: config.editor.autoComplete ? "on" : "off",
        autoClosingBrackets: "always",
        autoClosingQuotes: "always",
        formatOnPaste: config.editor.formatOnSave,
        formatOnType: config.editor.formatOnSave,
      }}
    />
  );
};
