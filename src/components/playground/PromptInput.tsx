import React, { useState, useRef, useEffect } from "react";
import styles from "./PromptInput.module.css";
import Button from "../shared/Button";
import { IoIosClose } from "react-icons/io";

interface ExamplePrompt {
  text: string;
  description: string;
}

interface PromptInputProps {
  onGenerateQuery: (prompt: string) => void;
  isLoading?: boolean;
  placeholderText?: string;
  recentPrompts?: string[];
  examplePrompts?: ExamplePrompt[];
}

const PromptInput: React.FC<PromptInputProps> = ({
  onGenerateQuery,
  isLoading = false,
  placeholderText = "Describe what you want to query in natural language...",
  recentPrompts = [],
  examplePrompts = [],
}) => {
  const [prompt, setPrompt] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle textarea focus
  const handleFocus = () => {
    if (
      (recentPrompts.length > 0 || examplePrompts.length > 0) &&
      !prompt.trim()
    ) {
      setShowSuggestions(true);
    }
  };

  // Handle textarea input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerateQuery(prompt.trim());
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      if (prompt.trim()) {
        onGenerateQuery(prompt.trim());
      }
      e.preventDefault();
    }
  };

  return (
    <div className={styles.promptInputContainer}>
      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          className={styles.promptTextarea}
          rows={4}
          disabled={isLoading}
        />

        {showSuggestions &&
          (recentPrompts.length > 0 || examplePrompts.length > 0) && (
            <div className={styles.suggestionsContainer} ref={suggestionsRef}>
              <div className={styles.suggestionsHeader}>
                <h4>Suggestions</h4>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowSuggestions(false)}
                  type="button"
                >
                  <IoIosClose size={20} />
                </button>
              </div>

              {recentPrompts.length > 0 && (
                <div className={styles.suggestionsSection}>
                  <h5>Recent Prompts</h5>
                  <ul className={styles.suggestionsList}>
                    {recentPrompts.map((recentPrompt, index) => (
                      <li
                        key={`recent-${index}`}
                        onClick={() => handleSuggestionClick(recentPrompt)}
                        className={styles.suggestion}
                      >
                        {recentPrompt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {examplePrompts.length > 0 && (
                <div className={styles.suggestionsSection}>
                  <h5>Example Prompts</h5>
                  <ul className={styles.suggestionsList}>
                    {examplePrompts.map((example, index) => (
                      <li
                        key={`example-${index}`}
                        onClick={() => handleSuggestionClick(example.text)}
                        className={styles.suggestion}
                      >
                        <div className={styles.exampleText}>{example.text}</div>
                        {example.description && (
                          <div className={styles.exampleDescription}>
                            {example.description}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        <div className={styles.promptControls}>
          <Button
            type="submit"
            variant="primary"
            disabled={!prompt.trim() || isLoading}
            isLoading={isLoading}
          >
            Generate SQL
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PromptInput;
