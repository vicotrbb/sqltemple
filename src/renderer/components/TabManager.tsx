import React from "react";
import { PlusIcon, CloseIcon } from "./icons/IconLibrary";

export interface QueryTab {
  id: string;
  title: string;
  content: string;
  isDirty: boolean;
}

interface TabManagerProps {
  tabs: QueryTab[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
}

export const TabManager: React.FC<TabManagerProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onNewTab,
}) => {
  return (
    <div className="flex items-center bg-vscode-bg-secondary border-b border-vscode-border">
      <div className="flex-1 flex overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`group flex items-center px-3 py-2 border-r border-vscode-border cursor-pointer transition-colors min-w-[120px] ${
              activeTabId === tab.id
                ? "bg-vscode-bg text-vscode-text border-t-2 border-t-vscode-blue"
                : "bg-vscode-bg-secondary text-vscode-text-secondary hover:bg-vscode-bg-tertiary"
            }`}
            onClick={() => onTabClick(tab.id)}
          >
            <span className="flex-1 text-sm truncate">
              {tab.title}
              {tab.isDirty && (
                <span className="ml-1 text-vscode-text-tertiary">•</span>
              )}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className={`ml-2 text-vscode-text-tertiary hover:text-vscode-text opacity-0 group-hover:opacity-100 transition-opacity ${
                activeTabId === tab.id ? "opacity-100" : ""
              }`}
            >
              <CloseIcon className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onNewTab}
        className="px-3 py-2 text-vscode-text-secondary hover:text-vscode-text hover:bg-vscode-bg-tertiary transition-colors border-r border-vscode-border"
        title="New Tab"
      >
        <PlusIcon className="w-4 h-4" />
      </button>
    </div>
  );
};
