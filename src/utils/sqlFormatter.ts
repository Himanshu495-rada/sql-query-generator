/**
 * Utility for formatting SQL queries for better readability
 */
export const formatSql = (sql: string): string => {
  if (!sql.trim()) return "";

  // Simple SQL formatter that adds proper indentation and spacing
  // In a real app, you might use a library like sql-formatter

  const uppercaseKeywords = (s: string): string => {
    // List of SQL keywords to uppercase
    const keywords = [
      "SELECT",
      "FROM",
      "WHERE",
      "JOIN",
      "LEFT JOIN",
      "RIGHT JOIN",
      "INNER JOIN",
      "FULL JOIN",
      "GROUP BY",
      "ORDER BY",
      "HAVING",
      "LIMIT",
      "OFFSET",
      "INSERT",
      "UPDATE",
      "DELETE",
      "CREATE",
      "ALTER",
      "DROP",
      "TABLE",
      "INDEX",
      "VIEW",
      "AND",
      "OR",
      "NOT",
      "IN",
      "BETWEEN",
      "LIKE",
      "IS NULL",
      "IS NOT NULL",
      "UNION",
      "ALL",
      "DISTINCT",
      "AS",
      "ON",
      "USING",
      "VALUES",
      "SET",
    ];

    let result = s;
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      result = result.replace(regex, keyword);
    });

    return result;
  };

  // Normalize whitespace
  let formattedSql = sql.replace(/\s+/g, " ").trim();

  // Add newlines after common clause keywords
  formattedSql = formattedSql
    .replace(
      /\b(SELECT|FROM|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT|OFFSET|INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/gi,
      "\n$1"
    )
    .replace(/\b(LEFT|RIGHT|INNER|FULL|CROSS)?\s+JOIN\b/gi, "\n$&")
    .replace(/\b(UNION|UNION ALL)\b/gi, "\n\n$&\n");

  // Indent subqueries inside parentheses
  let depth = 0;
  let result = "";

  for (let i = 0; i < formattedSql.length; i++) {
    const char = formattedSql[i];

    if (char === "(") {
      depth++;
      result += char;

      // Check if it's likely a subquery by looking ahead for SELECT
      let j = i + 1;
      while (j < formattedSql.length && /\s/.test(formattedSql[j])) j++;

      if (formattedSql.substring(j, j + 6).toUpperCase() === "SELECT") {
        result += "\n" + "  ".repeat(depth);
      }
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
      result += "\n" + "  ".repeat(depth) + char;
    } else if (char === "\n") {
      result += "\n" + "  ".repeat(depth);
    } else {
      result += char;
    }
  }

  // Apply uppercase to SQL keywords for consistency
  result = uppercaseKeywords(result);

  // Remove extra newlines
  result = result.replace(/\n\s*\n+/g, "\n");

  return result.trim();
};

/**
 * Highlights SQL keywords for syntax highlighting
 * This is a simple version - in a real app, you'd use a library like highlight.js
 */
export const highlightSql = (sql: string): string => {
  if (!sql) return "";

  const keywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "JOIN",
    "LEFT",
    "RIGHT",
    "INNER",
    "FULL",
    "OUTER",
    "CROSS",
    "GROUP BY",
    "ORDER BY",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "INSERT",
    "UPDATE",
    "DELETE",
    "CREATE",
    "ALTER",
    "DROP",
    "TABLE",
    "INDEX",
    "VIEW",
    "AND",
    "OR",
    "NOT",
    "IN",
    "BETWEEN",
    "LIKE",
    "IS NULL",
    "IS NOT NULL",
    "UNION",
    "ALL",
    "DISTINCT",
    "AS",
    "ON",
    "USING",
    "VALUES",
    "SET",
  ];

  const functions = [
    "COUNT",
    "SUM",
    "AVG",
    "MIN",
    "MAX",
    "COALESCE",
    "NULLIF",
    "CAST",
    "CONVERT",
    "DATE",
    "DATETIME",
    "TIME",
    "CURRENT_DATE",
    "CURRENT_TIME",
    "CURRENT_TIMESTAMP",
    "EXTRACT",
    "SUBSTRING",
    "CONCAT",
    "UPPER",
    "LOWER",
    "TRIM",
    "LENGTH",
    "ROUND",
  ];

  let highlighted = sql;

  // Escape HTML characters
  highlighted = highlighted
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Highlight keywords
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    highlighted = highlighted.replace(
      regex,
      '<span class="sql-keyword">$&</span>'
    );
  });

  // Highlight functions
  functions.forEach((func) => {
    const regex = new RegExp(`\\b${func}\\b\\s*\\(`, "gi");
    highlighted = highlighted.replace(
      regex,
      '<span class="sql-function">$&</span>'
    );
  });

  // Highlight strings
  highlighted = highlighted.replace(
    /'([^']*)'/g,
    "<span class=\"sql-string\">'$1'</span>"
  );
  highlighted = highlighted.replace(
    /"([^"]*)"/g,
    '<span class="sql-string">"$1"</span>'
  );

  // Highlight numbers
  highlighted = highlighted.replace(
    /\b(\d+)\b/g,
    '<span class="sql-number">$1</span>'
  );

  // Highlight comments
  highlighted = highlighted.replace(
    /--(.*)$/gm,
    '<span class="sql-comment">--$1</span>'
  );

  return highlighted;
};

