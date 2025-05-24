import React, { useState, useEffect } from "react";
import styles from "./DatabaseExplorer.module.css";
import { DatabaseSelector } from "../database/DatabaseSelector";

interface Column {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

interface Table {
  name: string;
  columns: Column[];
}

interface View {
  name: string;
  columns: Column[];
}

interface Database {
  id: string;
  name: string;
  type?: string;
  status?: 'connected' | 'disconnected' | 'error';
  tables: Table[];
  views: View[];
}

interface DatabaseExplorerProps {
  databases: Database[];
  activeDatabase?: string;
  onDatabaseChange: (databaseId: string) => void;
  onTableSelect: (tableName: string) => void;
  onColumnSelect: (tableName: string, columnName: string) => void;
}

const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({
  databases,
  activeDatabase,
  onDatabaseChange,
  onTableSelect,
  onColumnSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [expandedViews, setExpandedViews] = useState<Record<string, boolean>>({});

  // Set the first database as active if none is selected
  useEffect(() => {
    if (!activeDatabase && databases.length > 0) {
      onDatabaseChange(databases[0].id);
    }
  }, [databases, activeDatabase, onDatabaseChange]);

  const currentDb = databases.find((db) => db.id === activeDatabase);
  
  // Debug logging for schema data
  useEffect(() => {
    if (currentDb) {
      console.log('Current database:', currentDb.name);
      console.log('Tables:', currentDb.tables);
      console.log('Views:', currentDb.views);
    }
  }, [currentDb]);

  const handleTableClick = (tableName: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
    onTableSelect(tableName);
  };

  const handleViewClick = (viewName: string) => {
    setExpandedViews((prev) => ({
      ...prev,
      [viewName]: !prev[viewName],
    }));
  };

  const handleColumnClick = (tableName: string, columnName: string) => {
    onColumnSelect(tableName, columnName);
  };

  // Filter tables and views based on search term
  const filteredTables = currentDb?.tables?.filter((table) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredViews = currentDb?.views?.filter((view) =>
    view.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getColumnIcon = (column: Column) => {
    if (column.isPrimaryKey) return "🔑";
    if (column.isForeignKey) return "🔗";
    return "📋";
  };

  if (!currentDb) {
    return (
      <div className={styles.databaseExplorer}>
        <div className={styles.noDatabase}>
          <p>No database connected</p>
          <p>Connect a database to explore its schema</p>
        </div>
      </div>
    );
  }

  // Check if schema is loaded
  const hasSchema = currentDb.tables?.length > 0 || currentDb.views?.length > 0;
  if (!hasSchema) {
    return (
      <div className={styles.databaseExplorer}>
        <div className={styles.header}>
          <h3>Database Explorer</h3>
          <DatabaseSelector
            databases={databases}
            selectedDatabase={activeDatabase}
            onDatabaseChange={onDatabaseChange}
          />
        </div>
        <div className={styles.noDatabase}>
          <p>No schema available</p>
          <p>The database schema might still be loading or not accessible</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.databaseExplorer}>
      <div className={styles.header}>
        <h3>Database Explorer</h3>
        <DatabaseSelector
          databases={databases}
          selectedDatabase={activeDatabase}
          onDatabaseChange={onDatabaseChange}
        />
      </div>

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search tables and views..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.schemaContainer}>
        <div className={styles.schemaSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>📊</span>
            <span className={styles.sectionTitle}>Tables</span>
            <span className={styles.sectionCount}>{filteredTables.length}</span>
          </div>

          <div className={styles.itemList}>
            {filteredTables.length === 0 ? (
              <div className={styles.emptyMessage}>No tables found</div>
            ) : (
              filteredTables.map((table) => (
                <div key={table.name} className={styles.schemaItem}>
                  <div
                    className={styles.itemHeader}
                    onClick={() => handleTableClick(table.name)}
                  >
                    <span
                      className={`${styles.expandIcon} ${
                        expandedTables[table.name] ? styles.expanded : ""
                      }`}
                    >
                      ▶
                    </span>
                    <span className={styles.itemName}>{table.name}</span>
                  </div>

                  {expandedTables[table.name] && table.columns && (
                    <div className={styles.columnList}>
                      {table.columns.map((column) => (
                        <div
                          key={column.name}
                          className={styles.column}
                          onClick={() => handleColumnClick(table.name, column.name)}
                        >
                          <span className={styles.columnIcon}>
                            {getColumnIcon(column)}
                          </span>
                          <span className={styles.columnName}>{column.name}</span>
                          <span className={styles.columnType}>{column.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.schemaSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>👁️</span>
            <span className={styles.sectionTitle}>Views</span>
            <span className={styles.sectionCount}>{filteredViews.length}</span>
          </div>

          <div className={styles.itemList}>
            {filteredViews.length === 0 ? (
              <div className={styles.emptyMessage}>No views found</div>
            ) : (
              filteredViews.map((view) => (
                <div key={view.name} className={styles.schemaItem}>
                  <div
                    className={styles.itemHeader}
                    onClick={() => handleViewClick(view.name)}
                  >
                    <span
                      className={`${styles.expandIcon} ${
                        expandedViews[view.name] ? styles.expanded : ""
                      }`}
                    >
                      ▶
                    </span>
                    <span className={styles.itemName}>{view.name}</span>
                  </div>

                  {expandedViews[view.name] && (
                    <div className={styles.columnList}>
                      {view.columns.map((column) => (
                        <div
                          key={column.name}
                          className={styles.column}
                          onClick={() => handleColumnClick(view.name, column.name)}
                        >
                          <span className={styles.columnIcon}>
                            {getColumnIcon(column)}
                          </span>
                          <span className={styles.columnName}>{column.name}</span>
                          <span className={styles.columnType}>{column.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseExplorer;
