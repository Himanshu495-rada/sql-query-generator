import React, { useState } from "react";
import styles from "./DatabaseConnectionPage.module.css";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import ConnectionForm from "../components/database/ConnectionForm";
import DatabaseList from "../components/database/DatabaseList";
import { useAuth } from "../contexts/AuthContext";
import { useDatabase } from "../contexts/DatabaseContext";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import Modal, { ModalFooter } from "../components/shared/Modal";

const DatabaseConnectionPage: React.FC = () => {
  const { user } = useAuth();
  const {
    connections,
    connectToDatabase,
    disconnectDatabase,
    isLoading,
    error,
    loadTrialDatabase,
    deleteConnection,
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

  // Handle database connection
  const handleConnect = async (connectionData: any) => {
    try {
      await connectToDatabase(connectionData);
    } catch (err) {
      console.error("Connection error:", err);
      // Error is already handled by the context
    }
  };

  // Handle trial database selection
  const handleSelectTrial = async (databaseId: string) => {
    try {
      await loadTrialDatabase(databaseId);
    } catch (err) {
      console.error("Trial database loading error:", err);
      // Error is already handled by the context
    }
  };

  // Handle database disconnection
  const handleDisconnect = async (databaseId: string) => {
    try {
      await disconnectDatabase(databaseId);
    } catch (err) {
      console.error("Disconnection error:", err);
      // Error is already handled by the context
    }
  };

  // Open schema viewer modal
  const handleViewSchema = (databaseId: string) => {
    setSelectedConnection(databaseId);
    setIsViewSchemaModalOpen(true);
  };

  // Confirm database deletion
  const handleDeleteConfirm = async () => {
    if (!connectionToDelete) return;

    setIsDeleteLoading(true);
    try {
      await deleteConnection(connectionToDelete);
      setIsDeleteModalOpen(false);
      setConnectionToDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
      // Error is already handled by the context
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <div className={styles.databaseConnectionPage}>
      <Navbar
        user={user ? { name: user.name, avatarUrl: user.avatarUrl } : undefined}
        onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
        isSidebarVisible={isSidebarVisible}
        appName="Database Connections"
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
          <div className={styles.header}>
            <h1>Database Connections</h1>
            <p>
              Connect to your databases or use our trial databases to test the
              application.
            </p>
          </div>

          {isLoading && !connections.length ? (
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
                {error && <div className={styles.errorMessage}>{error}</div>}

                <DatabaseList
                  databases={connections}
                  onConnect={handleDisconnect} // This actually toggles connection
                  onDisconnect={handleDisconnect}
                  onViewSchema={handleViewSchema}
                  onDelete={(id) => {
                    setConnectionToDelete(id);
                    setIsDeleteModalOpen(true);
                  }}
                />
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
            <div>
              {/* In a real application, you would render the SchemaViewer component here */}
              <p>Schema viewer for database would be displayed here.</p>
              <p>Connection ID: {selectedConnection}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DatabaseConnectionPage;
