import React, { useState, useEffect } from "react";
import styles from "./DashboardPage.module.css";
import { useAuth } from "../contexts/AuthContext";
import { useDatabase } from "../contexts/DatabaseContext";
import { useNavigate } from "react-router-dom";
import Button from "../components/shared/Button";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import Modal, { ModalFooter } from "../components/shared/Modal";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";

// Dashboard card types
interface StatsCard {
  title: string;
  value: string | number;
  icon: string;
  change: {
    value: string;
    isPositive: boolean;
  };
}

interface ActivityItem {
  id: string;
  action: string;
  target: string;
  timestamp: Date;
  user?: {
    name: string;
    avatarUrl?: string;
  };
}

interface RecentPlayground {
  id: string;
  name: string;
  lastUsed: Date;
  databaseName: string;
  queryCount: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const {
    connections,
    activeConnection,
    isLoading: isDatabaseLoading,
  } = useDatabase();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaygroundName, setNewPlaygroundName] = useState("");
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string | null>(
    null
  );

  const navigate = useNavigate();

  // Stats for the statistics cards
  const stats: StatsCard[] = [
    {
      title: "Total Queries Run",
      value: 587,
      icon: "📊",
      change: { value: "12% increase", isPositive: true },
    },
    {
      title: "Active Playgrounds",
      value: 8,
      icon: "🧩",
      change: { value: "3 new this week", isPositive: true },
    },
    {
      title: "Connected Databases",
      value: connections.length,
      icon: "🗄️",
      change: { value: "2 new connections", isPositive: true },
    },
    {
      title: "SQL Generation Uses",
      value: 142,
      icon: "🤖",
      change: { value: "5% decrease", isPositive: false },
    },
  ];

  // Recent user activity
  const recentActivity: ActivityItem[] = [
    {
      id: "1",
      action: "executed query",
      target: "SELECT * FROM users",
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      user: user ? { name: user.name, avatarUrl: user.avatarUrl } : undefined,
    },
    {
      id: "2",
      action: "created playground",
      target: "Customer Analysis",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      user: user ? { name: user.name, avatarUrl: user.avatarUrl } : undefined,
    },
    {
      id: "3",
      action: "connected database",
      target: "Product Database",
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      user: user ? { name: user.name, avatarUrl: user.avatarUrl } : undefined,
    },
    {
      id: "4",
      action: "generated SQL",
      target: "Show all orders with total value > $100",
      timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      user: user ? { name: user.name, avatarUrl: user.avatarUrl } : undefined,
    },
  ];

  // Recent playgrounds
  const recentPlaygrounds: RecentPlayground[] = [
    {
      id: "pg1",
      name: "Sales Analysis",
      lastUsed: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      databaseName: "Sales DB",
      queryCount: 15,
    },
    {
      id: "pg2",
      name: "Customer Segmentation",
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      databaseName: "Marketing DB",
      queryCount: 8,
    },
    {
      id: "pg3",
      name: "Inventory Report",
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      databaseName: "Inventory DB",
      queryCount: 12,
    },
    {
      id: "pg4",
      name: "User Analytics",
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      databaseName: "User DB",
      queryCount: 7,
    },
  ];

  // Sample database schemas
  const sampleQueries = [
    {
      name: "Find recent orders",
      query: "SELECT * FROM orders ORDER BY order_date DESC LIMIT 10",
      database: "Sales DB",
    },
    {
      name: "Customer spending stats",
      query:
        "SELECT customer_id, COUNT(order_id) as order_count, SUM(total) as total_spent FROM orders GROUP BY customer_id ORDER BY total_spent DESC",
      database: "Marketing DB",
    },
    {
      name: "Low inventory alert",
      query:
        "SELECT product_name, stock_level FROM inventory WHERE stock_level < reorder_point",
      database: "Inventory DB",
    },
    {
      name: "Active users",
      query:
        "SELECT COUNT(*) as active_users FROM users WHERE last_login > NOW() - INTERVAL 7 DAY",
      database: "User DB",
    },
  ];

  // Initialize selected database when connections load
  useEffect(() => {
    if (connections.length > 0 && !selectedDatabaseId) {
      setSelectedDatabaseId(connections[0].id);
    }
  }, [connections, selectedDatabaseId]);

  // Format the relative time for display (e.g. "5 minutes ago")
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

  // Handle creating a new playground
  const handleCreatePlayground = () => {
    if (!newPlaygroundName.trim()) {
      alert("Please enter a playground name");
      return;
    }

    // In a real app, this would create the playground and redirect to it
    console.log(
      `Creating playground: ${newPlaygroundName} with database: ${selectedDatabaseId}`
    );
    setIsCreateModalOpen(false);
    setNewPlaygroundName("");
  };

  // Handle sidebar toggle (mobile view)
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  return (
    <div className={styles.dashboardPage}>
      <Navbar
        user={user ? { name: user.name, avatarUrl: user.avatarUrl } : undefined}
        onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
        isSidebarVisible={isSidebarVisible}
        onCreatePlayground={() => setIsCreateModalOpen(true)}
        onDatabaseConnect={() => console.log("Connect database")}
      />

      <div className={styles.mainContainer}>
        {isSidebarVisible && (
          <Sidebar
            isVisible={isSidebarVisible}
            playgrounds={recentPlaygrounds.map((pg) => ({
              id: pg.id,
              name: pg.name,
              lastUpdated: pg.lastUsed,
            }))}
            databases={connections.map((conn) => ({
              id: conn.id,
              name: conn.name,
              status: conn.status,
            }))}
            onPlaygroundClick={(id) =>
              console.log("Navigate to playground", id)
            }
            onCreatePlayground={() => setIsCreateModalOpen(true)}
            onDatabaseClick={(id) => console.log("Set active database", id)}
            onConnectDatabase={() => console.log("Connect database")}
            onCollapse={() => setIsSidebarVisible(false)}
          />
        )}

        {isDatabaseLoading ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner
              size="large"
              color="primary"
              text="Loading dashboard..."
            />
          </div>
        ) : (
          <div className={styles.dashboardContent}>
            <div className={styles.welcomeSection}>
              <h1>Welcome back, {user ? user.name.split(" ")[0] : "User"}</h1>
              <p>Here's what's happening with your SQL projects</p>
            </div>

            <div className={styles.statsSection}>
              {stats.map((stat, index) => (
                <div key={index} className={styles.statCard}>
                  <div className={styles.statIcon}>{stat.icon}</div>
                  <div className={styles.statInfo}>
                    <h3>{stat.title}</h3>
                    <div className={styles.statValue}>{stat.value}</div>
                    <div
                      className={`${styles.statChange} ${
                        stat.change.isPositive
                          ? styles.positive
                          : styles.negative
                      }`}
                    >
                      {stat.change.isPositive ? "↑ " : "↓ "}
                      {stat.change.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.dashboardGridContainer}>
              <div className={styles.recentSection}>
                <div className={styles.sectionHeader}>
                  <h2>Recent Activity</h2>
                  <Button variant="outline" size="small">
                    View All
                  </Button>
                </div>
                <div className={styles.activityList}>
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className={styles.activityItem}>
                      <div className={styles.activityUser}>
                        {activity.user?.avatarUrl ? (
                          <img
                            src={activity.user.avatarUrl}
                            alt={activity.user.name}
                            className={styles.userAvatar}
                          />
                        ) : (
                          <div className={styles.userAvatarPlaceholder}>
                            {activity.user?.name?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      <div className={styles.activityDetails}>
                        <div className={styles.activityText}>
                          <span className={styles.bold}>
                            {activity.user?.name || "You"}
                          </span>{" "}
                          {activity.action}{" "}
                          <span className={styles.activityTarget}>
                            {activity.target}
                          </span>
                        </div>
                        <div className={styles.activityTime}>
                          {formatRelativeTime(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.playgroundsSection}>
                <div className={styles.sectionHeader}>
                  <h2>Recent Playgrounds</h2>
                  <Button
                    variant="primary"
                    size="small"
                    icon="+"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    New Playground
                  </Button>
                </div>
                <div className={styles.playgroundsList}>
                  {recentPlaygrounds.map((playground) => (
                    <div key={playground.id} className={styles.playgroundCard}>
                      <div className={styles.playgroundIcon}>📊</div>
                      <div className={styles.playgroundInfo}>
                        <h3>{playground.name}</h3>
                        <div className={styles.playgroundDetails}>
                          <span className={styles.playgroundDatabase}>
                            {playground.databaseName}
                          </span>
                          <span className={styles.playgroundQueries}>
                            {playground.queryCount} queries
                          </span>
                          <span className={styles.playgroundTime}>
                            {formatRelativeTime(playground.lastUsed)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => navigate(`/playground/${playground.id}`)}
                      >
                        Open
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.queriesSection}>
                <div className={styles.sectionHeader}>
                  <h2>Sample Queries</h2>
                  <Button variant="outline" size="small">
                    More Samples
                  </Button>
                </div>
                <div className={styles.sampleQueriesList}>
                  {sampleQueries.map((item, index) => (
                    <div key={index} className={styles.queryCard}>
                      <div className={styles.queryHeader}>
                        <h3>{item.name}</h3>
                        <span className={styles.queryDatabase}>
                          {item.database}
                        </span>
                      </div>
                      <pre className={styles.queryCode}>{item.query}</pre>
                      <div className={styles.queryActions}>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => console.log("Copy query", item.query)}
                        >
                          Copy
                        </Button>
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() =>
                            console.log(
                              "Create playground with query",
                              item.query
                            )
                          }
                        >
                          Use in Playground
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Playground Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Playground"
        size="small"
        footer={
          <ModalFooter
            cancelText="Cancel"
            confirmText="Create"
            onCancel={() => setIsCreateModalOpen(false)}
            onConfirm={handleCreatePlayground}
            confirmDisabled={!newPlaygroundName.trim()}
          />
        }
      >
        <div className={styles.createPlaygroundForm}>
          <div className={styles.formGroup}>
            <label htmlFor="playground-name">Playground Name</label>
            <input
              type="text"
              id="playground-name"
              value={newPlaygroundName}
              onChange={(e) => setNewPlaygroundName(e.target.value)}
              placeholder="My New Playground"
              autoFocus
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="database-select">Database Connection</label>
            <select
              id="database-select"
              value={selectedDatabaseId || ""}
              onChange={(e) => setSelectedDatabaseId(e.target.value)}
            >
              <option value="" disabled>
                Select a database
              </option>
              {connections.map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {connection.name}{" "}
                  {connection.status !== "connected"
                    ? `(${connection.status})`
                    : ""}
                </option>
              ))}
              {connections.length === 0 && (
                <option value="" disabled>
                  No databases connected
                </option>
              )}
            </select>
            {connections.length === 0 && (
              <div className={styles.formNote}>
                You need to connect a database first.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;
