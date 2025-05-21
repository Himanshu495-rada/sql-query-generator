import React, { useRef, useEffect, useState } from "react";
import styles from "./SqlEditor.module.css";
import Button from "../shared/Button";

// Importing monaco editor would be done in an actual implementation
// This is a simplified version that focuses on the core functionality

interface SqlEditorProps {
  sql: string;
  onChange: (sql: string) => void;
  onExecute: () => void;
  explanation?: string;
  isLoading?: boolean;
  isDmlQuery?: boolean;
}

const SqlEditor: React.FC<SqlEditorProps> = ({
  sql,
  onChange,
  onExecute,
  explanation,
  isLoading = false,
  isDmlQuery = false,
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showDmlWarning, setShowDmlWarning] = useState(false);

  // This effect would be where we'd initialize Monaco Editor
  // in a real implementation
  useEffect(() => {
    if (editorRef.current) {
      // In reality, this would initialize Monaco Editor
      // For now, we just focus the textarea
      editorRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "F5" || (e.key === "Enter" && e.ctrlKey)) {
      e.preventDefault();
      handleExecute();
    }

    // Handle tab key for indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;

      // Insert tab at cursor position
      const newValue = sql.substring(0, start) + "  " + sql.substring(end);
      onChange(newValue);

      // Move cursor after the inserted tab
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd =
            start + 2;
        }
      }, 0);
    }
  };

  const handleExecute = () => {
    if (isDmlQuery) {
      setShowDmlWarning(true);
    } else {
      onExecute();
    }
  };

  const confirmExecute = () => {
    setShowDmlWarning(false);
    onExecute();
  };

  return (
    <div className={styles.sqlEditorContainer}>
      {/* <div className={styles.editorHeader}>
        <div className={styles.headerTabs}>
          <div className={`${styles.tab} ${styles.activeTab}`}>
            Generated SQL
          </div>
        </div>

        <div className={styles.headerControls}>
          {explanation && (
            <button
              className={styles.explanationToggle}
              onClick={() => setShowExplanation(!showExplanation)}
            >
              {showExplanation ? "Hide Explanation" : "Show Explanation"}
            </button>
          )}
        </div>
      </div> */}

      <div className={styles.editorContent}>
        <textarea
          ref={editorRef}
          className={styles.sqlTextarea}
          value={sql}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="-- Your SQL query will appear here"
          spellCheck={false}
          disabled={isLoading}
        />

        {showExplanation && explanation && (
          <div className={styles.explanationContainer}>
            <div className={styles.explanationHeader}>
              <h4>Explanation</h4>
              <button
                className={styles.closeButton}
                onClick={() => setShowExplanation(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.explanationContent}>{explanation}</div>
          </div>
        )}
      </div>

      <div className={styles.editorFooter}>
        <div className={styles.footerHints}>
          Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> or <kbd>F5</kbd> to execute
        </div>
        <Button
          onClick={handleExecute}
          disabled={!sql.trim() || isLoading}
          variant="primary"
        >
          {isLoading ? "Executing..." : "Execute Query"}
        </Button>
      </div>

      {showDmlWarning && (
        <div className={styles.dmlWarningOverlay}>
          <div className={styles.dmlWarningModal}>
            <div className={styles.warningIcon}>⚠️</div>
            <h3>Data Modification Warning</h3>
            <p>
              You are about to execute a query that may modify data (INSERT,
              UPDATE, DELETE, or similar). This will affect the sandbox
              database.
            </p>
            <p>Do you want to proceed?</p>
            <div className={styles.warningActions}>
              <Button
                onClick={() => setShowDmlWarning(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button onClick={confirmExecute} variant="danger">
                Execute Anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SqlEditor;
