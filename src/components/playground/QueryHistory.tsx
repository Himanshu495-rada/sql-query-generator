import React, { useState } from "react";
import styles from "./QueryHistory.module.css";

interface QueryHistoryItem {
  id: string;
  timestamp: Date;
  prompt: string;
  sql: string;
  hasError: boolean;
  rowCount?: number;
}

interface QueryHistoryProps {
  history: QueryHistoryItem[];
  onSelectQuery: (query: QueryHistoryItem) => void;
  onClearHistory: () => void;
}

const QueryHistory: React.FC<QueryHistoryProps> = ({
  history,
  onSelectQuery,
  onClearHistory,
}) => {
  const [expandedQueryId, setExpandedQueryId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "success" | "error">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const toggleExpand = (queryId: string) => {
    setExpandedQueryId(expandedQueryId === queryId ? null : queryId);
  };

  const filteredHistory = history.filter((item) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "success" && !item.hasError) ||
      (filter === "error" && item.hasError);

    const matchesSearch =
      item.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sql.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Format relative time (e.g., "5 minutes ago")
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <div className={styles.historyContainer}>
      <div className={styles.historyHeader}>
        <h3>Query History</h3>
        <div className={styles.historyFilters}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterButtonGroup}>
            <button
              className={`${styles.filterButton} ${
                filter === "all" ? styles.active : ""
              }`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`${styles.filterButton} ${
                filter === "success" ? styles.active : ""
              }`}
              onClick={() => setFilter("success")}
            >
              Success
            </button>
            <button
              className={`${styles.filterButton} ${
                filter === "error" ? styles.active : ""
              }`}
              onClick={() => setFilter("error")}
            >
              Errors
            </button>
          </div>

          {history.length > 0 && (
            <button className={styles.clearButton} onClick={onClearHistory}>
              Clear History
            </button>
          )}
        </div>
      </div>

      <div className={styles.historyList}>
        {filteredHistory.length === 0 ? (
          <div className={styles.emptyHistory}>
            {searchTerm || filter !== "all"
              ? "No matching queries found."
              : "Your query history will appear here."}
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className={`${styles.historyItem} ${
                item.hasError ? styles.errorItem : ""
              }`}
            >
              <div
                className={styles.historyItemHeader}
                onClick={() => toggleExpand(item.id)}
              >
                <div className={styles.headerPrompt}>
                  {item.prompt.length > 60
                    ? `${item.prompt.substring(0, 60)}...`
                    : item.prompt}
                </div>
                <div className={styles.headerInfo}>
                  {!item.hasError && item.rowCount !== undefined && (
                    <span className={styles.rowCount}>
                      {item.rowCount} rows
                    </span>
                  )}
                  <span className={styles.timestamp}>
                    {getRelativeTime(item.timestamp)}
                  </span>
                  <span className={styles.expandIcon}>
                    {expandedQueryId === item.id ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {expandedQueryId === item.id && (
                <div className={styles.historyItemDetails}>
                  <div className={styles.promptSection}>
                    <div className={styles.sectionLabel}>Prompt:</div>
                    <div className={styles.promptText}>{item.prompt}</div>
                  </div>
                  <div className={styles.sqlSection}>
                    <div className={styles.sectionLabel}>SQL:</div>
                    <pre className={styles.sqlCode}>{item.sql}</pre>
                  </div>
                  <div className={styles.historyItemActions}>
                    <button
                      className={styles.useQueryButton}
                      onClick={() => onSelectQuery(item)}
                    >
                      Use This Query
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QueryHistory;
