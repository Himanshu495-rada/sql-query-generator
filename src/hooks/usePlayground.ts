import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import useDatabase from "./useDatabase";
import useAi from "./useAi";
import playgroundService, { Playground } from "../services/playgroundService";
import { DatabaseConnection } from '../services/databaseService';

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

interface PlaygroundState extends Playground {
  currentSql: string;
  currentPrompt: string;
  currentExplanation: string;
  history: QueryHistoryItem[];
}

interface PlaygroundStateUpdate {
  currentSql?: string;
  currentPrompt?: string;
  currentExplanation?: string;
  history?: QueryHistoryItem[];
}

interface PlaygroundServerUpdate extends Partial<Playground> {
  currentSql?: string;
  currentPrompt?: string;
  currentExplanation?: string;
  history?: QueryHistoryItem[];
}

interface UsePlaygroundReturn {
  playground: PlaygroundState | null;
  createPlayground: (name: string, connections?: string[]) => PlaygroundState;
  savePlayground: (updates: PlaygroundServerUpdate) => Promise<void>;
  executeQuery: () => Promise<void>;
  generateSqlFromPrompt: (prompt: string) => Promise<void>;
  setCurrentSql: (sql: string) => void;
  isExecuting: boolean;
  isGenerating: boolean;
  queryResults: any[] | null;
  error: string | null;
  clearHistory: () => void;
  selectHistoryItem: (index: number) => void;
}

export default function usePlayground(id?: string): UsePlaygroundReturn {
  const [playground, setPlayground] = useState<PlaygroundState | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Rename the imported executeQuery to dbExecuteQuery to avoid naming conflict
  const {
    executeQuery: dbExecuteQuery,
    activeConnection,
    setActiveConnection,
    connections,
  } = useDatabase();
  const { generateSql } = useAi();

  // Load playground data
  useEffect(() => {
    if (!id) return;

    const loadPlayground = async () => {
      try {
        const data = await playgroundService.getPlayground(id);
        if (!data) {
          throw new Error('Invalid playground data received');
        }
        
        // Initialize UI state when loading from server
        const playgroundState: PlaygroundState = {
          ...data,
          currentSql: '',
          currentPrompt: '',
          currentExplanation: '',
          history: []
        };
        setPlayground(playgroundState);

        // Set active connection if available
        if (data.connections && data.connections.length > 0) {
          const firstConnection = data.connections[0].connection;
          setActiveConnection(firstConnection);
        }
      } catch (error) {
        console.error('Error loading playground:', error);
        setError(error instanceof Error ? error.message : 'Failed to load playground');
      }
    };

    loadPlayground();
  }, [id, setActiveConnection]);

  // Create a new playground
  const createPlayground = (name: string, connections?: string[]): PlaygroundState => {
    const newPlayground: PlaygroundState = {
      id: uuidv4(),
      name,
      userId: '', // This will be set by the backend
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      connections: [],
      // UI state
      currentSql: '',
      currentPrompt: '',
      currentExplanation: '',
      history: []
    };
    setPlayground(newPlayground);
    return newPlayground;
  };

  // Save playground changes
  const savePlayground = async (updates: PlaygroundServerUpdate): Promise<void> => {
    if (!playground) return;

    try {
      // Only send server-relevant fields to the API
      const serverUpdates: PlaygroundServerUpdate = {
        name: updates.name,
        description: updates.description,
        currentSql: updates.currentSql,
        currentPrompt: updates.currentPrompt,
        currentExplanation: updates.currentExplanation,
        history: updates.history,
      };

      const updatedPlayground = await playgroundService.updatePlayground(playground.id, serverUpdates);
      
      // Merge the server response with our local UI state
      setPlayground(prev => prev ? {
        ...prev,
        ...updatedPlayground,
      } : null);
    } catch (error) {
      console.error('Error saving playground:', error);
      setError(error instanceof Error ? error.message : 'Failed to save playground');
    }
  };

  // Update local playground state
  const updateLocalState = (updates: PlaygroundStateUpdate) => {
    setPlayground(prev => prev ? { ...prev, ...updates } : null);
  };

  // Set current SQL
  const setCurrentSql = useCallback((sql: string) => {
    updateLocalState({ currentSql: sql });
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    updateLocalState({ history: [] });
  }, []);

  // Select history item
  const selectHistoryItem = useCallback((index: number) => {
    if (!playground) return;
    const item = playground.history[index];
    if (!item) return;

    updateLocalState({
      currentSql: item.sql,
      currentPrompt: item.prompt || '',
      currentExplanation: item.explanation || ''
    });
  }, [playground]);

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
}
