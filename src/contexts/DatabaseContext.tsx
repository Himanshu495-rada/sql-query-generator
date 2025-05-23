import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import databaseService, {
  DatabaseConnection,
  ConnectionParams,
  QueryResult,
} from "../services/databaseService";

// Updated database type as a const object to be compatible with erasableSyntaxOnly
export const DatabaseType = {
  MYSQL: "MYSQL",
  POSTGRESQL: "POSTGRESQL",
  SQLITE: "SQLITE",
  MONGODB: "MONGODB",
  SAMPLE: "SAMPLE"
} as const;

// Create a type from the object values
export type DatabaseType = typeof DatabaseType[keyof typeof DatabaseType];

interface DatabaseContextType {
  connections: DatabaseConnection[];
  activeConnection: DatabaseConnection | null;
  isLoading: boolean;
  error: string | null;
  connectToDatabase: (params: ConnectionParams) => Promise<DatabaseConnection>;
  disconnectDatabase: (connectionId: string) => Promise<void>;
  executeQuery: (query: string) => Promise<QueryResult>;
  refreshSchema: () => Promise<void>;
  loadConnections: () => Promise<void>;
  loadSampleDatabase: (sampleId: string) => Promise<void>;
  setActiveConnection: (connection: DatabaseConnection | null) => void;
  clearError: () => void;
  deleteConnection: (connectionId: string) => Promise<void>;
  testConnection: (params: ConnectionParams) => Promise<boolean>;
}

const initialDatabaseContext: DatabaseContextType = {
  connections: [],
  activeConnection: null,
  isLoading: false,
  error: null,
  connectToDatabase: async () => {
    throw new Error("Not implemented");
  },
  disconnectDatabase: async () => {
    throw new Error("Not implemented");
  },
  executeQuery: async () => {
    throw new Error("Not implemented");
  },
  refreshSchema: async () => {
    throw new Error("Not implemented");
  },
  loadConnections: async () => {
    throw new Error("Not implemented");
  },
  loadSampleDatabase: async () => {
    throw new Error("Not implemented");
  },
  setActiveConnection: () => {},
  clearError: () => {},
  deleteConnection: async () => {
    throw new Error("Not implemented");
  },
  testConnection: async () => {
    throw new Error("Not implemented");
  },
};

const DatabaseContext = createContext<DatabaseContextType>(
  initialDatabaseContext
);

export const useDatabase = () => useContext(DatabaseContext);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({
  children,
}) => {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [activeConnection, setActiveConnection] =
    useState<DatabaseConnection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's database connections
  const loadConnections = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const connectionsList = await databaseService.getConnections();
      // Even if empty, at least we have a valid array now
      setConnections(connectionsList || []);
    } catch (err) {
      console.error("Failed to load connections:", err);
      // Set the error message but don't break the UI
      setError(err instanceof Error ? err.message : "Failed to load connections");
      // Ensure connections is always at least an empty array
      setConnections([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connect to a database
  const connectToDatabase = useCallback(async (
    params: ConnectionParams
  ): Promise<DatabaseConnection> => {
    setIsLoading(true);
    setError(null);

    try {
      const connection = await databaseService.connectToDatabase(params);
      setConnections((prev) => [...prev, connection]);
      setActiveConnection(connection);
      return connection;
    } catch (err) {
      console.error("Failed to connect to database:", err);
      setError(
        err instanceof Error ? err.message : "Failed to connect to database"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disconnect from a database
  const disconnectDatabase = useCallback(async (connectionId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await databaseService.disconnectDatabase(connectionId);
      
      // Update active connection if we just disconnected it
      if (activeConnection?.id === connectionId) {
        setActiveConnection(null);
      }
    } catch (err) {
      console.error("Failed to disconnect database:", err);
      setError(
        err instanceof Error ? err.message : "Failed to disconnect database"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Execute a query on the active connection
  const executeQuery = useCallback(async (query: string): Promise<QueryResult> => {
    if (!activeConnection) {
      throw new Error("No active database connection");
    }

    setIsLoading(true);
    setError(null);

    try {
      return await databaseService.executeQuery(
        activeConnection.id,
        query
      );
    } catch (err) {
      console.error("Query execution failed:", err);
      setError(err instanceof Error ? err.message : "Query execution failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [activeConnection]);

  // Refresh schema for the active connection
  const refreshSchema = useCallback(async (): Promise<void> => {
    if (!activeConnection) {
      throw new Error("No active database connection");
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedSchema = await databaseService.refreshSchema(
        activeConnection.id
      );
      
      // Update the active connection with the new schema
      setActiveConnection({
        ...activeConnection,
        schema: updatedSchema,
      });
    } catch (err) {
      console.error("Schema refresh failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to refresh schema"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [activeConnection]);

  // Load a sample database
  const loadSampleDatabase = useCallback(async (sampleId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const connection = await databaseService.loadSampleDatabase(sampleId);
      setConnections((prev) => [...prev, connection]);
      setActiveConnection(connection);
    } catch (err) {
      console.error("Failed to load sample database:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load sample database"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a connection
  const deleteConnection = useCallback(async (connectionId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await databaseService.deleteConnection(connectionId);
      
      // Remove from local state
      setConnections((prev) =>
        prev.filter((conn) => conn.id !== connectionId)
      );

      if (activeConnection?.id === connectionId) {
        setActiveConnection(null);
      }
    } catch (err) {
      console.error("Failed to delete connection:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete connection"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [activeConnection]);

  // Test a connection without saving it
  const testConnection = useCallback(async (params: ConnectionParams): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      return await databaseService.testConnection(params);
    } catch (err) {
      console.error("Connection test failed:", err);
      setError(
        err instanceof Error ? err.message : "Connection test failed"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error state
  const clearError = () => setError(null);

  // Context value
  const contextValue: DatabaseContextType = {
    connections,
    activeConnection,
    isLoading,
    error,
    connectToDatabase,
    disconnectDatabase,
    executeQuery,
    refreshSchema,
    loadConnections,
    loadSampleDatabase,
    setActiveConnection,
    clearError,
    deleteConnection,
    testConnection,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

export { DatabaseContext };
