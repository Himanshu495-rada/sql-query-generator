import React, { useState, useEffect } from "react";
import styles from "./DatabaseDetailsPage.module.css";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import SchemaViewer from "../components/database/SchemaViewer";
import Button from "../components/shared/Button";
import { useAuth } from "../contexts/AuthContext";
import { useDatabase } from "../contexts/DatabaseContext";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import Modal, { ModalFooter } from "../components/shared/Modal";

interface DatabaseDetailsPageProps {
  databaseId?: string; // From route params
}

const DatabaseDetailsPage: React.FC<DatabaseDetailsPageProps> = ({
  databaseId,
}) => {
  const { user } = useAuth();
  const {
    connections,
    refreshSchema,
    disconnectDatabase,
    executeQuery,
    isLoading,
  } = useDatabase();

  // UI state
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"schema" | "info" | "settings">(
    "schema"
  );
  const [recentQueries, setRecentQueries] = useState<
    { query: string; timestamp: Date }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [customQuery, setCustomQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Find the selected database from connections
  const database = connections.find((conn) => conn.id === databaseId);

  // Fetch the database details on initial load
  useEffect(() => {
    if (!databaseId || !connections.length) return;

    // Check if the database exists in connections
    if (!database) {
      setError(`Database with ID ${databaseId} not found`);
    }
  }, [databaseId, connections, database]);

  // Handle schema refresh
  const handleRefreshSchema = async () => {
    if (!databaseId) return;

    setIsRefreshing(true);
    setError(null);

    try {
      await refreshSchema(databaseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh schema");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle database disconnection
  const handleDisconnect = async () => {
    if (!databaseId) return;

    try {
      await disconnectDatabase(databaseId);
      setIsDisconnectModalOpen(false);

      // In a real application, navigate back to database list
      console.log("Database disconnected, should navigate back");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect database"
      );
    }
  };

  // Handle custom query execution
  const handleExecuteQuery = async () => {
    if (!customQuery.trim()) return;

    setIsExecutingQuery(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const result = await executeQuery(customQuery);
      setQueryResult(result.data);

      // Add to recent queries
      setRecentQueries([
        { query: customQuery, timestamp: new Date() },
        ...recentQueries.slice(0, 9),
      ]);
    } catch (err) {
      setQueryError(
        err instanceof Error ? err.message : "Failed to execute query"
      );
    } finally {
      setIsExecutingQuery(false);
    }
  };

  // Sample playgrounds data for sidebar
  const samplePlaygrounds = [
    {
      id: "pg1",
      name: "Sales Analysis",
      lastUpdated: new Date(),
      isActive: true,
    },
    {
      id: "pg2",
      name: "User Demographics",
      lastUpdated: new Date(Date.now() - 86400000),
    },
    {
      id: "pg3",
      name: "Inventory Report",
      lastUpdated: new Date(Date.now() - 172800000),
    },
  ];

  // Format the relative time for display
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Show loading state if loading connections or database not found
  if (isLoading || (!database && !error)) {
    return (
      <div className={styles.databaseDetailsPage}>
        <Navbar
          user={
            user ? { name: user.name, avatarUrl: user.avatarUrl } : undefined
          }
          onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
          isSidebarVisible={isSidebarVisible}
          appName="Database Details"
        />

        <div className={styles.mainContainer}>
          {isSidebarVisible && (
            <Sidebar
              isVisible={isSidebarVisible}
              playgrounds={samplePlaygrounds}
              databases={connections.map((conn) => ({
                id: conn.id,
                name: conn.name,
                status: conn.status,
              }))}
              onPlaygroundClick={() => {}}
              onCreatePlayground={() => {}}
              onDatabaseClick={() => {}}
              onConnectDatabase={() => {}}
              onCollapse={() => setIsSidebarVisible(false)}
            />
          )}

          <div className={styles.contentContainer}>
            <div className={styles.loadingContainer}>
              <LoadingSpinner
                size="large"
                color="primary"
                text="Loading database details..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if database not found
  if (error) {
    return (
      <div className={styles.databaseDetailsPage}>
        <Navbar
          user={
            user ? { name: user.name, avatarUrl: user.avatarUrl } : undefined
          }
          onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
          isSidebarVisible={isSidebarVisible}
          appName="Database Details"
        />

        <div className={styles.mainContainer}>
          {isSidebarVisible && (
            <Sidebar
              isVisible={isSidebarVisible}
              playgrounds={samplePlaygrounds}
              databases={connections.map((conn) => ({
                id: conn.id,
                name: conn.name,
                status: conn.status,
              }))}
              onPlaygroundClick={() => {}}
              onCreatePlayground={() => {}}
              onDatabaseClick={() => {}}
              onConnectDatabase={() => {}}
              onCollapse={() => setIsSidebarVisible(false)}
            />
          )}

          <div className={styles.contentContainer}>
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>❌</div>
              <h2>Error Loading Database</h2>
              <p>{error}</p>
              <Button
                variant="primary"
                onClick={() => console.log("Navigate back to connections")}
              >
                Back to Connections
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.databaseDetailsPage}>
      <Navbar
        user={user ? { name: user.name, avatarUrl: user.avatarUrl } : undefined}
        onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
        isSidebarVisible={isSidebarVisible}
        appName="Database Details"
      />

      <div className={styles.mainContainer}>
        {isSidebarVisible && (
          <Sidebar
            isVisible={isSidebarVisible}
            playgrounds={samplePlaygrounds}
            databases={connections.map((conn) => ({
              id: conn.id,
              name: conn.name,
              status: conn.status,
            }))}
            onPlaygroundClick={() => {}}
            onCreatePlayground={() => {}}
            onDatabaseClick={() => {}}
            onConnectDatabase={() => {}}
            onCollapse={() => setIsSidebarVisible(false)}
          />
        )}

        <div className={styles.contentContainer}>
          <div className={styles.databaseHeader}>
            <div className={styles.databaseInfo}>
              <div className={styles.databaseIcon}>
                {database?.type === "mysql" && "🐬"}
                {database?.type === "postgresql" && "🐘"}
                {database?.type === "sqlserver" && "🔷"}
                {database?.type === "oracle" && "🔶"}
                {database?.type === "sqlite" && "📄"}
                {database?.type === "trial" && "🧪"}
              </div>
              <div>
                <h1>{database?.name}</h1>
                <div className={styles.databaseMeta}>
                  <span className={styles.databaseType}>
                    {database?.type.toUpperCase()}
                  </span>
                  <span className={styles.databaseHost}>{database?.host}</span>
                  <span
                    className={`${styles.databaseStatus} ${
                      styles[database?.status || "disconnected"]
                    }`}
                  >
                    {database?.status.charAt(0).toUpperCase() +
                      database?.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.databaseActions}>
              <Button
                variant="secondary"
                size="small"
                onClick={handleRefreshSchema}
                isLoading={isRefreshing}
              >
                Refresh Schema
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setIsQueryModalOpen(true)}
              >
                Run Query
              </Button>
              <Button
                variant={
                  database?.status === "connected" ? "primary" : "outline"
                }
                size="small"
                onClick={() => setIsDisconnectModalOpen(true)}
                disabled={database?.status !== "connected"}
              >
                Disconnect
              </Button>
            </div>
          </div>

          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${
                  activeTab === "schema" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("schema")}
              >
                Database Schema
              </button>
              <button
                className={`${styles.tab} ${
                  activeTab === "info" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("info")}
              >
                Connection Info
              </button>
              <button
                className={`${styles.tab} ${
                  activeTab === "settings" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
            </div>
          </div>

          <div className={styles.tabContent}>
            {activeTab === "schema" && database?.schema && (
              <div className={styles.schemaContainer}>
                <SchemaViewer
                  schema={database.schema}
                  databaseName={database.name}
                  databaseType={database.type}
                  onTableSelect={(tableName) =>
                    console.log("Selected table:", tableName)
                  }
                  onViewSelect={(viewName) =>
                    console.log("Selected view:", viewName)
                  }
                />
              </div>
            )}

            {activeTab === "info" && (
              <div className={styles.infoContainer}>
                <div className={styles.infoCard}>
                  <h3>Connection Details</h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoLabel}>Name:</div>
                    <div className={styles.infoValue}>{database?.name}</div>

                    <div className={styles.infoLabel}>Type:</div>
                    <div className={styles.infoValue}>
                      {database?.type.toUpperCase()}
                    </div>

                    <div className={styles.infoLabel}>Host:</div>
                    <div className={styles.infoValue}>{database?.host}</div>

                    {database?.port && (
                      <>
                        <div className={styles.infoLabel}>Port:</div>
                        <div className={styles.infoValue}>{database.port}</div>
                      </>
                    )}

                    <div className={styles.infoLabel}>Username:</div>
                    <div className={styles.infoValue}>{database?.username}</div>

                    <div className={styles.infoLabel}>Status:</div>
                    <div
                      className={`${styles.infoValue} ${styles.statusValue} ${
                        styles[database?.status || "disconnected"]
                      }`}
                    >
                      {database?.status.charAt(0).toUpperCase() +
                        database?.status.slice(1)}
                    </div>

                    <div className={styles.infoLabel}>Last Connected:</div>
                    <div className={styles.infoValue}>
                      {database?.lastConnected
                        ? formatRelativeTime(database.lastConnected)
                        : "Never"}
                    </div>

                    <div className={styles.infoLabel}>Sandbox:</div>
                    <div className={styles.infoValue}>
                      {database?.isSandbox ? "Yes" : "No"}
                    </div>
                  </div>
                </div>

                {database?.schema && (
                  <div className={styles.statsCard}>
                    <h3>Database Statistics</h3>
                    <div className={styles.statsGrid}>
                      <div className={styles.statBlock}>
                        <div className={styles.statValue}>
                          {database.schema.tables.length}
                        </div>
                        <div className={styles.statLabel}>Tables</div>
                      </div>
                      <div className={styles.statBlock}>
                        <div className={styles.statValue}>
                          {database.schema.views.length}
                        </div>
                        <div className={styles.statLabel}>Views</div>
                      </div>
                      <div className={styles.statBlock}>
                        <div className={styles.statValue}>
                          {database.schema.procedures.length}
                        </div>
                        <div className={styles.statLabel}>
                          Stored Procedures
                        </div>
                      </div>
                      <div className={styles.statBlock}>
                        <div className={styles.statValue}>
                          {database.schema.tables.reduce(
                            (sum, table) => sum + (table.columns?.length || 0),
                            0
                          )}
                        </div>
                        <div className={styles.statLabel}>Total Columns</div>
                      </div>
                    </div>
                  </div>
                )}

                {recentQueries.length > 0 && (
                  <div className={styles.queriesCard}>
                    <h3>Recent Queries</h3>
                    <div className={styles.queriesList}>
                      {recentQueries.map((item, index) => (
                        <div key={index} className={styles.queryItem}>
                          <pre className={styles.queryText}>{item.query}</pre>
                          <div className={styles.queryTime}>
                            {formatRelativeTime(item.timestamp)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className={styles.settingsContainer}>
                <div className={styles.settingsCard}>
                  <h3>Database Settings</h3>
                  <p className={styles.settingsNote}>
                    These settings affect how this database connection behaves
                    in the application.
                  </p>

                  <div className={styles.settingsForm}>
                    <div className={styles.settingsGroup}>
                      <label htmlFor="db-name">Connection Name</label>
                      <input
                        type="text"
                        id="db-name"
                        value={database?.name}
                        placeholder="Enter connection name"
                      />
                      <div className={styles.settingsHelp}>
                        This is the display name used in the application.
                      </div>
                    </div>

                    <div className={styles.settingsGroup}>
                      <div className={styles.settingsCheckbox}>
                        <input
                          type="checkbox"
                          id="auto-connect"
                          checked={false}
                        />
                        <label htmlFor="auto-connect">
                          Auto-connect on startup
                        </label>
                      </div>
                      <div className={styles.settingsHelp}>
                        Automatically connect to this database when the
                        application starts.
                      </div>
                    </div>

                    <div className={styles.settingsGroup}>
                      <div className={styles.settingsCheckbox}>
                        <input
                          type="checkbox"
                          id="sandbox-mode"
                          checked={database?.isSandbox || false}
                          disabled
                        />
                        <label htmlFor="sandbox-mode">Sandbox Mode</label>
                      </div>
                      <div className={styles.settingsHelp}>
                        All operations will be performed in a sandbox
                        environment to protect your data.
                      </div>
                    </div>

                    <div className={styles.settingsGroup}>
                      <label htmlFor="timeout">
                        Connection Timeout (seconds)
                      </label>
                      <input
                        type="number"
                        id="timeout"
                        value={30}
                        min={5}
                        max={300}
                      />
                      <div className={styles.settingsHelp}>
                        How long to wait before timing out connection attempts.
                      </div>
                    </div>

                    <div className={styles.settingsActions}>
                      <Button
                        variant="primary"
                        onClick={() => console.log("Save settings")}
                      >
                        Save Settings
                      </Button>
                    </div>
                  </div>
                </div>

                <div className={styles.dangerZone}>
                  <h3>Danger Zone</h3>
                  <div className={styles.dangerAction}>
                    <div>
                      <h4>Delete Connection</h4>
                      <p>
                        Permanently delete this database connection. This action
                        cannot be undone.
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => console.log("Delete connection")}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disconnect Modal */}
      <Modal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        title="Disconnect Database"
        size="small"
        footer={
          <ModalFooter
            cancelText="Cancel"
            confirmText="Disconnect"
            onCancel={() => setIsDisconnectModalOpen(false)}
            onConfirm={handleDisconnect}
          />
        }
      >
        <div className={styles.modalContent}>
          <p>Are you sure you want to disconnect from {database?.name}?</p>
          <p>You can reconnect at any time.</p>
        </div>
      </Modal>

      {/* Query Modal */}
      <Modal
        isOpen={isQueryModalOpen}
        onClose={() => setIsQueryModalOpen(false)}
        title="Run Custom Query"
        size="large"
      >
        <div className={styles.queryModalContent}>
          <div className={styles.queryInputContainer}>
            <label htmlFor="custom-query">SQL Query:</label>
            <textarea
              id="custom-query"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
              className={styles.queryTextarea}
              rows={5}
            />
            <div className={styles.queryWarning}>
              Queries will run in sandbox mode to protect your data.
            </div>
          </div>

          <div className={styles.queryActions}>
            <Button
              variant="secondary"
              onClick={() => setIsQueryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExecuteQuery}
              disabled={!customQuery.trim() || isExecutingQuery}
              isLoading={isExecutingQuery}
            >
              Run Query
            </Button>
          </div>

          {queryError && (
            <div className={styles.queryErrorMessage}>{queryError}</div>
          )}

          {queryResult && (
            <div className={styles.queryResultContainer}>
              <h4>Query Results:</h4>
              <div className={styles.queryResultTable}>
                {queryResult.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(queryResult[0]).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {Object.values(row).map((value, valueIndex) => (
                            <td key={valueIndex}>
                              {value === null ? (
                                <span className={styles.nullValue}>NULL</span>
                              ) : (
                                String(value)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className={styles.emptyResult}>
                    Query executed successfully. No results returned.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DatabaseDetailsPage;
