export interface QueryTab {
  id: string;
  title: string;
  content: string;
  isDirty: boolean;
  filePath?: string;
}

export interface TabServiceCallbacks {
  onActiveTabChange?: (tabId: string | null) => void;
  onTabsChange?: (tabs: QueryTab[]) => void;
}

export class TabService {
  private tabs: QueryTab[] = [];
  private activeTabId: string | null = null;
  private callbacks: TabServiceCallbacks = {};

  constructor(callbacks?: TabServiceCallbacks) {
    this.callbacks = callbacks || {};
  }

  setCallbacks(callbacks: TabServiceCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  createNewTab(title?: string, content?: string): QueryTab {
    const newTab: QueryTab = {
      id: `tab-${Date.now()}`,
      title: title || `Query ${this.tabs.length + 1}`,
      content: content || "",
      isDirty: false,
    };

    this.tabs = [...this.tabs, newTab];
    this.setActiveTab(newTab.id);
    this.notifyTabsChange();

    return newTab;
  }

  updateTabContent(tabId: string, content: string): boolean {
    const tabIndex = this.tabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1) return false;

    this.tabs = this.tabs.map((tab) =>
      tab.id === tabId ? { ...tab, content, isDirty: true } : tab
    );
    this.notifyTabsChange();

    return true;
  }

  updateTabTitle(tabId: string, title: string): boolean {
    const tabIndex = this.tabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1) return false;

    this.tabs = this.tabs.map((tab) =>
      tab.id === tabId ? { ...tab, title, isDirty: false } : tab
    );
    this.notifyTabsChange();

    return true;
  }

  updateTabFilePath(tabId: string, filePath: string): boolean {
    const tabIndex = this.tabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1) return false;

    this.tabs = this.tabs.map((tab) =>
      tab.id === tabId ? { ...tab, filePath, isDirty: false } : tab
    );
    this.notifyTabsChange();

    return true;
  }

  closeTab(tabId: string): string | null {
    const newTabs = this.tabs.filter((tab) => tab.id !== tabId);
    this.tabs = newTabs;

    let newActiveTabId: string | null = null;

    if (this.activeTabId === tabId && newTabs.length > 0) {
      // Select the last tab if we closed the active one
      newActiveTabId = newTabs[newTabs.length - 1].id;
    } else if (this.activeTabId === tabId) {
      // No tabs left
      newActiveTabId = null;
    } else {
      // Keep the current active tab
      newActiveTabId = this.activeTabId;
    }

    this.setActiveTab(newActiveTabId);
    this.notifyTabsChange();

    // Create a new tab if no tabs are left
    if (newTabs.length === 0) {
      const newTab = this.createNewTab();
      return newTab.id;
    }

    return newActiveTabId;
  }

  duplicateTab(tabId: string): QueryTab | null {
    const tabToDuplicate = this.tabs.find((tab) => tab.id === tabId);
    if (!tabToDuplicate) return null;

    const newTab: QueryTab = {
      id: Date.now().toString(),
      title: `${tabToDuplicate.title} (Copy)`,
      content: tabToDuplicate.content,
      isDirty: false,
    };

    this.tabs = [...this.tabs, newTab];
    this.setActiveTab(newTab.id);
    this.notifyTabsChange();

    return newTab;
  }

  navigateToNextTab(): string | null {
    if (this.tabs.length <= 1) return this.activeTabId;

    const currentIndex = this.tabs.findIndex((tab) => tab.id === this.activeTabId);
    const nextIndex = (currentIndex + 1) % this.tabs.length;
    const nextTabId = this.tabs[nextIndex].id;

    this.setActiveTab(nextTabId);
    return nextTabId;
  }

  navigateToPreviousTab(): string | null {
    if (this.tabs.length <= 1) return this.activeTabId;

    const currentIndex = this.tabs.findIndex((tab) => tab.id === this.activeTabId);
    const prevIndex = currentIndex === 0 ? this.tabs.length - 1 : currentIndex - 1;
    const prevTabId = this.tabs[prevIndex].id;

    this.setActiveTab(prevTabId);
    return prevTabId;
  }

  setActiveTab(tabId: string | null): void {
    if (tabId && !this.tabs.find((tab) => tab.id === tabId)) {
      return; // Tab doesn't exist
    }

    this.activeTabId = tabId;
    this.callbacks.onActiveTabChange?.(tabId);
  }

  getActiveTab(): QueryTab | null {
    if (!this.activeTabId) return null;
    return this.tabs.find((tab) => tab.id === this.activeTabId) || null;
  }

  getTab(tabId: string): QueryTab | null {
    return this.tabs.find((tab) => tab.id === tabId) || null;
  }

  getTabs(): QueryTab[] {
    return [...this.tabs];
  }

  getActiveTabId(): string | null {
    return this.activeTabId;
  }

  private notifyTabsChange(): void {
    this.callbacks.onTabsChange?.(this.getTabs());
  }

  // Initialize with at least one tab
  initialize(): void {
    if (this.tabs.length === 0) {
      this.createNewTab();
    }
  }
}

export const tabService = new TabService();