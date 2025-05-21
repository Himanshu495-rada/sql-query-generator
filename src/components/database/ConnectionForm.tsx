import React, { useState, FormEvent } from "react";
import styles from "./ConnectionForm.module.css";
import Button from "../shared/Button";

interface DatabaseType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface ConnectionFormProps {
  onConnect: (connectionData: ConnectionData) => Promise<void>;
  onSelectTrial: (databaseId: string) => Promise<void>;
}

interface ConnectionData {
  type: string;
  host: string;
  port: string;
  username: string;
  password: string;
  databaseName: string;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({
  onConnect,
  onSelectTrial,
}) => {
  const [activeTab, setActiveTab] = useState<"remote" | "trial">("remote");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionData, setConnectionData] = useState<ConnectionData>({
    type: "mysql",
    host: "",
    port: "",
    username: "",
    password: "",
    databaseName: "",
  });

  // Sample trial databases
  const trialDatabases: DatabaseType[] = [
    {
      id: "sample_ecommerce",
      name: "E-Commerce Sample",
      icon: "🛒",
      description: "Sample database with products, customers, and orders.",
    },
    {
      id: "sample_hr",
      name: "HR Management",
      icon: "👥",
      description: "Employee management system with departments and roles.",
    },
    {
      id: "sample_blog",
      name: "Blog Platform",
      icon: "📝",
      description: "Blog with users, posts, comments, and categories.",
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setConnectionData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onConnect(connectionData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to database"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate test connection
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Connection successful!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to test connection"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrialSelect = async (databaseId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await onSelectTrial(databaseId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load trial database"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.connectionContainer}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "remote" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("remote")}
        >
          Remote Database
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "trial" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("trial")}
        >
          Trial Databases
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === "remote" ? (
          <form onSubmit={handleSubmit} className={styles.connectionForm}>
            <div className={styles.formGroup}>
              <label htmlFor="type">Database Type</label>
              <select
                id="type"
                name="type"
                value={connectionData.type}
                onChange={handleInputChange}
              >
                <option value="mysql">MySQL</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="sqlserver">SQL Server</option>
                <option value="oracle">Oracle</option>
                <option value="sqlite">SQLite</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="host">Host / Server</label>
              <input
                type="text"
                id="host"
                name="host"
                value={connectionData.host}
                onChange={handleInputChange}
                placeholder="e.g., localhost or 192.168.1.1"
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="port">Port</label>
                <input
                  type="text"
                  id="port"
                  name="port"
                  value={connectionData.port}
                  onChange={handleInputChange}
                  placeholder="e.g., 3306"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="databaseName">Database Name</label>
                <input
                  type="text"
                  id="databaseName"
                  name="databaseName"
                  value={connectionData.databaseName}
                  onChange={handleInputChange}
                  placeholder="e.g., mydb"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={connectionData.username}
                onChange={handleInputChange}
                placeholder="Database username"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={connectionData.password}
                onChange={handleInputChange}
                placeholder="Database password"
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.buttonGroup}>
              <Button
                type="button"
                variant="secondary"
                onClick={handleTestConnection}
                disabled={isLoading}
              >
                Test Connection
              </Button>
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </form>
        ) : (
          <div className={styles.trialDatabases}>
            <p className={styles.trialInfo}>
              Choose one of our trial databases to get started quickly without
              setting up your own connection.
            </p>

            {trialDatabases.map((db) => (
              <div className={styles.trialCard} key={db.id}>
                <div className={styles.trialIcon}>{db.icon}</div>
                <div className={styles.trialDetails}>
                  <h3>{db.name}</h3>
                  <p>{db.description}</p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => handleTrialSelect(db.id)}
                  disabled={isLoading}
                >
                  Select
                </Button>
              </div>
            ))}

            {error && <div className={styles.error}>{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionForm;
