import {
  DatabaseSchema,
  DatabaseTable,
  DatabaseView,
} from "../services/databaseService";

/**
 * Utility functions for working with database schemas
 */

/**
 * Get all column names from a database schema
 */
export const getAllColumns = (schema: DatabaseSchema): string[] => {
  const columns: string[] = [];

  schema.tables.forEach((table) => {
    table.columns.forEach((column) => {
      columns.push(`${table.name}.${column.name}`);
    });
  });

  schema.views?.forEach((view) => {
    view.columns.forEach((column) => {
      columns.push(`${view.name}.${column.name}`);
    });
  });

  return columns;
};

/**
 * Get all table names from a database schema
 */
export const getAllTables = (schema: DatabaseSchema): string[] => {
  return schema.tables.map((table) => table.name);
};

/**
 * Get all view names from a database schema
 */
export const getAllViews = (schema: DatabaseSchema): string[] => {
  return schema.views?.map((view) => view.name) || [];
};

/**
 * Find a table in the schema by name
 */
export const findTableByName = (
  schema: DatabaseSchema,
  tableName: string
): DatabaseTable | undefined => {
  return schema.tables.find(
    (table) => table.name.toLowerCase() === tableName.toLowerCase()
  );
};

/**
 * Find a view in the schema by name
 */
export const findViewByName = (
  schema: DatabaseSchema,
  viewName: string
): DatabaseView | undefined => {
  return schema.views?.find(
    (view) => view.name.toLowerCase() === viewName.toLowerCase()
  );
};

/**
 * Find a column in a table by name
 */
export const findColumnInTable = (
  table: DatabaseTable,
  columnName: string
): DatabaseTable["columns"][0] | undefined => {
  return table.columns.find(
    (column) => column.name.toLowerCase() === columnName.toLowerCase()
  );
};

/**
 * Convert a schema to a simplified format for AI context
 * This creates a string representation of the schema that can be included in AI prompts
 */
export const schemaToAiContext = (schema: DatabaseSchema): string => {
  let schemaString = "Database Schema:\n\n";

  // Add tables
  schema.tables.forEach((table) => {
    schemaString += `Table: ${table.name}\n`;
    schemaString += "Columns:\n";

    table.columns.forEach((column) => {
      let columnString = `- ${column.name} (${column.type})`;
      if (column.isPrimaryKey) columnString += " PRIMARY KEY";
      if (column.isForeignKey && column.referencedTable) {
        columnString += ` FOREIGN KEY REFERENCES ${column.referencedTable}(${
          column.referencedColumn || "id"
        })`;
      }
      if (!column.nullable) columnString += " NOT NULL";
      schemaString += `${columnString}\n`;
    });

    schemaString += "\n";
  });
  // Add views
  if (schema.views && schema.views.length > 0) {
    schemaString += "\nViews:\n";
    schema.views.forEach((view) => {
      schemaString += `View: ${view.name}\n`;
      schemaString += "Columns:\n";

      view.columns.forEach((column) => {
        schemaString += `- ${column.name} (${column.type})\n`;
      });

      schemaString += "\n";
    });
  }

  return schemaString;
};

/**
 * Get foreign key relationships between tables
 */
export const getRelationships = (
  schema: DatabaseSchema
): {
  source: string;
  target: string;
  sourceColumn: string;
  targetColumn: string;
}[] => {
  const relationships: {
    source: string;
    target: string;
    sourceColumn: string;
    targetColumn: string;
  }[] = [];

  schema.tables.forEach((table) => {
    table.columns.forEach((column) => {
      if (column.isForeignKey && column.referencedTable) {
        relationships.push({
          source: table.name,
          target: column.referencedTable,
          sourceColumn: column.name,
          targetColumn: column.referencedColumn || "id",
        });
      }
    });
  });

  return relationships;
};

/**
 * Generate a sample query for a given table
 */
export const generateSampleQuery = (table: DatabaseTable): string => {
  const tableName = table.name;
  const columns = table.columns.map((column) => column.name).join(", ");

  // If the table has a primary key or a date column, we can order by it
  const orderByColumn =
    table.columns.find((column) => column.isPrimaryKey) ||
    table.columns.find((column) => /date|time/i.test(column.type)) ||
    table.columns[0];

  let query = `SELECT ${columns}\nFROM ${tableName}`;

  if (orderByColumn) {
    query += `\nORDER BY ${orderByColumn.name}`;

    // If it's a date, sort by descending (most recent first)
    if (/date|time/i.test(orderByColumn.type)) {
      query += " DESC";
    }
  }

  query += "\nLIMIT 100;";

  return query;
};

