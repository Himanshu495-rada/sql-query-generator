import React, { useState, useEffect } from "react";
import styles from "./DatabaseConnectionPage.module.css";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import ConnectionForm from "../components/database/ConnectionForm";
import DatabaseList from "../components/database/DatabaseList";
import SchemaViewer from "../components/database/SchemaViewer";
import { useAuth } from "../contexts/AuthContext";
import { useDatabase } from "../contexts/DatabaseContext";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import Modal, { ModalFooter } from "../components/shared/Modal";
import api from "../utils/api";
import { ConnectionData } from "../components/database/ConnectionForm";
import { DatabaseType } from "../contexts/DatabaseContext";

// Define the response shape for connections API
interface ConnectionsResponse {
  connections: Array<any>;
}

const DatabaseConnectionPage: React.FC = () => {
  const { user } = useAuth();
  const {
    connections,
    connectToDatabase,
    disconnectDatabase,
    isLoading,
    error,
    loadSampleDatabase,
    deleteConnection,
    loadConnections,
    clearError,
    setError,
  } = useDatabase();

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(
    null
  );
  const [isViewSchemaModalOpen, setIsViewSchemaModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(
    null
  );
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [localConnections, setLocalConnections] = useState<any[]>([]);
  const [localLoading, setLocalLoading] = useState(false);

  // Fetch connections on mount - use empty dependency array to run only once
  useEffect(() => {
    const fetchConnections = async () => {
      setLocalLoading(true);
      try {
        await loadConnections();

        if (!connections || connections.length === 0) {
          const fetchedConnections = await api.get<ConnectionsResponse>(
            "/connections"
          );
          setLocalConnections(fetchedConnections.connections || []);
        }
      } catch (error) {
        console.error("Error fetching connections:", error);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle database connection
  const handleConnect = async (connectionData: ConnectionData) => {
    try {
      // Convert form data to expected format
      const params = {
        name: connectionData.name,
        type: connectionData.type as DatabaseType,
        host: connectionData.host,
        port: connectionData.port ? Number(connectionData.port) : undefined,
        username: connectionData.username,
        password: connectionData.password,
        database: connectionData.database,
        file: connectionData.file,
        createSandbox: connectionData.createSandbox,
      };

      // Clear any existing error before attempting connection
      if (error) clearError();

      // Attempt to connect
      await connectToDatabase(params);

      // After successful connection, refresh connections list
      await loadConnections();
    } catch (err) {
      // Log the error for debugging
      console.error("Connection error:", err);

      // If the error wasn't set by the context (which would happen in most cases),
      // we set it here as a fallback
      if (!error) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to connect to database";
        setError(errorMessage);
      }
    }
  };

  // Handle sample database selection
  const handleSelectTrial = async (databaseId: string) => {
    try {
      await loadSampleDatabase(databaseId);

      await loadConnections();
    } catch (err) {
      console.error("Sample database loading error:", err);
    }
  };

  // Handle database disconnection
  const handleDisconnect = async (databaseId: string) => {
    try {
      await disconnectDatabase(databaseId);

      await loadConnections();
    } catch (err) {
      console.error("Disconnection error:", err);
    }
  };

  // Handle view schema
  const handleViewSchema = async (databaseId: string) => {
    try {
      setSelectedConnection(databaseId);

      // Find the connection in our existing connections list
      const connection = displayedConnections.find(
        (conn) => conn?.id === databaseId
      );

      // Directly fetch the schema for this connection ID
      try {
        // If the ID is valid, make the request directly to avoid using the context's active connection
        if (databaseId && databaseId !== "unknown") {
          const response = await api.get(`connections/${databaseId}/schema`);

          // Check for correct schema structure in response
          if (response && response.data && response.data.schema) {
            console.log("Schema received:", response.data.schema);

            // Store the schema in the connection object for later display
            if (connection) {
              connection.schema = response.data.schema;
            }
          } else {
            console.error("Unexpected schema response format:", response);
          }
        } else {
          console.error("Invalid connection ID:", databaseId);
        }
      } catch (schemaError) {
        console.error("Error fetching schema:", schemaError);
      }

      // Open the modal regardless - it will show loading state if schema isn't available
      setIsViewSchemaModalOpen(true);
    } catch (err) {
      console.error("Error handling view schema:", err);
    }
  };

  // Confirm database deletion
  const handleDeleteConfirm = async () => {
    if (!connectionToDelete) return;

    setIsDeleteLoading(true);
    try {
      await deleteConnection(connectionToDelete);
      setIsDeleteModalOpen(false);
      setConnectionToDelete(null);

      await loadConnections();
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  // Get active connection schema
  const getConnectionSchema = () => {
    if (!selectedConnection) return null;

    // Find the connection in our displayed connections list
    const connection = displayedConnections.find(
      (conn) => conn?.id === selectedConnection
    );

    // Return the schema if it exists
    return connection?.schema || null;
  };

  // Use connections from context if available, otherwise use local state
  const displayedConnections =
    Array.isArray(connections) && connections.length > 0
      ? connections
      : Array.isArray(localConnections)
      ? localConnections
      : [];

  // Ensure all connections have required properties to avoid rendering errors
  const safeConnections = displayedConnections
    .map((conn) => {
      if (!conn) return null;
      // Create a valid Database object with all required fields
      return {
        id: conn.id || "unknown",
        name: conn.name || "Unknown Connection",
        type: conn.type || "POSTGRESQL",
        host: conn.host || "localhost",
        status: conn.status || "error",
        lastConnected: conn.lastConnected || null,
        isSandbox: !!conn.isSandbox,
      };
    })
    .filter(Boolean) as {
    // Type assertion to match Database interface
    id: string;
    name: string;
    type: string;
    host: string;
    status: "connected" | "disconnected" | "error";
    lastConnected: Date | null;
    isSandbox: boolean;
  }[];

  const isLoadingConnections = isLoading || localLoading;

  // Format user data for Navbar
  const formattedUser = user
    ? {
        name: user.name,
        avatarUrl: user.avatarUrl || undefined,
      }
    : undefined;

  return (
    <div className={styles.databaseConnectionPage}>
      <Navbar
        user={formattedUser}
        onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
        isSidebarVisible={isSidebarVisible}
        appName="Database Connections"
      />

      <div className={styles.mainContainer}>
        {isSidebarVisible && safeConnections && (
          <Sidebar
            isVisible={isSidebarVisible}
            playgrounds={[]}
            databases={(safeConnections || []).map((conn) => ({
              id: conn?.id || "unknown",
              name: conn?.name || "Unknown Connection",
              status: conn?.status || "connected",
            }))}
            onPlaygroundClick={() => {}}
            onCreatePlayground={() => {}}
            onDatabaseClick={() => {}}
            onConnectDatabase={() => setIsSidebarVisible(false)}
            onCollapse={() => setIsSidebarVisible(false)}
          />
        )}

        <div className={styles.contentContainer}>
          <div className={styles.header}>
            <h1>Database Connections</h1>
            <p>
              Connect to your databases or use our sample databases to test the
              application.
            </p>
          </div>

          {/* Show error if present */}
          {error && (
            <div className={styles.errorBox}>
              <strong>Connection Error:</strong> {error}
            </div>
          )}

          {isLoadingConnections &&
          (!safeConnections || safeConnections.length === 0) ? (
            <div className={styles.loadingContainer}>
              <LoadingSpinner
                size="large"
                color="primary"
                text="Loading connections..."
              />
            </div>
          ) : (
            <div className={styles.connectionContent}>
              <section className={styles.connectionFormSection}>
                <h2>Connect to a Database</h2>
                <ConnectionForm
                  onConnect={handleConnect}
                  onSelectTrial={handleSelectTrial}
                />
              </section>

              <section className={styles.databaseListSection}>
                <h2>Your Connections</h2>
                {!safeConnections || safeConnections.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>You don't have any database connections yet.</p>
                    <p>
                      Connect to a database using the form above or try one of
                      our sample databases.
                    </p>
                  </div>
                ) : (
                  <DatabaseList
                    databases={safeConnections}
                    onConnect={handleDisconnect}
                    onDisconnect={handleDisconnect}
                    onViewSchema={handleViewSchema}
                    onDelete={(id) => {
                      setConnectionToDelete(id);
                      setIsDeleteModalOpen(true);
                    }}
                  />
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        size="small"
        footer={
          <ModalFooter
            cancelText="Cancel"
            confirmText="Delete"
            onCancel={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            confirmDisabled={isDeleteLoading}
            isConfirmLoading={isDeleteLoading}
            confirmVariant="danger"
          />
        }
      >
        <div className={styles.deleteModalContent}>
          <div className={styles.warningIcon}>⚠️</div>
          <p>Are you sure you want to delete this database connection?</p>
          <p>
            This action cannot be undone. All playgrounds associated with this
            connection will be affected.
          </p>
        </div>
      </Modal>

      {/* Schema Viewer Modal */}
      <Modal
        isOpen={isViewSchemaModalOpen}
        onClose={() => setIsViewSchemaModalOpen(false)}
        title="Database Schema"
        size="large"
      >
        <div className={styles.schemaModalContent}>
          {selectedConnection && (
            <>
              {getConnectionSchema() ? (
                <SchemaViewer
                  schema={{
                    tables: getConnectionSchema()?.tables || [],
                    views: getConnectionSchema()?.views || [],
                    procedures: getConnectionSchema()?.procedures || [],
                  }}
                  databaseName={
                    safeConnections.find(
                      (conn) => conn.id === selectedConnection
                    )?.name || "Database"
                  }
                  databaseType={
                    safeConnections.find(
                      (conn) => conn.id === selectedConnection
                    )?.type || "Unknown"
                  }
                />
              ) : (
                <div className={styles.schemaLoading}>
                  <LoadingSpinner size="medium" color="primary" />
                  <p>
                    Loading schema or no schema available for this connection.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DatabaseConnectionPage;
