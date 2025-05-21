import React, { useState } from "react";
import styles from "./ApiSettings.module.css";
import Button from "../shared/Button";

interface ApiSettingsProps {
  apiKey: string | null;
  onSaveApiKey: (key: string) => Promise<void>;
  aiModel: string;
  onChangeAiModel: (model: string) => Promise<void>;
  advancedSettings: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  onUpdateAdvancedSettings: (settings: {
    temperature: number;
    maxTokens: number;
    topP: number;
  }) => Promise<void>;
}

const ApiSettings: React.FC<ApiSettingsProps> = ({
  apiKey,
  onSaveApiKey,
  aiModel,
  onChangeAiModel,
  advancedSettings,
  onUpdateAdvancedSettings,
}) => {
  // API key state
  const [newApiKey, setNewApiKey] = useState("");
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [apiKeySuccess, setApiKeySuccess] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // AI model state
  const [selectedModel, setSelectedModel] = useState(aiModel);
  const [isChangingModel, setIsChangingModel] = useState(false);
  const [modelChangeSuccess, setModelChangeSuccess] = useState(false);
  const [modelChangeError, setModelChangeError] = useState<string | null>(null);

  // Advanced settings state
  const [temperature, setTemperature] = useState(advancedSettings.temperature);
  const [maxTokens, setMaxTokens] = useState(advancedSettings.maxTokens);
  const [topP, setTopP] = useState(advancedSettings.topP);
  const [isSavingAdvanced, setIsSavingAdvanced] = useState(false);
  const [advancedSuccess, setAdvancedSuccess] = useState(false);
  const [advancedError, setAdvancedError] = useState<string | null>(null);

  // Available AI models
  const availableModels = [
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", type: "OpenAI" },
    { id: "gpt-4", name: "GPT-4", type: "OpenAI" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", type: "OpenAI" },
    { id: "claude-3-sonnet", name: "Claude 3 Sonnet", type: "Anthropic" },
    { id: "claude-3-opus", name: "Claude 3 Opus", type: "Anthropic" },
  ];

  // Format API key for display security
  const formatApiKey = (key: string) => {
    if (!key) return "";
    if (key.length < 8) return "•".repeat(key.length);
    return (
      key.substring(0, 4) +
      "•".repeat(key.length - 8) +
      key.substring(key.length - 4)
    );
  };

  // Handle API key submission
  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiKey.trim()) return;

    setIsSavingApiKey(true);
    setApiKeySuccess(false);
    setApiKeyError(null);

    try {
      await onSaveApiKey(newApiKey);
      setApiKeySuccess(true);
      setNewApiKey("");
    } catch (error) {
      setApiKeyError(
        error instanceof Error ? error.message : "Failed to save API key"
      );
    } finally {
      setIsSavingApiKey(false);
    }
  };

  // Handle AI model change
  const handleModelChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedModel === aiModel) return;

    setIsChangingModel(true);
    setModelChangeSuccess(false);
    setModelChangeError(null);

    try {
      await onChangeAiModel(selectedModel);
      setModelChangeSuccess(true);
    } catch (error) {
      setModelChangeError(
        error instanceof Error ? error.message : "Failed to change AI model"
      );
      setSelectedModel(aiModel); // Reset to current model on failure
    } finally {
      setIsChangingModel(false);
    }
  };

  // Handle advanced settings submission
  const handleAdvancedSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSavingAdvanced(true);
    setAdvancedSuccess(false);
    setAdvancedError(null);

    try {
      await onUpdateAdvancedSettings({
        temperature,
        maxTokens,
        topP,
      });
      setAdvancedSuccess(true);
    } catch (error) {
      setAdvancedError(
        error instanceof Error ? error.message : "Failed to update settings"
      );
    } finally {
      setIsSavingAdvanced(false);
    }
  };

  return (
    <div className={styles.apiSettingsContainer}>
      <h2 className={styles.sectionTitle}>AI Integration Settings</h2>

      {/* API Key Section */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionSubtitle}>OpenAI API Key</h3>
        <p className={styles.sectionDescription}>
          Your API key is required to generate SQL queries using OpenAI's GPT
          models. This key is stored securely and only used for your requests.
        </p>

        {apiKey ? (
          <div className={styles.currentApiKey}>
            <div className={styles.apiKeyLabel}>Current API Key:</div>
            <div className={styles.apiKeyValue}>
              {isApiKeyVisible ? apiKey : formatApiKey(apiKey)}
              <button
                className={styles.visibilityToggle}
                onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                type="button"
              >
                {isApiKeyVisible ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.noApiKey}>
            <span className={styles.warningIcon}>⚠️</span>
            No API key configured. Please add your API key to use AI-powered SQL
            generation.
          </div>
        )}

        <form onSubmit={handleApiKeySubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="api-key">
              {apiKey ? "Update API Key" : "Add API Key"}
            </label>
            <div className={styles.apiKeyInput}>
              <input
                type={isApiKeyVisible ? "text" : "password"}
                id="api-key"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <button
                type="button"
                className={styles.visibilityButton}
                onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
              >
                {isApiKeyVisible ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {apiKeySuccess && (
            <div className={styles.successMessage}>
              API key saved successfully!
            </div>
          )}

          {apiKeyError && (
            <div className={styles.errorMessage}>{apiKeyError}</div>
          )}

          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="primary"
              disabled={isSavingApiKey || !newApiKey.trim()}
            >
              {isSavingApiKey ? "Saving..." : "Save API Key"}
            </Button>
          </div>
        </form>
      </div>

      {/* AI Model Selection */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionSubtitle}>AI Model Selection</h3>
        <p className={styles.sectionDescription}>
          Select which AI model to use for generating SQL queries. Different
          models have different capabilities and pricing.
        </p>

        <form onSubmit={handleModelChange} className={styles.form}>
          <div className={styles.modelOptions}>
            {availableModels.map((model) => (
              <div
                key={model.id}
                className={`${styles.modelOption} ${
                  selectedModel === model.id ? styles.selectedModel : ""
                }`}
                onClick={() => setSelectedModel(model.id)}
              >
                <div className={styles.modelRadio}>
                  <input
                    type="radio"
                    id={`model-${model.id}`}
                    name="ai-model"
                    value={model.id}
                    checked={selectedModel === model.id}
                    onChange={() => setSelectedModel(model.id)}
                  />
                  <label htmlFor={`model-${model.id}`}></label>
                </div>

                <div className={styles.modelInfo}>
                  <h4>{model.name}</h4>
                  <span className={styles.modelType}>{model.type}</span>
                </div>
              </div>
            ))}
          </div>

          {modelChangeSuccess && (
            <div className={styles.successMessage}>
              AI model changed successfully!
            </div>
          )}

          {modelChangeError && (
            <div className={styles.errorMessage}>{modelChangeError}</div>
          )}

          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="primary"
              disabled={isChangingModel || selectedModel === aiModel}
            >
              {isChangingModel ? "Changing..." : "Change Model"}
            </Button>
          </div>
        </form>
      </div>

      {/* Advanced Settings */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionSubtitle}>Advanced AI Settings</h3>
        <p className={styles.sectionDescription}>
          Configure advanced parameters for the AI model. These settings affect
          how the AI generates SQL queries.
        </p>

        <form onSubmit={handleAdvancedSettingsSubmit} className={styles.form}>
          <div className={styles.advancedSettingsGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="temperature">
                Temperature
                <span className={styles.parameterValue}>{temperature}</span>
              </label>
              <input
                type="range"
                id="temperature"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
              <p className={styles.parameterDescription}>
                Controls randomness: lower values produce more predictable
                results, higher values produce more creative results.
              </p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="max-tokens">
                Maximum Tokens
                <span className={styles.parameterValue}>{maxTokens}</span>
              </label>
              <input
                type="range"
                id="max-tokens"
                min="100"
                max="4000"
                step="100"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              />
              <p className={styles.parameterDescription}>
                The maximum number of tokens to generate in the completion.
                Higher values allow for longer responses but cost more.
              </p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="top-p">
                Top P<span className={styles.parameterValue}>{topP}</span>
              </label>
              <input
                type="range"
                id="top-p"
                min="0"
                max="1"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
              />
              <p className={styles.parameterDescription}>
                Controls diversity by limiting the tokens considered to the most
                probable ones. Lower values focus on high probability tokens.
              </p>
            </div>
          </div>

          {advancedSuccess && (
            <div className={styles.successMessage}>
              Advanced settings updated successfully!
            </div>
          )}

          {advancedError && (
            <div className={styles.errorMessage}>{advancedError}</div>
          )}

          <div className={styles.formActions}>
            <Button type="submit" variant="primary" disabled={isSavingAdvanced}>
              {isSavingAdvanced ? "Saving..." : "Save Settings"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setTemperature(advancedSettings.temperature);
                setMaxTokens(advancedSettings.maxTokens);
                setTopP(advancedSettings.topP);
              }}
            >
              Reset to Defaults
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiSettings;
