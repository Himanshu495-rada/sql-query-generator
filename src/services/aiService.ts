import axios from "axios";

// Types for AI operations
interface GenerateSqlRequest {
  prompt: string;
  databaseSchema?: any;
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
}

interface GenerateSqlResponse {
  sql: string;
  explanation: string;
}

// API base URL - in a real app, this would be in an environment variable
const API_URL =
  process.env.REACT_APP_API_URL || "https://api.sqlquerygenerator.com";

/**
 * AI service for handling SQL generation from natural language
 */
class AiService {
  /**
   * Generate SQL from natural language prompt
   */
  async generateSql(request: GenerateSqlRequest): Promise<GenerateSqlResponse> {
    try {
      // For development/demo, return mock SQL
      if (process.env.NODE_ENV === "development") {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Generate mock SQL based on prompt keywords
        const prompt = request.prompt.toLowerCase();

        // Different responses based on the prompt content
        if (prompt.includes("employee") && prompt.includes("age")) {
          return {
            sql: `SELECT employee_id, first_name, last_name, email, hire_date, age \nFROM employees \nWHERE age > 50 \nORDER BY age DESC;`,
            explanation: `This query selects employees with age greater than 50 years old, ordered by age in descending order. It returns basic employee information including their ID, name, email, hire date, and age.`,
          };
        } else if (prompt.includes("product") && prompt.includes("sales")) {
          return {
            sql: `SELECT p.name AS product_name, \n       SUM(oi.quantity) AS total_quantity, \n       SUM(oi.quantity * oi.price) AS total_revenue \nFROM products p \nJOIN order_items oi ON p.id = oi.product_id \nJOIN orders o ON oi.order_id = o.id \nWHERE o.order_date BETWEEN '2023-01-01' AND '2023-12-31' \nGROUP BY p.id, p.name \nORDER BY total_revenue DESC;`,
            explanation: `This query calculates sales performance for each product in 2023. It joins the products, order_items, and orders tables, filters for orders in 2023, and groups by product to show total quantity sold and total revenue generated. Results are sorted by revenue in descending order.`,
          };
        } else if (prompt.includes("user") && prompt.includes("post")) {
          return {
            sql: `SELECT u.username, COUNT(p.id) as post_count \nFROM users u \nLEFT JOIN posts p ON u.id = p.author_id \nGROUP BY u.id, u.username \nORDER BY post_count DESC;`,
            explanation: `This query counts the number of posts written by each user. It uses a LEFT JOIN to include users who haven't written any posts (they'll have a post_count of 0). The results are ordered by post count in descending order to show the most active users first.`,
          };
        } else {
          // Default response
          const firstTable =
            request.databaseSchema?.tables?.[0]?.name || "table_name";
          return {
            sql: `SELECT * \nFROM ${firstTable} \nLIMIT 10;`,
            explanation: `This is a basic query to fetch the first 10 rows from the ${firstTable} table. You can modify this query to filter, join, or aggregate data according to your needs.`,
          };
        }
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      const apiKey = localStorage.getItem("aiApiKey");

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      if (apiKey) {
        headers["X-API-Key"] = apiKey;
      }

      const response = await axios.post<GenerateSqlResponse>(
        `${API_URL}/ai/generate-sql`,
        request,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      // Handle common error cases with user-friendly messages
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error("API key is invalid or has expired");
          case 402:
            throw new Error(
              "Usage limit exceeded. Please update your subscription."
            );
          case 400:
            throw new Error(
              `Failed to generate SQL: ${
                error.response.data.message || "Invalid request"
              }`
            );
          default:
            throw new Error(
              `Failed to generate SQL: ${
                error.response.data.message || "Unknown error"
              }`
            );
        }
      }

      throw new Error(
        "Network error. Please check your connection and try again."
      );
    }
  }

  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      // For development/demo, return mock models
      if (process.env.NODE_ENV === "development") {
        return [
          "gpt-3.5-turbo",
          "gpt-4",
          "gpt-4-turbo",
          "claude-3-sonnet",
          "claude-3-opus",
        ];
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      const apiKey = localStorage.getItem("aiApiKey");

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      if (apiKey) {
        headers["X-API-Key"] = apiKey;
      }

      const response = await axios.get<string[]>(`${API_URL}/ai/models`, {
        headers,
      });

      return response.data;
    } catch (error: any) {
      return [
        "gpt-3.5-turbo",
        "gpt-4",
        "gpt-4-turbo",
        "claude-3-sonnet",
        "claude-3-opus",
      ];
    }
  }

  /**
   * Save API key
   */
  async saveApiKey(apiKey: string): Promise<void> {
    try {
      // In development mode, just save to localStorage
      if (process.env.NODE_ENV === "development") {
        localStorage.setItem("aiApiKey", apiKey);
        return;
      }

      // In production, save to server for the user
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("You must be logged in to save API key");
      }

      await axios.post(
        `${API_URL}/ai/api-key`,
        { apiKey },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Also save locally
      localStorage.setItem("aiApiKey", apiKey);
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to save API key: ${
            error.response.data.message || "Unknown error"
          }`
        );
      }

      throw new Error(
        "Network error. Please check your connection and try again."
      );
    }
  }

  /**
   * Get the stored API key
   */
  getApiKey(): string | null {
    return localStorage.getItem("aiApiKey");
  }
}

export default new AiService();
