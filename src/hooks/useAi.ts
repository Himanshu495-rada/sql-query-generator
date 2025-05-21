import { useState, useCallback } from "react";
import useDatabase from "./useDatabase";

interface UseAiReturn {
  generateSql: (
    prompt: string
  ) => Promise<{ sql: string; explanation: string }>;
  isGenerating: boolean;
  error: string | null;
}

const useAi = (): UseAiReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { activeConnection } = useDatabase();

  const generateSql = useCallback(
    async (prompt: string): Promise<{ sql: string; explanation: string }> => {
      setIsGenerating(true);
      setError(null);

      try {
        if (!activeConnection) {
          throw new Error("No active database connection");
        }

        if (!prompt.trim()) {
          throw new Error("Please provide a valid prompt");
        }

        // In a real app, this would be an API call to the AI service
        // Here we'll simulate a response based on the prompt
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay

        // Extract schema for context (in a real app, this would be formatted and sent to the AI)
        const schema = activeConnection.schema;

        // Generate mock SQL based on prompt keywords
        let sql = "";
        let explanation = "";

        if (
          prompt.toLowerCase().includes("employee") &&
          prompt.toLowerCase().includes("age")
        ) {
          sql = `SELECT employee_id, first_name, last_name, email, hire_date, age \nFROM employees \nWHERE age > 50 \nORDER BY age DESC;`;
          explanation = `This query selects employees with age greater than 50 years old, ordered by age in descending order. It returns basic employee information including their ID, name, email, hire date, and age.`;
        } else if (
          prompt.toLowerCase().includes("product") &&
          prompt.toLowerCase().includes("sales")
        ) {
          sql = `SELECT p.name AS product_name, \n       SUM(oi.quantity) AS total_quantity, \n       SUM(oi.quantity * oi.price) AS total_revenue \nFROM products p \nJOIN order_items oi ON p.id = oi.product_id \nJOIN orders o ON oi.order_id = o.id \nWHERE o.order_date BETWEEN '2023-01-01' AND '2023-12-31' \nGROUP BY p.id, p.name \nORDER BY total_revenue DESC;`;
          explanation = `This query calculates sales performance for each product in 2023. It joins the products, order_items, and orders tables, filters for orders in 2023, and groups by product to show total quantity sold and total revenue generated. Results are sorted by revenue in descending order.`;
        } else if (
          prompt.toLowerCase().includes("user") &&
          prompt.toLowerCase().includes("post")
        ) {
          sql = `SELECT u.username, COUNT(p.id) as post_count \nFROM users u \nLEFT JOIN posts p ON u.id = p.author_id \nGROUP BY u.id, u.username \nORDER BY post_count DESC;`;
          explanation = `This query counts the number of posts written by each user. It uses a LEFT JOIN to include users who haven't written any posts (they'll have a post_count of 0). The results are ordered by post count in descending order to show the most active users first.`;
        } else {
          sql = `SELECT * \nFROM ${
            schema?.tables[0]?.name || "table_name"
          } \nLIMIT 10;`;
          explanation = `This is a basic query to fetch the first 10 rows from the ${
            schema?.tables[0]?.name || "table_name"
          } table. You can modify this query to filter, join, or aggregate data according to your needs.`;
        }

        return { sql, explanation };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate SQL";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsGenerating(false);
      }
    },
    [activeConnection]
  );

  return {
    generateSql,
    isGenerating,
    error,
  };
};

export default useAi;
