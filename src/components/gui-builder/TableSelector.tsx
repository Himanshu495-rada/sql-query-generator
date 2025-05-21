import React, { useState, useEffect } from "react";
import styles from "./TableSelector.module.css";

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

interface Table {
  name: string;
  columns: Column[];
  rowCount?: number;
  description?: string;
}

interface ForeignKeyRelation {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

interface TableSelectorProps {
  tables: Table[];
  relations: ForeignKeyRelation[];
  onTableSelect: (tableName: string) => void;
  selectedTable: string | null;
}

const TableSelector: React.FC<TableSelectorProps> = ({
  tables,
  relations,
  onTableSelect,
  selectedTable,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTables, setFilteredTables] = useState<Table[]>(tables);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  // Filter tables based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTables(tables);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredTables(
        tables.filter(
          (table) =>
            table.name.toLowerCase().includes(term) ||
            table.description?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, tables]);

  // Group tables by prefix (e.g., "customer_*", "order_*")
  const getTableGroups = () => {
    const groups: { [key: string]: Table[] } = {};

    filteredTables.forEach((table) => {
      const parts = table.name.split("_");
      const prefix = parts.length > 1 ? parts[0] : "other";

      if (!groups[prefix]) {
        groups[prefix] = [];
      }

      groups[prefix].push(table);
    });

    return groups;
  };

  const tableGroups = getTableGroups();

  // Find related tables for the selected table
  const getRelatedTables = (tableName: string) => {
    return relations
      .filter((rel) => rel.fromTable === tableName || rel.toTable === tableName)
      .map((rel) =>
        rel.fromTable === tableName ? rel.toTable : rel.fromTable
      );
  };

  const relatedTables = selectedTable ? getRelatedTables(selectedTable) : [];

  // Renders a single table card or list item
  const renderTableItem = (table: Table) => {
    const isSelected = table.name === selectedTable;
    const isRelated = relatedTables.includes(table.name);

    const columnCount = table.columns.length;
    const pkCount = table.columns.filter((col) => col.isPrimaryKey).length;
    const fkCount = table.columns.filter((col) => col.isForeignKey).length;

    if (viewMode === "grid") {
      return (
        <div
          key={table.name}
          className={`${styles.tableCard} ${
            isSelected ? styles.selected : ""
          } ${isRelated ? styles.related : ""}`}
          onClick={() => onTableSelect(table.name)}
        >
          <div className={styles.tableHeader}>
            <h3 className={styles.tableName}>{table.name}</h3>
            {isSelected && (
              <span className={styles.selectedBadge}>Selected</span>
            )}
            {!isSelected && isRelated && (
              <span className={styles.relatedBadge}>Related</span>
            )}
          </div>

          <div className={styles.tableStats}>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>📋</span>
              <span className={styles.statValue}>{columnCount} columns</span>
            </div>
            {pkCount > 0 && (
              <div className={styles.statItem}>
                <span className={styles.statIcon}>🔑</span>
                <span className={styles.statValue}>
                  {pkCount} {pkCount === 1 ? "key" : "keys"}
                </span>
              </div>
            )}
            {fkCount > 0 && (
              <div className={styles.statItem}>
                <span className={styles.statIcon}>🔗</span>
                <span className={styles.statValue}>
                  {fkCount} {fkCount === 1 ? "relation" : "relations"}
                </span>
              </div>
            )}
            {table.rowCount !== undefined && (
              <div className={styles.statItem}>
                <span className={styles.statIcon}>📊</span>
                <span className={styles.statValue}>
                  {table.rowCount.toLocaleString()} rows
                </span>
              </div>
            )}
          </div>

          {table.description && (
            <div className={styles.tableDescription}>
              {table.description.length > 80
                ? `${table.description.slice(0, 80)}...`
                : table.description}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div
          key={table.name}
          className={`${styles.tableListItem} ${
            isSelected ? styles.selected : ""
          } ${isRelated ? styles.related : ""}`}
          onClick={() => onTableSelect(table.name)}
        >
          <div className={styles.tableListName}>{table.name}</div>
          <div className={styles.tableListStats}>
            <span>{columnCount} cols</span>
            {pkCount > 0 && (
              <span className={styles.pkBadge}>{pkCount} PK</span>
            )}
            {fkCount > 0 && (
              <span className={styles.fkBadge}>{fkCount} FK</span>
            )}
            {table.rowCount !== undefined && (
              <span className={styles.rowCountBadge}>
                {table.rowCount.toLocaleString()} rows
              </span>
            )}
          </div>
          {(isSelected || isRelated) && (
            <div className={styles.tableBadgeWrapper}>
              {isSelected && (
                <span className={styles.selectedBadge}>Selected</span>
              )}
              {!isSelected && isRelated && (
                <span className={styles.relatedBadge}>Related</span>
              )}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className={styles.tableSelectorContainer}>
      <div className={styles.toolBar}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearchTerm("")}
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.viewControls}>
          <button
            className={`${styles.viewButton} ${
              viewMode === "grid" ? styles.active : ""
            }`}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            ⊞
          </button>
          <button
            className={`${styles.viewButton} ${
              viewMode === "list" ? styles.active : ""
            }`}
            onClick={() => setViewMode("list")}
            title="List view"
          >
            ≡
          </button>
        </div>
      </div>

      <div className={styles.tableCount}>
        {filteredTables.length}{" "}
        {filteredTables.length === 1 ? "table" : "tables"} found
        {searchTerm && ` for "${searchTerm}"`}
      </div>

      {viewMode === "grid" ? (
        // Grid view
        <div className={styles.tableGrid}>
          {filteredTables.length > 0 ? (
            filteredTables.map((table) => renderTableItem(table))
          ) : (
            <div className={styles.noTablesMessage}>
              No tables found matching your search.
            </div>
          )}
        </div>
      ) : (
        // List view with grouping
        <div className={styles.tableList}>
          {Object.keys(tableGroups).length > 0 ? (
            Object.entries(tableGroups).map(([prefix, tables]) => (
              <div className={styles.tableGroup} key={prefix}>
                <div className={styles.groupHeader}>
                  {prefix.toUpperCase()} ({tables.length})
                </div>
                {tables.map((table) => renderTableItem(table))}
              </div>
            ))
          ) : (
            <div className={styles.noTablesMessage}>
              No tables found matching your search.
            </div>
          )}
        </div>
      )}

      {selectedTable && (
        <div className={styles.selectedTableInfo}>
          <div className={styles.selectedTableHeader}>
            <h3>Selected Table: {selectedTable}</h3>
          </div>
          <div className={styles.columnList}>
            {tables
              .find((t) => t.name === selectedTable)
              ?.columns.map((column) => (
                <div key={column.name} className={styles.columnItem}>
                  <span className={styles.columnIcon}>
                    {column.isPrimaryKey
                      ? "🔑"
                      : column.isForeignKey
                      ? "🔗"
                      : "📋"}
                  </span>
                  <span className={styles.columnName}>{column.name}</span>
                  <span className={styles.columnType}>{column.type}</span>
                  {column.nullable && (
                    <span className={styles.nullableBadge}>NULL</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSelector;
