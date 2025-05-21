import React, { useState } from "react";
import styles from "./SettingsPage.module.css";
import ProfileSettings from "../components/settings/ProfileSettings";
import ApiSettings from "../components/settings/ApiSettings";
import AppSettings from "../components/settings/AppSettings";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useDatabase } from "../contexts/DatabaseContext";

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "app" | "api">(
    "profile"
  );
  const { user, updateProfile, updatePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const { connections, activeConnection } = useDatabase();

  // Mock data for API settings
  const apiSettings = {
    apiKey: "sk-1234567890abcdef", // In a real app, this would be securely retrieved
    aiModel: "gpt-4",
    advancedSettings: {
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
    },
  };

  // Mock data for app settings
  const appSettings = {
    autoSaveEnabled: true,
    autoSaveInterval: 30, // seconds
    maxPlaygrounds: 10,
  };

  // Handler functions for settings updates
  const handleSaveApiKey = async (key: string) => {
    // In a real app, this would securely store the API key
    console.log("Saving API key:", key);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
  };

  const handleChangeAiModel = async (model: string) => {
    console.log("Changing AI model to:", model);
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API call
  };

  const handleUpdateAdvancedSettings = async (settings: any) => {
    console.log("Updating advanced settings:", settings);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
  };

  const handleChangeTheme = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
  };

  const handleChangeDefaultDatabase = async (databaseId: string | null) => {
    console.log("Changing default database to:", databaseId);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
  };

  const handleChangeAutoSave = async (enabled: boolean, interval: number) => {
    console.log("Updating auto-save settings:", { enabled, interval });
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
  };

  const handleChangeMaxPlaygrounds = async (maxPlaygrounds: number) => {
    console.log("Updating max playgrounds:", maxPlaygrounds);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
  };

  // If user is not loaded yet, show loading state
  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.settingsPage}>
      <div className={styles.sidebar}>
        <h2>Settings</h2>
        <nav className={styles.navigation}>
          <button
            className={`${styles.navButton} ${
              activeTab === "profile" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <span className={styles.navIcon}>👤</span>
            Profile
          </button>

          <button
            className={`${styles.navButton} ${
              activeTab === "app" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("app")}
          >
            <span className={styles.navIcon}>⚙️</span>
            Application
          </button>

          <button
            className={`${styles.navButton} ${
              activeTab === "api" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("api")}
          >
            <span className={styles.navIcon}>🤖</span>
            AI Integration
          </button>
        </nav>
      </div>

      <div className={styles.contentContainer}>
        {activeTab === "profile" && (
          <ProfileSettings
            userProfile={user}
            onUpdateProfile={updateProfile}
            onUpdatePassword={updatePassword}
          />
        )}

        {activeTab === "app" && (
          <AppSettings
            theme={theme}
            onChangeTheme={handleChangeTheme}
            defaultDatabase={activeConnection?.id || null}
            availableDatabases={connections.map((conn) => ({
              id: conn.id,
              name: conn.name,
            }))}
            onChangeDefaultDatabase={handleChangeDefaultDatabase}
            autoSaveEnabled={appSettings.autoSaveEnabled}
            autoSaveInterval={appSettings.autoSaveInterval}
            onChangeAutoSave={handleChangeAutoSave}
            maxPlaygrounds={appSettings.maxPlaygrounds}
            onChangeMaxPlaygrounds={handleChangeMaxPlaygrounds}
          />
        )}

        {activeTab === "api" && (
          <ApiSettings
            apiKey={apiSettings.apiKey}
            onSaveApiKey={handleSaveApiKey}
            aiModel={apiSettings.aiModel}
            onChangeAiModel={handleChangeAiModel}
            advancedSettings={apiSettings.advancedSettings}
            onUpdateAdvancedSettings={handleUpdateAdvancedSettings}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
