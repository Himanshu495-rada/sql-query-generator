import React, { useState } from "react";
import styles from "./DatabaseList.module.css";
import Button from "../shared/Button";

interface Database {
  id: string;
  name: string;
  type: string;
  host: string;
  status: "connected" | "disconnected" | "error";
  lastConnected: Date | null;
  isSandbox: boolean;
}

interface DatabaseListProps {
  databases: Database[];
  onConnect: (databaseId: string) => void;
  onDisconnect: (databaseId: string) => void;
  onViewSchema: (databaseId: string) => void;
  onDelete: (databaseId: string) => void;
}

const DatabaseList: React.FC<DatabaseListProps> = ({
  databases,
  onConnect,
  onDisconnect,
  onViewSchema,
  onDelete,
}) => {
  const [expandedDatabaseId, setExpandedDatabaseId] = useState<string | null>(
    null
  );
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const toggleExpand = (databaseId: string) => {
    setExpandedDatabaseId(
      expandedDatabaseId === databaseId ? null : databaseId
    );
  };

  const handleDelete = (databaseId: string) => {
    if (confirmDelete === databaseId) {
      onDelete(databaseId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(databaseId);
    }
  };

  const getStatusIcon = (status: "connected" | "disconnected" | "error") => {
    switch (status) {
      case "connected":
        return (
          <span
            className={`${styles.statusIndicator} ${styles.connected}`}
            title="Connected"
          >
            ●
          </span>
        );
      case "disconnected":
        return (
          <span
            className={`${styles.statusIndicator} ${styles.disconnected}`}
            title="Disconnected"
          >
            ●
          </span>
        );
      case "error":
        return (
          <span
            className={`${styles.statusIndicator} ${styles.error}`}
            title="Error"
          >
            ●
          </span>
        );
    }
  };

  const getDatabaseTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "mysql":
        return "🐬";
      case "postgresql":
        return "🐘";
      case "sqlserver":
        return "🔷";
      case "oracle":
        return "🔶";
      case "sqlite":
        return "📄";
      default:
        return "💾";
    }
  };

  if (databases.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🔌</div>
        <h3>No databases connected</h3>
        <p>Connect to a database to get started</p>
      </div>
    );
  }

  return (
    <div className={styles.databaseListContainer}>
      <div className={styles.databaseList}>
        {databases.map((database) => (
          <div
            key={database.id}
            className={`${styles.databaseItem} ${
              expandedDatabaseId === database.id ? styles.expanded : ""
            }`}
          >
            <div
              className={styles.databaseHeader}
              onClick={() => toggleExpand(database.id)}
            >
              <div className={styles.databaseHeaderLeft}>
                <span className={styles.databaseIcon}>
                  {getDatabaseTypeIcon(database.type)}
                </span>
                <div className={styles.databaseInfo}>
                  <div className={styles.databaseName}>
                    {database.name}
                    {database.isSandbox && (
                      <span className={styles.sandboxBadge}>Sandbox</span>
                    )}
                  </div>
                  <div className={styles.databaseHost}>{database.host}</div>
                </div>
              </div>
              <div className={styles.databaseStatus}>
                {getStatusIcon(database.status)}
                <span className={styles.expandIcon}>
                  {expandedDatabaseId === database.id ? "▲" : "▼"}
                </span>
              </div>
            </div>

            {expandedDatabaseId === database.id && (
              <div className={styles.databaseDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Database type:</span>
                  <span className={styles.detailValue}>{database.type}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Host:</span>
                  <span className={styles.detailValue}>{database.host}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Status:</span>
                  <span className={styles.detailValue}>
                    {database.status.charAt(0).toUpperCase() +
                      database.status.slice(1)}
                  </span>
                </div>
                {database.lastConnected && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Last connected:</span>
                    <span className={styles.detailValue}>
                      {database.lastConnected.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className={styles.actions}>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => onViewSchema(database.id)}
                  >
                    View Schema
                  </Button>
                  {database.status === "connected" ? (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => onDisconnect(database.id)}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => onConnect(database.id)}
                    >
                      Connect
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleDelete(database.id)}
                  >
                    {confirmDelete === database.id
                      ? "Confirm Delete"
                      : "Delete"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DatabaseList;
