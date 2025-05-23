import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import useDatabase from "./useDatabase";
import useAi from "./useAi";
import playgroundService from "../services/playgroundService";

interface QueryHistoryItem {
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

interface Playground {
  id: string;
  name: string;
  databaseId: string | null;
  currentSql: string;
  currentPrompt: string;
  currentExplanation: string;
  history: QueryHistoryItem[];
  lastUpdated: Date;
}

interface UsePlaygroundReturn {
  playground: Playground | null;
  createPlayground: (name: string, databaseId?: string | null) => Playground;
  savePlayground: (updates?: Partial<Playground>) => void;
  executeQuery: () => Promise<void>;
  generateSqlFromPrompt: (prompt: string) => Promise<void>;
  setCurrentSql: (sql: string) => void;
  isExecuting: boolean;
  isGenerating: boolean;
  queryResults: Record<string, any>[] | null;
  error: string | null;
  clearHistory: () => void;
  selectHistoryItem: (itemId: string) => void;
}

const usePlayground = (playgroundId?: string): UsePlaygroundReturn => {
  const [playground, setPlayground] = useState<Playground | null>(null);
  const [queryResults, setQueryResults] = useState<
    Record<string, any>[] | null
  >(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rename the imported executeQuery to dbExecuteQuery to avoid naming conflict
  const {
    executeQuery: dbExecuteQuery,
    activeConnection,
    setActiveConnection,
    connections,
  } = useDatabase();
  const { generateSql, isGenerating } = useAi();

  // Load saved playground data when playgroundId changes
  useEffect(() => {
    if (playgroundId) {
      loadPlayground(playgroundId);
    } else {
      setPlayground(null);
      setQueryResults(null);
    }
  }, [playgroundId]);

  // Load playground from API or localStorage as fallback
  const loadPlayground = useCallback(
    async (id: string) => {
      // Set loading state while fetching
      setIsExecuting(true);
      setError(null);
      
      try {
        // First try to load from the API
        try {
          const playground = await playgroundService.getPlayground(id);
          
          setPlayground(playground);
          
          // Set active connection if the playground has a database
          if (playground.databaseId) {
            // Find the connection in the loaded connections list
            const connectionToActivate = connections.find(conn => conn.id === playground.databaseId);
            if (connectionToActivate) {
              setActiveConnection(connectionToActivate);
            }
          }
          
          return;
        } catch (apiError) {
          console.log('Could not load playground from API, falling back to localStorage:', apiError);
          // If API fails, try localStorage as fallback
        }
        
        // Try to load from localStorage
        const savedData = localStorage.getItem(`playground_${id}`);

        if (savedData) {
          const parsedData = JSON.parse(savedData);

          // Fix dates that were serialized to strings
          const playground: Playground = {
            ...parsedData,
            lastUpdated: new Date(parsedData.lastUpdated),
            history: parsedData.history.map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp),
            })),
          };

          setPlayground(playground);

          // Set active connection if the playground has a database
          if (playground.databaseId) {
            // Find the connection in the loaded connections list
            const connectionToActivate = connections.find(conn => conn.id === playground.databaseId);
            if (connectionToActivate) {
              setActiveConnection(connectionToActivate);
            }
          }
        } else {
          setError(`Playground with ID ${id} not found`);
        }
      } catch (err) {
        setError("Failed to load playground data");
        console.error("Error loading playground:", err);
      }
    },
    [setActiveConnection]
  );

  // Create a new playground
  const createPlayground = useCallback(
    (name: string, databaseId: string | null = null): Playground => {
      const newPlayground: Playground = {
        id: uuidv4(),
        name,
        databaseId,
        currentSql: "",
        currentPrompt: "",
        currentExplanation: "",
        history: [],
        lastUpdated: new Date(),
      };

      // Save to localStorage (or eventually to backend)
      localStorage.setItem(
        `playground_${newPlayground.id}`,
        JSON.stringify(newPlayground)
      );

      // Update local state
      setPlayground(newPlayground);
      setQueryResults(null);

      // If a database ID was provided, set it as the active connection
      if (databaseId) {
        setActiveConnection(databaseId);
      }

      return newPlayground;
    },
    [setActiveConnection]
  );

  // Save playground changes
  const savePlayground = useCallback(
    (updates: Partial<Playground> = {}) => {
      if (!playground) return;

      const updatedPlayground = {
        ...playground,
        ...updates,
        lastUpdated: new Date(),
      };

      // Save to localStorage (or eventually to backend)
      localStorage.setItem(
        `playground_${updatedPlayground.id}`,
        JSON.stringify(updatedPlayground)
      );

      // Update local state
      setPlayground(updatedPlayground);
    },
    [playground]
  );

  // Execute SQL query
  const executeQuery = useCallback(async () => {
    if (!playground || !playground.currentSql.trim()) {
      setError("No SQL query to execute");
      return;
    }

    if (!activeConnection) {
      setError("No active database connection");
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      // Use the renamed dbExecuteQuery instead of executeQuery here
      const result = await dbExecuteQuery(playground.currentSql);
      setQueryResults(result.data);

      // Add to history
      const historyItem: QueryHistoryItem = {
        id: uuidv4(),
        prompt: playground.currentPrompt,
        sql: playground.currentSql,
        timestamp: new Date(),
        hasError: false,
        rowCount: result.rowCount,
        executionTime: result.executionTime,
        explanation: playground.currentExplanation,
      };

      const updatedHistory = [historyItem, ...playground.history];
      savePlayground({ history: updatedHistory });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to execute query";
      setError(errorMessage);

      // Add failed query to history
      const historyItem: QueryHistoryItem = {
        id: uuidv4(),
        prompt: playground.currentPrompt,
        sql: playground.currentSql,
        timestamp: new Date(),
        hasError: true,
        error: errorMessage,
        explanation: playground.currentExplanation,
      };

      const updatedHistory = [historyItem, ...playground.history];
      savePlayground({ history: updatedHistory });
    } finally {
      setIsExecuting(false);
    }
  }, [playground, activeConnection, dbExecuteQuery, savePlayground]);

  // Generate SQL from natural language prompt
  const generateSqlFromPrompt = useCallback(
    async (prompt: string) => {
      if (!playground) {
        setError("No active playground");
        return;
      }

      setError(null);

      try {
        // Update current prompt immediately for better UX
        savePlayground({ currentPrompt: prompt });

        const { sql, explanation } = await generateSql(prompt);

        // Update playground with generated SQL and explanation
        savePlayground({
          currentSql: sql,
          currentPrompt: prompt,
          currentExplanation: explanation,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate SQL";
        setError(errorMessage);
      }
    },
    [playground, generateSql, savePlayground]
  );

  // Update current SQL
  const setCurrentSql = useCallback(
    (sql: string) => {
      if (!playground) return;
      savePlayground({ currentSql: sql });
    },
    [playground, savePlayground]
  );

  // Clear history
  const clearHistory = useCallback(() => {
    if (!playground) return;
    savePlayground({ history: [] });
  }, [playground, savePlayground]);

  // Select a history item to restore
  const selectHistoryItem = useCallback(
    (itemId: string) => {
      if (!playground) return;

      const item = playground.history.find((h) => h.id === itemId);
      if (!item) return;

      savePlayground({
        currentSql: item.sql,
        currentPrompt: item.prompt,
        currentExplanation: item.explanation || "",
      });
    },
    [playground, savePlayground]
  );

  return {
    playground,
    createPlayground,
    savePlayground,
    executeQuery,
    generateSqlFromPrompt,
    setCurrentSql,
    isExecuting,
    isGenerating,
    queryResults,
    error,
    clearHistory,
    selectHistoryItem,
  };
};

export default usePlayground;
