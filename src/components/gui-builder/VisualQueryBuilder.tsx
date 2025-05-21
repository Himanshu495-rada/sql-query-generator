import React, { useState, useEffect } from "react";
import styles from "./VisualQueryBuilder.module.css";

interface Column {
  name: string;
  type: string;
  table: string;
}

interface Table {
  name: string;
  alias?: string;
}

interface Join {
  type: "INNER" | "LEFT" | "RIGHT" | "OUTER";
  table: string;
  alias?: string;
  condition: string;
}

interface WhereCondition {
  id: string;
  column: string;
  operator: string;
  value: string;
  logicalOperator?: "AND" | "OR";
}

interface OrderByClause {
  column: string;
  direction: "ASC" | "DESC";
}

interface QueryState {
  selectedColumns: Column[];
  tables: Table[];
  joins: Join[];
  whereConditions: WhereCondition[];
  groupByColumns: string[];
  orderByClauses: OrderByClause[];
  limit: string;
  offset: string;
  distinct: boolean;
}

interface VisualQueryBuilderProps {
  availableTables: {
    name: string;
    columns: { name: string; type: string }[];
  }[];
  onQueryChange: (query: string, queryState: QueryState) => void;
  initialQueryState?: QueryState;
}

const VisualQueryBuilder: React.FC<VisualQueryBuilderProps> = ({
  availableTables,
  onQueryChange,
  initialQueryState,
}) => {
  const defaultQueryState: QueryState = {
    selectedColumns: [],
    tables: [],
    joins: [],
    whereConditions: [],
    groupByColumns: [],
    orderByClauses: [],
    limit: "",
    offset: "",
    distinct: false,
  };

  const [queryState, setQueryState] = useState<QueryState>(
    initialQueryState || defaultQueryState
  );
  const [availableColumns, setAvailableColumns] = useState<Column[]>([]);
  const [activeTab, setActiveTab] = useState<
    "columns" | "where" | "joins" | "groupBy" | "orderBy" | "options"
  >("columns");
  const [sqlQuery, setSqlQuery] = useState<string>("");
  const [conditionId, setConditionId] = useState<number>(1);

  // Operators available for WHERE conditions
  const operators = [
    { value: "=", label: "Equals (=)" },
    { value: "<>", label: "Not Equal (<>)" },
    { value: ">", label: "Greater Than (>)" },
    { value: "<", label: "Less Than (<)" },
    { value: ">=", label: "Greater Than or Equal (>=)" },
    { value: "<=", label: "Less Than or Equal (<=)" },
    { value: "LIKE", label: "Like" },
    { value: "NOT LIKE", label: "Not Like" },
    { value: "IN", label: "In" },
    { value: "NOT IN", label: "Not In" },
    { value: "IS NULL", label: "Is Null" },
    { value: "IS NOT NULL", label: "Is Not Null" },
  ];

  // Update available columns when tables change
  useEffect(() => {
    const columns: Column[] = [];

    queryState.tables.forEach((table) => {
      const foundTable = availableTables.find((t) => t.name === table.name);
      if (foundTable) {
        foundTable.columns.forEach((column) => {
          columns.push({
            name: column.name,
            type: column.type,
            table: table.alias || table.name,
          });
        });
      }
    });

    setAvailableColumns(columns);
  }, [queryState.tables, availableTables]);

  // Generate SQL query when query state changes
  useEffect(() => {
    generateSqlQuery();
  }, [queryState]);

  const generateSqlQuery = () => {
    const {
      selectedColumns,
      tables,
      joins,
      whereConditions,
      groupByColumns,
      orderByClauses,
      limit,
      offset,
      distinct,
    } = queryState;

    if (tables.length === 0 || selectedColumns.length === 0) {
      setSqlQuery("");
      return;
    }

    let query = "SELECT ";

    if (distinct) {
      query += "DISTINCT ";
    }

    // Add selected columns
    query += selectedColumns
      .map((col) => `${col.table}.${col.name}`)
      .join(", ");

    // Add FROM clause
    const mainTable = tables[0];
    query += `\nFROM ${mainTable.name}${
      mainTable.alias ? ` AS ${mainTable.alias}` : ""
    }`;

    // Add JOINs
    if (joins.length > 0) {
      joins.forEach((join) => {
        query += `\n${join.type} JOIN ${join.table}${
          join.alias ? ` AS ${join.alias}` : ""
        } ON ${join.condition}`;
      });
    }

    // Add WHERE clause
    if (whereConditions.length > 0) {
      query += "\nWHERE ";

      whereConditions.forEach((condition, index) => {
        if (index > 0) {
          query += ` ${condition.logicalOperator} `;
        }

        if (
          condition.operator === "IS NULL" ||
          condition.operator === "IS NOT NULL"
        ) {
          query += `${condition.column} ${condition.operator}`;
        } else if (
          condition.operator === "IN" ||
          condition.operator === "NOT IN"
        ) {
          query += `${condition.column} ${condition.operator} (${condition.value})`;
        } else {
          query += `${condition.column} ${condition.operator} ${condition.value}`;
        }
      });
    }

    // Add GROUP BY clause
    if (groupByColumns.length > 0) {
      query += `\nGROUP BY ${groupByColumns.join(", ")}`;
    }

    // Add ORDER BY clause
    if (orderByClauses.length > 0) {
      query += `\nORDER BY ${orderByClauses
        .map((clause) => `${clause.column} ${clause.direction}`)
        .join(", ")}`;
    }

    // Add LIMIT and OFFSET
    if (limit) {
      query += `\nLIMIT ${limit}`;

      if (offset) {
        query += ` OFFSET ${offset}`;
      }
    }

    setSqlQuery(query);
    onQueryChange(query, queryState);
  };

  // Handler for adding a table
  const handleAddTable = (tableName: string) => {
    const tableExists = queryState.tables.some((t) => t.name === tableName);

    if (!tableExists) {
      const updatedTables = [...queryState.tables, { name: tableName }];
      setQueryState((prev) => ({
        ...prev,
        tables: updatedTables,
      }));
    }
  };

  // Handler for adding a column to select
  const handleAddColumn = (column: Column) => {
    const columnExists = queryState.selectedColumns.some(
      (c) => c.name === column.name && c.table === column.table
    );

    if (!columnExists) {
      setQueryState((prev) => ({
        ...prev,
        selectedColumns: [...prev.selectedColumns, column],
      }));
    }
  };

  // Handler for removing a column from select
  const handleRemoveColumn = (column: Column) => {
    setQueryState((prev) => ({
      ...prev,
      selectedColumns: prev.selectedColumns.filter(
        (c) => !(c.name === column.name && c.table === column.table)
      ),
    }));
  };

  // Handler for adding a WHERE condition
  const handleAddWhereCondition = () => {
    if (availableColumns.length === 0) return;

    const newCondition: WhereCondition = {
      id: `condition-${conditionId}`,
      column: `${availableColumns[0].table}.${availableColumns[0].name}`,
      operator: "=",
      value: "",
      logicalOperator:
        queryState.whereConditions.length > 0 ? "AND" : undefined,
    };

    setConditionId((prev) => prev + 1);
    setQueryState((prev) => ({
      ...prev,
      whereConditions: [...prev.whereConditions, newCondition],
    }));
  };

  // Handler for removing a WHERE condition
  const handleRemoveWhereCondition = (id: string) => {
    setQueryState((prev) => ({
      ...prev,
      whereConditions: prev.whereConditions.filter((c) => c.id !== id),
    }));
  };

  // Handler for updating a WHERE condition
  const handleWhereConditionChange = (
    id: string,
    field: keyof WhereCondition,
    value: string
  ) => {
    setQueryState((prev) => ({
      ...prev,
      whereConditions: prev.whereConditions.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  // Handler for adding a JOIN
  const handleAddJoin = () => {
    if (availableTables.length < 2 || queryState.tables.length < 1) return;

    // Find a table that's not already in the query
    const mainTable = queryState.tables[0];
    const availableTable = availableTables.find(
      (t) =>
        !queryState.tables.some((qt) => qt.name === t.name) &&
        t.name !== mainTable.name
    );

    if (availableTable) {
      const newJoin: Join = {
        type: "INNER",
        table: availableTable.name,
        condition: `${mainTable.alias || mainTable.name}.id = ${
          availableTable.name
        }.${mainTable.name.toLowerCase()}_id`,
      };

      setQueryState((prev) => ({
        ...prev,
        joins: [...prev.joins, newJoin],
        tables: [...prev.tables, { name: availableTable.name }],
      }));
    }
  };

  // Handler for removing a JOIN
  const handleRemoveJoin = (index: number) => {
    const removedJoin = queryState.joins[index];

    setQueryState((prev) => {
      // Remove the join
      const updatedJoins = prev.joins.filter((_, i) => i !== index);

      // Remove the table associated with this join
      const updatedTables = prev.tables.filter(
        (t) => t.name !== removedJoin.table
      );

      // Remove any columns that were from the removed table
      const updatedSelectedColumns = prev.selectedColumns.filter(
        (col) =>
          col.table !== removedJoin.table && col.table !== removedJoin.alias
      );

      // Update where conditions
      const updatedWhereConditions = prev.whereConditions.filter(
        (condition) =>
          !condition.column.startsWith(
            `${removedJoin.alias || removedJoin.table}.`
          )
      );

      // Update group by
      const updatedGroupByColumns = prev.groupByColumns.filter(
        (col) => !col.startsWith(`${removedJoin.alias || removedJoin.table}.`)
      );

      // Update order by
      const updatedOrderByClauses = prev.orderByClauses.filter(
        (clause) =>
          !clause.column.startsWith(
            `${removedJoin.alias || removedJoin.table}.`
          )
      );

      return {
        ...prev,
        joins: updatedJoins,
        tables: updatedTables,
        selectedColumns: updatedSelectedColumns,
        whereConditions: updatedWhereConditions,
        groupByColumns: updatedGroupByColumns,
        orderByClauses: updatedOrderByClauses,
      };
    });
  };

  // Handler for updating a JOIN
  const handleJoinChange = (
    index: number,
    field: keyof Join,
    value: string
  ) => {
    setQueryState((prev) => ({
      ...prev,
      joins: prev.joins.map((join, i) =>
        i === index ? { ...join, [field]: value } : join
      ),
    }));
  };

  // Handler for adding a GROUP BY column
  const handleAddGroupByColumn = (column: string) => {
    if (!queryState.groupByColumns.includes(column)) {
      setQueryState((prev) => ({
        ...prev,
        groupByColumns: [...prev.groupByColumns, column],
      }));
    }
  };

  // Handler for removing a GROUP BY column
  const handleRemoveGroupByColumn = (column: string) => {
    setQueryState((prev) => ({
      ...prev,
      groupByColumns: prev.groupByColumns.filter((c) => c !== column),
    }));
  };

  // Handler for adding an ORDER BY clause
  const handleAddOrderByClause = () => {
    if (availableColumns.length === 0) return;

    const newClause: OrderByClause = {
      column: `${availableColumns[0].table}.${availableColumns[0].name}`,
      direction: "ASC",
    };

    setQueryState((prev) => ({
      ...prev,
      orderByClauses: [...prev.orderByClauses, newClause],
    }));
  };

  // Handler for removing an ORDER BY clause
  const handleRemoveOrderByClause = (index: number) => {
    setQueryState((prev) => ({
      ...prev,
      orderByClauses: prev.orderByClauses.filter((_, i) => i !== index),
    }));
  };

  // Handler for updating an ORDER BY clause
  const handleOrderByClauseChange = (
    index: number,
    field: keyof OrderByClause,
    value: string
  ) => {
    setQueryState((prev) => ({
      ...prev,
      orderByClauses: prev.orderByClauses.map((clause, i) =>
        i === index
          ? {
              ...clause,
              [field]:
                field === "direction" ? (value as "ASC" | "DESC") : value,
            }
          : clause
      ),
    }));
  };

  return (
    <div className={styles.visualQueryBuilder}>
      <div className={styles.queryTabs}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "columns" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("columns")}
        >
          Columns
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "joins" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("joins")}
        >
          Joins
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "where" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("where")}
        >
          Where
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "groupBy" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("groupBy")}
        >
          Group By
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "orderBy" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("orderBy")}
        >
          Order By
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "options" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("options")}
        >
          Options
        </button>
      </div>

      <div className={styles.queryBuilder}>
        {activeTab === "columns" && (
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <h3>Tables</h3>
              {queryState.tables.length > 0 ? (
                <div className={styles.selectedItems}>
                  {queryState.tables.map((table, index) => (
                    <div key={table.name} className={styles.selectedItem}>
                      <span>{table.name}</span>
                      {index > 0 && (
                        <button className={styles.removeButton}>×</button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  No tables selected. Please select a table.
                </div>
              )}

              {queryState.tables.length === 0 && (
                <div className={styles.tableSelector}>
                  <select
                    onChange={(e) => handleAddTable(e.target.value)}
                    value=""
                  >
                    <option value="" disabled>
                      Select a table...
                    </option>
                    {availableTables.map((table) => (
                      <option key={table.name} value={table.name}>
                        {table.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className={styles.addButton}
                    onClick={() => {
                      const select = document.querySelector(
                        `.${styles.tableSelector} select`
                      ) as HTMLSelectElement;
                      if (select.value) {
                        handleAddTable(select.value);
                      }
                    }}
                  >
                    Add Table
                  </button>
                </div>
              )}
            </div>

            <div className={styles.section}>
              <h3>Selected Columns</h3>
              {queryState.selectedColumns.length > 0 ? (
                <div className={styles.selectedItems}>
                  {queryState.selectedColumns.map((column) => (
                    <div
                      key={`${column.table}.${column.name}`}
                      className={styles.selectedItem}
                    >
                      <span>
                        {column.table}.{column.name}
                      </span>
                      <button
                        className={styles.removeButton}
                        onClick={() => handleRemoveColumn(column)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  No columns selected. Please select columns below.
                </div>
              )}

              <div className={styles.availableItems}>
                <h4>Available Columns</h4>
                {availableColumns.length > 0 ? (
                  <div className={styles.columnGrid}>
                    {availableColumns.map((column) => (
                      <div
                        key={`${column.table}.${column.name}`}
                        className={`${styles.columnItem} ${
                          queryState.selectedColumns.some(
                            (c) =>
                              c.name === column.name && c.table === column.table
                          )
                            ? styles.selected
                            : ""
                        }`}
                        onClick={() => handleAddColumn(column)}
                      >
                        <span className={styles.columnName}>{column.name}</span>
                        <span className={styles.tableLabel}>
                          {column.table}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    No columns available. Please select a table first.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "joins" && (
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>Table Joins</h3>
                <button
                  className={styles.addButton}
                  onClick={handleAddJoin}
                  disabled={queryState.tables.length === 0}
                >
                  Add Join
                </button>
              </div>

              {queryState.joins.length > 0 ? (
                <div className={styles.joinItems}>
                  {queryState.joins.map((join, index) => (
                    <div key={index} className={styles.joinItem}>
                      <div className={styles.joinRow}>
                        <select
                          value={join.type}
                          onChange={(e) =>
                            handleJoinChange(index, "type", e.target.value)
                          }
                          className={styles.joinTypeSelect}
                        >
                          <option value="INNER">INNER JOIN</option>
                          <option value="LEFT">LEFT JOIN</option>
                          <option value="RIGHT">RIGHT JOIN</option>
                          <option value="OUTER">FULL OUTER JOIN</option>
                        </select>

                        <span className={styles.tableName}>{join.table}</span>

                        <button
                          className={styles.removeButton}
                          onClick={() => handleRemoveJoin(index)}
                        >
                          ×
                        </button>
                      </div>

                      <div className={styles.joinCondition}>
                        <span className={styles.onLabel}>ON</span>
                        <input
                          type="text"
                          value={join.condition}
                          onChange={(e) =>
                            handleJoinChange(index, "condition", e.target.value)
                          }
                          placeholder="Join condition"
                          className={styles.conditionInput}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  No joins defined. Add a join to connect multiple tables.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "where" && (
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>Where Conditions</h3>
                <button
                  className={styles.addButton}
                  onClick={handleAddWhereCondition}
                  disabled={availableColumns.length === 0}
                >
                  Add Condition
                </button>
              </div>

              {queryState.whereConditions.length > 0 ? (
                <div className={styles.whereItems}>
                  {queryState.whereConditions.map((condition, index) => (
                    <div key={condition.id} className={styles.whereItem}>
                      {index > 0 && (
                        <select
                          value={condition.logicalOperator}
                          onChange={(e) =>
                            handleWhereConditionChange(
                              condition.id,
                              "logicalOperator",
                              e.target.value
                            )
                          }
                          className={styles.logicalOperatorSelect}
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      )}

                      <div className={styles.conditionRow}>
                        <select
                          value={condition.column}
                          onChange={(e) =>
                            handleWhereConditionChange(
                              condition.id,
                              "column",
                              e.target.value
                            )
                          }
                          className={styles.columnSelect}
                        >
                          {availableColumns.map((column) => (
                            <option
                              key={`${column.table}.${column.name}`}
                              value={`${column.table}.${column.name}`}
                            >
                              {column.table}.{column.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={condition.operator}
                          onChange={(e) =>
                            handleWhereConditionChange(
                              condition.id,
                              "operator",
                              e.target.value
                            )
                          }
                          className={styles.operatorSelect}
                        >
                          {operators.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>

                        {condition.operator !== "IS NULL" &&
                          condition.operator !== "IS NOT NULL" && (
                            <input
                              type="text"
                              value={condition.value}
                              onChange={(e) =>
                                handleWhereConditionChange(
                                  condition.id,
                                  "value",
                                  e.target.value
                                )
                              }
                              placeholder="Value"
                              className={styles.valueInput}
                            />
                          )}

                        <button
                          className={styles.removeButton}
                          onClick={() =>
                            handleRemoveWhereCondition(condition.id)
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  No conditions defined. Add a condition to filter results.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "groupBy" && (
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <h3>Group By Columns</h3>

              {queryState.groupByColumns.length > 0 ? (
                <div className={styles.selectedItems}>
                  {queryState.groupByColumns.map((column) => (
                    <div key={column} className={styles.selectedItem}>
                      <span>{column}</span>
                      <button
                        className={styles.removeButton}
                        onClick={() => handleRemoveGroupByColumn(column)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  No group by columns defined. Select columns below.
                </div>
              )}

              <div className={styles.availableItems}>
                <h4>Available Columns</h4>
                {availableColumns.length > 0 ? (
                  <div className={styles.columnGrid}>
                    {availableColumns.map((column) => (
                      <div
                        key={`${column.table}.${column.name}`}
                        className={`${styles.columnItem} ${
                          queryState.groupByColumns.includes(
                            `${column.table}.${column.name}`
                          )
                            ? styles.selected
                            : ""
                        }`}
                        onClick={() =>
                          handleAddGroupByColumn(
                            `${column.table}.${column.name}`
                          )
                        }
                      >
                        <span className={styles.columnName}>{column.name}</span>
                        <span className={styles.tableLabel}>
                          {column.table}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    No columns available. Please select a table first.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "orderBy" && (
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>Order By Clauses</h3>
                <button
                  className={styles.addButton}
                  onClick={handleAddOrderByClause}
                  disabled={availableColumns.length === 0}
                >
                  Add Order By
                </button>
              </div>

              {queryState.orderByClauses.length > 0 ? (
                <div className={styles.orderByItems}>
                  {queryState.orderByClauses.map((clause, index) => (
                    <div key={index} className={styles.orderByItem}>
                      <select
                        value={clause.column}
                        onChange={(e) =>
                          handleOrderByClauseChange(
                            index,
                            "column",
                            e.target.value
                          )
                        }
                        className={styles.columnSelect}
                      >
                        {availableColumns.map((column) => (
                          <option
                            key={`${column.table}.${column.name}`}
                            value={`${column.table}.${column.name}`}
                          >
                            {column.table}.{column.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={clause.direction}
                        onChange={(e) =>
                          handleOrderByClauseChange(
                            index,
                            "direction",
                            e.target.value
                          )
                        }
                        className={styles.directionSelect}
                      >
                        <option value="ASC">Ascending</option>
                        <option value="DESC">Descending</option>
                      </select>

                      <button
                        className={styles.removeButton}
                        onClick={() => handleRemoveOrderByClause(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  No order by clauses defined. Add a clause to sort results.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "options" && (
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <h3>Query Options</h3>

              <div className={styles.optionRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={queryState.distinct}
                    onChange={(e) =>
                      setQueryState((prev) => ({
                        ...prev,
                        distinct: e.target.checked,
                      }))
                    }
                  />
                  DISTINCT results (remove duplicates)
                </label>
              </div>

              <div className={styles.optionRow}>
                <label className={styles.inputLabel}>
                  LIMIT (max number of rows):
                  <input
                    type="text"
                    value={queryState.limit}
                    onChange={(e) =>
                      setQueryState((prev) => ({
                        ...prev,
                        limit: e.target.value,
                      }))
                    }
                    className={styles.limitInput}
                    placeholder="e.g., 100"
                  />
                </label>
              </div>

              <div className={styles.optionRow}>
                <label className={styles.inputLabel}>
                  OFFSET (number of rows to skip):
                  <input
                    type="text"
                    value={queryState.offset}
                    onChange={(e) =>
                      setQueryState((prev) => ({
                        ...prev,
                        offset: e.target.value,
                      }))
                    }
                    className={styles.offsetInput}
                    placeholder="e.g., 10"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.sqlPreview}>
        <h3>Generated SQL Query</h3>
        <pre className={styles.sqlCode}>
          {sqlQuery || "Select tables and columns to generate a query."}
        </pre>
      </div>
    </div>
  );
};

export default VisualQueryBuilder;
