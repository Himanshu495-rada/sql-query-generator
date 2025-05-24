import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./PlaygroundPage.module.css";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import DatabaseExplorer from "../components/playground/DatabaseExplorer";
import Button from "../components/shared/Button";
import Modal, { ModalFooter } from "../components/shared/Modal";
import { useAuth } from "../contexts/AuthContext";
import { useDatabase } from "../contexts/DatabaseContext";
import usePlayground from "../hooks/usePlayground";
import { formatSql } from "../utils/sqlFormatter";
import playgroundService from "../services/playgroundService";
import queryService, { GenerateQueryPayload, ParsedSqlData } from '../services/queryService';
import { FiCopy, FiPlay, FiMaximize2 } from 'react-icons/fi';
import { chatMessageService, ChatMessage as ApiChatMessage } from '../services/chatMessageService';

// Define interfaces for the playground data structure
interface PlaygroundItem {
  id: string;
  name: string;
  lastUsed?: Date;
  databaseName?: string;
}

interface SqlGenerationResult {
  sql: string;
  explanation: string;
}

// Utility to extract plain SQL (remove comments, normalize whitespace)
function extractSQL(text: string): string {
  return text
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Local loading state for API call from chat
  const [isApiGenerating, setIsApiGenerating] = useState(false);


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

  // New state for expanded result
  const [expandedResult, setExpandedResult] = useState<any[] | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

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

  // Fetch all chat messages for the playground on load
  useEffect(() => {
    if (id) {
      chatMessageService.getAllForPlayground(id)
        .then(setMessages)
        .catch((err) => {
          console.error('Failed to fetch chat messages:', err);
          setMessages([]);
        });
    }
  }, [id]);

  // Update handlePromptSubmit to use chatMessageService for optimistic user message
  const handlePromptSubmit = async () => {
    if (!prompt.trim() || isApiGenerating || isGenerating) return;

    if (!id || !activeConnection?.id || !user?.id) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        playgroundId: id || '',
        userId: user?.id || '',
        sender: 'ai',
        message: 'Error: Playground ID, Active Connection ID, or User ID is missing to generate SQL.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]);
      setIsApiGenerating(false);
      return;
    }

    // Optimistically add user message
    const userMessage: ApiChatMessage = {
      id: `user-${Date.now()}`,
      playgroundId: id,
      userId: user.id,
      sender: 'user',
      message: prompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt('');
    setIsApiGenerating(true);

    const payload: GenerateQueryPayload = {
      prompt: currentPrompt,
      playgroundId: id,
      connectionId: activeConnection.id,
    };

    try {
      const response = await queryService.generateQuery(payload);
      if (!response.success || !response.data || !response.data.query) {
        throw new Error(response.message || 'API returned unsuccessful response or missing data.');
      }
      // After backend processes, refetch all chat messages for the playground
      const updatedMessages = await chatMessageService.getAllForPlayground(id);
      setMessages(updatedMessages);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        playgroundId: id,
        userId: user.id,
        sender: 'ai',
        message: error.message || 'An unknown error occurred.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]);
    }
    setIsApiGenerating(false);
  };

  // Handle query execution
  const handleExecuteQuery = async (sql: string) => {
    const lastAiMsg = [...messages].reverse().find(m => m.sender === 'ai' && m.sql && m.queryId);
    if (!lastAiMsg || !lastAiMsg.queryId) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        playgroundId: id || '',
        userId: user?.id || '',
        sender: 'ai',
        message: 'No valid queryId found for execution. Please generate a query first.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]);
      return;
    }
    try {
      setCurrentSql(sql);
      setIsApiGenerating(true);
      // Parse the sql if it's JSON-wrapped
      let sqlToExecute = sql;
      if (typeof sql === 'string') {
        let trimmed = sql.trim();
        if (trimmed.startsWith('json')) {
          trimmed = trimmed.replace(/^json\s*/, '');
        }
        if (trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.query) sqlToExecute = parsed.query;
          } catch (e) {
            // fallback: use as-is
          }
        }
        // Always clean the SQL before sending
        sqlToExecute = extractSQL(sqlToExecute);
      }
      const response = await queryService.executeQuery(lastAiMsg.queryId, sqlToExecute);
      // Extract rows from response
      let resultRows: any[] = [];
      if (response.data?.query?.result?.rows && Array.isArray(response.data.query.result.rows)) {
        resultRows = response.data.query.result.rows;
      } else if (Array.isArray(response.data?.query?.result)) {
        resultRows = response.data.query.result;
      }
      // Add result message to chat
      const resultMsg: ApiChatMessage = {
        id: `result-${Date.now()}`,
        playgroundId: id || '',
        userId: user?.id || '',
        sender: 'ai',
        message: 'Query executed successfully.',
        sql: sqlToExecute,
        results: resultRows,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, resultMsg]);
      // Save result message in backend chat
      await chatMessageService.addMessage({
        playgroundId: id!,
        userId: user!.id,
        sender: 'ai',
        message: 'Query executed successfully.',
        sql: sqlToExecute,
        queryId: lastAiMsg.queryId,
        results: resultRows,
      });
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        playgroundId: id || '',
        userId: user?.id || '',
        sender: 'ai',
        message: 'Error executing query: ' + (error as Error).message,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]);
    } finally {
      setIsApiGenerating(false);
    }
  };

  // Handle copy query
  const handleCopyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
    // You might want to show a toast notification here
  };

  // Handle exporting data
  const handleExportData = (format: "json" | "csv" | "xml", dataToExport?: any[]) => {
    const data = dataToExport || queryResults || sampleResults; // Use passed data, fallback to hook's queryResults or sample

    if (!data || data.length === 0) {
      console.warn("No data available to export.");
      // Optionally, show a user-facing message here
      alert("No results to export.");
      return;
    }

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
                      className={`${styles.databaseStatus} ${styles[activeConnection.status]
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
              {/* Chat Area Start */}
              <div className={styles.chatContainer} ref={chatContainerRef}>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`${styles.messageBox} ${message.sender === 'user' ? styles.userMessage : styles.assistantMessage}`}
                  >
                    <div>{message.message}</div>

                    {message.sql && (
                      <div className={styles.queryBox}>
                        <div className={styles.queryHeader}>
                          <span>Generated SQL</span>
                          <div className={styles.queryActions}>
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => handleCopyQuery(message.sql!)}
                            >
                              <FiCopy className={styles.icon} /> Copy
                            </Button>
                            <Button
                        variant="primary"
                        size="small"
                              onClick={() => handleExecuteQuery(message.sql!)}
                              disabled={isExecuting || noConnection} 
                            >
                              <FiPlay className={styles.icon} /> Execute
                            </Button>
                          </div>
                        </div>
                        <pre className={styles.queryContent}>{message.sql}</pre>
                    </div>
                    )}

                    {message.results && Array.isArray(message.results) && message.results.length > 0 && (
                      <div className={styles.resultsBox}>
                        <div className={styles.resultsHeader}>
                          <span>Results ({message.results.length} rows)</span>
                          <div className={styles.resultsActions}>
                            <Button size="small" onClick={() => { setExpandedResult(message.results || []); setIsResultModalOpen(true); }}>
                              <FiMaximize2 className={styles.icon} /> Expand
                            </Button>
                            <Button size="small" onClick={() => handleExportData('json', message.results)}>
                              Export JSON
                            </Button>
                            <Button size="small" onClick={() => handleExportData('csv', message.results)}>
                              Export CSV
                            </Button>
                            <Button size="small" onClick={() => handleExportData('xml', message.results)}>
                              Export XML
                            </Button>
                          </div>
                        </div>
                        <div className={styles.resultsTableWrapper}>
                          <table className={styles.resultsTable}>
                            <thead>
                              <tr>
                                {Object.keys(message.results[0]).map((col) => (
                                  <th key={col}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {message.results.map((row, i) => (
                                <tr key={i}>
                                  {Object.values(row).map((val, j) => (
                                    <td key={j}>{String(val)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        </div>
                      )}
                  </div>
                ))}
                {isGenerating && (
                    <div className={`${styles.messageBox} ${styles.assistantMessage} ${styles.typingIndicatorContainer} /* Ensure these styles are defined */`}>
                         <p className={styles.typingIndicator}>AI is thinking...</p>
                    </div>
                )}
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
                      rows={3}
                    />
                    <Button
                      className={styles.sendButton}
                      onClick={handlePromptSubmit}
                      disabled={!prompt.trim() || isApiGenerating || isGenerating}
                      variant="primary"
                    >
                      {isApiGenerating || isGenerating ? 'Generating...' : 'Send'}
                    </Button>
                  </div>
                </div>
              </div>
              {/* Chat Area End */}
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

      {/* Modal for expanded results */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title="Query Results"
        size="large"
      >
        {expandedResult && expandedResult.length > 0 ? (
          <div className={styles.resultsTableWrapper}>
            <table className={styles.resultsTable}>
              <thead>
                <tr>
                  {Object.keys(expandedResult[0]).map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expandedResult.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j}>{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>No results to display.</div>
        )}
        <div className={styles.resultsModalActions}>
          <Button onClick={() => handleExportData('json', expandedResult || undefined)}>Export JSON</Button>
          <Button onClick={() => handleExportData('csv', expandedResult || undefined)}>Export CSV</Button>
          <Button onClick={() => handleExportData('xml', expandedResult || undefined)}>Export XML</Button>
        </div>
      </Modal>
    </div>
  );
};

export default PlaygroundPage;
