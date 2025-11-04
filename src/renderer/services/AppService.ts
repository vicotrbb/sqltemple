import {
  DatabaseConnectionConfig,
  DatabaseSchema,
  QueryResult,
} from "../../main/database/interfaces";
import { databaseService } from "./DatabaseService";
import { aiService } from "./AIService";
import { fileService } from "./FileService";
import {
  tabService,
  TabService,
  QueryTab,
  TableDetailsTab,
  AppTab,
} from "./TabService";

export interface AppServiceCallbacks {
  onConnectionChange?: (
    connection: DatabaseConnectionConfig | null,
    isConnected: boolean
  ) => void;
  onSchemaChange?: (schema: DatabaseSchema | null) => void;
  onQueryResult?: (result: QueryResult | null) => void;
  onQueryPlan?: (plan: any, query: string) => void;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
  onTabsChange?: (tabs: AppTab[], activeTabId: string | null) => void;
  onActiveTabChange?: (tabId: string | null) => void;
}

export class AppService {
  private callbacks: AppServiceCallbacks = {};
  private tabService: TabService;

  constructor(callbacks?: AppServiceCallbacks) {
    this.callbacks = callbacks || {};
    this.tabService = tabService;

    // Set up tab service callbacks
    this.tabService.setCallbacks({
      onTabsChange: (tabs) =>
        this.callbacks.onTabsChange?.(tabs, this.tabService.getActiveTabId()),
      onActiveTabChange: (tabId) => this.callbacks.onActiveTabChange?.(tabId),
    });
  }

