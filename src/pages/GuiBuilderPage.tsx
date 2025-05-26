import React, { useState, useEffect, useCallback } from "react";
import styles from "./GuiBuilderPage.module.css";
import Button from "../components/shared/Button";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import Modal from "../components/shared/Modal";
import { useAuth } from "../contexts/AuthContext";
import ResultsTable from "../components/playground/ResultsTable";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { DatabaseContext, DatabaseType } from "../contexts/DatabaseContext";
import guiBuilderService from "../services/guiBuilderService";

// Sample query conditions for the GUI builder
type ConditionOperator =
  | "="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "LIKE"
  | "IN"
  | "IS NULL"
  | "IS NOT NULL";

interface QueryCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
  conjunction: "AND" | "OR";
}

interface JoinClause {
  id: string;
  leftTable: string;
  leftField: string;
  rightTable: string;
  rightField: string;
  type: "INNER JOIN" | "LEFT JOIN" | "RIGHT JOIN" | "FULL JOIN";
}

interface SortOrder {
  field: string;
  direction: "ASC" | "DESC";
}

interface TableField {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  table: string;
}

const GuiBuilderPage: React.FC = () => {
  const { user } = useAuth();
  const {
    connections,
    activeConnection,
    setActiveConnection: contextSetActiveConnection,
    loadConnections,
    refreshSchema,
  } = React.useContext(DatabaseContext);

  // UI state
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<Record<string, unknown>[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Query builder state
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<TableField[]>([]);
  const [conditions, setConditions] = useState<QueryCondition[]>([]);
  const [joins, setJoins] = useState<JoinClause[]>([]);
  const [sortOrders, setSortOrders] = useState<SortOrder[]>([]);
  const [limit, setLimit] = useState<number | null>(null);
  const [generatedSql, setGeneratedSql] = useState<string>("");
  // Get table fields once a table is selected
  const [availableFields, setAvailableFields] = useState<TableField[]>([]);
  // State for real playgrounds data
  interface PlaygroundData {
    id: string;
    name: string;
    lastUpdated: Date;
    isActive: boolean;
  }

  const [recentPlaygrounds, setRecentPlaygrounds] = useState<PlaygroundData[]>(
    []
  );

  // Effect to update available fields when a table is selected
  useEffect(() => {
    if (selectedTable && activeConnection?.schema) {
      const tableSchema = activeConnection.schema.tables.find(
        (t) => t.name === selectedTable
      );

      if (tableSchema) {
        const fields = tableSchema.columns.map((column) => ({
          name: column.name,
          type: column.type,
          isPrimaryKey: column.isPrimaryKey,
          isForeignKey: column.isForeignKey,
          table: selectedTable,
        }));

        setAvailableFields(fields);
      }
    } else {
      setAvailableFields([]);
    }
  }, [selectedTable, activeConnection]);
  // Auto-select first connection if no active connection is set
  useEffect(() => {
    if (connections && connections.length > 0 && !activeConnection) {
      contextSetActiveConnection(connections[0]);
    }
  }, [connections, activeConnection, contextSetActiveConnection]);

  // Load connections and playgrounds on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load connections first
        await loadConnections();

        // Load real playgrounds from API
        const { default: playgroundService } = await import(
          "../services/playgroundService"
        );
        const playgrounds = await playgroundService.getPlaygrounds();
        if (playgrounds && Array.isArray(playgrounds)) {
          const formattedPlaygrounds = playgrounds.map(
            (pg: {
              id: string;
              name?: string;
              updatedAt?: string;
              createdAt?: string;
            }) => ({
              id: pg.id,
              name: pg.name || "Unnamed Playground",
              lastUpdated: new Date(pg.updatedAt || pg.createdAt || Date.now()),
              isActive: false,
            })
          );
          setRecentPlaygrounds(formattedPlaygrounds);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        // Set empty array as fallback
        setRecentPlaygrounds([]);
      }
    };

    loadData();
  }, [loadConnections]);

  // Effect to load schema when active connection changes
  useEffect(() => {
    const loadSchema = async () => {
      if (
        activeConnection &&
        (!activeConnection.schema ||
          Object.keys(activeConnection.schema).length === 0)
      ) {
        console.log("Loading schema for connection:", activeConnection);
        try {
          await refreshSchema();
          console.log("Schema loaded successfully:", activeConnection.schema);
        } catch (error) {
          console.error("Error loading schema:", error);
        }
      } else if (activeConnection?.schema) {
        console.log("Using existing schema:", activeConnection.schema);
      }
    };

    loadSchema();
  }, [activeConnection, refreshSchema]);

  // Get all available tables from the active connection
  const availableTables =
    activeConnection?.schema?.tables.map((table) => ({
      name: table.name,
      fieldCount: table.columns.length,
      rowCount: table.rowCount,
    })) || [];

  const resetQueryState = () => {
    setSelectedFields([]);
    setConditions([]);
    setJoins([]);
    setSortOrders([]);
    setLimit(null);
    // generatedSql will be updated by the useEffect hook watching these states
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    resetQueryState();
  };

  // Helper to quote identifiers based on database type
  const quoteIdentifier = (identifier: string): string => {
    if (!activeConnection) return identifier;
    switch (activeConnection.type) {
      case DatabaseType.MYSQL:
        return "`" + identifier.replace(/`/g, "``") + "`";
      case DatabaseType.POSTGRESQL:
      case DatabaseType.SQLITE:
        return `"${identifier.replace(/"/g, '""""')}"`;
      default:
        return identifier;
    }
  };
  // Helper to generate SQL from current query state
  const generateSql = useCallback(() => {
    if (!selectedTable || !activeConnection) {
      setGeneratedSql("");
      return;
    }
    const q = quoteIdentifier;
    let sql = "SELECT ";
    if (selectedFields.length === 0) {
      sql += "* ";
    } else {
      sql += selectedFields
        .map((field) => `${q(field.table)}.${q(field.name)}`)
        .join(", ");
      sql += " ";
    }
    sql += `FROM ${q(selectedTable)} `;
    if (joins.length > 0) {
      joins.forEach((join) => {
        sql += `${join.type} ${q(join.rightTable)} ON ${q(join.leftTable)}.${q(
          join.leftField
        )} = ${q(join.rightTable)}.${q(join.rightField)} `;
      });
    }
    if (conditions.length > 0) {
      sql += "WHERE ";
      conditions.forEach((condition, index) => {
        if (index > 0) {
          sql += `${condition.conjunction} `;
        }
        const fieldNameParts = condition.field.split(".");
        const fieldTable =
          fieldNameParts.length > 1 ? fieldNameParts[0] : selectedTable;
        const fieldCol =
          fieldNameParts.length > 1 ? fieldNameParts[1] : fieldNameParts[0];
        const fieldIdentifier = `${q(fieldTable)}.${q(fieldCol)}`;

        if (
          condition.operator === "IS NULL" ||
          condition.operator === "IS NOT NULL"
        ) {
          sql += `${fieldIdentifier} ${condition.operator}`;
        } else if (condition.operator === "IN") {
          const values = condition.value
            .split(",")
            .map((v) => `'${v.trim().replace(/'/g, "''")}'`);
          sql += `${fieldIdentifier} IN (${values.join(", ")})`;
        } else if (condition.operator === "LIKE") {
          sql += `${fieldIdentifier} LIKE '%${condition.value.replace(
            /'/g,
            "''"
          )}%'`;
        } else {
          sql += `${fieldIdentifier} ${
            condition.operator
          } '${condition.value.replace(/'/g, "''")}'`;
        }
      });
    }
    if (sortOrders.length > 0) {
      sql += "ORDER BY ";
      sql += sortOrders
        .map((sort) => {
          const fieldNameParts = sort.field.split(".");
          const fieldTable =
            fieldNameParts.length > 1 ? fieldNameParts[0] : selectedTable;
          const fieldCol =
            fieldNameParts.length > 1 ? fieldNameParts[1] : fieldNameParts[0];
          return `${q(fieldTable)}.${q(fieldCol)} ${sort.direction}`;
        })
        .join(", ");
    }
    if (limit !== null) {
      sql += `LIMIT ${limit}`;
    }
    sql += ";";
    const finalSql = sql.replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
    setGeneratedSql(finalSql);
  }, [
    selectedTable,
    activeConnection,
    selectedFields,
    conditions,
    joins,
    sortOrders,
    limit,
    quoteIdentifier,
  ]);
  // Effect to regenerate SQL whenever query parts change
  useEffect(() => {
    generateSql();
  }, [generateSql]);

  // Add a new condition
  const handleAddCondition = () => {
    if (availableFields.length === 0) return;

    const newCondition: QueryCondition = {
      id: `condition-${Date.now()}`,
      field: availableFields[0].name,
      operator: "=",
      value: "",
      conjunction: conditions.length === 0 ? "AND" : "AND",
    };

    setConditions([...conditions, newCondition]);
  };

  // Remove a condition
  const handleRemoveCondition = (id: string) => {
    setConditions(conditions.filter((condition) => condition.id !== id));
  };

  // Update a condition
  const handleUpdateCondition = (
    id: string,
    updates: Partial<QueryCondition>
  ) => {
    setConditions(
      conditions.map((condition) =>
        condition.id === id ? { ...condition, ...updates } : condition
      )
    );
  };

  // Add a new join
  const handleAddJoin = () => {
    if (!selectedTable || availableTables.length < 2) return;

    // Find a table different from the selected one
    const otherTable =
      availableTables.find((table) => table.name !== selectedTable)?.name || "";

    const newJoin: JoinClause = {
      id: `join-${Date.now()}`,
      leftTable: selectedTable,
      leftField: availableFields.length > 0 ? availableFields[0].name : "",
      rightTable: otherTable,
      rightField: "",
      type: "INNER JOIN",
    };

    setJoins([...joins, newJoin]);
  };

  // Remove a join
  const handleRemoveJoin = (id: string) => {
    setJoins(joins.filter((join) => join.id !== id));
  };

  // Update a join
  const handleUpdateJoin = (id: string, updates: Partial<JoinClause>) => {
    setJoins(
      joins.map((join) => (join.id === id ? { ...join, ...updates } : join))
    );
  };

  // Add a sort order
  const handleAddSortOrder = () => {
    if (availableFields.length === 0) return;

    const newSortOrder: SortOrder = {
      field: availableFields[0].name,
      direction: "ASC",
    };

    setSortOrders([...sortOrders, newSortOrder]);
  };

  // Remove a sort order
  const handleRemoveSortOrder = (index: number) => {
    setSortOrders(sortOrders.filter((_, i) => i !== index));
  };

  // Toggle field selection
  const handleToggleFieldSelection = (field: TableField) => {
    const isSelected = selectedFields.some(
      (f) => f.name === field.name && f.table === field.table
    );

    if (isSelected) {
      setSelectedFields(
        selectedFields.filter(
          (f) => !(f.name === field.name && f.table === field.table)
        )
      );
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  // Select all fields
  const handleSelectAllFields = () => {
    setSelectedFields(availableFields);
  };

  // Deselect all fields
  const handleDeselectAllFields = () => {
    setSelectedFields([]);
  }; // Execute the generated query
  const handleExecuteQuery = async () => {
    if (!generatedSql.trim()) {
      setError("No SQL query to execute");
      return;
    }
    if (!activeConnection) {
      setError("No active database connection for query execution.");
      return;
    }
    setIsExecuting(true);
    setError(null);
    // Clear previous results before new execution
    setResults(null);
    try {
      const result = await guiBuilderService.executeQuery({
        connectionId: activeConnection.id,
        sqlQuery: generatedSql,
      }); // Convert {columns, rows} format to array of objects format for ResultsTable
      const { rows } = result.data;
      // Note: rows is already an array of objects from the API response
      const formattedResults: Record<string, unknown>[] = rows;

      setResults(formattedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute query");
      setResults(null);
    } finally {
      setIsExecuting(false);
    }
  };

  const downloadFile = (
    content: string,
    fileName: string,
    contentType: string
  ) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    document.body.appendChild(a); // Required for Firefox
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };
  const exportToJson = (data: Record<string, unknown>[], fileName: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    downloadFile(jsonString, fileName, "application/json");
  };

  const escapeCsvCell = (cellData: unknown): string => {
    if (cellData === null || cellData === undefined) {
      return "";
    }
    const stringValue = String(cellData);
    // If the string contains a comma, double quote, or newline, wrap it in double quotes
    // and escape any existing double quotes by doubling them up.
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n") ||
      stringValue.includes("\r")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const exportToCsv = (data: Record<string, unknown>[], fileName: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","), // header row
      ...data.map((row) =>
        headers.map((fieldName) => escapeCsvCell(row[fieldName])).join(",")
      ),
    ];
    const csvString = csvRows.join("\r\n");
    downloadFile(csvString, fileName, "text/csv;charset=utf-8;");
  };

  const escapeXmlValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };
  const exportToXml = (data: Record<string, unknown>[], fileName: string) => {
    if (!data || data.length === 0) return;
    let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n';
    const headers = Object.keys(data[0]);
    data.forEach((row) => {
      xmlString += "  <item>\n";
      headers.forEach((header) => {
        const tagName = header
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .replace(/^[^a-zA-Z_]+/, "_");
        xmlString += `    <${tagName}>${escapeXmlValue(
          row[header]
        )}</${tagName}>\n`;
      });
      xmlString += "  </item>\n";
    });
    xmlString += "</results>";
    downloadFile(xmlString, fileName, "application/xml");
  };

  const handleExportData = (format: "json" | "csv" | "xml") => {
    if (!results || results.length === 0) {
      setError("No data to export.");
      return;
    }

    // Corrected timestamp generation
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\./g, "-");
    const baseFilename = `query_results_${timestamp}`;

    switch (format) {
      case "json":
        exportToJson(results, `${baseFilename}.json`);
        break;
      case "csv":
        exportToCsv(results, `${baseFilename}.csv`);
        break;
      case "xml":
        exportToXml(results, `${baseFilename}.xml`);
        break;
      default:
        console.error("Unsupported export format:", format);
        setError("Unsupported export format.");
    }
  };
  // Playground click handlers
  const handlePlaygroundClick = (playgroundId: string) => {
    // Navigate to the selected playground
    window.location.href = `/playground/${playgroundId}`;
  };

  const handleCreatePlayground = () => {
    // Navigate to create new playground
    window.location.href = "/playground";
  };

  return (
    <div className={styles.guiBuilderPage}>
      <Navbar
        user={
          user
            ? { name: user.name, avatarUrl: user.avatarUrl || undefined }
            : undefined
        }
        onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
        isSidebarVisible={isSidebarVisible}
        onDatabaseConnect={() => setIsConnectModalOpen(true)}
        appName="SQL Query Builder"
      />

      <div className={styles.mainContainer}>
        {" "}
        {isSidebarVisible && (
          <Sidebar
            isVisible={isSidebarVisible}
            playgrounds={recentPlaygrounds.map((pg) => ({
              id: pg.id,
              name: pg.name,
              lastUpdated: pg.lastUpdated,
              isActive: false, // No active playground in gui builder
            }))}
            databases={connections.map((conn) => ({
              id: conn.id,
              name: conn.name,
              status: conn.status,
            }))}
            onPlaygroundClick={handlePlaygroundClick}
            onCreatePlayground={handleCreatePlayground}
            onDatabaseClick={(id) => {
              const connToActivate = connections.find((c) => c.id === id);
              contextSetActiveConnection(connToActivate || null);
            }}
            onConnectDatabase={() => setIsConnectModalOpen(true)}
            onCollapse={() => setIsSidebarVisible(false)}
          />
        )}{" "}
        <div className={styles.content}>
          <div className={styles.builderHeader}>
            <div className={styles.headerContent}>
              <div className={styles.headerText}>
                <h1>Visual Query Builder</h1>
                <p>
                  Build SQL queries using a visual interface instead of writing
                  code.
                </p>
              </div>
              {connections.length > 0 && (
                <div className={styles.databaseSelector}>
                  <label
                    htmlFor="database-select"
                    className={styles.selectorLabel}
                  >
                    Active Database:
                  </label>
                  <select
                    id="database-select"
                    className={styles.databaseSelect}
                    value={activeConnection?.id || ""}
                    onChange={(e) => {
                      const selectedConnection = connections.find(
                        (conn) => conn.id === e.target.value
                      );
                      contextSetActiveConnection(selectedConnection || null);
                    }}
                  >
                    <option value="" disabled>
                      Select a database
                    </option>
                    {connections.map((connection) => (
                      <option key={connection.id} value={connection.id}>
                        {connection.name} ({connection.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {!activeConnection ? (
            <div className={styles.noConnectionMessage}>
              <div className={styles.noConnectionIcon}>🔌</div>
              <h2>No Database Connected</h2>
              <p>Connect to a database to start building queries</p>{" "}
              <Button onClick={() => setIsConnectModalOpen(true)}>
                Connect Database
              </Button>
            </div>
          ) : (
            <div className={styles.builderContainer}>
              <div className={styles.tableSelection}>
                <h2>1. Select Table</h2>
                <div className={styles.tableGrid}>
                  {availableTables.map((table) => (
                    <div
                      key={table.name}
                      className={`${styles.tableCard} ${
                        selectedTable === table.name ? styles.selectedTable : ""
                      }`}
                      onClick={() => handleTableSelect(table.name)}
                    >
                      <div className={styles.tableIcon}>📊</div>
                      <div className={styles.tableDetails}>
                        <div className={styles.tableName}>{table.name}</div>
                        <div className={styles.tableStats}>
                          {table.fieldCount} fields • {table.rowCount} rows
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {selectedTable && (
                <>
                  <div className={styles.fieldSelection}>
                    <div className={styles.sectionHeader}>
                      <h2>2. Select Fields</h2>
                      <div className={styles.fieldActions}>
                        <button
                          onClick={handleSelectAllFields}
                          className={styles.smallButton}
                        >
                          Select All
                        </button>
                        <button
                          onClick={handleDeselectAllFields}
                          className={styles.smallButton}
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                    <div className={styles.fieldsContainer}>
                      {availableFields.length > 0 ? (
                        <div className={styles.fieldGrid}>
                          {availableFields.map((field) => (
                            <div
                              key={`${field.table}-${field.name}`}
                              className={`${styles.fieldCard} ${
                                selectedFields.some(
                                  (f) =>
                                    f.name === field.name &&
                                    f.table === field.table
                                )
                                  ? styles.selectedField
                                  : ""
                              }`}
                              onClick={() => handleToggleFieldSelection(field)}
                            >
                              <div className={styles.fieldIcon}>
                                {field.isPrimaryKey
                                  ? "🔑"
                                  : field.isForeignKey
                                  ? "🔗"
                                  : "📋"}
                              </div>
                              <div className={styles.fieldDetails}>
                                <div className={styles.fieldName}>
                                  {field.name}
                                </div>
                                <div className={styles.fieldType}>
                                  {field.type}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.emptyMessage}>
                          No fields available for the selected table
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.conditionsSection}>
                    <div className={styles.sectionHeader}>
                      <h2>3. Add Conditions</h2>
                      <Button
                        size="small"
                        onClick={handleAddCondition}
                        disabled={availableFields.length === 0}
                      >
                        Add Condition
                      </Button>
                    </div>

                    <div className={styles.conditionsContainer}>
                      {conditions.length > 0 ? (
                        <div className={styles.conditionsList}>
                          {conditions.map((condition, index) => (
                            <div
                              key={condition.id}
                              className={styles.conditionRow}
                            >
                              {index > 0 && (
                                <select
                                  className={styles.conjunctionSelect}
                                  value={condition.conjunction}
                                  onChange={(e) =>
                                    handleUpdateCondition(condition.id, {
                                      conjunction: e.target.value as
                                        | "AND"
                                        | "OR",
                                    })
                                  }
                                >
                                  <option value="AND">AND</option>
                                  <option value="OR">OR</option>
                                </select>
                              )}

                              <select
                                className={styles.fieldSelect}
                                value={condition.field}
                                onChange={(e) =>
                                  handleUpdateCondition(condition.id, {
                                    field: e.target.value,
                                  })
                                }
                              >
                                {availableFields.map((field) => (
                                  <option
                                    key={`${field.table}-${field.name}`}
                                    value={field.name}
                                  >
                                    {field.name}
                                  </option>
                                ))}
                              </select>

                              <select
                                className={styles.operatorSelect}
                                value={condition.operator}
                                onChange={(e) =>
                                  handleUpdateCondition(condition.id, {
                                    operator: e.target
                                      .value as ConditionOperator,
                                  })
                                }
                              >
                                <option value="=">Equals (=)</option>
                                <option value="!=">Not Equals (!=)</option>
                                <option value=">">Greater Than (&gt;)</option>
                                <option value="<">Less Than (&lt;)</option>
                                <option value=">=">
                                  Greater Than or Equal (&gt;=)
                                </option>
                                <option value="<=">
                                  Less Than or Equal (&lt;=)
                                </option>
                                <option value="LIKE">Contains (LIKE)</option>
                                <option value="IN">In List (IN)</option>
                                <option value="IS NULL">Is Empty (NULL)</option>
                                <option value="IS NOT NULL">
                                  Is Not Empty (NOT NULL)
                                </option>
                              </select>

                              {condition.operator !== "IS NULL" &&
                                condition.operator !== "IS NOT NULL" && (
                                  <input
                                    type="text"
                                    className={styles.valueInput}
                                    value={condition.value}
                                    onChange={(e) =>
                                      handleUpdateCondition(condition.id, {
                                        value: e.target.value,
                                      })
                                    }
                                    placeholder={
                                      condition.operator === "IN"
                                        ? "Comma-separated values"
                                        : "Value"
                                    }
                                  />
                                )}

                              <button
                                className={styles.removeButton}
                                onClick={() =>
                                  handleRemoveCondition(condition.id)
                                }
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.emptyConditions}>
                          No conditions added. Query will return all records.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.joinsSection}>
                    <div className={styles.sectionHeader}>
                      <h2>4. Add Joins (Optional)</h2>
                      <Button
                        size="small"
                        onClick={handleAddJoin}
                        disabled={availableTables.length < 2}
                      >
                        Add Join
                      </Button>
                    </div>

                    <div className={styles.joinsContainer}>
                      {joins.length > 0 ? (
                        <div className={styles.joinsList}>
                          {joins.map((join) => (
                            <div key={join.id} className={styles.joinRow}>
                              <select
                                className={styles.joinTypeSelect}
                                value={join.type}
                                onChange={(e) =>
                                  handleUpdateJoin(join.id, {
                                    type: e.target.value as JoinClause["type"],
                                  })
                                }
                              >
                                <option value="INNER JOIN">Inner Join</option>
                                <option value="LEFT JOIN">Left Join</option>
                                <option value="RIGHT JOIN">Right Join</option>
                                <option value="FULL JOIN">Full Join</option>
                              </select>

                              <div className={styles.joinTables}>
                                <div className={styles.joinTable}>
                                  <select
                                    value={join.leftTable}
                                    onChange={(e) =>
                                      handleUpdateJoin(join.id, {
                                        leftTable: e.target.value,
                                      })
                                    }
                                  >
                                    {availableTables.map((table) => (
                                      <option
                                        key={`left-${table.name}`}
                                        value={table.name}
                                      >
                                        {table.name}
                                      </option>
                                    ))}
                                  </select>
                                  <span className={styles.joinDot}>.</span>
                                  <select
                                    value={join.leftField}
                                    onChange={(e) =>
                                      handleUpdateJoin(join.id, {
                                        leftField: e.target.value,
                                      })
                                    }
                                  >
                                    {activeConnection?.schema?.tables
                                      .find((t) => t.name === join.leftTable)
                                      ?.columns.map((column) => (
                                        <option
                                          key={`left-${column.name}`}
                                          value={column.name}
                                        >
                                          {column.name}
                                        </option>
                                      ))}
                                  </select>
                                </div>

                                <span className={styles.joinEquals}>=</span>

                                <div className={styles.joinTable}>
                                  <select
                                    value={join.rightTable}
                                    onChange={(e) =>
                                      handleUpdateJoin(join.id, {
                                        rightTable: e.target.value,
                                      })
                                    }
                                  >
                                    {availableTables.map((table) => (
                                      <option
                                        key={`right-${table.name}`}
                                        value={table.name}
                                      >
                                        {table.name}
                                      </option>
                                    ))}
                                  </select>
                                  <span className={styles.joinDot}>.</span>
                                  <select
                                    value={join.rightField}
                                    onChange={(e) =>
                                      handleUpdateJoin(join.id, {
                                        rightField: e.target.value,
                                      })
                                    }
                                  >
                                    {activeConnection?.schema?.tables
                                      .find((t) => t.name === join.rightTable)
                                      ?.columns.map((column) => (
                                        <option
                                          key={`right-${column.name}`}
                                          value={column.name}
                                        >
                                          {column.name}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              </div>

                              <button
                                className={styles.removeButton}
                                onClick={() => handleRemoveJoin(join.id)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.emptyJoins}>
                          No joins added. Query will use a single table.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.sortLimitSection}>
                    <div className={styles.sortSection}>
                      <div className={styles.sectionHeader}>
                        <h2>5. Sort Results (Optional)</h2>
                        <Button
                          size="small"
                          onClick={handleAddSortOrder}
                          disabled={availableFields.length === 0}
                        >
                          Add Sort
                        </Button>
                      </div>

                      <div className={styles.sortContainer}>
                        {sortOrders.length > 0 ? (
                          <div className={styles.sortList}>
                            {sortOrders.map((sortOrder, index) => (
                              <div key={index} className={styles.sortRow}>
                                <span className={styles.sortLabel}>
                                  Sort by
                                </span>
                                <select
                                  value={sortOrder.field}
                                  onChange={(e) => {
                                    const newSortOrders = [...sortOrders];
                                    newSortOrders[index] = {
                                      ...newSortOrders[index],
                                      field: e.target.value,
                                    };
                                    setSortOrders(newSortOrders);
                                  }}
                                >
                                  {availableFields.map((field) => (
                                    <option
                                      key={`sort-${field.table}-${field.name}`}
                                      value={field.name}
                                    >
                                      {field.name}
                                    </option>
                                  ))}
                                </select>

                                <select
                                  value={sortOrder.direction}
                                  onChange={(e) => {
                                    const newSortOrders = [...sortOrders];
                                    newSortOrders[index] = {
                                      ...newSortOrders[index],
                                      direction: e.target.value as
                                        | "ASC"
                                        | "DESC",
                                    };
                                    setSortOrders(newSortOrders);
                                  }}
                                >
                                  <option value="ASC">Ascending</option>
                                  <option value="DESC">Descending</option>
                                </select>

                                <button
                                  className={styles.removeButton}
                                  onClick={() => handleRemoveSortOrder(index)}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.emptySort}>
                            No sorting applied. Results will use default
                            database order.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.limitSection}>
                      <div className={styles.sectionHeader}>
                        <h2>6. Limit Results (Optional)</h2>
                      </div>

                      <div className={styles.limitContainer}>
                        <div className={styles.limitRow}>
                          <span className={styles.limitLabel}>Limit to</span>
                          <input
                            type="number"
                            className={styles.limitInput}
                            value={limit !== null ? limit : ""}
                            onChange={(e) => {
                              const value = e.target.value.trim();
                              setLimit(value ? parseInt(value) : null);
                            }}
                            min="1"
                            placeholder="No limit"
                          />
                          <span className={styles.limitLabel}>rows</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.previewExecuteSection}>
                    <div className={styles.previewSection}>
                      <h2>Generated SQL</h2>
                      <div className={styles.sqlPreview}>
                        <pre>{generatedSql}</pre>
                      </div>
                    </div>

                    <div className={styles.executeSection}>
                      <Button
                        variant="primary"
                        onClick={handleExecuteQuery}
                        disabled={isExecuting || !generatedSql.trim()}
                      >
                        {isExecuting ? "Executing..." : "Execute Query"}
                      </Button>
                    </div>
                  </div>
                </>
              )}{" "}
              {/* Results Section */}
              <div className={styles.resultsSection}>
                {isExecuting ? (
                  <div className={styles.loadingContainer}>
                    <LoadingSpinner size="large" text="Executing query..." />
                  </div>
                ) : results && results.length > 0 ? (
                  <div className={styles.queryResults}>
                    <div className={styles.resultsHeader}>
                      <span>Results ({results.length} rows)</span>
                    </div>
                    <ResultsTable
                      data={results}
                      isLoading={false}
                      error={error}
                      onExportData={handleExportData}
                    />
                  </div>
                ) : error && !isExecuting ? (
                  <div className={styles.errorContainer}>
                    <h2>Error</h2>
                    <div className={styles.errorMessage}>{error}</div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        title="Connect to Database"
        size="medium"
      >
        <div className={styles.connectModalContent}>
          <p>This would contain the database connection form.</p>
          <p>For now, we're just using the mock connections.</p>
        </div>
      </Modal>
    </div>
  );
};

export default GuiBuilderPage;
