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
  connections: string[]; // Changed from connectionIds to connections
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
  const [selectedDatabaseIds, setSelectedDatabaseIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingPlayground, setIsCreatingPlayground] = useState(false);
  const [recentPlaygrounds, setRecentPlaygrounds] = useState<
    RecentPlayground[]
  >([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<StatsCard[]>([]);

  const navigate = useNavigate();

  // Fetch dashboard data on mount
  useEffect(() => {
    if (!user) {
      console.log("No user, skipping dashboard data fetch");
      return;
    }
    setIsLoading(true);

    // Record the start time to ensure minimum loading time
    const startTime = Date.now();
    console.log("Loading dashboard data...");

    // Helper function to set sample playground data
    const useSamplePlaygrounds = () => {
      console.log("Using sample playground data");
      const samplePlaygrounds: RecentPlayground[] = [
        {
          id: "sample-1",
          name: "Sample SQL Playground",
          lastUsed: new Date(),
          databaseName: "Sample Database",
          queryCount: 5,
        },
        {
          id: "sample-2",
          name: "Customer Analysis",
          lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000),
          databaseName: "Marketing DB",
          queryCount: 12,
        },
      ];
      console.log("Setting sample playgrounds:", samplePlaygrounds);
      setRecentPlaygrounds([...samplePlaygrounds]);
    };

    const fetchDashboardData = async () => {
      try {
        // Load database connections
        await loadConnections();
        console.log("Connections loaded");

        // Fetch playgrounds with direct API access for precise response handling
        try {
          console.log("Making direct API call to fetch playgrounds");
          const rawResponse = await api.get("playgrounds");
          console.log("Raw API Response:", rawResponse);

          // Parse the raw response in the exact format provided
          // {"success":true,"data":{"playgrounds":[...]}}
          if (
            rawResponse?.success === true &&
            rawResponse?.data?.playgrounds &&
            Array.isArray(rawResponse.data.playgrounds)
          ) {
            const apiPlaygrounds = rawResponse.data.playgrounds;
            console.log(
              "Successfully extracted playgrounds from API:",
              apiPlaygrounds
            );

            if (apiPlaygrounds.length > 0) {
              // Format the playgrounds for the UI
              const formattedPlaygrounds: RecentPlayground[] =
                apiPlaygrounds.map((pg: any) => ({
                  id:
                    pg.id ||
                    `pg-${Date.now()}-${Math.random()
                      .toString(36)
                      .substring(2, 9)}`,
                  name: pg.name || "Unnamed Playground",
                  lastUsed: new Date(
                    pg.updatedAt || pg.createdAt || Date.now()
                  ),
                  databaseName:
                    pg.connections && pg.connections.length > 0
                      ? "Connected Database"
                      : "No Database",
                  queryCount: 0, // Default since we don't have this info
                }));

              console.log(
                "Setting formatted playgrounds (API format):",
                formattedPlaygrounds
              );

              // Create a new array to ensure React detects the state change
              setRecentPlaygrounds([...formattedPlaygrounds]);

              // Log that we've set the data
              console.log(
                `Set ${formattedPlaygrounds.length} playgrounds from API`
              );

              // For debugging, we can use setTimeout to see the state in the next render cycle
              setTimeout(() => {
                if (recentPlaygrounds.length === 0) {
                  console.warn(
                    "Playgrounds state is still empty after update, using fallback"
                  );
                  // As a fallback if state is still empty, force another update
                  setRecentPlaygrounds([...formattedPlaygrounds]);
                } else {
                  console.log(
                    "Confirmed playgrounds were set:",
                    recentPlaygrounds
                  );
                }
              }, 100);
            } else {
              console.log(
                "API returned empty playgrounds array, using sample data"
              );
              useSamplePlaygrounds();
            }
          } else {
            // Fallback to using the PlaygroundService
            console.log(
              "Raw API response not in expected format, trying PlaygroundService"
            );
            const playgroundService = await import(
              "../services/playgroundService"
            ).then((module) => module.default);
            const playgrounds = await playgroundService.getPlaygrounds();

            if (
              playgrounds &&
              Array.isArray(playgrounds) &&
              playgrounds.length > 0
            ) {
              console.log(
                "PlaygroundService returned playgrounds:",
                playgrounds
              );

              const formattedPlaygrounds: RecentPlayground[] = playgrounds.map(
                (pg) => ({
                  id:
                    pg.id ||
                    `pg-${Date.now()}-${Math.random()
                      .toString(36)
                      .substring(2, 9)}`,
                  name: pg.name || "Unnamed Playground",
                  lastUsed: new Date(pg.updatedAt || Date.now()),
                  databaseName:
                    pg.connections && pg.connections.length > 0
                      ? "Connected Database"
                      : "No Database",
                  queryCount: 0, // Default since we don't have this info in the new schema
                })
              );

              console.log(
                "Setting playgrounds from PlaygroundService:",
                formattedPlaygrounds
              );

              // Use a new array to ensure React detects the state change
              setRecentPlaygrounds([...formattedPlaygrounds]);

              console.log(
                `Set ${formattedPlaygrounds.length} playgrounds from PlaygroundService`
              );

              // Add a fallback check after the state update to ensure data was properly set
              setTimeout(() => {
                if (recentPlaygrounds.length === 0) {
                  console.warn(
                    "PlaygroundService: State is still empty, applying fallback"
                  );
                  // Force another update if state is still empty
                  setRecentPlaygrounds([...formattedPlaygrounds]);
                } else {
                  console.log(
                    "PlaygroundService: Confirmed data was set:",
                    recentPlaygrounds.length
                  );
                }
              }, 100);
            } else {
              console.log(
                "PlaygroundService returned no playgrounds, using sample data"
              );
              useSamplePlaygrounds();
            }
          }
        } catch (playgroundError) {
          console.error("Error fetching playgrounds:", playgroundError);
          useSamplePlaygrounds();
        }

        // Fetch user activity
        try {
          const activityResponse = await api.get("user/activities");
          console.log("Activity response:", activityResponse);

          if (activityResponse?.success && activityResponse?.data?.activities) {
            const activities = activityResponse.data.activities;

            const formattedActivities = activities.map((activity: any) => ({
              id: activity.id,
              action: activity.action,
              target: activity.target,
              timestamp: new Date(activity.createdAt),
              user: activity.user
                ? {
                    name: activity.user.name,
                    avatarUrl: activity.user.avatarUrl,
                  }
                : undefined,
            }));

            setRecentActivity(formattedActivities);
          } else {
            // Sample activity if API doesn't return data
            const sampleActivity: ActivityItem[] = [
              {
                id: "act-1",
                action: "created",
                target: "Sample Playground",
                timestamp: new Date(),
                user: {
                  name: user?.name || "You",
                  avatarUrl: user?.avatarUrl || undefined,
                },
              },
            ];
            setRecentActivity(sampleActivity);
          }
        } catch (activityError) {
          console.error("Error fetching user activity:", activityError);
          const sampleActivity: ActivityItem[] = [
            {
              id: "act-1",
              action: "created",
              target: "Sample Playground",
              timestamp: new Date(),
              user: {
                name: user?.name || "You",
                avatarUrl: user?.avatarUrl || undefined,
              },
            },
          ];
          setRecentActivity(sampleActivity);
        }

        // Fetch dashboard stats
        const statsResponse = await api.get<{ stats: any }>("dashboard/stats");

        if (statsResponse && statsResponse.stats) {
          const dashboardStats = [
            {
              title: "Total Queries Run",
              value: statsResponse.stats.totalQueries || 0,
              icon: "📊",
              change: {
                value: statsResponse.stats.queriesChange || "0%",
                isPositive:
                  statsResponse.stats.queriesChangePositive !== undefined
                    ? statsResponse.stats.queriesChangePositive
                    : true,
              },
            },
            {
              title: "Active Playgrounds",
              value: statsResponse.stats.activePlaygrounds || 0,
              icon: "🧩",
              change: {
                value: statsResponse.stats.playgroundsChange || "0",
                isPositive:
                  statsResponse.stats.playgroundsChangePositive !== undefined
                    ? statsResponse.stats.playgroundsChangePositive
                    : true,
              },
            },
            {
              title: "Connected Databases",
              value: connections?.length || 0,
              icon: "🗄️",
              change: {
                value: statsResponse.stats.connectionsChange || "0",
                isPositive:
                  statsResponse.stats.connectionsChangePositive !== undefined
                    ? statsResponse.stats.connectionsChangePositive
                    : true,
              },
            },
            {
              title: "SQL Generation Uses",
              value: statsResponse.stats.generationUses || 0,
              icon: "🤖",
              change: {
                value: statsResponse.stats.generationChange || "0%",
                isPositive:
                  statsResponse.stats.generationChangePositive !== undefined
                    ? statsResponse.stats.generationChangePositive
                    : true,
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
    if (
      connections &&
      connections.length > 0 &&
      selectedDatabaseIds.length === 0
    ) {
      setSelectedDatabaseIds(connections.map((conn) => conn.id));
    }
  }, [connections, selectedDatabaseIds]);

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

  // Data for SQL Templates
  const sqlTemplates = [
    {
      title: "Generate SQL",
      description: "Generate SQL from text",
      slug: "generate-sql",
    },
    {
      title: "Optimize SQL",
      description: "Optimize SQL queries",
      slug: "optimize-sql",
    },
    {
      title: "Explain SQL",
      description: "Get a detailed explanation of your SQL query",
      slug: "explain-sql",
    },
  ];

  // Handle creating a new playground
  const handleCreatePlayground = async () => {
    if (!newPlaygroundName.trim()) {
      alert("Please enter a playground name");
      return;
    }

    if (selectedDatabaseIds.length === 0) {
      alert("Please select at least one database connection");
      return;
    }

    setIsCreatingPlayground(true);

    try {
      const playgroundData: PlaygroundData = {
        name: newPlaygroundName.trim(),
        connections: selectedDatabaseIds, // Changed from connectionIds to connections
        description: newPlaygroundDescription.trim() || undefined,
      };

      // Create the playground
      const response = await api.post("playgrounds", playgroundData);
      console.log("Playground creation response:", response);

      // The API returns data in format: {success: true, data: {playground: {...}}}
      if (
        response?.success === true &&
        response?.data?.playground &&
        response.data.playground.id
      ) {
        // Successfully created playground, navigate to it
        navigate(`/playground/${response.data.playground.id}`);
      } else if (response?.status === 201 || response?.status === 200) {
        // If we got a success status but can't find the ID in the expected format,
        // try to extract it from other possible response formats
        const playgroundId =
          response?.data?.id ||
          response?.id ||
          response?.playground?.id ||
          response?.data?.playground?.id;

        if (playgroundId) {
          navigate(`/playground/${playgroundId}`);
        } else {
          // Refresh dashboard to show the new playground
          window.location.reload();
        }
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
    navigate("/databases");
  };

  // Handle selecting a playground
  const handlePlaygroundClick = (id: string) => {
    navigate(`/playground/${id}`);
  };

  // Handle selecting a database
  const handleDatabaseClick = (id: string) => {
    setSelectedDatabaseIds((prevIds) => {
      if (prevIds.includes(id)) {
        return prevIds.filter((i) => i !== id);
      } else {
        return [...prevIds, id];
      }
    });
  };

  // Handle sidebar toggle (mobile view)
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const isPageLoading = isLoading || isDatabaseLoading;

  // Update stats when connections change to fix the database count issue on refresh
  useEffect(() => {
    // Only update if we have both stats and connections available
    if (stats.length > 0 && connections) {
      setStats((prevStats) => {
        const newStats = [...prevStats];
        const dbStatsIndex = newStats.findIndex(
          (stat) => stat.title === "Connected Databases"
        );

        if (
          dbStatsIndex !== -1 &&
          newStats[dbStatsIndex].value !== connections.length
        ) {
          newStats[dbStatsIndex] = {
            ...newStats[dbStatsIndex],
            value: connections.length,
          };
          return newStats;
        }
        return prevStats;
      });
    }
  }, [connections, stats]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className={styles.dashboardPage}>
      <Navbar
        user={
          user
            ? { name: user.name, avatarUrl: user.avatarUrl || undefined }
            : undefined
        }
        onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
        isSidebarVisible={isSidebarVisible}
        appName="Dashboard"
        onCreatePlayground={() => setIsCreateModalOpen(true)}
        onDatabaseConnect={handleConnectDatabase}
        onLogout={handleLogout}
        onSettingsClick={() => navigate("/settings")}
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

            {/* SQL Templates Section */}
            <div className={styles.sqlTemplatesSection}>
              <h2 className={styles.sqlTemplatesTitle}>SQL Templates</h2>
              <div className={styles.sqlTemplatesCardContainer}>
                {sqlTemplates.map((template, index) => (
                  <div
                    key={index}
                    className={styles.sqlTemplateCard}
                    onClick={() => navigate(`/chat/${template.slug}`)} // Navigate on click
                    role="button" // Accessibility
                    tabIndex={0} // Accessibility
                    onKeyPress={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        navigate(`/chat/${template.slug}`);
                      }
                    }} // Accessibility for keyboard navigation
                  >
                    <h3>{template.title}</h3>
                    <p>{template.description}</p>
                  </div>
                ))}
              </div>
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
                    // Only show the 3 most recent playgrounds
                    recentPlaygrounds.slice(0, 3).map((playground) => (
                      <div
                        key={playground.id}
                        className={styles.playgroundCard}
                      >
                        <div className={styles.playgroundHeader}>
                          <div className={styles.playgroundIcon}>🧩</div>
                          <div className={styles.playgroundInfo}>
                            <h3>{playground.name}</h3>
                            <div className={styles.playgroundMeta}>
                              <span className={styles.databaseLabel}>
                                {playground.databaseName}
                              </span>
                              <span className={styles.timeLabel}>
                                {formatRelativeTime(playground.lastUsed)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.playgroundActions}>
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() =>
                              navigate(`/playground/${playground.id}`)
                            }
                          >
                            Open
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
            confirmDisabled={
              !newPlaygroundName.trim() ||
              selectedDatabaseIds.length === 0 ||
              isCreatingPlayground
            }
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
            <label htmlFor="playground-description">
              Description (optional)
            </label>
            <input
              type="text"
              id="playground-description"
              value={newPlaygroundDescription}
              onChange={(e) => setNewPlaygroundDescription(e.target.value)}
              placeholder="Describe your playground"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="database-select">Database Connections*</label>
            <div className={styles.databaseSelectionList}>
              {(connections || []).map((connection) => (
                <div
                  key={connection.id}
                  className={styles.databaseSelectionItem}
                >
                  <input
                    type="checkbox"
                    id={`db-${connection.id}`}
                    checked={selectedDatabaseIds.includes(connection.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDatabaseIds([
                          ...selectedDatabaseIds,
                          connection.id,
                        ]);
                      } else {
                        setSelectedDatabaseIds(
                          selectedDatabaseIds.filter(
                            (id) => id !== connection.id
                          )
                        );
                      }
                    }}
                  />
                  <label htmlFor={`db-${connection.id}`}>
                    {connection.name}{" "}
                    {connection.status !== "connected"
                      ? `(${connection.status})`
                      : ""}
                  </label>
                </div>
              ))}
            </div>
            {(!connections || connections.length === 0) && (
              <div className={styles.formNote}>
                You need to connect a database first.
                <Button
                  variant="outline"
                  size="small"
                  onClick={handleConnectDatabase}
                  style={{ marginLeft: "8px" }}
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