/**
 * Generate a JOIN query between two related tables
 */
export const generateJoinQuery = (
  schema: DatabaseSchema,
  sourceTable: string,
  targetTable: string
): string | null => {
  // Find the tables in the schema
  const sourceTableObj = findTableByName(schema, sourceTable);
  const targetTableObj = findTableByName(schema, targetTable);

  if (!sourceTableObj || !targetTableObj) {
    return null;
  }

  // Look for foreign key relationships
  const relationships = getRelationships(schema);
  const directRelationship = relationships.find(
    (rel) =>
      (rel.source === sourceTable && rel.target === targetTable) ||
      (rel.source === targetTable && rel.target === sourceTable)
  );

  if (directRelationship) {
    // Choose columns to select
    const sourceColumns = sourceTableObj.columns
      .filter(
        (col) =>
          !col.isForeignKey || col.name !== directRelationship.sourceColumn
      )
      .map((col) => `${sourceTable}.${col.name}`);

    const targetColumns = targetTableObj.columns
      .filter(
        (col) =>
          !col.isPrimaryKey || col.name !== directRelationship.targetColumn
      )
      .map((col) => `${targetTable}.${col.name}`);

    const allColumns = [...sourceColumns, ...targetColumns];

    // Build the JOIN query
    if (directRelationship.source === sourceTable) {
      return (
        `SELECT ${allColumns.join(", ")}\n` +
        `FROM ${sourceTable}\n` +
        `JOIN ${targetTable} ON ${sourceTable}.${directRelationship.sourceColumn} = ${targetTable}.${directRelationship.targetColumn}\n` +
        "LIMIT 100;"
      );
    } else {
      return (
        `SELECT ${allColumns.join(", ")}\n` +
        `FROM ${targetTable}\n` +
        `JOIN ${sourceTable} ON ${targetTable}.${directRelationship.targetColumn} = ${sourceTable}.${directRelationship.sourceColumn}\n` +
        "LIMIT 100;"
      );
    }
  }

  return null;
};

/**
 * Get common aggregate queries for a table
 */
export const getAggregateQueries = (
  table: DatabaseTable
): { name: string; query: string }[] => {
  const queries: { name: string; query: string }[] = [];
  const tableName = table.name;

  // Find numeric columns for aggregation
  const numericColumns = table.columns.filter((col) =>
    /int|float|decimal|double|number/i.test(col.type)
  );

  // Find potential group-by columns
  const groupByColumns = table.columns.filter((col) =>
    /id$|key$|code$|type|status|category|name/i.test(col.name)
  );

  // Find date columns
  const dateColumns = table.columns.filter((col) =>
    /date|time|timestamp/i.test(col.type)
  );

  // Add count query
  queries.push({
    name: `Count records in ${tableName}`,
    query: `SELECT COUNT(*) AS total_count\nFROM ${tableName};`,
  });

  // Add group by queries if we have group-by columns
  if (groupByColumns.length > 0) {
    const groupByCol = groupByColumns[0].name;

    queries.push({
      name: `Group by ${groupByCol}`,
      query: `SELECT ${groupByCol}, COUNT(*) AS count\nFROM ${tableName}\nGROUP BY ${groupByCol}\nORDER BY count DESC;`,
    });

    // If we have numeric columns, add aggregate functions
    if (numericColumns.length > 0) {
      const numCol = numericColumns[0].name;

      queries.push({
        name: `Sum of ${numCol} by ${groupByCol}`,
        query: `SELECT ${groupByCol}, SUM(${numCol}) AS total_${numCol}\nFROM ${tableName}\nGROUP BY ${groupByCol}\nORDER BY total_${numCol} DESC;`,
      });

      queries.push({
        name: `Average ${numCol} by ${groupByCol}`,
        query: `SELECT ${groupByCol}, AVG(${numCol}) AS avg_${numCol}\nFROM ${tableName}\nGROUP BY ${groupByCol}\nORDER BY avg_${numCol} DESC;`,
      });
    }
  }

  // Add time-based queries if we have date columns
  if (dateColumns.length > 0) {
    const dateCol = dateColumns[0].name;

    queries.push({
      name: `Records by month`,
      query: `SELECT\n  EXTRACT(YEAR FROM ${dateCol}) AS year,\n  EXTRACT(MONTH FROM ${dateCol}) AS month,\n  COUNT(*) AS count\nFROM ${tableName}\nGROUP BY year, month\nORDER BY year DESC, month DESC;`,
    });
  }

  return queries;
};
