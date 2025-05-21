import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./PlaygroundPage.module.css";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import PromptInput from "../components/playground/PromptInput";
import SqlEditor from "../components/playground/SqlEditor";
import ResultsTable from "../components/playground/ResultsTable";
import DatabaseExplorer from "../components/playground/DatabaseExplorer";
import QueryHistory from "../components/playground/QueryHistory";
import Button from "../components/shared/Button";
import Modal, { ModalFooter } from "../components/shared/Modal";
import { useAuth } from "../contexts/AuthContext";
import { useDatabase } from "../contexts/DatabaseContext";
import usePlayground from "../hooks/usePlayground";
import { formatSql, isDmlQuery } from "../utils/sqlFormatter";

const PlaygroundPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connections, activeConnection, setActiveConnection } = useDatabase();
  const {
    playground,
    createPlayground,
    savePlayground,
    executeQuery,
    generateSqlFromPrompt,
    setCurrentSql,
    isExecuting,
    isGenerating,
    queryResults,
    error,
    clearHistory,
    selectHistoryItem,
  } = usePlayground(id);

  // UI state
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isDbExplorerVisible, setIsDbExplorerVisible] = useState(true);
  const [activeTab, setActiveTab] = useState("sql"); // 'sql' or 'explanation'

  const results = [
    {
      id: 1,
      product_name: "Smartphone X",
      category: "Electronics",
      price: 899.99,
      stock: 45,
      rating: 4.8,
    },
    {
      id: 2,
      product_name: "Wireless Headphones",
      category: "Electronics",
      price: 159.99,
      stock: 78,
      rating: 4.5,
    },
    {
      id: 3,
      product_name: "Coffee Maker",
      category: "Home & Kitchen",
      price: 89.99,
      stock: 32,
      rating: 4.2,
    },
    {
      id: 4,
      product_name: "Running Shoes",
      category: "Footwear",
      price: 129.99,
      stock: 56,
      rating: 4.7,
    },
    {
      id: 5,
      product_name: "Smart Watch",
      category: "Electronics",
      price: 249.99,
      stock: 23,
      rating: 4.6,
    },
    {
      id: 6,
      product_name: "Backpack",
      category: "Accessories",
      price: 59.99,
      stock: 98,
      rating: 4.4,
    },
    {
      id: 7,
      product_name: "Bluetooth Speaker",
      category: "Electronics",
      price: 79.99,
      stock: 41,
      rating: 4.3,
    },
    {
      id: 8,
      product_name: "Yoga Mat",
      category: "Fitness",
      price: 29.99,
      stock: 120,
      rating: 4.1,
    },
    {
      id: 9,
      product_name: "Sunglasses",
      category: "Accessories",
      price: 149.99,
      stock: 37,
      rating: 4.4,
    },
    {
      id: 10,
      product_name: "Water Bottle",
      category: "Fitness",
      price: 19.99,
      stock: 145,
      rating: 4.0,
    },
  ];

  // Add sample data for testing
  const [sampleResults, setSampleResults] = useState(results);

  // Example prompts for the prompt input
  const examplePrompts = [
    {
      text: "Show me all customers who made purchases in the last month",
      description: "Finds recent customers",
    },
    {
      text: "List top 10 products by sales volume",
      description: "Sales performance analysis",
    },
    {
      text: "Find employees with salary greater than $50,000",
      description: "HR data query",
    },
    {
      text: "Show blog posts with more than 5 comments",
      description: "Content engagement analysis",
    },
    {
      text: "Get orders with total value over $1000",
      description: "High-value orders",
    },
    {
      text: "Find products with less than 10 items in stock",
      description: "Low inventory alert",
    },
  ];

  // Effect to create a new playground if no ID is provided
  useEffect(() => {
    if (!id && !playground) {
      handleCreateNewPlayground();
    }
  }, [id, playground]);

  // Create a new playground
  const handleCreateNewPlayground = useCallback(() => {
    const newPlayground = createPlayground(
      "New Playground",
      activeConnection?.id || null
    );
    navigate(`/playground/${newPlayground.id}`);
  }, [createPlayground, activeConnection, navigate]);

  // Save playground name on rename
  const handleSaveName = () => {
    if (playground && newName.trim()) {
      savePlayground({ name: newName.trim() });
      setIsRenaming(false);
    }
  };

  // Start renaming the playground
  const handleStartRename = () => {
    if (playground) {
      setNewName(playground.name);
      setIsRenaming(true);
    }
  };

  // Handle database change
  const handleDatabaseChange = (databaseId: string) => {
    if (playground) {
      savePlayground({ databaseId });
      setActiveConnection(databaseId);
    }
  };

  // Handle query execution
  const handleExecuteQuery = async () => {
    await executeQuery();
  };

  // Handle SQL generation from prompt
  const handleGenerateSql = async (prompt: string) => {
    await generateSqlFromPrompt(prompt);
  };

  // Handle SQL editor changes
  const handleSqlChange = (sql: string) => {
    setCurrentSql(sql);
  };

  // Mock SQL and explanation for testing
  const mockSql =
    "SELECT name, category, price\nFROM products\nWHERE price > 50\nORDER BY price DESC;";
  const mockExplanation =
    "This query selects all products with a price greater than $50, ordered by price in descending order. It returns the product name, category, and price columns.";

  // Handle exporting data
  const handleExportData = (format: "json" | "csv" | "xml") => {
    // This is just for UI testing - normally you'd use exportUtils here
    const data = queryResults || sampleResults;

    // Create a simple download simulation
    const element = document.createElement("a");

    let content = "";
    let filename = "";
    let type = "";

    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      filename = "query-results.json";
      type = "application/json";
    } else if (format === "csv") {
      // Create CSV content
      const headers = Object.keys(data[0]).join(",");
      const rows = data.map((item) => Object.values(item).join(","));
      content = [headers, ...rows].join("\n");
      filename = "query-results.csv";
      type = "text/csv";
    } else if (format === "xml") {
      // Create simple XML content
      content = `<results>\n${data
        .map(
          (item) =>
            `  <result>\n${Object.entries(item)
              .map(([key, value]) => `    <${key}>${value}</${key}>`)
              .join("\n")}\n  </result>`
        )
        .join("\n")}\n</results>`;
      filename = "query-results.xml";
      type = "application/xml";
    }

    const blob = new Blob([content], { type });
    element.href = URL.createObjectURL(blob);
    element.download = filename;

    // Simulate download
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    console.log(`Exporting data as ${format}`);
  };

  // Toggle panels
  const toggleHistory = () => {
    setIsHistoryVisible(!isHistoryVisible);
  };

  const toggleDatabaseExplorer = () => {
    setIsDbExplorerVisible(!isDbExplorerVisible);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isActionsDropdownOpen) {
        setIsActionsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActionsDropdownOpen]);

  return (
    <div className={styles.playgroundPage}>
      <Navbar
        user={user ? { name: user.name, avatarUrl: user.avatarUrl } : undefined}
        onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
        isSidebarVisible={isSidebarVisible}
        onCreatePlayground={handleCreateNewPlayground}
        appName="SQL Playground"
      />

      <div className={styles.mainContainer}>
        {isSidebarVisible && (
          <Sidebar
            isVisible={isSidebarVisible}
            playgrounds={connections.map((conn) => ({
              id: conn.id,
              name: conn.name,
              lastUpdated: conn.lastConnected || new Date(),
              isActive: activeConnection?.id === conn.id,
            }))}
            databases={connections.map((conn) => ({
              id: conn.id,
              name: conn.name,
              status: conn.status,
            }))}
            onPlaygroundClick={() => {}}
            onCreatePlayground={handleCreateNewPlayground}
            onDatabaseClick={(id) => setActiveConnection(id)}
            onConnectDatabase={() => navigate("/databases")}
            onCollapse={() => setIsSidebarVisible(false)}
          />
        )}

        <div className={styles.playgroundContent}>
          <div className={styles.playgroundHeader}>
            <div className={styles.headerLeft}>
              {isRenaming ? (
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  className={styles.editNameInput}
                  autoFocus
                />
              ) : (
                <div
                  className={styles.playgroundName}
                  onClick={handleStartRename}
                >
                  <span className={styles.playgroundIcon}>📝</span>
                  {playground?.name || "New Playground"}
                </div>
              )}

              <div className={styles.databaseInfo}>
                {activeConnection ? (
                  <>
                    <span
                      className={`${styles.databaseStatus} ${
                        styles[activeConnection.status]
                      }`}
                    ></span>
                    {activeConnection.name}
                  </>
                ) : (
                  "No database connected"
                )}
              </div>
            </div>

            <div className={styles.headerRight}>
              {!activeConnection && (
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => navigate("/databases")}
                >
                  Connect Database
                </Button>
              )}

              {activeConnection && (
                <select
                  value={activeConnection.id}
                  onChange={(e) => handleDatabaseChange(e.target.value)}
                  className={styles.databaseSelector}
                >
                  {connections.map((connection) => (
                    <option key={connection.id} value={connection.id}>
                      {connection.name}
                    </option>
                  ))}
                </select>
              )}

              <div className={styles.actionsDropdown}>
                <button
                  className={styles.actionsButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsActionsDropdownOpen(!isActionsDropdownOpen);
                  }}
                >
                  Actions {isActionsDropdownOpen ? "▲" : "▼"}
                </button>

                {isActionsDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <div
                      className={styles.dropdownItem}
                      onClick={() => {
                        toggleDatabaseExplorer();
                        setIsActionsDropdownOpen(false);
                      }}
                    >
                      {isDbExplorerVisible ? "Hide" : "Show"} Database Explorer
                    </div>
                    <div
                      className={styles.dropdownItem}
                      onClick={() => {
                        toggleHistory();
                        setIsActionsDropdownOpen(false);
                      }}
                    >
                      {isHistoryVisible ? "Hide" : "Show"} Query History
                    </div>
                    <div className={styles.dropdownDivider}></div>
                    <div
                      className={styles.dropdownItem + " " + styles.dangerItem}
                      onClick={() => {
                        setIsDeleteModalOpen(true);
                        setIsActionsDropdownOpen(false);
                      }}
                    >
                      Delete Playground
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!activeConnection ? (
            <div className={styles.noConnectionState}>
              <div className={styles.noConnectionIcon}>🔌</div>
              <h2>No Database Connected</h2>
              <p>Connect to a database to start building SQL queries</p>
              <Button variant="primary" onClick={() => navigate("/databases")}>
                Connect Database
              </Button>
            </div>
          ) : (
            <div className={styles.playgroundLayout}>
              {isDbExplorerVisible && activeConnection?.schema && (
                <div className={styles.databaseExplorerContainer}>
                  <DatabaseExplorer
                    databases={[
                      {
                        id: activeConnection.id,
                        name: activeConnection.name,
                        tables: activeConnection.schema.tables || [],
                        views: activeConnection.schema.views || [],
                      },
                    ]}
                    activeDatabase={activeConnection.id}
                    onDatabaseChange={(id) => setActiveConnection(id)}
                    onTableSelect={(tableName) => {
                      const table = activeConnection.schema?.tables.find(
                        (t) => t.name === tableName
                      );
                      if (table) {
                        const columns = table.columns
                          .map((c) => c.name)
                          .join(", ");
                        const sql = `SELECT ${columns}\nFROM ${tableName}\nLIMIT 100;`;
                        setCurrentSql(formatSql(sql));
                      }
                    }}
                    onColumnSelect={(tableName, columnName) => {
                      const currentSql = playground?.currentSql || "";
                      if (!currentSql.includes(columnName)) {
                        // This is a simple way to add a column to the query
                        // In a real app, you'd want to use a SQL parser to update the query properly
                        setCurrentSql(
                          `SELECT ${tableName}.${columnName}\nFROM ${tableName}\nLIMIT 100;`
                        );
                      }
                    }}
                  />
                </div>
              )}

              <div className={styles.mainSection}>
                <div className={styles.promptSection}>
                  <h2 className={styles.sectionTitle}>
                    Generate SQL from Natural Language
                  </h2>
                  <PromptInput
                    onGenerateQuery={handleGenerateSql}
                    isLoading={isGenerating}
                    placeholderText="Describe what you want to query in natural language..."
                    recentPrompts={
                      playground?.history
                        .slice(0, 3)
                        .map((item) => item.prompt) || []
                    }
                    examplePrompts={examplePrompts}
                  />
                </div>

                <div className={styles.splitView}>
                  <div className={styles.editorSection}>
                    <div className={styles.sectionHeader}>
                      <div className={styles.sqlTabs}>
                        <button
                          className={`${styles.sqlTab} ${
                            activeTab === "sql" ? styles.active : ""
                          }`}
                          onClick={() => setActiveTab("sql")}
                        >
                          Generated SQL
                        </button>
                        {(playground?.currentExplanation ||
                          mockExplanation) && (
                          <button
                            className={`${styles.sqlTab} ${
                              activeTab === "explanation" ? styles.active : ""
                            }`}
                            onClick={() => setActiveTab("explanation")}
                          >
                            Explanation
                          </button>
                        )}
                      </div>
                      {/* <Button
                        variant="primary"
                        size="small"
                        onClick={handleExecuteQuery}
                        disabled={
                          isExecuting || (!playground?.currentSql && !mockSql)
                        }
                      >
                        {isExecuting ? "Executing..." : "Execute Query"}
                      </Button> */}
                    </div>
                    <div className={styles.sqlEditorWrapper}>
                      {activeTab === "sql" ? (
                        <SqlEditor
                          sql={playground?.currentSql || mockSql}
                          onChange={handleSqlChange}
                          onExecute={handleExecuteQuery}
                          explanation={
                            playground?.currentExplanation || mockExplanation
                          }
                          isLoading={isExecuting}
                          isDmlQuery={isDmlQuery(
                            playground?.currentSql || mockSql
                          )}
                        />
                      ) : (
                        <div className={styles.explanationContainer}>
                          {playground?.currentExplanation ||
                            mockExplanation ||
                            "No explanation available for this query."}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.resultsSection}>
                    <ResultsTable
                      data={queryResults || sampleResults}
                      isLoading={isExecuting}
                      error={playground?.currentSql ? error : null}
                      onExportData={handleExportData}
                    />
                  </div>
                </div>
              </div>

              {isHistoryVisible && (
                <div className={styles.historyContainer}>
                  <QueryHistory
                    history={playground?.history || []}
                    onSelectQuery={selectHistoryItem}
                    onClearHistory={clearHistory}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Playground Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Playground"
        size="small"
        footer={
          <ModalFooter
            cancelText="Cancel"
            confirmText="Delete"
            onCancel={() => setIsDeleteModalOpen(false)}
            onConfirm={() => {
              // Delete the playground and navigate back
              navigate("/");
              setIsDeleteModalOpen(false);
            }}
            confirmVariant="danger"
          />
        }
      >
        <div className={styles.deleteModalContent}>
          <div className={styles.warningIcon}>⚠️</div>
          <p>Are you sure you want to delete this playground?</p>
          <p>
            This action cannot be undone. All queries and history will be lost.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default PlaygroundPage;
