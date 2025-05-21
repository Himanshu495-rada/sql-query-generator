import axios from "axios";

// Types for database operations
export interface DatabaseConnection {
  id: string;
  name: string;
  host: string;
  port?: string;
  username: string;
  type: "mysql" | "postgresql" | "sqlserver" | "oracle" | "sqlite" | "trial";
  status: "connected" | "disconnected" | "error";
  lastConnected: Date | null;
  isSandbox: boolean;
  schema?: DatabaseSchema;
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
  views: DatabaseView[];
  procedures: DatabaseProcedure[];
}

export interface ConnectionParams {
  type: string;
  host: string;
  port?: string;
  username: string;
  password: string;
  databaseName: string;
}

export interface QueryResult {
  data: Record<string, any>[];
  rowCount: number;
  executionTime: number; // in milliseconds
}

// API base URL - in a real app, this would be in an environment variable
const API_URL =
  process.env.REACT_APP_API_URL || "https://api.sqlquerygenerator.com";

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
      // For development/demo, create a mock connection
      if (process.env.NODE_ENV === "development") {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Create a mock connection with schema
        const connectionId = `conn_${Date.now()}`;
        const connection: DatabaseConnection = {
          id: connectionId,
          name: params.databaseName,
          host: params.host,
          port: params.port,
          username: params.username,
          type: params.type as any,
          status: "connected",
          lastConnected: new Date(),
          isSandbox: true,
          schema: this._generateMockSchema(),
        };

        return connection;
      }

      // In production, make an API call to connect
      const token = localStorage.getItem("authToken");
      const response = await axios.post<DatabaseConnection>(
        `${API_URL}/databases/connect`,
        params,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      return {
        ...response.data,
        lastConnected: response.data.lastConnected
          ? new Date(response.data.lastConnected)
          : null,
      };
    } catch (error: any) {
      // Handle common error cases with user-friendly messages
      if (error.response) {
        throw new Error(
          `Failed to connect to database: ${
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
   * Disconnect from a database
   */
  async disconnectDatabase(connectionId: string): Promise<void> {
    try {
      // For development/demo, do nothing
      if (process.env.NODE_ENV === "development") {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return;
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      await axios.post(
        `${API_URL}/databases/${connectionId}/disconnect`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to disconnect database: ${
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
   * Execute a SQL query on a database
   */
  async executeQuery(
    connectionId: string,
    query: string
  ): Promise<QueryResult> {
    try {
      // For development/demo, return mock results
      if (process.env.NODE_ENV === "development") {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Generate mock results based on the query
        let mockResult: QueryResult = {
          data: [],
          rowCount: 0,
          executionTime: Math.floor(Math.random() * 200) + 50, // random time between 50-250ms
        };

        // Simulate different query results based on query content
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes("select") && lowerQuery.includes("users")) {
          mockResult.data = [
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
          ];
          mockResult.rowCount = 3;
        } else if (
          lowerQuery.includes("select") &&
          lowerQuery.includes("orders")
        ) {
          mockResult.data = [
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
          ];
          mockResult.rowCount = 3;
        } else if (
          lowerQuery.includes("insert") ||
          lowerQuery.includes("update") ||
          lowerQuery.includes("delete")
        ) {
          mockResult.rowCount = 1; // Number of affected rows
        }

        return mockResult;
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      const response = await axios.post<QueryResult>(
        `${API_URL}/databases/${connectionId}/query`,
        { query },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Query execution failed: ${
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
   * Refresh database schema
   */
  async refreshSchema(connectionId: string): Promise<DatabaseSchema> {
    try {
      // For development/demo, return mock schema
      if (process.env.NODE_ENV === "development") {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return this._generateMockSchema();
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      const response = await axios.get<DatabaseSchema>(
        `${API_URL}/databases/${connectionId}/schema`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to refresh schema: ${
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
   * Load a trial database
   */
  async loadTrialDatabase(databaseId: string): Promise<DatabaseConnection> {
    try {
      // For development/demo, create a mock trial database
      if (process.env.NODE_ENV === "development") {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1200));

        const connectionId = `trial_${databaseId}_${Date.now()}`;

        // Define trial database details based on the selected trial
        let databaseName = "";
        let schema: DatabaseSchema;

        switch (databaseId) {
          case "sample_ecommerce":
            databaseName = "E-Commerce Sample";
            schema = this._generateEcommerceSchema();
            break;
          case "sample_hr":
            databaseName = "HR Management";
            schema = this._generateHrSchema();
            break;
          default:
            databaseName = "Blog Platform";
            schema = this._generateBlogSchema();
        }

        const connection: DatabaseConnection = {
          id: connectionId,
          name: databaseName,
          host: "localhost",
          username: "trial_user",
          type: "trial",
          status: "connected",
          lastConnected: new Date(),
          isSandbox: true,
          schema,
        };

        return connection;
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      const response = await axios.post<DatabaseConnection>(
        `${API_URL}/databases/trial/${databaseId}`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      return {
        ...response.data,
        lastConnected: response.data.lastConnected
          ? new Date(response.data.lastConnected)
          : null,
      };
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to load trial database: ${
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
   * Delete a database connection
   */
  async deleteConnection(connectionId: string): Promise<void> {
    try {
      // For development/demo, do nothing
      if (process.env.NODE_ENV === "development") {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return;
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      await axios.delete(`${API_URL}/databases/${connectionId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to delete connection: ${
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
   * Generate a mock database schema for development
   */
  private _generateMockSchema(): DatabaseSchema {
    return {
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
              name: "description",
              type: "TEXT",
              nullable: true,
              isPrimaryKey: false,
              isForeignKey: false,
            },
          ],
          rowCount: 1000,
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
  }

  /**
   * Generate a mock e-commerce database schema for development
   */
  private _generateEcommerceSchema(): DatabaseSchema {
    return {
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
    };
  }

  /**
   * Generate a mock HR database schema for development
   */
  private _generateHrSchema(): DatabaseSchema {
    return {
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
    };
  }

  /**
   * Generate a mock blog database schema for development
   */
  private _generateBlogSchema(): DatabaseSchema {
    return {
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
    };
  }
}

export default new DatabaseService();
