import React, { useState, useRef, FormEvent } from "react";
import styles from "./ConnectionForm.module.css";
import Button from "../shared/Button";
import { DatabaseType } from "../../contexts/DatabaseContext";

interface DatabaseTypeOption {
  id: DatabaseType;
  name: string;
  icon: string;
  description: string;
}

interface ConnectionFormProps {
  onConnect: (connectionData: ConnectionData) => Promise<void>;
  onSelectTrial: (databaseId: string) => Promise<void>;
}

export interface ConnectionData {
  name: string;
  type: DatabaseType;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  connectionString?: string;
  file?: File;
  createSandbox: boolean;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({
  onConnect,
  onSelectTrial,
}) => {
  const [activeTab, setActiveTab] = useState<"remote" | "trial">("remote");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionData, setConnectionData] = useState<ConnectionData>({
    name: "",
    type: DatabaseType.POSTGRESQL,
    host: "",
    port: undefined,
    username: "",
    password: "",
    database: "",
    createSandbox: true,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFilename, setSelectedFilename] = useState<string>("");

  // Database types supported by our backend
  const databaseTypes: DatabaseTypeOption[] = [
    {
      id: DatabaseType.POSTGRESQL,
      name: "PostgreSQL",
      icon: "🐘",
      description: "Advanced, enterprise-class open source database",
    },
    {
      id: DatabaseType.MYSQL,
      name: "MySQL",
      icon: "🐬",
      description: "Popular open source relational database",
    },
    {
      id: DatabaseType.SQLITE,
      name: "SQLite",
      icon: "🗃️",
      description: "Self-contained, serverless SQL database engine",
    },
    {
      id: DatabaseType.MONGODB,
      name: "MongoDB",
      icon: "🍃",
      description: "NoSQL document database",
    },
  ];

  // Sample trial databases
  const trialDatabases: DatabaseTypeOption[] = [
    {
      id: DatabaseType.POSTGRESQL,
      name: "E-Commerce Sample",
      icon: "🛒",
      description: "Sample database with products, customers, and orders.",
    },
    {
      id: DatabaseType.MYSQL,
      name: "HR Management",
      icon: "👥",
      description: "Employee management system with departments and roles.",
    },
    {
      id: DatabaseType.POSTGRESQL,
      name: "Blog Platform",
      icon: "📝",
      description: "Blog with users, posts, comments, and categories.",
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle port number conversion
    if (name === "port" && value) {
      setConnectionData((prev) => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setConnectionData((prev) => ({ ...prev, [name]: value }));
    }
    
    // Clear the file if database type changes
    if (name === "type" && value !== DatabaseType.SQLITE) {
      setConnectionData((prev) => ({ ...prev, file: undefined }));
      setSelectedFilename("");
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setConnectionData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setConnectionData((prev) => ({ ...prev, file }));
      setSelectedFilename(file.name);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate the form based on the database type
      if (connectionData.type === DatabaseType.SQLITE) {
        if (!connectionData.file && !connectionData.connectionString) {
          throw new Error("Please upload a SQLite database file or provide a connection string");
        }
      } else {
        if (!connectionData.host) {
          throw new Error("Host is required");
        }
        if (!connectionData.database) {
          throw new Error("Database name is required");
        }
      }

      if (!connectionData.name) {
        throw new Error("Connection name is required");
      }

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
      // Similar validation as submit
      if (connectionData.type === DatabaseType.SQLITE) {
        if (!connectionData.file && !connectionData.connectionString) {
          throw new Error("Please upload a SQLite database file or provide a connection string");
        }
      } else {
        if (!connectionData.host) {
          throw new Error("Host is required");
        }
        if (!connectionData.database) {
          throw new Error("Database name is required");
        }
      }

      // In a real app, this would make an API call to test the connection
      await fetch('http://localhost:3000/api/connections/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          type: connectionData.type,
          host: connectionData.host,
          port: connectionData.port,
          username: connectionData.username,
          password: connectionData.password,
          database: connectionData.database,
          connectionString: connectionData.connectionString
        })
      }).then(response => {
        if (!response.ok) {
          throw new Error('Connection test failed');
        }
        return response.json();
      });
      
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

  // Determine if we show file upload UI
  const showFileUpload = connectionData.type === DatabaseType.SQLITE;

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
              <label htmlFor="name">Connection Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={connectionData.name}
                onChange={handleInputChange}
                placeholder="My Database Connection"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="type">Database Type</label>
              <select
                id="type"
                name="type"
                value={connectionData.type}
                onChange={handleInputChange}
              >
                {databaseTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {showFileUpload ? (
              <>
                <div className={styles.formGroup}>
                  <label>SQLite Database File</label>
                  <div className={styles.fileUpload}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".db,.sqlite,.sqlite3"
                      style={{ display: 'none' }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={triggerFileInput}
                    >
                      Choose File
                    </Button>
                    <span className={styles.filename}>
                      {selectedFilename || "No file selected"}
                    </span>
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="connectionString">
                    Or Connection String (file path)
                  </label>
                  <input
                    type="text"
                    id="connectionString"
                    name="connectionString"
                    value={connectionData.connectionString || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., /path/to/database.db"
                  />
                </div>
              </>
            ) : (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="host">Host / Server</label>
                  <input
                    type="text"
                    id="host"
                    name="host"
                    value={connectionData.host || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., localhost or 192.168.1.1"
                    required={connectionData.type !== DatabaseType.SQLITE}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="port">Port</label>
                    <input
                      type="number"
                      id="port"
                      name="port"
                      value={connectionData.port || ""}
                      onChange={handleInputChange}
                      placeholder="e.g., 5432"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="database">Database Name</label>
                    <input
                      type="text"
                      id="database"
                      name="database"
                      value={connectionData.database || ""}
                      onChange={handleInputChange}
                      placeholder="e.g., mydb"
                      required={connectionData.type !== DatabaseType.SQLITE}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={connectionData.username || ""}
                    onChange={handleInputChange}
                    placeholder="Database username"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={connectionData.password || ""}
                    onChange={handleInputChange}
                    placeholder="Database password"
                  />
                </div>
              </>
            )}

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="createSandbox"
                  checked={connectionData.createSandbox}
                  onChange={handleCheckboxChange}
                />
                Create sandbox database (recommended for safe query execution)
              </label>
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
              <div className={styles.trialCard} key={db.name}>
                <div className={styles.trialIcon}>{db.icon}</div>
                <div className={styles.trialDetails}>
                  <h3>{db.name}</h3>
                  <p>{db.description}</p>
                </div>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => handleTrialSelect(db.name)}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Use This"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionForm;
