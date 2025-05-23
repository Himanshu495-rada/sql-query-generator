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
import api from "../utils/api";

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

interface PlaygroundData {
  name: string;
  connectionId: string; 
  description?: string;
  isPublic?: boolean;
}

// Interface removed as it's not used in this file

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    connections,
    isLoading: isDatabaseLoading,
    loadConnections,
  } = useDatabase();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaygroundName, setNewPlaygroundName] = useState("");
  const [newPlaygroundDescription, setNewPlaygroundDescription] = useState("");
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingPlayground, setIsCreatingPlayground] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentPlaygrounds, setRecentPlaygrounds] = useState<RecentPlayground[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<StatsCard[]>([]);

  const navigate = useNavigate();

  // Fetch dashboard data on mount
  useEffect(() => {
    // Define a local function to prevent re-render cycles
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      // Record the start time to ensure minimum loading time
      const startTime = Date.now();
      
      try {
        // Load connections if not already loaded
        await loadConnections();
        
        // Fetch recent playgrounds
        const playgroundsResponse = await api.get<{ playgrounds: any[] }>('playgrounds/recent');
        
        if (playgroundsResponse && playgroundsResponse.playgrounds) {
          const formattedPlaygrounds = playgroundsResponse.playgrounds.map(pg => ({
            id: pg.id,
            name: pg.name,
            lastUsed: new Date(pg.updatedAt || pg.createdAt),
            databaseName: pg.connection?.name || "Unknown Database",
            queryCount: pg.queryCount || 0
          }));
          
          setRecentPlaygrounds(formattedPlaygrounds);
        } else {
          // If no data, set empty array
          setRecentPlaygrounds([]);
        }
        
        // Fetch user activity
        const activityResponse = await api.get<{ activities: any[] }>('user/activities');
        
        if (activityResponse && activityResponse.activities) {
          const formattedActivities = activityResponse.activities.map(activity => ({
            id: activity.id,
            action: activity.action,
            target: activity.target,
            timestamp: new Date(activity.createdAt),
            user: activity.user ? {
              name: activity.user.name,
              avatarUrl: activity.user.avatarUrl
            } : undefined
          }));
          
          setRecentActivity(formattedActivities);
        } else {
          // Sample activity if API doesn't return data
          const sampleActivity: ActivityItem[] = [
            {
              id: "1",
              action: "logged in",
              target: "to the application",
              timestamp: new Date(),
              user: user ? { 
                name: user.name, 
                avatarUrl: user.avatarUrl || undefined 
              } : undefined,
            }
          ];
          setRecentActivity(sampleActivity);
        }
        
        // Fetch dashboard stats
        const statsResponse = await api.get<{ stats: any }>('dashboard/stats');
        
        if (statsResponse && statsResponse.stats) {
          const dashboardStats = [
            {
              title: "Total Queries Run",
              value: statsResponse.stats.totalQueries || 0,
              icon: "📊",
              change: { 
                value: statsResponse.stats.queriesChange || "0%", 
                isPositive: (statsResponse.stats.queriesChangePositive !== undefined) 
                  ? statsResponse.stats.queriesChangePositive 
                  : true 
              },
            },
            {
              title: "Active Playgrounds",
              value: statsResponse.stats.activePlaygrounds || 0,
              icon: "🧩",
              change: { 
                value: statsResponse.stats.playgroundsChange || "0", 
                isPositive: (statsResponse.stats.playgroundsChangePositive !== undefined)
                  ? statsResponse.stats.playgroundsChangePositive
                  : true
              },
            },
            {
              title: "Connected Databases",
              value: connections?.length || 0,
              icon: "🗄️",
              change: { 
                value: statsResponse.stats.connectionsChange || "0", 
                isPositive: (statsResponse.stats.connectionsChangePositive !== undefined)
                  ? statsResponse.stats.connectionsChangePositive
                  : true
              },
            },
            {
              title: "SQL Generation Uses",
              value: statsResponse.stats.generationUses || 0,
              icon: "🤖",
              change: { 
                value: statsResponse.stats.generationChange || "0%", 
                isPositive: (statsResponse.stats.generationChangePositive !== undefined)
                  ? statsResponse.stats.generationChangePositive
                  : true
              },
            },
          ];
          
          setStats(dashboardStats);
        } else {
          // Default stats if API doesn't return data
          setStats([
            {
              title: "Total Queries Run",
              value: 0,
              icon: "📊",
              change: { value: "0% increase", isPositive: true },
            },
            {
              title: "Active Playgrounds",
              value: recentPlaygrounds.length,
              icon: "🧩",
              change: { value: "0 new", isPositive: true },
            },
            {
              title: "Connected Databases",
              value: connections?.length || 0,
              icon: "🗄️",
              change: { value: "0 new connections", isPositive: true },
            },
            {
              title: "SQL Generation Uses",
              value: 0,
              icon: "🤖",
              change: { value: "0% change", isPositive: true },
            },
          ]);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
        
        // Set default data if API fails
        setRecentPlaygrounds([]);
        setRecentActivity([]);
        setStats([
          {
            title: "Total Queries Run",
            value: 0,
            icon: "📊",
            change: { value: "0% increase", isPositive: true },
          },
          {
            title: "Active Playgrounds",
            value: 0,
            icon: "🧩",
            change: { value: "0 new", isPositive: true },
          },
          {
            title: "Connected Databases",
            value: connections.length,
            icon: "🗄️",
            change: { value: "0 new connections", isPositive: true },
          },
          {
            title: "SQL Generation Uses",
            value: 0,
            icon: "🤖",
            change: { value: "0% change", isPositive: true },
          },
        ]);
      } finally {
        // Calculate elapsed time and enforce minimum loading time of 1 second
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 1000; // 1 second in milliseconds
        
        if (elapsedTime < minLoadingTime) {
          // If loading was too fast, wait for the remaining time
          setTimeout(() => {
            setIsLoading(false);
          }, minLoadingTime - elapsedTime);
        } else {
          // If loading took longer than minimum time, update immediately
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();
    // Remove loadConnections from the dependency array to prevent re-render cycles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Initialize selected database when connections load
  useEffect(() => {
    if (connections && connections.length > 0 && !selectedDatabaseId) {
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

  // Sample queries for the UI
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

  // Handle creating a new playground
  const handleCreatePlayground = async () => {
    if (!newPlaygroundName.trim()) {
      alert("Please enter a playground name");
      return;
    }

    if (!selectedDatabaseId) {
      alert("Please select a database connection");
      return;
    }

    setIsCreatingPlayground(true);

    try {
      const playgroundData: PlaygroundData = {
        name: newPlaygroundName.trim(),
        connectionId: selectedDatabaseId,
        description: newPlaygroundDescription.trim() || undefined
      };

      // Create the playground
      const response = await api.post<{ playground: { id: string } }>('playgrounds', playgroundData);

      // Navigate to the new playground
      if (response && response.playground && response.playground.id) {
        navigate(`/playground/${response.playground.id}`);
      } else {
        throw new Error("Failed to create playground");
      }
    } catch (err) {
      console.error("Error creating playground:", err);
      alert(err instanceof Error ? err.message : "Failed to create playground");
    } finally {
      setIsCreatingPlayground(false);
      setIsCreateModalOpen(false);
      setNewPlaygroundName("");
      setNewPlaygroundDescription("");
    }
  };

  // Handle navigating to database connection page
  const handleConnectDatabase = () => {
    navigate('/databases');
  };

  // Handle selecting a playground
  const handlePlaygroundClick = (id: string) => {
    navigate(`/playground/${id}`);
  };

  // Handle selecting a database
  const handleDatabaseClick = (id: string) => {
    setSelectedDatabaseId(id);
  };

  // Handle sidebar toggle (mobile view)
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const isPageLoading = isLoading || isDatabaseLoading;

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className={styles.dashboardPage}>
      <Navbar
        user={user ? { name: user.name, avatarUrl: user.avatarUrl || undefined } : undefined}
        onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
        isSidebarVisible={isSidebarVisible}
        appName="Dashboard"
        onCreatePlayground={() => setIsCreateModalOpen(true)}
        onDatabaseConnect={handleConnectDatabase}
        onLogout={handleLogout}
        onSettingsClick={() => navigate('/settings')}
      />

      <div className={styles.mainContainer}>
        {isSidebarVisible && (
          <Sidebar
            isVisible={isSidebarVisible}
            playgrounds={(recentPlaygrounds || []).map((pg) => ({
              id: pg.id,
              name: pg.name,
              lastUpdated: pg.lastUsed,
            }))}
            databases={(connections || []).map((conn) => ({
              id: conn.id,
              name: conn.name,
              status: conn.status,
            }))}
            onPlaygroundClick={handlePlaygroundClick}
            onCreatePlayground={() => setIsCreateModalOpen(true)}
            onDatabaseClick={handleDatabaseClick}
            onConnectDatabase={handleConnectDatabase}
            onCollapse={() => setIsSidebarVisible(false)}
          />
        )}

        {isPageLoading ? (
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
              {error && <div className={styles.errorMessage}>{error}</div>}
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
                  {recentActivity.length === 0 ? (
                    <div className={styles.emptyState}>No recent activity</div>
                  ) : (
                    recentActivity.map((activity) => (
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
                    ))
                  )}
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
                  {recentPlaygrounds.length === 0 ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyStateIcon}>🧩</div>
                      <p>No recent playgrounds</p>
                    </div>
                  ) : (
                    recentPlaygrounds.map((playground) => (
                      <div key={playground.id} className={styles.playgroundCard}>
                        <div className={styles.playgroundHeader}>
                          <div className={styles.playgroundIcon}>🧩</div>
                          <div className={styles.playgroundInfo}>
                            <h3>{playground.name}</h3>
                          </div>
                        </div>
                        <div className={styles.playgroundDetails}>
                          <div className={styles.playgroundDetail}>
                            <span className={styles.playgroundDatabase}>
                              {playground.databaseName}
                            </span>
                          </div>
                          <div className={styles.playgroundDetail}>
                            <span className={styles.detailIcon}>📊</span>
                            <span className={styles.playgroundQueries}>
                              {playground.queryCount} queries
                            </span>
                          </div>
                          <div className={styles.playgroundDetail}>
                            <span className={styles.detailIcon}>🕒</span>
                            <span className={styles.playgroundTime}>
                              {formatRelativeTime(playground.lastUsed)}
                            </span>
                          </div>
                        </div>
                        <div className={styles.playgroundActions}>
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => navigate(`/playground/${playground.id}`)}
                          >
                            Open Playground
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
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
                          onClick={() => {
                            navigator.clipboard.writeText(item.query);
                            alert("Query copied to clipboard");
                          }}
                        >
                          Copy
                        </Button>
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => {
                            setNewPlaygroundName(item.name);
                            setIsCreateModalOpen(true);
                          }}
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
            confirmDisabled={!newPlaygroundName.trim() || !selectedDatabaseId || isCreatingPlayground}
            isConfirmLoading={isCreatingPlayground}
          />
        }
      >
        <div className={styles.createPlaygroundForm}>
          <div className={styles.formGroup}>
            <label htmlFor="playground-name">Playground Name*</label>
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
            <label htmlFor="playground-description">Description (optional)</label>
            <input
              type="text"
              id="playground-description"
              value={newPlaygroundDescription}
              onChange={(e) => setNewPlaygroundDescription(e.target.value)}
              placeholder="Describe your playground"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="database-select">Database Connection*</label>
            <select
              id="database-select"
              value={selectedDatabaseId || ""}
              onChange={(e) => setSelectedDatabaseId(e.target.value)}
            >
              <option value="" disabled>
                Select a database
              </option>
              {(connections || []).map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {connection.name}{" "}
                  {connection.status !== "connected"
                    ? `(${connection.status})`
                    : ""}
                </option>
              ))}
              {(!connections || connections.length === 0) && (
                <option value="" disabled>
                  No databases connected
                </option>
              )}
            </select>
            {(!connections || connections.length === 0) && (
              <div className={styles.formNote}>
                You need to connect a database first.
                <Button 
                  variant="outline" 
                  size="small" 
                  onClick={handleConnectDatabase}
                  style={{marginLeft: '8px'}}
                >
                  Connect Database
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;