  setCallbacks(callbacks: AppServiceCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Database operations
  async connectToDatabase(config: DatabaseConnectionConfig): Promise<boolean> {
    const result = await databaseService.connect(config);
    if (result.success) {
      this.callbacks.onConnectionChange?.(
        databaseService.getCurrentConnection(),
        true
      );

      // Load connections and schema after successful connection
      await this.loadConnections();
      await this.loadSchema();

      return true;
    } else {
      this.callbacks.onError?.(result.error || "Connection failed");
      return false;
    }
  }

  async disconnectFromDatabase(): Promise<boolean> {
    const result = await databaseService.disconnect();
    if (result.success) {
      this.callbacks.onConnectionChange?.(null, false);
      this.callbacks.onSchemaChange?.(null);
      this.callbacks.onQueryResult?.(null);
      return true;
    } else {
      this.callbacks.onError?.(result.error || "Disconnect failed");
      return false;
    }
  }

  async executeQuery(selectedText?: string): Promise<boolean> {
    const activeTab = this.getActiveQueryTab();
    if (!activeTab) {
      this.callbacks.onError?.("No active tab found");
      return false;
    }

    const queryToExecute = selectedText || activeTab.content;
    if (!queryToExecute.trim()) {
      return false;
    }

    const result = await databaseService.executeQuery(queryToExecute);
    if (result.success && result.data) {
      this.callbacks.onQueryResult?.(result.data);
      return true;
    } else {
      this.callbacks.onQueryResult?.(
        result.data || {
          columns: [],
          rows: [],
          rowCount: 0,
          duration: 0,
          error: result.error || "Unknown error",
        }
      );
      return false;
    }
  }

  async loadSchema(): Promise<boolean> {
    const result = await databaseService.loadSchema();
    if (result.success && result.data) {
      this.callbacks.onSchemaChange?.(result.data);
      return true;
    } else {
      this.callbacks.onError?.(result.error || "Failed to load schema");
      return false;
    }
  }

  async loadConnections(): Promise<DatabaseConnectionConfig[]> {
    const result = await databaseService.loadConnections();
    if (result.success && result.data) {
      return result.data;
    } else {
      this.callbacks.onError?.(result.error || "Failed to load connections");
      return [];
    }
  }

  async explainQuery(): Promise<boolean> {
    const activeTab = this.getActiveQueryTab();
    if (!activeTab || !activeTab.content.trim()) {
      return false;
    }

    const result = await databaseService.getQueryPlan(activeTab.content);
    if (result.success && result.data) {
      this.callbacks.onQueryPlan?.(result.data, activeTab.content);
      return true;
    } else {
      this.callbacks.onError?.(result.error || "Failed to get query plan");
      return false;
    }
  }

  // AI operations
  async explainQueryWithAI(selectedText?: string): Promise<string | null> {
    const queryText = selectedText || this.getActiveQueryTab()?.content;
    if (!queryText?.trim()) {
      return null;
    }

    const result = await aiService.explainQuery(queryText);
    if (result.success && result.data) {
      return result.data;
    } else {
      this.callbacks.onError?.(result.error || "Failed to explain query");
      return null;
    }
  }

  async optimizeQueryWithAI(
    selectedText?: string
  ): Promise<{ optimizedQuery: string; originalQuery: string } | null> {
    const queryText = selectedText || this.getActiveQueryTab()?.content;
    if (!queryText?.trim()) {
      return null;
    }

    const result = await aiService.optimizeQuery(queryText);
    if (result.success && result.data) {
      return { optimizedQuery: result.data, originalQuery: queryText };
    } else {
      this.callbacks.onError?.(result.error || "Failed to optimize query");
      return null;
    }
  }

  async createQueryWithAI(prompt: string): Promise<string | null> {
    const result = await aiService.createQuery(prompt);
    if (result.success && result.data) {
      return result.data;
    } else {
      this.callbacks.onError?.(result.error || "Failed to create query");
      return null;
    }
  }

  // File operations
  async openQueryFile(): Promise<boolean> {
    const result = await fileService.openQueryFile();
    if (result.success && result.data && !result.canceled) {
      const activeTab = this.getActiveQueryTab();
      if (activeTab) {
        this.tabService.updateTabContent(activeTab.id, result.data.content);
        if (result.data.fileName) {
          this.tabService.updateTabTitle(activeTab.id, result.data.fileName);
        }
      }
      return true;
    } else if (result.canceled) {
      return false; // User canceled, not an error
    } else {
      this.callbacks.onError?.(result.error || "Failed to open file");
      return false;
    }
  }

  async saveQueryFile(): Promise<boolean> {
    const activeTab = this.getActiveQueryTab();
    if (!activeTab || !activeTab.content?.trim()) {
      return false;
    }

    const result = await fileService.saveQueryFile(
      activeTab.content,
      activeTab.filePath
    );
    if (result.success && result.data && !result.canceled) {
      if (result.data.fileName) {
        this.tabService.updateTabTitle(activeTab.id, result.data.fileName);
      }
      return true;
    } else if (result.canceled) {
      return false; // User canceled, not an error
    } else {
      this.callbacks.onError?.(result.error || "Failed to save file");
      return false;
    }
  }

  async saveQueryFileAs(): Promise<boolean> {
    const activeTab = this.getActiveQueryTab();
    if (!activeTab || !activeTab.content?.trim()) {
      return false;
    }

    const result = await fileService.saveQueryFileAs(activeTab.content);
    if (result.success && result.data && !result.canceled) {
      if (result.data.fileName) {
        this.tabService.updateTabTitle(activeTab.id, result.data.fileName);
      }
      return true;
    } else if (result.canceled) {
      return false; // User canceled, not an error
    } else {
      this.callbacks.onError?.(result.error || "Failed to save file");
      return false;
    }
  }

  async importConnections(): Promise<boolean> {
    const result = await fileService.importConnections();
    if (result.success && result.data && !result.canceled) {
      const { imported, failed } = result.data;
      if (imported > 0) {
        this.callbacks.onSuccess?.(
          `Successfully imported ${imported} connection(s).`
        );
        if (failed > 0) {
          this.callbacks.onError?.(`${failed} connection(s) failed to import.`);
        }
      } else {
        this.callbacks.onError?.(
          "No connections were imported. Please check the file format."
        );
      }
      return imported > 0;
    } else if (result.canceled) {
      return false; // User canceled, not an error
    } else {
      this.callbacks.onError?.(result.error || "Failed to import connections");
      return false;
    }
  }

  async exportConnections(): Promise<boolean> {
    const result = await fileService.exportConnections();
    if (result.success && result.data && !result.canceled) {
      this.callbacks.onSuccess?.(
        `Successfully exported ${result.data.count} connection(s) to ${result.data.filePath}`
      );
      return true;
    } else if (result.canceled) {
      return false; // User canceled, not an error
    } else {
      this.callbacks.onError?.(result.error || "Failed to export connections");
      return false;
    }
  }

  // Tab operations
  createNewTab(title?: string, content?: string): string {
    const tab = this.tabService.createNewTab(title, content);
    return tab.id;
  }

  updateTabContent(tabId: string, content: string): boolean {
    return this.tabService.updateTabContent(tabId, content);
  }

  closeTab(tabId: string): string | null {
    return this.tabService.closeTab(tabId);
  }

  duplicateTab(tabId: string): boolean {
    const result = this.tabService.duplicateTab(tabId);
    return result !== null;
  }

  navigateToNextTab(): string | null {
    return this.tabService.navigateToNextTab();
  }

  navigateToPreviousTab(): string | null {
    return this.tabService.navigateToPreviousTab();
  }

  setActiveTab(tabId: string): void {
    this.tabService.setActiveTab(tabId);
  }

  getActiveTab(): AppTab | null {
    return this.tabService.getActiveTab();
  }

  getTabs(): AppTab[] {
    return this.tabService.getTabs();
  }

  getActiveTabId(): string | null {
    return this.tabService.getActiveTabId();
  }

  // Utility methods
  addQueryToActiveTab(query: string): boolean {
    const activeTab = this.getActiveQueryTab();
    if (activeTab) {
      const newContent =
        activeTab.content +
        (activeTab.content && !activeTab.content.endsWith("\n") ? "\n" : "") +
        query;
      return this.tabService.updateTabContent(activeTab.id, newContent);
    }
    return false;
  }

  addQueryToActiveTabWithNewlines(query: string): boolean {
    const activeTab = this.getActiveQueryTab();
    if (activeTab) {
      const newContent =
        activeTab.content +
        (activeTab.content && !activeTab.content.endsWith("\n") ? "\n\n" : "") +
        query;
      return this.tabService.updateTabContent(activeTab.id, newContent);
    }
    return false;
  }

  replaceQueryInActiveTab(oldQuery: string, newQuery: string): boolean {
    const activeTab = this.getActiveQueryTab();
    if (activeTab) {
      const newContent = activeTab.content.replace(oldQuery, newQuery);
      return this.tabService.updateTabContent(activeTab.id, newContent);
    }
    return false;
  }

  getCurrentConnection(): DatabaseConnectionConfig | null {
    return databaseService.getCurrentConnection();
  }

  getIsConnected(): boolean {
    return databaseService.getIsConnected();
  }

  // Initialize the service
  initialize(): void {
    this.tabService.initialize();
  }

  openTableDetailsTab(schema: string, table: string): TableDetailsTab {
    const existing = this.tabService
      .getTabs()
      .find(
        (tab): tab is TableDetailsTab =>
          tab.type === "table-details" &&
          tab.schema === schema &&
          tab.table === table
      );

    if (existing) {
      this.tabService.setActiveTab(existing.id);
      return existing;
    }

    return this.tabService.createTableDetailsTab(schema, table);
  }

  private getActiveQueryTab(): QueryTab | null {
    const tab = this.tabService.getActiveTab();
    return tab && tab.type === "query" ? tab : null;
  }
}

export const appService = new AppService();
