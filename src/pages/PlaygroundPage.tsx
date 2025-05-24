import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./PlaygroundPage.module.css";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import PromptInput from "../components/playground/PromptInput";
import SqlEditor from "../components/playground/SqlEditor";
import ResultsTable from "../components/playground/ResultsTable";
import DatabaseExplorer from "../components/playground/DatabaseExplorer";
import QueryHistory, { QueryHistoryItem } from "../components/playground/QueryHistory";
import Button from "../components/shared/Button";
import Modal, { ModalFooter } from "../components/shared/Modal";
import { useAuth } from "../contexts/AuthContext";
import { useDatabase } from "../contexts/DatabaseContext";
import usePlayground from "../hooks/usePlayground";
import { formatSql, isDmlQuery } from "../utils/sqlFormatter";
import playgroundService from "../services/playgroundService";
import { Playground, PlaygroundConnection } from "../services/playgroundService";

// Define interfaces for the playground data structure
interface PlaygroundItem {
  id: string;
  name: string;
  lastUsed?: Date;
  databaseName?: string;
}

interface ChatMessage {
  type: 'user' | 'assistant';
  content: string;
  query?: string;
  explanation?: string;
  results?: any[];
}

interface SqlGenerationResult {
  sql: string;
  explanation: string;
}

const PlaygroundPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connections, activeConnection, setActiveConnection, refreshSchema, loadConnections } = useDatabase();
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
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [activeTab, setActiveTab] = useState("sql"); // 'sql' or 'explanation'
  const actionsDropdownRef = useRef<HTMLDivElement>(null);

  // New state for chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
  const [sampleResults] = useState([]);
  
  // State for recent playgrounds to show in sidebar
  const [recentPlaygrounds, setRecentPlaygrounds] = useState<PlaygroundItem[]>([]);

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
  
  // Effect to fetch playgrounds for the sidebar
  useEffect(() => {
    const fetchPlaygrounds = async () => {
      try {
        const playgroundsData = await playgroundService.getPlaygrounds();
        // Sort by lastUpdated to show most recent first
        const sortedPlaygrounds = [...playgroundsData].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        
        setRecentPlaygrounds(sortedPlaygrounds.map(pg => ({
          id: pg.id,
          name: pg.name,
          lastUsed: new Date(pg.updatedAt),
          databaseName: pg.connections?.length > 0 
            ? pg.connections.map(conn => conn.connection.name).join(", ")
            : 'No database'
        })));
      } catch (error) {
        console.error('Error fetching playgrounds:', error);
      }
    };
    
    fetchPlaygrounds();
  }, [connections]);

  // Create a new playground
  const handleCreateNewPlayground = useCallback(() => {
    const newPlayground = createPlayground(
      "New Playground",
      activeConnection ? [activeConnection.id] : undefined
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
  const handleDatabaseChange = async (databaseId: string) => {
    if (playground && id) {
      try {
        // Find the database connection object by ID
        const connection = connections.find(conn => conn.id === databaseId);
        console.log('Changing to database:', connection);
        if (connection) {
          setIsLoadingSchema(true);
          setActiveConnection(connection);
          
          // Load the schema for the selected database if not already loaded
          try {
            if (!connection.schema || Object.keys(connection.schema).length === 0) {
              await refreshSchema();
              console.log('Schema loaded after database change:', connection.schema);
            } else {
              console.log('Using existing schema:', connection.schema);
            }
          } catch (error) {
            console.error('Error loading schema:', error);
          } finally {
            setIsLoadingSchema(false);
          }
        }
      } catch (error) {
        console.error('Error changing database:', error);
        setIsLoadingSchema(false);
      }
    }
  };

  // Effect to load connections when component mounts
  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Effect to load schema when active connection changes
  useEffect(() => {
    const loadSchema = async () => {
      if (activeConnection && (!activeConnection.schema || Object.keys(activeConnection.schema).length === 0)) {
        console.log('Loading schema for connection:', activeConnection);
        setIsLoadingSchema(true);
        try {
          await refreshSchema();
          console.log('Schema loaded successfully:', activeConnection.schema);
        } catch (error) {
          console.error('Error loading schema:', error);
        } finally {
          setIsLoadingSchema(false);
        }
      } else if (activeConnection?.schema) {
        console.log('Using existing schema:', activeConnection.schema);
      }
    };

    loadSchema();
  }, [activeConnection, refreshSchema]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle prompt submission
  const handlePromptSubmit = async () => {
    if (!prompt.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: prompt }]);
    const currentPrompt = prompt;
    setPrompt('');

    try {
      // Generate SQL from prompt
      await generateSqlFromPrompt(currentPrompt);
      
      // Add assistant message with query and explanation
      if (playground?.currentSql && playground?.currentExplanation) {
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: 'Here\'s the SQL query based on your request:',
          query: playground.currentSql,
          explanation: playground.currentExplanation
        }]);
      }
    } catch (error) {
      console.error('Error generating SQL:', error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: 'Sorry, I encountered an error while generating the SQL query.'
      }]);
    }
  };

  // Handle query execution
  const handleExecuteQuery = async (query: string) => {
    try {
      setCurrentSql(query);
      await executeQuery();
      
      if (queryResults) {
        // Add results message
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: 'Query executed successfully:',
          results: queryResults
        }]);
      }
    } catch (error) {
      console.error('Error executing query:', error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: 'Error executing query: ' + (error as Error).message
      }]);
    }
  };

  // Handle copy query
  const handleCopyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
    // You might want to show a toast notification here
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
      if (
        actionsDropdownRef.current &&
        !actionsDropdownRef.current.contains(event.target as Node) &&
        isActionsDropdownOpen
      ) {
        setIsActionsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActionsDropdownOpen]);

  // Add a function to get active connections for the current playground
  const getPlaygroundConnections = useCallback(() => {
    if (!playground) return [];
    return playground.connections?.map(conn => conn.connection) || [];
  }, [playground]);

  // Handle playground deletion
  const handleDeletePlayground = async () => {
    if (!id) return;
    
    try {
      const success = await playgroundService.deletePlayground(id);
      if (success) {
        navigate("/");
      } else {
        console.error("Failed to delete playground");
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error("Error deleting playground:", error);
      // You might want to show an error message to the user here
    }
    setIsDeleteModalOpen(false);
  };

  // Update the condition to check for active connection
  const noConnection = !activeConnection || !playground?.connections.length;

  return (
    <div className={styles.playgroundPage}>
      <Navbar
        user={user ? { name: user.name, avatarUrl: user.avatarUrl || undefined } : undefined}
        onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
        isSidebarVisible={isSidebarVisible}
        onCreatePlayground={handleCreateNewPlayground}
        appName="SQL Playground"
      />

      <div className={styles.mainContainer}>
        {isSidebarVisible && (
          <Sidebar
            isVisible={isSidebarVisible}
            playgrounds={recentPlaygrounds.map((pg) => ({
              id: pg.id,
              name: pg.name,
              lastUpdated: pg.lastUsed || new Date(),
              isActive: id === pg.id,
            }))}
            databases={connections.map((conn) => ({
              id: conn.id,
              name: conn.name,
              status: conn.status,
            }))}
            onPlaygroundClick={(id) => navigate(`/playground/${id}`)}
            onCreatePlayground={handleCreateNewPlayground}
            onDatabaseClick={(id) => {
              const connection = connections.find(conn => conn.id === id);
              if (connection) {
                setActiveConnection(connection);
              }
            }}
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

              <div className={styles.actionsDropdown} ref={actionsDropdownRef}>
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

          {noConnection ? (
            <div className={styles.noConnectionState}>
              <div className={styles.noConnectionIcon}>🔌</div>
              <h2>No Database Connected</h2>
              <p>Connect to a database to start building SQL queries</p>
              <Button variant="primary" onClick={() => navigate("/databases")}>
                Connect Database
              </Button>
            </div>
          ) : (
            <div className={styles.mainSection}>
              {isDbExplorerVisible && (
                <div className={styles.databaseExplorerContainer}>
                  {isLoadingSchema ? (
                    <div className={styles.loadingState}>
                      <div className={styles.spinner}></div>
                      <p>Loading database schema...</p>
                    </div>
                  ) : (
                    <DatabaseExplorer
                      databases={connections.map(connection => {
                        console.log('Mapping connection:', connection.name, 'Schema:', connection.schema);
                        return {
                          id: connection.id,
                          name: connection.name,
                          type: connection.type,
                          status: connection.status,
                          tables: connection.schema?.tables || [],
                          views: connection.schema?.views || [],
                        };
                      })}
                      activeDatabase={activeConnection?.id || ''}
                      onDatabaseChange={handleDatabaseChange}
                      onTableSelect={(tableName) => {
                        const table = activeConnection?.schema?.tables.find(
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
                          setCurrentSql(
                            `SELECT ${tableName}.${columnName}\nFROM ${tableName}\nLIMIT 100;`
                          );
                        }
                      }}
                    />
                  )}
                </div>
              )}

              <div className={styles.chatContainer} ref={chatContainerRef}>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`${styles.messageBox} ${
                      message.type === 'user' ? styles.userMessage : styles.assistantMessage
                    }`}
                  >
                    <div>{message.content}</div>
                    
                    {message.query && (
                      <div className={styles.queryBox}>
                        <div className={styles.queryHeader}>
                          <span>Generated SQL</span>
                          <div className={styles.queryActions}>
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => handleCopyQuery(message.query!)}
                            >
                              Copy
                            </Button>
                            <Button
                              variant="primary"
                              size="small"
                              onClick={() => handleExecuteQuery(message.query!)}
                            >
                              Execute
                            </Button>
                          </div>
                        </div>
                        <pre className={styles.queryContent}>{message.query}</pre>
                      </div>
                    )}
                    
                    {message.explanation && (
                      <div className={styles.explanationBox}>
                        {message.explanation}
                      </div>
                    )}
                    
                    {message.results && (
                      <div className={styles.resultsBox}>
                        <div className={styles.resultsPreview}>
                          {/* Show a preview of the results */}
                          {message.results.length} rows returned
                        </div>
                        <button
                          className={styles.expandButton}
                          onClick={() => {/* Handle expand to modal */}}
                        >
                          View Full Results
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className={styles.inputContainer}>
                <div className={styles.inputWrapper}>
                  <textarea
                    className={styles.promptInput}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to query in natural language..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePromptSubmit();
                      }
                    }}
                  />
                  <button
                    className={styles.sendButton}
                    onClick={handlePromptSubmit}
                    disabled={!prompt.trim() || isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Send'}
                  </button>
                </div>
              </div>
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
            onConfirm={handleDeletePlayground}
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
