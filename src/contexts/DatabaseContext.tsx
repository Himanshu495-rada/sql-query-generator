import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Define types for database objects
interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  referencedColumn?: string;
}

interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  rowCount?: number;
}

interface DatabaseView {
  name: string;
  columns: DatabaseColumn[];
}

interface DatabaseProcedure {
  name: string;
  parameters: {
    name: string;
    type: string;
    mode: string; // IN, OUT, INOUT
  }[];
}

interface DatabaseSchema {
  tables: DatabaseTable[];
  views: DatabaseView[];
  procedures: DatabaseProcedure[];
}

interface DatabaseConnection {
  id: string;
  name: string;
  host: string;
  port?: string;
  username: string;
  type: "mysql" | "postgresql" | "sqlserver" | "oracle" | "sqlite" | "trial";
  status: "connected" | "disconnected" | "error";
  lastConnected: Date | null;
  isSandbox: boolean;
  schema: DatabaseSchema | null;
}

interface ConnectionParams {
  type: string;
  host: string;
  port?: string;
  username: string;
  password: string;
  databaseName: string;
}

interface DatabaseQueryResult {
  data: Record<string, any>[];
  rowCount: number;
  executionTime: number; // in milliseconds
}

interface DatabaseContextType {
  connections: DatabaseConnection[];
  activeConnection: DatabaseConnection | null;
  isLoading: boolean;
  error: string | null;
  connectToDatabase: (params: ConnectionParams) => Promise<string>;
  disconnectDatabase: (connectionId: string) => Promise<void>;
  setActiveConnection: (connectionId: string) => void;
  executeQuery: (query: string) => Promise<DatabaseQueryResult>;
  refreshSchema: (connectionId: string) => Promise<void>;
  loadTrialDatabase: (databaseId: string) => Promise<string>;
  deleteConnection: (connectionId: string) => Promise<void>;
}

