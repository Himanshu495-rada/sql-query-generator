import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../contexts/DatabaseContext';
import Navbar from '../components/shared/Navbar';
import Sidebar from '../components/shared/Sidebar';
import Button from '../components/shared/Button';
import styles from './ChatPage.module.css';
import authService from '../services/authService';
import queryService, { ApiQueryResponseData, GenerateQueryApiResponse, ParsedSqlData } from '../services/queryService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  sql?: string;
  timestamp: Date;
  queryData?: any;
  isError?: boolean;
}

const ChatPage: React.FC = () => {
  const { templateType } = useParams<{ templateType: string }>();
  const { user } = useAuth();
  const { connections, loadConnections, isLoading: isDbLoading } = useDatabase();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); // Default to false for chat page
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    // Set an initial message based on templateType or a generic welcome
    let initialText = "How can I help you today?";
    if (templateType === 'generate-sql') {
      initialText = "I'm ready to help you generate SQL from text. Describe what you need!";
    } else if (templateType === 'optimize-sql') {
      initialText = "Paste your SQL query, and I'll help you optimize it.";
    } else if (templateType === 'explain-sql') {
      initialText = "Need an SQL query explained? Paste it here, and I'll break it down for you.";
    }

    setMessages([
      {
        id: 'initial-ai-message',
        text: initialText,
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);
  }, [templateType]);
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedDatabaseId) return;

    const newMessages: Message[] = [
      ...messages,
      { id: String(messages.length + 1), text: inputValue, sender: 'user', timestamp: new Date() },
    ];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare payload for chat-based query generation
      const payload = {
        prompt: inputValue,
        connectionId: selectedDatabaseId,
        enforceDQL: true, // Enforce DQL for chat page
        // playgroundId is intentionally omitted for chat context
      };

      const response: GenerateQueryApiResponse = await queryService.generateQuery(payload);
      console.log('API Response in ChatPage:', response);

      if (response.data?.query) {
        const aiResponse: ApiQueryResponseData = response.data.query;
        
        let finalSql = '';
        let finalExplanation = ""; // Default explanation

        if (aiResponse.sqlQuery && typeof aiResponse.sqlQuery === 'string') {
          let jsonStringInSql = aiResponse.sqlQuery.trim();
          if (jsonStringInSql.startsWith('```json')) {
            jsonStringInSql = jsonStringInSql.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (jsonStringInSql.startsWith('json')) {
            jsonStringInSql = jsonStringInSql.replace(/^json\s*/, '');
          }
          try {
            const processedForJsonParse = jsonStringInSql.replace(/"\s*\+\s*"/g, "");
            const parsedSqlData: ParsedSqlData = JSON.parse(processedForJsonParse);
            finalSql = parsedSqlData.query || '';
            finalExplanation = parsedSqlData.explanation || aiResponse.explanation || 'No detailed explanation provided.';
          } catch (parseError) {
            console.warn('ChatPage: Failed to parse inner JSON from sqlQuery, attempting fallback:', parseError);
            const sqlMatch = aiResponse.sqlQuery.match(/```(?:sql)?\s*([\s\S]*?)\s*```/);
            if (sqlMatch && sqlMatch[1]) {
              finalSql = sqlMatch[1].trim();
            } else if (!aiResponse.sqlQuery.includes('json') && !aiResponse.sqlQuery.includes('{')) { 
              finalSql = aiResponse.sqlQuery.trim(); 
            }
            // Keep the original explanation if SQL parsing failed but an explanation exists
            finalExplanation = aiResponse.explanation || 'Could not parse SQL details, using original explanation if available.';
            if (!finalSql && !jsonStringInSql.includes('{')) finalSql = jsonStringInSql; 
          }
        } else if (aiResponse.sqlQuery) {
          // Fallback if sqlQuery is not a string but exists (e.g. already parsed object - less likely from backend)
          finalSql = String(aiResponse.sqlQuery);
        }

        const displayQuery = finalSql || 'No SQL query generated.';
        const displayExplanation = finalExplanation;

        // Add AI's response to messages
        // Ensure explanation is also displayed, perhaps formatted differently
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: String(prevMessages.length + 1),
            text: `Explanation: ${displayExplanation}`,
            sql: displayQuery,
            sender: 'ai',
            queryData: aiResponse, 
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error('Failed to generate SQL query or response structure is not as expected.');
      }
    } catch (error: any) {
      console.error('Failed to send message or generate SQL:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred.';
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: String(prevMessages.length + 1),
          text: `Error: ${errorMessage}`,
          sender: 'ai',
          isError: true,
          timestamp: new Date(),
        },
      ]);
    }
    setIsLoading(false);
  };

  const handleCopySql = (sql: string) => {
    navigator.clipboard.writeText(sql).then(() => {
      // Maybe show a toast notification: "SQL copied!"
      console.log('SQL copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy SQL: ', err);
    });
  };
  
  const handleRunSql = (sql: string) => {
    // Placeholder for running SQL. 
    // This would likely navigate to a playground or execute directly 
    // if a database is selected and an execution service exists.
    console.log('Running SQL:', sql, 'on database:', selectedDatabaseId);
    alert('Run SQL functionality is not yet implemented.');
  };

  const formatPageTitle = () => {
    if (!templateType) return 'Chat';
    return templateType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className={styles.chatPage}>
      <Navbar
        user={user ? { name: user.name, avatarUrl: user.avatarUrl || undefined } : undefined}
        onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
        isSidebarVisible={isSidebarVisible}
        appName={formatPageTitle()}
        // Add other Navbar props if needed, like onLogout, onSettingsClick
        onLogout={() => { authService.logout(); navigate('/login');}}
        onSettingsClick={() => navigate('/settings')}
      />
      <div className={styles.mainContainer}>
        {isSidebarVisible && (
            <Sidebar
                isVisible={isSidebarVisible}
                // Pass necessary props to Sidebar, e.g., playgrounds, databases
                // For now, keeping it simple or using Dashboard's approach
                playgrounds={[]}
                databases={connections || []}
                onPlaygroundClick={(id) => navigate(`/playground/${id}`)}
                onCreatePlayground={() => navigate('/playground')} // Or open a modal
                onDatabaseClick={(id) => console.log('DB clicked:', id)} // Or navigate to DB details
                onConnectDatabase={() => navigate('/databases')}
                onCollapse={() => setIsSidebarVisible(false)}
            />
        )}
        <div className={styles.chatArea}>
          <div className={styles.messageList}>
            {messages.map((msg) => (
              <div key={msg.id} className={`${styles.messageBubble} ${msg.sender === 'user' ? styles.userMessage : styles.aiMessage}`}>
                <div className={styles.messageSenderInfo}>
                  <span className={styles.senderName}>{msg.sender === 'user' ? (user?.name || 'You') : 'AI Assistant'}</span>
                  <span className={styles.timestamp}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
                <p>{msg.text}</p>
                {msg.sql && (
                  <div className={styles.sqlBlock}>
                    <div className={styles.sqlActions}>
                      <Button 
                        size="small"
                        onClick={() => handleRunSql(msg.sql!)} 
                        disabled={!selectedDatabaseId}
                        className={styles.sqlActionButton} 
                      >
                        <span className={styles.icon}>►</span> Run
                      </Button>
                      <Button 
                        size="small"
                        onClick={() => handleCopySql(msg.sql!)}
                        className={styles.sqlActionButton} 
                      >
                        <span className={styles.icon}>📋</span> Copy
                      </Button>
                    </div>
                    <pre><code>{msg.sql}</code></pre>
                  </div>
                )}
              </div>
            ))}
            {isLoading && <div className={styles.typingIndicator}>AI is thinking...</div>}
          </div>
          <div className={styles.inputSection}>
            <textarea
              className={styles.inputTextArea}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter your follow-up here..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className={styles.inputControls}>
                <select 
                    className={styles.databaseSelector}
                    value={selectedDatabaseId || ''}
                    onChange={(e) => setSelectedDatabaseId(e.target.value || null)}
                    disabled={isDbLoading || connections.length === 0}
                >
                    <option value="" disabled={connections.length > 0}>{(isDbLoading) ? 'Loading DBs...' : (connections.length === 0 ? 'No connections' : 'Select Database')}</option>
                    {connections.map(conn => (
                        <option key={conn.id} value={conn.id}>{conn.name}</option>
                    ))}
                </select>
                <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} className={styles.sendButton}>
                 Send
                </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
