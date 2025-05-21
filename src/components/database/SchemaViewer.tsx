import React, { useState } from "react";
import styles from "./SchemaViewer.module.css";

// Schema interfaces
interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  referencedColumn?: string;
}

interface Table {
  name: string;
  columns: Column[];
}

interface View {
  name: string;
  columns: Column[];
}

interface StoredProcedure {
  name: string;
  parameters: { name: string; type: string; mode: string }[];
}

interface Schema {
  tables: Table[];
  views: View[];
  procedures: StoredProcedure[];
}

interface SchemaViewerProps {
  schema: Schema;
  databaseName: string;
  databaseType: string;
  onTableSelect?: (tableName: string) => void;
  onViewSelect?: (viewName: string) => void;
}

const SchemaViewer: React.FC<SchemaViewerProps> = ({
  schema,
  databaseName,
  databaseType,
  onTableSelect,
  onViewSelect,
}) => {
  const [expandedSection, setExpandedSection] = useState<
    "tables" | "views" | "procedures"
  >("tables");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSystemObjects, setShowSystemObjects] = useState(false);

  // Filter functions
  const isSystemObject = (name: string): boolean => {
    return (
      name.startsWith("_") ||
      name.startsWith("sys") ||
      name.startsWith("pg_") ||
      name.startsWith("information_schema") ||
      name.startsWith("sqlite_")
    );
  };

  const filterBySearchTerm = <T extends { name: string }>(items: T[]) => {
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (showSystemObjects || !isSystemObject(item.name))
    );
  };

  const filteredTables = filterBySearchTerm(schema.tables);
  const filteredViews = filterBySearchTerm(schema.views);
  const filteredProcedures = filterBySearchTerm(schema.procedures);

  // Handler functions
  const handleItemClick = (
    itemName: string,
    type: "table" | "view" | "procedure"
  ) => {
    if (expandedItem === itemName) {
      setExpandedItem(null);
    } else {
      setExpandedItem(itemName);

      if (type === "table" && onTableSelect) {
        onTableSelect(itemName);
      } else if (type === "view" && onViewSelect) {
        onViewSelect(itemName);
      }
    }
  };

  const handleSectionClick = (section: "tables" | "views" | "procedures") => {
    setExpandedSection(section);
    setExpandedItem(null);
  };

  // Helper rendering functions
  const renderColumnInfo = (column: Column) => {
    const getColumnIcon = () => {
      if (column.isPrimaryKey) return "🔑";
      if (column.isForeignKey) return "🔗";
      return "📋";
    };

    return (
      <div className={styles.columnItem} key={column.name}>
        <div className={styles.columnIcon}>{getColumnIcon()}</div>
        <div className={styles.columnName}>{column.name}</div>
        <div className={styles.columnType}>{column.type}</div>
        {column.nullable && <div className={styles.columnNullable}>NULL</div>}
        {column.isForeignKey && column.referencedTable && (
          <div className={styles.foreignKeyInfo}>
            → {column.referencedTable}.{column.referencedColumn}
          </div>
        )}
      </div>
    );
  };

  const renderParameterInfo = (param: {
    name: string;
    type: string;
    mode: string;
  }) => {
    return (
      <div className={styles.paramItem} key={param.name}>
        <div className={styles.paramMode}>{param.mode}</div>
        <div className={styles.paramName}>{param.name}</div>
        <div className={styles.paramType}>{param.type}</div>
      </div>
    );
  };

  return (
    <div className={styles.schemaViewer}>
      <div className={styles.schemaHeader}>
        <div className={styles.schemaInfo}>
          <h3>{databaseName}</h3>
          <span className={styles.databaseType}>{databaseType}</span>
        </div>
        <div className={styles.schemaSearch}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search schema..."
            className={styles.searchInput}
          />
          <label className={styles.systemObjectsToggle}>
            <input
              type="checkbox"
              checked={showSystemObjects}
              onChange={() => setShowSystemObjects(!showSystemObjects)}
            />
            Show system objects
          </label>
        </div>
      </div>

      <div className={styles.schemaTabs}>
        <button
          className={`${styles.schemaTab} ${
            expandedSection === "tables" ? styles.activeTab : ""
          }`}
          onClick={() => handleSectionClick("tables")}
        >
          Tables ({filteredTables.length})
        </button>
        <button
          className={`${styles.schemaTab} ${
            expandedSection === "views" ? styles.activeTab : ""
          }`}
          onClick={() => handleSectionClick("views")}
        >
          Views ({filteredViews.length})
        </button>
        <button
          className={`${styles.schemaTab} ${
            expandedSection === "procedures" ? styles.activeTab : ""
          }`}
          onClick={() => handleSectionClick("procedures")}
        >
          Procedures ({filteredProcedures.length})
        </button>
      </div>

      <div className={styles.schemaContent}>
        {expandedSection === "tables" && (
          <div className={styles.tableList}>
            {filteredTables.length === 0 ? (
              <div className={styles.emptyState}>No tables found</div>
            ) : (
              filteredTables.map((table) => (
                <div key={table.name} className={styles.schemaItem}>
                  <div
                    className={styles.schemaItemHeader}
                    onClick={() => handleItemClick(table.name, "table")}
                  >
                    <div className={styles.itemIcon}>📊</div>
                    <div className={styles.itemName}>{table.name}</div>
                    <div className={styles.itemCount}>
                      {table.columns.length} columns
                    </div>
                    <div className={styles.expandIcon}>
                      {expandedItem === table.name ? "▼" : "▶"}
                    </div>
                  </div>

                  {expandedItem === table.name && (
                    <div className={styles.schemaItemDetails}>
                      <div className={styles.columnHeader}>
                        <div className={styles.columnIcon}></div>
                        <div className={styles.columnName}>Column</div>
                        <div className={styles.columnType}>Type</div>
                      </div>
                      {table.columns.map((column) => renderColumnInfo(column))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {expandedSection === "views" && (
          <div className={styles.viewList}>
            {filteredViews.length === 0 ? (
              <div className={styles.emptyState}>No views found</div>
            ) : (
              filteredViews.map((view) => (
                <div key={view.name} className={styles.schemaItem}>
                  <div
                    className={styles.schemaItemHeader}
                    onClick={() => handleItemClick(view.name, "view")}
                  >
                    <div className={styles.itemIcon}>👁️</div>
                    <div className={styles.itemName}>{view.name}</div>
                    <div className={styles.itemCount}>
                      {view.columns.length} columns
                    </div>
                    <div className={styles.expandIcon}>
                      {expandedItem === view.name ? "▼" : "▶"}
                    </div>
                  </div>

                  {expandedItem === view.name && (
                    <div className={styles.schemaItemDetails}>
                      <div className={styles.columnHeader}>
                        <div className={styles.columnIcon}></div>
                        <div className={styles.columnName}>Column</div>
                        <div className={styles.columnType}>Type</div>
                      </div>
                      {view.columns.map((column) => renderColumnInfo(column))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {expandedSection === "procedures" && (
          <div className={styles.procedureList}>
            {filteredProcedures.length === 0 ? (
              <div className={styles.emptyState}>
                No stored procedures found
              </div>
            ) : (
              filteredProcedures.map((procedure) => (
                <div key={procedure.name} className={styles.schemaItem}>
                  <div
                    className={styles.schemaItemHeader}
                    onClick={() => handleItemClick(procedure.name, "procedure")}
                  >
                    <div className={styles.itemIcon}>⚙️</div>
                    <div className={styles.itemName}>{procedure.name}</div>
                    <div className={styles.itemCount}>
                      {procedure.parameters.length} params
                    </div>
                    <div className={styles.expandIcon}>
                      {expandedItem === procedure.name ? "▼" : "▶"}
                    </div>
                  </div>

                  {expandedItem === procedure.name && (
                    <div className={styles.schemaItemDetails}>
                      <div className={styles.paramHeader}>
                        <div className={styles.paramMode}>Mode</div>
                        <div className={styles.paramName}>Parameter</div>
                        <div className={styles.paramType}>Type</div>
                      </div>
                      {procedure.parameters.map((param) =>
                        renderParameterInfo(param)
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaViewer;
