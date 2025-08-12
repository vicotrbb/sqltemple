import { useEffect } from 'react';
import { useConfig } from '../contexts/ConfigContext';

export const useEditorConfig = (editorInstance: any) => {
  const { config } = useConfig();

  useEffect(() => {
    if (!editorInstance) return;

    const { editor } = config;

    editorInstance.updateOptions({
      fontSize: config.appearance.fontSize,
      fontFamily: config.appearance.fontFamily,
      lineNumbers: editor.showLineNumbers ? 'on' : 'off',
      wordWrap: editor.wordWrap ? 'on' : 'off',
      tabSize: editor.tabSize,
      insertSpaces: editor.insertSpaces,
      renderWhitespace: editor.showWhitespace ? 'all' : 'none',
      folding: editor.enableCodeFolding,
      renderLineHighlight: editor.highlightActiveLine ? 'all' : 'none',
      quickSuggestions: editor.autoComplete,
      suggestOnTriggerCharacters: editor.autoComplete,
      acceptSuggestionOnEnter: editor.autoComplete ? 'on' : 'off',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      theme: config.appearance.theme === 'light' || 
             (config.appearance.theme === 'system' && 
              !window.matchMedia('(prefers-color-scheme: dark)').matches) 
             ? 'vs' : 'vs-dark',
    });

    const editorDom = editorInstance.getDomNode();
    if (editorDom) {
      editorDom.style.fontSize = `${config.appearance.fontSize}px`;
      editorDom.style.fontFamily = config.appearance.fontFamily;
    }

  }, [editorInstance, config]);

  return {
    formatDocument: () => {
      if (editorInstance) {
        editorInstance.getAction('editor.action.formatDocument')?.run();
      }
    },
    getSelectedText: () => {
      if (editorInstance) {
        const selection = editorInstance.getSelection();
        if (selection && !selection.isEmpty()) {
          return editorInstance.getModel().getValueInRange(selection);
        }
      }
      return '';
    },
    replaceSelection: (text: string) => {
      if (editorInstance) {
        const selection = editorInstance.getSelection();
        if (selection) {
          editorInstance.executeEdits('replace-selection', [{
            range: selection,
            text: text,
          }]);
        }
      }
    },
    insertText: (text: string) => {
      if (editorInstance) {
        const position = editorInstance.getPosition();
        if (position) {
          editorInstance.executeEdits('insert-text', [{
            range: { 
              startLineNumber: position.lineNumber, 
              startColumn: position.column,
              endLineNumber: position.lineNumber, 
              endColumn: position.column 
            },
            text: text,
          }]);
        }
      }
    },
  };
};