import React, { useState, useEffect } from "react";
import styles from "./GuiBuilderPage.module.css";
import Button from "../components/shared/Button";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import Modal from "../components/shared/Modal";
import useDatabase from "../hooks/useDatabase";
import { useAuth } from "../contexts/AuthContext";
import ResultsTable from "../components/playground/ResultsTable";
import LoadingSpinner from "../components/shared/LoadingSpinner";

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
  const { connections, activeConnection, executeQuery, setActiveConnection } =
    useDatabase();

  // UI state
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | undefined>(
    undefined
  );

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

  // Get all available tables from the active connection
  const availableTables =
    activeConnection?.schema?.tables.map((table) => ({
      name: table.name,
      fieldCount: table.columns.length,
      rowCount: table.rowCount,
    })) || [];

  // Helper to generate SQL from current query state
  const generateSql = () => {
    if (!selectedTable) {
      setGeneratedSql("");
      return;
    }

    let sql = "SELECT ";

    // Selected fields
    if (selectedFields.length === 0) {
      sql += "* ";
    } else {
      sql += selectedFields
        .map((field) => `${field.table}.${field.name}`)
        .join(", ");
      sql += " ";
    }

    // FROM clause
    sql += `\nFROM ${selectedTable} `;

    // JOIN clauses
    if (joins.length > 0) {
      joins.forEach((join) => {
        sql += `\n${join.type} ${join.rightTable} ON ${join.leftTable}.${join.leftField} = ${join.rightTable}.${join.rightField} `;
      });
    }

    // WHERE clause
    if (conditions.length > 0) {
      sql += "\nWHERE ";
      conditions.forEach((condition, index) => {
        if (index > 0) {
          sql += ` ${condition.conjunction} `;
        }

        // Handle IS NULL and IS NOT NULL differently
        if (
          condition.operator === "IS NULL" ||
          condition.operator === "IS NOT NULL"
        ) {
          sql += `${condition.field} ${condition.operator}`;
        } else if (condition.operator === "IN") {
          // Split comma-separated values for IN operator
          const values = condition.value.split(",").map((v) => v.trim());
          sql += `${condition.field} IN (${values
            .map((v) => `'${v}'`)
            .join(", ")})`;
        } else if (condition.operator === "LIKE") {
          sql += `${condition.field} LIKE '%${condition.value}%'`;
        } else {
          sql += `${condition.field} ${condition.operator} '${condition.value}'`;
        }
      });
    }

    // ORDER BY clause
    if (sortOrders.length > 0) {
      sql += "\nORDER BY ";
      sql += sortOrders
        .map((sort) => `${sort.field} ${sort.direction}`)
        .join(", ");
    }

    // LIMIT clause
    if (limit !== null) {
      sql += `\nLIMIT ${limit}`;
    }

    sql += ";";

    setGeneratedSql(sql);
  };

  // Effect to regenerate SQL whenever query parts change
  useEffect(() => {
    generateSql();
  }, [selectedTable, selectedFields, conditions, joins, sortOrders, limit]);

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
  };

  // Execute the generated query
  const handleExecuteQuery = async () => {
    if (!generatedSql.trim()) {
      setError("No SQL query to execute");
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const startTime = performance.now();
      const result = await executeQuery(generatedSql);
      const endTime = performance.now();

      setResults(result.data);
      setExecutionTime(endTime - startTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute query");
      setResults(null);
    } finally {
      setIsExecuting(false);
    }
  };

  // Sample playground data for the sidebar
  const samplePlaygrounds = [
    {
      id: "pg1",
      name: "Sales Analysis",
      lastUpdated: new Date(),
      isActive: true,
    },
    {
      id: "pg2",
      name: "User Demographics",
      lastUpdated: new Date(Date.now() - 86400000),
    },
    {
      id: "pg3",
      name: "Inventory Report",
      lastUpdated: new Date(Date.now() - 172800000),
    },
  ];

  return (
    <div className={styles.guiBuilderPage}>
      <Navbar
        user={user ? { name: user.name, avatarUrl: user.avatarUrl } : undefined}
        onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
        isSidebarVisible={isSidebarVisible}
        onDatabaseConnect={() => setIsConnectModalOpen(true)}
        appName="SQL Query Builder"
      />

      <div className={styles.mainContainer}>
        {isSidebarVisible && (
          <Sidebar
            isVisible={isSidebarVisible}
            playgrounds={samplePlaygrounds}
            databases={connections.map((conn) => ({
              id: conn.id,
              name: conn.name,
              status: conn.status,
            }))}
            onPlaygroundClick={() => {}}
            onCreatePlayground={() => {}}
            onDatabaseClick={(id) => setActiveConnection(id)}
            onConnectDatabase={() => setIsConnectModalOpen(true)}
            onCollapse={() => setIsSidebarVisible(false)}
          />
        )}

        <div className={styles.content}>
          <div className={styles.builderHeader}>
            <h1>Visual Query Builder</h1>
            <p>
              Build SQL queries using a visual interface instead of writing
              code.
            </p>
          </div>

          {!activeConnection ? (
            <div className={styles.noConnectionMessage}>
              <div className={styles.noConnectionIcon}>🔌</div>
              <h2>No Database Connected</h2>
              <p>Connect to a database to start building queries</p>
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
                      onClick={() => setSelectedTable(table.name)}
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
              )}

              {/* Results Section */}
              <div className={styles.resultsSection}>
                {isExecuting ? (
                  <div className={styles.loadingContainer}>
                    <LoadingSpinner size="large" text="Executing query..." />
                  </div>
                ) : results ? (
                  <div className={styles.queryResults}>
                    <h2>Query Results</h2>
                    <ResultsTable
                      data={results}
                      isLoading={false}
                      executionTime={executionTime}
                      onExportData={() => {}}
                    />
                  </div>
                ) : error ? (
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
