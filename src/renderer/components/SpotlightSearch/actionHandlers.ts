import { SearchResult } from './SearchManager';

export interface ActionHandlerContext {
  onTableClick?: (tableName: string, schemaName: string) => void;
  onViewClick?: (viewName: string, schemaName: string) => void;
  onConnect?: (connection: any) => void;
  editorInstance?: any;
}

export const executeAction = (item: SearchResult, context: ActionHandlerContext) => {
  switch (item.type) {
    case 'table':
      if (context.onTableClick && item.metadata?.schema) {
        context.onTableClick(item.name, item.metadata.schema);
      }
      break;
      
    case 'view':
      if (context.onViewClick && item.metadata?.schema) {
        context.onViewClick(item.name, item.metadata.schema);
      }
      break;
      
    case 'connection':
      if (context.onConnect && item.metadata?.connection) {
        context.onConnect(item.metadata.connection);
      }
      break;
      
    case 'column':
      if (context.editorInstance && item.metadata?.schema && item.metadata?.table) {
        const columnRef = `${item.metadata.schema}.${item.metadata.table}.${item.name}`;
        insertAtCursor(context.editorInstance, columnRef);
      }
      break;
      
    case 'function':
      if (context.editorInstance) {
        const functionCall = `${item.name}()`;
        insertAtCursor(context.editorInstance, functionCall);
      }
      break;
      
    case 'procedure':
      if (context.editorInstance) {
        const procedureCall = `CALL ${item.name}()`;
        insertAtCursor(context.editorInstance, procedureCall);
      }
      break;
      
    case 'schema':
      if (context.editorInstance) {
        insertAtCursor(context.editorInstance, `${item.name}.`);
      }
      break;
      
    default:
      console.log('No action handler for type:', item.type);
  }
};

const insertAtCursor = (editor: any, text: string) => {
  if (!editor) return;
  
  const position = editor.getPosition();
  const range = {
    startLineNumber: position.lineNumber,
    startColumn: position.column,
    endLineNumber: position.lineNumber,
    endColumn: position.column
  };
  
  editor.executeEdits('spotlight-search', [{
    range,
    text,
    forceMoveMarkers: true
  }]);
  
  editor.focus();
};