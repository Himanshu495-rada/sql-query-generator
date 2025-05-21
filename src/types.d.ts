// Global type definitions for the application

/**
 * Toast notification types
 */
type ToastType = "success" | "error" | "warning" | "info";

interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  onClose?: () => void;
}

/**
 * Theme type
 */
type ThemeType = "light" | "dark" | "system";

/**
 * SQL Query Types
 */
type SqlQueryType =
  | "select"
  | "insert"
  | "update"
  | "delete"
  | "create"
  | "alter"
  | "drop"
  | "other";

/**
 * Pagination
 */
interface PaginationOptions {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Table configuration
 */
interface TableColumn {
  id: string;
  label: string;
  key: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  render?: (value: any, row: any) => React.ReactNode;
}

/**
 * Sort direction
 */
type SortDirection = "asc" | "desc";

/**
 * Sort options
 */
interface SortOptions {
  column: string;
  direction: SortDirection;
}

/**
 * Filter options
 */
interface FilterOptions {
  [key: string]: string | number | boolean | null;
}

/**
 * Database connection status
 */
type ConnectionStatus = "connected" | "disconnected" | "error";

/**
 * Database types
 */
type DatabaseType =
  | "mysql"
  | "postgresql"
  | "sqlserver"
  | "oracle"
  | "sqlite"
  | "trial";
