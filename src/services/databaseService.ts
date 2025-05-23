import api from "../utils/api";
import { DatabaseType } from "../contexts/DatabaseContext";

// Types for database operations
export interface DatabaseConnection {
  id: string;
  name: string;
  host?: string;
  port?: number;
  username?: string;
  type: DatabaseType;
  status: "connected" | "disconnected" | "error";
  lastConnected: Date | null;
  isSandbox: boolean;
  schema?: DatabaseSchema;
  sandboxDb?: {
    id: string;
    name: string;
  };
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  referencedColumn?: string;
}

export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  rowCount?: number;
}

export interface DatabaseView {
  name: string;
  columns: DatabaseColumn[];
}

export interface DatabaseProcedure {
  name: string;
  parameters: {
    name: string;
    type: string;
    mode: string; // IN, OUT, INOUT
  }[];
}

export interface DatabaseSchema {
  tables: DatabaseTable[];
  views?: DatabaseView[];
  procedures?: DatabaseProcedure[];
}

export interface ConnectionParams {
  name: string;
  type: DatabaseType;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  connectionString?: string;
  options?: Record<string, any>;
  file?: File;
  createSandbox?: boolean;
}

export interface QueryResult {
  data: Record<string, any>[];
  rowCount: number;
  executionTime: number; // in milliseconds
}

/**
 * Database service for handling database connections and operations
 */
class DatabaseService {
  /**
   * Connect to a database with the given parameters
   */
  async connectToDatabase(
    params: ConnectionParams
  ): Promise<DatabaseConnection> {
    try {
      // Special handling for SQLite file upload
      if (params.type === DatabaseType.SQLITE && params.file) {
        const formData = new FormData();
        formData.append('sqliteFile', params.file);
        formData.append('name', params.name);
        formData.append('type', params.type);
        formData.append('createSandbox', params.createSandbox ? 'true' : 'false');
        
        const response = await api.uploadFile<{ connection: DatabaseConnection }>('connections/sqlite-upload', formData);
        return this.normalizeConnection(response.connection);
      }
      
      // Regular connection
      const response = await api.post<{ connection: DatabaseConnection }>('connections', params);
      return this.normalizeConnection(response.connection);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to connect to database');
    }
  }

  /**
   * Disconnect from a database
   */
  async disconnectDatabase(connectionId: string): Promise<void> {
    try {
      await api.del(`connections/${connectionId}`);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to disconnect from database');
    }
  }

  /**
   * Execute a SQL query on a database
   */
  async executeQuery(
    connectionId: string,
    query: string
  ): Promise<QueryResult> {
    try {
      const response = await api.post<{ query: any }>('queries/execute', {
        connectionId,
        sqlQuery: query,
      });
      
      return {
        data: response.query.result?.rows || [],
        rowCount: response.query.result?.rowCount || 0,
        executionTime: response.query.executionTime || 0,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to execute query');
    }
  }

  /**
   * Get all database connections
   */
  async getConnections(): Promise<DatabaseConnection[]> {
    try {
      const response = await api.get('connections');
      
      // Check if the response has the expected structure
      if (!response || typeof response !== 'object') {
        console.error('Invalid response format from connections API:', response);
        return [];
      }
      
      // Handle case where connections might be directly in response or in response.data
      const connections = response.connections || response.data?.connections || [];
      
      // If connections is not an array, log error and return empty array
      if (!Array.isArray(connections)) {
        console.error('Connections is not an array:', connections);
        return [];
      }
      
      return connections.map(conn => this.normalizeConnection(conn));
    } catch (error) {
      console.error('Failed to get connections:', error);
      return [];
    }
  }

  /**
   * Get a specific database connection
   */
  async getConnection(connectionId: string): Promise<DatabaseConnection> {
    try {
      const response = await api.get<{ connection: any }>(`connections/${connectionId}`);
      return this.normalizeConnection(response.connection);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get connection details');
    }
  }

  /**
   * Refresh the schema of a database
   */
  async refreshSchema(connectionId: string): Promise<DatabaseSchema> {
    try {
      const response = await api.get(`connections/${connectionId}/schema`);
      
      // Check if the schema is nested in data property
      if (response && response.data && response.data.schema) {
        console.log("Schema retrieved from API:", response.data.schema);
        return response.data.schema;
      } else if (response && response.schema) {
        console.log("Schema retrieved directly:", response.schema);
        return response.schema;
      } else {
        console.error("Unexpected schema response format:", response);
        // Return empty schema object to avoid errors
        return { tables: [] };
      }
    } catch (error) {
      console.error("Failed to refresh schema:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to refresh schema');
    }
  }

  /**
   * Test a database connection without saving it
   */
  async testConnection(params: ConnectionParams): Promise<boolean> {
    try {
      await api.post('connections/test', params);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Connection test failed');
    }
  }

  /**
   * Load a sample database
   */
  async loadSampleDatabase(sampleId: string): Promise<DatabaseConnection> {
    try {
      // Get the sample database details
      const response = await api.get<{ sampleDatabases: any[] }>('connections/sample/all');
      
      const sample = response.sampleDatabases.find(
        db => db.id === sampleId || db.name === sampleId
      );
      
      if (!sample) {
        throw new Error(`Sample database ${sampleId} not found`);
      }
      
      // Connect to the sample database
      const connectionResponse = await api.post<{ connection: DatabaseConnection }>('connections', {
        name: sample.name,
        type: sample.type,
        host: sample.host,
        port: sample.port,
        username: sample.username,
        password: sample.password,
        database: sample.database,
        isSample: true,
        createSandbox: true
      });
      
      return this.normalizeConnection(connectionResponse.connection);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to load sample database');
    }
  }

  /**
   * Delete a connection
   */
  async deleteConnection(connectionId: string): Promise<void> {
    try {
      await api.del(`connections/${connectionId}`);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete connection');
    }
  }
  
  /**
   * Normalize a connection object from the API
   */
  private normalizeConnection(connection: any): DatabaseConnection {
    // Handle case where connection might be nested in a playground connection
    const connData = connection.connection || connection;

    return {
      id: connData.id,
      name: connData.name,
      type: connData.type,
      host: connData.host || undefined,
      port: connData.port,
      username: connData.username,
      status: "connected", // We'll assume it's connected if we have the data
      lastConnected: connData.updatedAt ? new Date(connData.updatedAt) : null,
      isSandbox: Boolean(connData.sandboxDb),
      sandboxDb: connData.sandboxDb ? {
        id: connData.sandboxDb.id,
        name: connData.sandboxDb.name
      } : undefined
    };
  }
}

export default new DatabaseService();
