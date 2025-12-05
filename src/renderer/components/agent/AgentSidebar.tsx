import React, { useEffect, useMemo, useRef, useState } from "react";
import type {
  AgentMessageRecord,
  AgentSessionRecord,
} from "../../../main/storage/StorageManager";
import { CloseIcon, PlusIcon } from "../icons/IconLibrary";

export interface AgentSidebarProps {
  width: number;
  onResizeStart: () => void;
  onClose: () => void;
  onSend: (input: string) => Promise<void>;
  onSelectSession: (sessionId: string | null) => void;
  onStartNewSession: () => void;
  onInsertSql: (sql: string) => void;
  onRunSql: (sql: string) => Promise<void> | void;
  sessions: AgentSessionRecord[];
  activeSessionId: string | null;
  messages: AgentMessageRecord[];
  streamingContent: Record<string, string>;
  inputValue: string;
  onInputChange: (value: string) => void;
  isSending: boolean;
  connectionName?: string;
}

interface MessageGroup {
  id: string;
  user?: AgentMessageRecord | null;
  processing: AgentMessageRecord[];
  responses: AgentMessageRecord[];
}

const PROCESSING_TYPES = new Set(["thought", "tool_call"]);

export const AgentSidebar: React.FC<AgentSidebarProps> = ({
  width,
  onResizeStart,
  onClose,
  onSend,
  onSelectSession,
  onStartNewSession,
  onInsertSql,
  onRunSql,
  sessions,
  activeSessionId,
  messages,
  streamingContent,
  inputValue,
  onInputChange,
  isSending,
  connectionName,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const activeStatus = useMemo(() => {
    if (!activeSessionId) {
      return null;
    }
    return sessions.find((session) => session.id === activeSessionId)?.status;
  }, [activeSessionId, sessions]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputValue.trim()) return;
    try {
      await onSend(inputValue.trim());
      onInputChange("");
    } catch {
      // Keep current input so the user can retry.
    }
  };

  useEffect(() => {
    setExpandedGroups({});
  }, [activeSessionId]);

  const groupedMessages = useMemo<MessageGroup[]>(() => {
    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;

    messages.forEach((message) => {
      if (message.role === "user") {
        currentGroup = {
          id: message.id,
          user: message,
          processing: [],
          responses: [],
        };
        groups.push(currentGroup);
        return;
      }

      if (!currentGroup) {
        currentGroup = {
          id: message.id,
          user: null,
          processing: [],
          responses: [],
        };
        groups.push(currentGroup);
      }

      if (
        PROCESSING_TYPES.has(message.metadata?.type || "") ||
        message.role === "tool"
      ) {
        currentGroup.processing.push(message);
        return;
      }

      currentGroup.responses.push(message);
    });

    return groups;
  }, [messages]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <div
      className="relative bg-vscode-bg-secondary border-l border-vscode-border flex flex-col"
      style={{ width }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-vscode-green/60"
        onMouseDown={(e) => {
          e.preventDefault();
          onResizeStart();
        }}
      />

      <header className="flex items-center justify-between px-4 py-3 border-b border-vscode-border">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-vscode-text">
            SQLTemple Agent
          </span>
          <span className="text-xs text-vscode-text-tertiary">
            {connectionName
              ? `Connected to ${connectionName}`
              : "Connect to a database to chat"}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-vscode-bg-quaternary transition-colors"
        >
          <CloseIcon className="w-4 h-4 text-vscode-text-secondary" />
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-56 border-r border-vscode-border flex flex-col">
          <div className="p-3 border-b border-vscode-border">
            <button
              onClick={onStartNewSession}
              className="w-full inline-flex items-center justify-center space-x-2 text-xs font-semibold text-vscode-text px-3 py-2 rounded bg-vscode-bg-quaternary hover:bg-vscode-bg-tertiary transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New Conversation</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="text-xs text-vscode-text-tertiary px-3 py-4">
                Conversations will appear here.
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`w-full text-left px-3 py-2 border-b border-vscode-border/60 transition-colors ${
                    session.id === activeSessionId
                      ? "bg-vscode-bg-quaternary"
                      : "hover:bg-vscode-bg-quaternary/60"
                  }`}
                >
                  <div className="text-xs font-medium text-vscode-text truncate">
                    {session.title}
                  </div>
                  <div className="flex items-center text-[11px] text-vscode-text-tertiary justify-between mt-0.5">
                    <span>{session.status}</span>
                    <span>{formatShortDate(session.updatedAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-vscode-border px-4 py-2 text-xs text-vscode-text-secondary">
            <span>
              {activeSessionId
                ? `Session ${activeSessionId.slice(0, 6)}…`
                : "New session"}
            </span>
            {activeStatus && (
              <span className="capitalize">
                Status:{" "}
                <span className="font-medium text-vscode-text">
                  {activeStatus}
                </span>
              </span>
            )}
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          >
            {messages.length === 0 ? (
              <div className="text-xs text-vscode-text-tertiary py-6 text-center border border-dashed border-vscode-border rounded">
                Ask anything about your data. The agent will use safe tools to
                explore the connected database.
              </div>
            ) : (
              groupedMessages.map((group) => (
                <div
                  key={group.id}
                  className="space-y-2 border border-vscode-border/60 rounded-lg px-3 py-2 bg-vscode-bg"
                >
                  {group.user && (
                    <MessageBubble
                      message={group.user}
                      liveContent={streamingContent[group.user.id]}
                    />
                  )}

                  {group.processing.length > 0 && (
                    <ProcessingSection
                      count={group.processing.length}
                      expanded={Boolean(expandedGroups[group.id])}
                      onToggle={() => toggleGroup(group.id)}
                      messages={group.processing}
                    />
                  )}

                  {group.responses.map((message) => {
                    const sqlMeta = message.metadata?.sql;
                    const isSqlSuggestion =
                      message.metadata?.type === "sql_suggestion" &&
                      typeof sqlMeta === "string";

                    if (isSqlSuggestion) {
                      const sqlText = sqlMeta as string;
                      return (
                        <SqlSuggestionCard
                          key={message.id}
                          sql={sqlText}
                          description={
                            message.content ||
                            (message.metadata?.description as
                              | string
                              | undefined)
                          }
                          onInsert={() => onInsertSql(sqlText)}
                          onRun={() => onRunSql(sqlText)}
                        />
                      );
                    }

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        liveContent={streamingContent[message.id]}
                      />
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-vscode-border p-3 space-y-2"
          >
            <textarea
              className="w-full bg-vscode-bg rounded border border-vscode-border px-3 py-2 text-sm text-vscode-text focus:outline-none focus:ring-1 focus:ring-vscode-blue resize-none"
              rows={3}
              placeholder={
                connectionName
                  ? "Describe what you need (Cmd+Enter to send)"
                  : "Connect to a database to start a conversation"
              }
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              disabled={isSending || !connectionName}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  if (inputValue.trim()) {
                    const payload = inputValue.trim();
                    void onSend(payload)
                      .then(() => onInputChange(""))
                      .catch(() => undefined);
                  }
                }
              }}
            />

            <div className="flex items-center justify-between text-xs text-vscode-text-tertiary">
              <span>Agent uses the configured AI provider.</span>
              <button
                type="submit"
                disabled={!inputValue.trim() || isSending || !connectionName}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  inputValue.trim() && !isSending && connectionName
                    ? "bg-vscode-green text-vscode-bg hover:bg-vscode-green/80"
                    : "bg-vscode-bg-quaternary text-vscode-text-tertiary cursor-not-allowed"
                }`}
              >
                {isSending ? "Thinking…" : "Send"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: AgentMessageRecord;
  liveContent?: string;
}

interface ProcessingSectionProps {
  count: number;
  expanded: boolean;
  onToggle: () => void;
  messages: AgentMessageRecord[];
}

interface SqlSuggestionCardProps {
  sql: string;
  description?: string | null;
  onInsert: () => void;
  onRun: () => Promise<void> | void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  liveContent,
}) => {
  const content =
    liveContent !== undefined && liveContent !== null
      ? liveContent
      : message.content;

  const isUser = message.role === "user";
  const isTool = message.role === "tool";
  const isThought = message.metadata?.type === "thought";

  const bubbleClass = isUser
    ? "bg-vscode-green text-vscode-bg self-end"
    : isTool
      ? "bg-vscode-bg-quaternary text-vscode-text border border-vscode-border"
      : "bg-vscode-bg-tertiary text-vscode-text";

  const label = isUser
    ? "You"
    : isTool
      ? `Tool: ${message.metadata?.tool || "result"}`
      : isThought
        ? "Thought"
        : "Agent";

  return (
    <div
      className={`flex flex-col text-sm max-w-full ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      <div className="text-xs text-vscode-text-tertiary mb-1">{label}</div>
      <div
        className={`px-3 py-2 rounded-lg whitespace-pre-wrap ${bubbleClass}`}
      >
        {content || <span className="opacity-70">…</span>}
      </div>
    </div>
  );
};

const ProcessingSection: React.FC<ProcessingSectionProps> = ({
  count,
  expanded,
  onToggle,
  messages,
}) => {
  return (
    <div className="bg-vscode-bg-secondary border border-dashed border-vscode-border rounded-lg px-3 py-2 space-y-2">
      <button
        type="button"
        onClick={onToggle}
        className="text-xs text-vscode-text-secondary underline inline-flex items-center gap-1 hover:text-vscode-text"
      >
        <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}>
          ▶
        </span>
        Processing ({count})
      </button>

      {expanded && (
        <div className="space-y-2 text-xs text-vscode-text-secondary">
          {messages.map((message) => (
            <div
              key={message.id}
              className="px-3 py-2 rounded-md bg-vscode-bg border border-vscode-border/80 whitespace-pre-wrap"
            >
              <div className="text-[11px] uppercase tracking-wide text-vscode-text-tertiary mb-1">
                {message.metadata?.type === "tool_call"
                  ? "Tool Call"
                  : message.role === "tool"
                    ? "Tool Result"
                    : "Thought"}
              </div>
              {message.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SqlSuggestionCard: React.FC<SqlSuggestionCardProps> = ({
  sql,
  description,
  onInsert,
  onRun,
}) => {
  return (
    <div className="border border-vscode-border rounded-lg bg-vscode-bg-secondary px-3 py-3 space-y-3">
      <div className="text-[11px] uppercase tracking-wide text-vscode-text-tertiary">
        SQL suggestion
      </div>
      {description && (
        <p className="text-sm text-vscode-text-secondary">{description}</p>
      )}
      <pre className="text-xs bg-vscode-bg border border-vscode-border rounded-md p-3 overflow-auto text-vscode-text font-mono">
        {sql}
      </pre>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onInsert}
          className="text-xs px-3 py-1.5 rounded border border-vscode-green text-vscode-green hover:bg-vscode-green/10 transition-colors"
        >
          Insert
        </button>
        <button
          type="button"
          onClick={() => {
            void onRun();
          }}
          className="text-xs px-3 py-1.5 rounded bg-vscode-green text-vscode-bg hover:bg-vscode-green/80 transition-colors"
        >
          Run
        </button>
      </div>
    </div>
  );
};

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
