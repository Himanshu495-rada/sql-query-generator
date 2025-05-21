import axios from "axios";

// Types for playground operations
export interface Playground {
  id: string;
  name: string;
  databaseId: string | null;
  currentSql: string;
  currentPrompt: string;
  currentExplanation: string;
  history: QueryHistoryItem[];
  lastUpdated: Date;
}

export interface QueryHistoryItem {
  id: string;
  prompt: string;
  sql: string;
  timestamp: Date;
  hasError: boolean;
  error?: string;
  rowCount?: number;
  executionTime?: number;
  explanation?: string;
}

// API base URL - in a real app, this would be in an environment variable
const API_URL =
  process.env.REACT_APP_API_URL || "https://api.sqlquerygenerator.com";

/**
 * Service for managing SQL playgrounds
 */
class PlaygroundService {
  /**
   * Get all playgrounds for the current user
   */
  async getPlaygrounds(): Promise<Playground[]> {
    try {
      // For development/demo, get from localStorage
      if (process.env.NODE_ENV === "development") {
        const playgrounds: Playground[] = [];
        const keys = Object.keys(localStorage);

        for (const key of keys) {
          if (key.startsWith("playground_")) {
            try {
              const rawData = localStorage.getItem(key);
              if (rawData) {
                const parsedData = JSON.parse(rawData);
                playgrounds.push({
                  ...parsedData,
                  lastUpdated: new Date(parsedData.lastUpdated),
                  history: parsedData.history.map((item: any) => ({
                    ...item,
                    timestamp: new Date(item.timestamp),
                  })),
                });
              }
            } catch (e) {
              console.error("Error parsing playground data:", e);
            }
          }
        }

        // Sort by last updated
        return playgrounds.sort(
          (a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()
        );
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      const response = await axios.get<any[]>(`${API_URL}/playgrounds`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      return response.data.map((pg) => ({
        ...pg,
        lastUpdated: new Date(pg.lastUpdated),
        history: pg.history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })),
      }));
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to get playgrounds: ${
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
   * Get a playground by ID
   */
  async getPlayground(id: string): Promise<Playground> {
    try {
      // For development/demo, get from localStorage
      if (process.env.NODE_ENV === "development") {
        const rawData = localStorage.getItem(`playground_${id}`);
        if (!rawData) {
          throw new Error(`Playground with ID ${id} not found`);
        }

        const parsedData = JSON.parse(rawData);
        return {
          ...parsedData,
          lastUpdated: new Date(parsedData.lastUpdated),
          history: parsedData.history.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          })),
        };
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      const response = await axios.get<any>(`${API_URL}/playgrounds/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      return {
        ...response.data,
        lastUpdated: new Date(response.data.lastUpdated),
        history: response.data.history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })),
      };
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        throw new Error(`Playground with ID ${id} not found`);
      } else if (error.response) {
        throw new Error(
          `Failed to get playground: ${
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
   * Create a new playground
   */
  async createPlayground(
    name: string,
    databaseId: string | null = null
  ): Promise<Playground> {
    try {
      const playgroundData = {
        name,
        databaseId,
        currentSql: "",
        currentPrompt: "",
        currentExplanation: "",
        history: [],
        lastUpdated: new Date(),
      };

      // For development/demo, store in localStorage
      if (process.env.NODE_ENV === "development") {
        const id = `pg_${Date.now()}`;
        const playground: Playground = {
          id,
          ...playgroundData,
        };

        localStorage.setItem(`playground_${id}`, JSON.stringify(playground));
        return playground;
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      const response = await axios.post<Playground>(
        `${API_URL}/playgrounds`,
        playgroundData,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      return {
        ...response.data,
        lastUpdated: new Date(response.data.lastUpdated),
        history: response.data.history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })),
      };
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to create playground: ${
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
   * Update a playground
   */
  async updatePlayground(
    id: string,
    updates: Partial<Playground>
  ): Promise<Playground> {
    try {
      // For development/demo, update in localStorage
      if (process.env.NODE_ENV === "development") {
        const rawData = localStorage.getItem(`playground_${id}`);
        if (!rawData) {
          throw new Error(`Playground with ID ${id} not found`);
        }

        const parsedData = JSON.parse(rawData);
        const updatedPlayground = {
          ...parsedData,
          ...updates,
          lastUpdated: new Date(),
        };

        localStorage.setItem(
          `playground_${id}`,
          JSON.stringify(updatedPlayground)
        );

        return {
          ...updatedPlayground,
          lastUpdated: new Date(updatedPlayground.lastUpdated),
          history: updatedPlayground.history.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          })),
        };
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      const response = await axios.put<Playground>(
        `${API_URL}/playgrounds/${id}`,
        { ...updates, lastUpdated: new Date() },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      return {
        ...response.data,
        lastUpdated: new Date(response.data.lastUpdated),
        history: response.data.history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })),
      };
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        throw new Error(`Playground with ID ${id} not found`);
      } else if (error.response) {
        throw new Error(
          `Failed to update playground: ${
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
   * Delete a playground
   */
  async deletePlayground(id: string): Promise<void> {
    try {
      // For development/demo, remove from localStorage
      if (process.env.NODE_ENV === "development") {
        localStorage.removeItem(`playground_${id}`);
        return;
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      await axios.delete(`${API_URL}/playgrounds/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error: any) {
      if (error.response && error.response.status !== 404) {
        throw new Error(
          `Failed to delete playground: ${
            error.response.data.message || "Unknown error"
          }`
        );
      }

      if (error.response?.status !== 404) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
    }
  }
}

export default new PlaygroundService();