/**
 * Detects if a SQL query might be a data modification query (INSERT, UPDATE, DELETE, etc.)
 */
export const isDmlQuery = (sql: string): boolean => {
  if (!sql.trim()) return false;

  const dmlPattern =
    /^\s*(INSERT|UPDATE|DELETE|TRUNCATE|CREATE|ALTER|DROP|RENAME|GRANT|REVOKE)\s+/i;
  return dmlPattern.test(sql);
};

/**
 * Extracts tables referenced in a SQL query
 * Note: This is a simple implementation and won't work for all cases
 */
export const extractTablesFromSql = (sql: string): string[] => {
  if (!sql.trim()) return [];

  // Normalize whitespace
  const normalizedSql = sql.replace(/\s+/g, " ").trim();

  // Extract tables from FROM clause
  const fromPattern =
    /\bFROM\s+([^()[\]]+?)(?:\s*(?:WHERE|GROUP BY|HAVING|ORDER BY|LIMIT|$))/i;
  const fromMatch = normalizedSql.match(fromPattern);

  const tables = new Set<string>();

  if (fromMatch) {
    const fromClause = fromMatch[1];
    // Split the FROM clause by commas, accounting for table aliases
    const tableReferences = fromClause.split(",").map((t) => t.trim());

    tableReferences.forEach((tableRef) => {
      // Extract the table name, ignoring aliases
      const tableName = tableRef.split(/\s+/)[0].trim();
      if (tableName) tables.add(tableName);
    });
  }

  // Extract tables from JOIN clauses
  const joinPattern =
    /\b(?:JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|CROSS JOIN)\s+(\w+)/gi;
  let joinMatch;

  while ((joinMatch = joinPattern.exec(normalizedSql)) !== null) {
    if (joinMatch[1]) tables.add(joinMatch[1]);
  }

  return Array.from(tables);
};

/**
 * Parse SQL error message to provide a more user-friendly message
 */
export const parseErrorMessage = (errorMessage: string): string => {
  // Common error patterns and their user-friendly messages
  const errorPatterns = [
    {
      pattern: /table\s+'([^']+)'\s+does not exist/i,
      message: (matches: RegExpMatchArray) =>
        `Table '${matches[1]}' does not exist in the database.`,
    },
    {
      pattern: /column\s+'([^']+)'\s+does not exist/i,
      message: (matches: RegExpMatchArray) =>
        `Column '${matches[1]}' does not exist in the table.`,
    },
    {
      pattern: /syntax error at or near "([^"]+)"/i,
      message: (matches: RegExpMatchArray) =>
        `Syntax error near "${matches[1]}". Please check your SQL syntax.`,
    },
    {
      pattern: /permission denied for table\s+([^\s]+)/i,
      message: (matches: RegExpMatchArray) =>
        `You don't have permission to access the table '${matches[1]}'.`,
    },
  ];

  // Check if the error matches any known patterns
  for (const { pattern, message } of errorPatterns) {
    const matches = errorMessage.match(pattern);
    if (matches) {
      return message(matches);
    }
  }

  // Default to the original error message if no pattern matched
  return errorMessage;
};
