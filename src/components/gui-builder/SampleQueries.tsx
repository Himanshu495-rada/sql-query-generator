import React, { useState, useEffect } from "react";
import styles from "./SampleQueries.module.css";

interface Column {
  name: string;
  type: string;
}

interface Table {
  name: string;
  columns: Column[];
}

interface SampleQuery {
  id: string;
  name: string;
  description: string;
  tables: string[];
  query: string;
  category: "basic" | "intermediate" | "advanced" | "reporting";
  tags: string[];
}

interface SampleQueriesProps {
  tables: Table[];
  onSelectQuery: (query: string) => void;
}

const SampleQueries: React.FC<SampleQueriesProps> = ({
  tables,
  onSelectQuery,
}) => {
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [queries, setQueries] = useState<SampleQuery[]>([]);

  // Generate sample queries based on the selected table
  useEffect(() => {
    if (!selectedTable) {
      setQueries([]);
      return;
    }

    const selectedTableObj = tables.find((t) => t.name === selectedTable);
    if (!selectedTableObj) {
      setQueries([]);
      return;
    }

    // Generate sample queries based on the table schema
    const generatedQueries = generateQueriesForTable(selectedTableObj);
    setQueries(generatedQueries);
  }, [selectedTable, tables]);

  // Filter queries based on search term and category
  const filteredQueries = queries.filter((query) => {
    const matchesSearch =
      searchTerm === "" ||
      query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" || query.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Helper function to generate sample queries for a table
  const generateQueriesForTable = (table: Table): SampleQuery[] => {
    const tableName = table.name;
    const columns = table.columns;
    const idColumn = columns.find(
      (col) =>
        col.name.toLowerCase() === "id" ||
        col.name.toLowerCase().endsWith("_id")
    );
    const nameColumn = columns.find((col) =>
      col.name.toLowerCase().includes("name")
    );
    const dateColumn = columns.find(
      (col) =>
        col.name.toLowerCase().includes("date") ||
        col.name.toLowerCase().includes("created") ||
        col.name.toLowerCase().includes("updated")
    );
    const numberColumns = columns.filter(
      (col) =>
        col.type.toLowerCase().includes("int") ||
        col.type.toLowerCase().includes("float") ||
        col.type.toLowerCase().includes("decimal") ||
        col.type.toLowerCase().includes("numeric")
    );

    const queries: SampleQuery[] = [];

    // Basic queries
    queries.push({
      id: `${tableName}-select-all`,
      name: `Get all ${tableName}`,
      description: `Retrieve all records from the ${tableName} table`,
      tables: [tableName],
      query: `SELECT * FROM ${tableName}`,
      category: "basic",
      tags: ["select", "all"],
    });

    if (idColumn) {
      queries.push({
        id: `${tableName}-select-by-id`,
        name: `Get ${tableName} by ID`,
        description: `Retrieve a specific record by ID`,
        tables: [tableName],
        query: `SELECT * FROM ${tableName} WHERE ${idColumn.name} = ?`,
        category: "basic",
        tags: ["select", "filter", "id"],
      });
    }

    if (nameColumn) {
      queries.push({
        id: `${tableName}-select-by-name`,
        name: `Find ${tableName} by name`,
        description: `Search for records by name`,
        tables: [tableName],
        query: `SELECT * FROM ${tableName} WHERE ${nameColumn.name} LIKE ?`,
        category: "basic",
        tags: ["select", "search", "name"],
      });
    }

    // Intermediate queries
    if (dateColumn) {
      queries.push({
        id: `${tableName}-recent`,
        name: `Recent ${tableName}`,
        description: `Get the most recent records`,
        tables: [tableName],
        query: `SELECT * FROM ${tableName} ORDER BY ${dateColumn.name} DESC LIMIT 10`,
        category: "intermediate",
        tags: ["select", "order", "date", "recent"],
      });

      queries.push({
        id: `${tableName}-date-range`,
        name: `${tableName} in date range`,
        description: `Find records within a specific date range`,
        tables: [tableName],
        query: `SELECT * FROM ${tableName} WHERE ${dateColumn.name} BETWEEN ? AND ?`,
        category: "intermediate",
        tags: ["select", "filter", "date", "range"],
      });
    }

    // Advanced queries with aggregations
    if (numberColumns.length > 0) {
      const numberCol = numberColumns[0];

      queries.push({
        id: `${tableName}-stats`,
        name: `${tableName} statistics`,
        description: `Get statistical information about ${numberCol.name}`,
        tables: [tableName],
        query: `SELECT 
  COUNT(*) AS total_count,
  AVG(${numberCol.name}) AS average_value,
  MIN(${numberCol.name}) AS minimum_value,
  MAX(${numberCol.name}) AS maximum_value,
  SUM(${numberCol.name}) AS sum_value
FROM ${tableName}`,
        category: "advanced",
        tags: [
          "statistics",
          "aggregation",
          "count",
          "average",
          "min",
          "max",
          "sum",
        ],
      });

      if (dateColumn) {
        queries.push({
          id: `${tableName}-trend`,
          name: `${tableName} trend analysis`,
          description: `Analyze trends over time`,
          tables: [tableName],
          query: `SELECT 
  DATE_TRUNC('month', ${dateColumn.name}) AS month,
  COUNT(*) AS count,
  AVG(${numberCol.name}) AS average_value
FROM ${tableName}
GROUP BY DATE_TRUNC('month', ${dateColumn.name})
ORDER BY month`,
          category: "reporting",
          tags: ["trend", "time", "analysis", "group", "month"],
        });
      }
    }

    // Add INSERT query
    queries.push({
      id: `${tableName}-insert`,
      name: `Add new ${tableName}`,
      description: `Insert a new record into ${tableName}`,
      tables: [tableName],
      query: `INSERT INTO ${tableName} (${columns
        .map((c) => c.name)
        .join(", ")})
VALUES (${columns.map(() => "?").join(", ")})`,
      category: "basic",
      tags: ["insert", "create"],
    });

    // Add UPDATE query
    if (idColumn) {
      const updateColumns = columns.filter((c) => c.name !== idColumn.name);

      queries.push({
        id: `${tableName}-update`,
        name: `Update ${tableName}`,
        description: `Update an existing ${tableName} record`,
        tables: [tableName],
        query: `UPDATE ${tableName}
SET ${updateColumns.map((c) => `${c.name} = ?`).join(",\n    ")}
WHERE ${idColumn.name} = ?`,
        category: "basic",
        tags: ["update", "edit"],
      });
    }

    // Add DELETE query
    if (idColumn) {
      queries.push({
        id: `${tableName}-delete`,
        name: `Delete ${tableName}`,
        description: `Remove a ${tableName} record`,
        tables: [tableName],
        query: `DELETE FROM ${tableName}
WHERE ${idColumn.name} = ?`,
        category: "basic",
        tags: ["delete", "remove"],
      });
    }

    return queries;
  };

  const handleCopyQuery = (query: string) => {
    navigator.clipboard
      .writeText(query)
      .then(() => {
        alert("Query copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  return (
    <div className={styles.sampleQueriesContainer}>
      <div className={styles.header}>
        <h2>Sample Queries</h2>
        <p>Select a table and explore commonly used queries</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.tableSelect}>
          <label htmlFor="tableSelect">Choose a table:</label>
          <select
            id="tableSelect"
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
          >
            <option value="">-- Select a table --</option>
            {tables.map((table) => (
              <option key={table.name} value={table.name}>
                {table.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

          <div className={styles.categoryFilter}>
            <label htmlFor="categoryFilter">Filter by:</label>
            <select
              id="categoryFilter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="reporting">Reporting</option>
            </select>
          </div>
        </div>
      </div>

      {selectedTable ? (
        filteredQueries.length > 0 ? (
          <div className={styles.queriesList}>
            {filteredQueries.map((query) => (
              <div key={query.id} className={styles.queryCard}>
                <div className={styles.queryHeader}>
                  <div className={styles.queryTitle}>
                    <h3>{query.name}</h3>
                    <span
                      className={`${styles.categoryBadge} ${
                        styles[query.category]
                      }`}
                    >
                      {query.category}
                    </span>
                  </div>
                  <div className={styles.queryActions}>
                    <button
                      className={styles.copyButton}
                      onClick={() => handleCopyQuery(query.query)}
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                    <button
                      className={styles.useButton}
                      onClick={() => onSelectQuery(query.query)}
                    >
                      Use
                    </button>
                  </div>
                </div>

                <p className={styles.queryDescription}>{query.description}</p>

                <pre className={styles.queryCode}>{query.query}</pre>

                <div className={styles.queryTags}>
                  {query.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noQueries}>
            <p>No queries found for the selected filters.</p>
          </div>
        )
      ) : (
        <div className={styles.selectTablePrompt}>
          <div className={styles.promptIcon}>💡</div>
          <h3>Select a table to see sample queries</h3>
          <p>
            Choose a table from the dropdown menu above to explore commonly used
            queries for that table.
          </p>
        </div>
      )}
    </div>
  );
};

export default SampleQueries;