const initialDatabaseContext: DatabaseContextType = {
  connections: [],
  activeConnection: null,
  isLoading: false,
  error: null,
  connectToDatabase: async () => "",
  disconnectDatabase: async () => {},
  setActiveConnection: () => {},
  executeQuery: async () => ({ data: [], rowCount: 0, executionTime: 0 }),
  refreshSchema: async () => {},
  loadTrialDatabase: async () => "",
  deleteConnection: async () => {},
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
  const [activeConnection, setActiveConnectionState] =
    useState<DatabaseConnection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved connections from localStorage on initial render
  useEffect(() => {
    const loadSavedConnections = () => {
      try {
        const savedConnectionsJson = localStorage.getItem(
          "databaseConnections"
        );

        if (savedConnectionsJson) {
          const savedConnections = JSON.parse(
            savedConnectionsJson
          ) as DatabaseConnection[];

          // Fix dates that were serialized to strings
          const connectionsWithDates = savedConnections.map((conn) => ({
            ...conn,
            lastConnected: conn.lastConnected
              ? new Date(conn.lastConnected)
              : null,
          }));

          setConnections(connectionsWithDates);

          // Set active connection if it exists
          const activeId = localStorage.getItem("activeConnectionId");
          if (activeId) {
            const active =
              connectionsWithDates.find((c) => c.id === activeId) || null;
            setActiveConnectionState(active);
          }
        }
      } catch (err) {
        console.error("Error loading saved connections:", err);
      }
    };

    loadSavedConnections();
  }, []);

  // Save connections to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("databaseConnections", JSON.stringify(connections));
  }, [connections]);

  // Save active connection ID to localStorage when it changes
  useEffect(() => {
    if (activeConnection) {
      localStorage.setItem("activeConnectionId", activeConnection.id);
    } else {
      localStorage.removeItem("activeConnectionId");
    }
  }, [activeConnection]);

  // Connect to a database with the given parameters
  const connectToDatabase = async (
    params: ConnectionParams
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, this would be an API call to establish a connection
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay

      const connectionId = `conn_${Date.now()}`;

      // Mock schema data - in real app this would come from the database
      const mockSchema: DatabaseSchema = {
        tables: [
          {
            name: "users",
            columns: [
              {
                name: "id",
                type: "INT",
                nullable: false,
                isPrimaryKey: true,
                isForeignKey: false,
              },
              {
                name: "name",
                type: "VARCHAR(100)",
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
              },
              {
                name: "email",
                type: "VARCHAR(255)",
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
              },
              {
                name: "created_at",
                type: "TIMESTAMP",
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
              },
            ],
            rowCount: 120,
          },
          {
            name: "orders",
            columns: [
              {
                name: "id",
                type: "INT",
                nullable: false,
                isPrimaryKey: true,
                isForeignKey: false,
              },
              {
                name: "user_id",
                type: "INT",
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: true,
                referencedTable: "users",
                referencedColumn: "id",
              },
              {
                name: "total",
                type: "DECIMAL(10,2)",
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
              },
              {
                name: "status",
                type: "VARCHAR(50)",
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
              },
              {
                name: "created_at",
                type: "TIMESTAMP",
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
              },
            ],
            rowCount: 500,
          },
        ],
        views: [
          {
            name: "active_users",
            columns: [
              {
                name: "id",
                type: "INT",
                nullable: false,
                isPrimaryKey: true,
                isForeignKey: false,
              },
              {
                name: "name",
                type: "VARCHAR(100)",
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
              },
              {
                name: "email",
                type: "VARCHAR(255)",
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: false,
              },
            ],
          },
        ],
        procedures: [
          {
            name: "get_user_orders",
            parameters: [
              { name: "user_id", type: "INT", mode: "IN" },
              { name: "start_date", type: "DATE", mode: "IN" },
              { name: "end_date", type: "DATE", mode: "IN" },
            ],
          },
        ],
      };

      // Create the sandbox connection
      const newConnection: DatabaseConnection = {
        id: connectionId,
        name: params.databaseName,
        host: params.host,
        port: params.port,
        username: params.username,
        type: params.type as any,
        status: "connected",
        lastConnected: new Date(),
        isSandbox: true,
        schema: mockSchema,
      };

      // Add the new connection
      setConnections((prev) => [...prev, newConnection]);
      setActiveConnectionState(newConnection);

      return connectionId;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect to database";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from a database
  const disconnectDatabase = async (connectionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, you would close the connection via API call
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

      // Update the connection status
      setConnections((prev) =>
        prev.map((conn) =>
          conn.id === connectionId ? { ...conn, status: "disconnected" } : conn
        )
      );

      // If active connection is being disconnected, set it to null
      if (activeConnection?.id === connectionId) {
        setActiveConnectionState(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to disconnect database";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Set the active connection
  const setActiveConnection = (connectionId: string) => {
    const connection = connections.find((conn) => conn.id === connectionId);

    if (connection) {
      setActiveConnectionState(connection);
    } else {
      setError(`Connection with ID ${connectionId} not found`);
    }
  };

  // Execute a SQL query on the active connection
  const executeQuery = async (query: string): Promise<DatabaseQueryResult> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!activeConnection) {
        throw new Error("No active database connection");
      }

      // In a real app, you would send the query to your API which would execute it on the database
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay

      // Mock query result - in a real app this would be the actual query result
      let mockResult: DatabaseQueryResult;

      // Simulate different query results based on query content
      if (
        query.toLowerCase().includes("select") &&
        query.toLowerCase().includes("users")
      ) {
        mockResult = {
          data: [
            {
              id: 1,
              name: "John Doe",
              email: "john@example.com",
              created_at: "2023-01-15T08:30:00Z",
            },
            {
              id: 2,
              name: "Jane Smith",
              email: "jane@example.com",
              created_at: "2023-02-20T14:45:00Z",
            },
            {
              id: 3,
              name: "Bob Johnson",
              email: "bob@example.com",
              created_at: "2023-03-10T11:15:00Z",
            },
          ],
          rowCount: 3,
          executionTime: 120, // ms
        };
      } else if (
        query.toLowerCase().includes("select") &&
        query.toLowerCase().includes("orders")
      ) {
        mockResult = {
          data: [
            {
              id: 101,
              user_id: 1,
              total: 125.5,
              status: "completed",
              created_at: "2023-04-12T09:20:00Z",
            },
            {
              id: 102,
              user_id: 1,
              total: 75.2,
              status: "processing",
              created_at: "2023-04-15T16:30:00Z",
            },
            {
              id: 103,
              user_id: 2,
              total: 240.0,
              status: "completed",
              created_at: "2023-04-10T13:45:00Z",
            },
          ],
          rowCount: 3,
          executionTime: 150, // ms
        };
      } else if (
        query.toLowerCase().includes("insert") ||
        query.toLowerCase().includes("update") ||
        query.toLowerCase().includes("delete")
      ) {
        mockResult = {
          data: [],
          rowCount: 1, // Number of affected rows
          executionTime: 200, // ms
        };
      } else {
        mockResult = {
          data: [],
          rowCount: 0,
          executionTime: 100, // ms
        };
      }

      return mockResult;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to execute query";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh the schema of a database
  const refreshSchema = async (connectionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const connection = connections.find((conn) => conn.id === connectionId);

      if (!connection) {
        throw new Error(`Connection with ID ${connectionId} not found`);
      }

      // In a real app, you would fetch the updated schema from the database
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

      // For this mock, we'll just pretend the schema was refreshed
      setConnections((prev) =>
        prev.map((conn) =>
          conn.id === connectionId
            ? { ...conn, lastConnected: new Date() }
            : conn
        )
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refresh schema";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load a trial database
  const loadTrialDatabase = async (databaseId: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, this would initialize a trial database in your backend
      await new Promise((resolve) => setTimeout(resolve, 1200)); // Simulate network delay

      const connectionId = `trial_${databaseId}_${Date.now()}`;

      // Define trial database details based on the selected trial
      let databaseDetails: {
        name: string;
        schema: DatabaseSchema;
      };

      if (databaseId === "sample_ecommerce") {
        databaseDetails = {
          name: "E-Commerce Sample",
          schema: {
            tables: [
              {
                name: "products",
                columns: [
                  {
                    name: "id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                  },
                  {
                    name: "name",
                    type: "VARCHAR(255)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "price",
                    type: "DECIMAL(10,2)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "category_id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: true,
                    referencedTable: "categories",
                    referencedColumn: "id",
                  },
                ],
                rowCount: 500,
              },
              {
                name: "categories",
                columns: [
                  {
                    name: "id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                  },
                  {
                    name: "name",
                    type: "VARCHAR(100)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                ],
                rowCount: 10,
              },
              {
                name: "customers",
                columns: [
                  {
                    name: "id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                  },
                  {
                    name: "name",
                    type: "VARCHAR(255)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "email",
                    type: "VARCHAR(255)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "address",
                    type: "TEXT",
                    nullable: true,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                ],
                rowCount: 1000,
              },
              {
                name: "orders",
                columns: [
                  {
                    name: "id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                  },
                  {
                    name: "customer_id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: true,
                    referencedTable: "customers",
                    referencedColumn: "id",
                  },
                  {
                    name: "order_date",
                    type: "DATE",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "total_amount",
                    type: "DECIMAL(10,2)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                ],
                rowCount: 2500,
              },
              {
                name: "order_items",
                columns: [
                  {
                    name: "id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                  },
                  {
                    name: "order_id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: true,
                    referencedTable: "orders",
                    referencedColumn: "id",
                  },
                  {
                    name: "product_id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: true,
                    referencedTable: "products",
                    referencedColumn: "id",
                  },
                  {
                    name: "quantity",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "price",
                    type: "DECIMAL(10,2)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                ],
                rowCount: 5000,
              },
            ],
            views: [
              {
                name: "product_sales",
                columns: [
                  {
                    name: "product_id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: true,
                  },
                  {
                    name: "product_name",
                    type: "VARCHAR(255)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "total_quantity",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "total_revenue",
                    type: "DECIMAL(15,2)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                ],
              },
            ],
            procedures: [
              {
                name: "get_customer_orders",
                parameters: [{ name: "customer_id", type: "INT", mode: "IN" }],
              },
              {
                name: "get_product_sales",
                parameters: [
                  { name: "start_date", type: "DATE", mode: "IN" },
                  { name: "end_date", type: "DATE", mode: "IN" },
                ],
              },
            ],
          },
        };
      } else if (databaseId === "sample_hr") {
        databaseDetails = {
          name: "HR Management",
          schema: {
            tables: [
              {
                name: "employees",
                columns: [
                  {
                    name: "id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                  },
                  {
                    name: "first_name",
                    type: "VARCHAR(50)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "last_name",
                    type: "VARCHAR(50)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "email",
                    type: "VARCHAR(100)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "hire_date",
                    type: "DATE",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "department_id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: true,
                    referencedTable: "departments",
                    referencedColumn: "id",
                  },
                  {
                    name: "role_id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: true,
                    referencedTable: "roles",
                    referencedColumn: "id",
                  },
                  {
                    name: "manager_id",
                    type: "INT",
                    nullable: true,
                    isPrimaryKey: false,
                    isForeignKey: true,
                    referencedTable: "employees",
                    referencedColumn: "id",
                  },
                  {
                    name: "salary",
                    type: "DECIMAL(10,2)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                ],
                rowCount: 300,
              },
              {
                name: "departments",
                columns: [
                  {
                    name: "id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                  },
                  {
                    name: "name",
                    type: "VARCHAR(100)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "location",
                    type: "VARCHAR(100)",
                    nullable: true,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                ],
                rowCount: 12,
              },
              {
                name: "roles",
                columns: [
                  {
                    name: "id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                  },
                  {
                    name: "title",
                    type: "VARCHAR(100)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "min_salary",
                    type: "DECIMAL(10,2)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "max_salary",
                    type: "DECIMAL(10,2)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                ],
                rowCount: 20,
              },
            ],
            views: [
              {
                name: "employee_details",
                columns: [
                  {
                    name: "employee_id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                  },
                  {
                    name: "full_name",
                    type: "VARCHAR(101)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "department",
                    type: "VARCHAR(100)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "role",
                    type: "VARCHAR(100)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "manager",
                    type: "VARCHAR(101)",
                    nullable: true,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                ],
              },
            ],
            procedures: [
              {
                name: "calculate_department_payroll",
                parameters: [
                  { name: "dept_id", type: "INT", mode: "IN" },
                  { name: "total_payroll", type: "DECIMAL(15,2)", mode: "OUT" },
                ],
              },
            ],
          },
        };
      } else {
        // Default to a blog sample
        databaseDetails = {
          name: "Blog Platform",
          schema: {
            tables: [
              {
                name: "users",
                columns: [
                  {
                    name: "id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                  },
                  {
                    name: "username",
                    type: "VARCHAR(50)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "email",
                    type: "VARCHAR(255)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "password",
                    type: "VARCHAR(255)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "created_at",
                    type: "TIMESTAMP",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                ],
                rowCount: 100,
              },
              {
                name: "posts",
                columns: [
                  {
                    name: "id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                  },
                  {
                    name: "title",
                    type: "VARCHAR(255)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "content",
                    type: "TEXT",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "author_id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: true,
                    referencedTable: "users",
                    referencedColumn: "id",
                  },
                  {
                    name: "category_id",
                    type: "INT",
                    nullable: true,
                    isPrimaryKey: false,
                    isForeignKey: true,
                    referencedTable: "categories",
                    referencedColumn: "id",
                  },
                  {
                    name: "published_at",
                    type: "TIMESTAMP",
                    nullable: true,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "created_at",
                    type: "TIMESTAMP",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                ],
                rowCount: 500,
              },
              {
                name: "comments",
                columns: [
                  {
                    name: "id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                  },
                  {
                    name: "content",
                    type: "TEXT",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "post_id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: true,
                    referencedTable: "posts",
                    referencedColumn: "id",
                  },
                  {
                    name: "user_id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: true,
                    referencedTable: "users",
                    referencedColumn: "id",
                  },
                  {
                    name: "created_at",
                    type: "TIMESTAMP",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                ],
                rowCount: 1500,
              },
              {
                name: "categories",
                columns: [
                  {
                    name: "id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                  },
                  {
                    name: "name",
                    type: "VARCHAR(50)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "slug",
                    type: "VARCHAR(50)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                ],
                rowCount: 10,
              },
            ],
            views: [
              {
                name: "post_stats",
                columns: [
                  {
                    name: "post_id",
                    type: "INT",
                    nullable: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                  },
                  {
                    name: "title",
                    type: "VARCHAR(255)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "author",
                    type: "VARCHAR(50)",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                  {
                    name: "comment_count",
                    type: "BIGINT",
                    nullable: false,
                    isPrimaryKey: false,
                    isForeignKey: false,
                  },
                ],
              },
            ],
            procedures: [
              {
                name: "get_user_activity",
                parameters: [{ name: "user_id", type: "INT", mode: "IN" }],
              },
            ],
          },
        };
      }

      // Create the trial database connection
      const newConnection: DatabaseConnection = {
        id: connectionId,
        name: databaseDetails.name,
        host: "localhost",
        username: "trial_user",
        type: "trial",
        status: "connected",
        lastConnected: new Date(),
        isSandbox: true,
        schema: databaseDetails.schema,
      };

      // Add the new connection
      setConnections((prev) => [...prev, newConnection]);
      setActiveConnectionState(newConnection);

      return connectionId;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load trial database";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a database connection
  const deleteConnection = async (connectionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, you might need to clean up resources on the server
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

      // Remove the connection from the list
      setConnections((prev) => prev.filter((conn) => conn.id !== connectionId));

      // If the deleted connection was active, clear active connection
      if (activeConnection?.id === connectionId) {
        setActiveConnectionState(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete connection";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create the context value
  const contextValue: DatabaseContextType = {
    connections,
    activeConnection,
    isLoading,
    error,
    connectToDatabase,
    disconnectDatabase,
    setActiveConnection,
    executeQuery,
    refreshSchema,
    loadTrialDatabase,
    deleteConnection,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

export { DatabaseContext };
