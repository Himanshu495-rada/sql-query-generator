import React, { useState } from "react";
import styles from "./AppSettings.module.css";
import Button from "../shared/Button";

interface AppSettingsProps {
  theme: "light" | "dark" | "system";
  onChangeTheme: (theme: "light" | "dark" | "system") => Promise<void>;
  defaultDatabase: string | null;
  availableDatabases: Array<{ id: string; name: string }>;
  onChangeDefaultDatabase: (databaseId: string | null) => Promise<void>;
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
  onChangeAutoSave: (enabled: boolean, interval: number) => Promise<void>;
  maxPlaygrounds: number;
  onChangeMaxPlaygrounds: (maxPlaygrounds: number) => Promise<void>;
}

const AppSettings: React.FC<AppSettingsProps> = ({
  theme,
  onChangeTheme,
  defaultDatabase,
  availableDatabases,
  onChangeDefaultDatabase,
  autoSaveEnabled,
  autoSaveInterval,
  onChangeAutoSave,
  maxPlaygrounds,
  onChangeMaxPlaygrounds,
}) => {
  // Theme state
  const [selectedTheme, setSelectedTheme] = useState<
    "light" | "dark" | "system"
  >(theme);
  const [isChangingTheme, setIsChangingTheme] = useState(false);
  const [themeChangeSuccess, setThemeChangeSuccess] = useState(false);
  const [themeChangeError, setThemeChangeError] = useState<string | null>(null);

  // Default database state
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(
    defaultDatabase
  );
  const [isChangingDatabase, setIsChangingDatabase] = useState(false);
  const [databaseChangeSuccess, setDatabaseChangeSuccess] = useState(false);
  const [databaseChangeError, setDatabaseChangeError] = useState<string | null>(
    null
  );

  // Auto-save state
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(autoSaveEnabled);
  const [saveInterval, setSaveInterval] = useState(autoSaveInterval);
  const [isChangingAutoSave, setIsChangingAutoSave] = useState(false);
  const [autoSaveChangeSuccess, setAutoSaveChangeSuccess] = useState(false);
  const [autoSaveChangeError, setAutoSaveChangeError] = useState<string | null>(
    null
  );

  // Max playgrounds state
  const [playgroundLimit, setPlaygroundLimit] = useState(maxPlaygrounds);
  const [isChangingPlaygroundLimit, setIsChangingPlaygroundLimit] =
    useState(false);
  const [playgroundLimitChangeSuccess, setPlaygroundLimitChangeSuccess] =
    useState(false);
  const [playgroundLimitChangeError, setPlaygroundLimitChangeError] = useState<
    string | null
  >(null);

  // Handle theme change
  const handleThemeChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTheme === theme) return;

    setIsChangingTheme(true);
    setThemeChangeSuccess(false);
    setThemeChangeError(null);

    try {
      await onChangeTheme(selectedTheme);
      setThemeChangeSuccess(true);
    } catch (error) {
      setThemeChangeError(
        error instanceof Error ? error.message : "Failed to change theme"
      );
      setSelectedTheme(theme); // Reset to current theme on failure
    } finally {
      setIsChangingTheme(false);
    }
  };

  // Handle default database change
  const handleDatabaseChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDatabase === defaultDatabase) return;

    setIsChangingDatabase(true);
    setDatabaseChangeSuccess(false);
    setDatabaseChangeError(null);

    try {
      await onChangeDefaultDatabase(selectedDatabase);
      setDatabaseChangeSuccess(true);
    } catch (error) {
      setDatabaseChangeError(
        error instanceof Error
          ? error.message
          : "Failed to change default database"
      );
      setSelectedDatabase(defaultDatabase); // Reset to current database on failure
    } finally {
      setIsChangingDatabase(false);
    }
  };

  // Handle auto-save settings change
  const handleAutoSaveChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      isAutoSaveEnabled === autoSaveEnabled &&
      saveInterval === autoSaveInterval
    )
      return;

    setIsChangingAutoSave(true);
    setAutoSaveChangeSuccess(false);
    setAutoSaveChangeError(null);

    try {
      await onChangeAutoSave(isAutoSaveEnabled, saveInterval);
      setAutoSaveChangeSuccess(true);
    } catch (error) {
      setAutoSaveChangeError(
        error instanceof Error
          ? error.message
          : "Failed to update auto-save settings"
      );
      setIsAutoSaveEnabled(autoSaveEnabled); // Reset to current settings on failure
      setSaveInterval(autoSaveInterval);
    } finally {
      setIsChangingAutoSave(false);
    }
  };

  // Handle max playgrounds change
  const handlePlaygroundLimitChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (playgroundLimit === maxPlaygrounds) return;

    setIsChangingPlaygroundLimit(true);
    setPlaygroundLimitChangeSuccess(false);
    setPlaygroundLimitChangeError(null);

    try {
      await onChangeMaxPlaygrounds(playgroundLimit);
      setPlaygroundLimitChangeSuccess(true);
    } catch (error) {
      setPlaygroundLimitChangeError(
        error instanceof Error
          ? error.message
          : "Failed to update playground limit"
      );
      setPlaygroundLimit(maxPlaygrounds); // Reset to current limit on failure
    } finally {
      setIsChangingPlaygroundLimit(false);
    }
  };

  return (
    <div className={styles.appSettingsContainer}>
      <h2 className={styles.sectionTitle}>Application Settings</h2>

      {/* Theme Settings */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionSubtitle}>Theme</h3>
        <p className={styles.sectionDescription}>
          Choose your preferred application theme.
        </p>

        <form onSubmit={handleThemeChange} className={styles.form}>
          <div className={styles.themeOptions}>
            <div
              className={`${styles.themeOption} ${
                selectedTheme === "light" ? styles.selectedTheme : ""
              }`}
              onClick={() => setSelectedTheme("light")}
            >
              <input
                type="radio"
                id="theme-light"
                name="theme"
                value="light"
                checked={selectedTheme === "light"}
                onChange={() => setSelectedTheme("light")}
              />
              <label htmlFor="theme-light">
                <div className={styles.themeIcon}>☀️</div>
                <div className={styles.themeLabel}>Light</div>
              </label>
            </div>

            <div
              className={`${styles.themeOption} ${
                selectedTheme === "dark" ? styles.selectedTheme : ""
              }`}
              onClick={() => setSelectedTheme("dark")}
            >
              <input
                type="radio"
                id="theme-dark"
                name="theme"
                value="dark"
                checked={selectedTheme === "dark"}
                onChange={() => setSelectedTheme("dark")}
              />
              <label htmlFor="theme-dark">
                <div className={styles.themeIcon}>🌙</div>
                <div className={styles.themeLabel}>Dark</div>
              </label>
            </div>

            <div
              className={`${styles.themeOption} ${
                selectedTheme === "system" ? styles.selectedTheme : ""
              }`}
              onClick={() => setSelectedTheme("system")}
            >
              <input
                type="radio"
                id="theme-system"
                name="theme"
                value="system"
                checked={selectedTheme === "system"}
                onChange={() => setSelectedTheme("system")}
              />
              <label htmlFor="theme-system">
                <div className={styles.themeIcon}>🖥️</div>
                <div className={styles.themeLabel}>System</div>
              </label>
            </div>
          </div>

          {themeChangeSuccess && (
            <div className={styles.successMessage}>
              Theme updated successfully!
            </div>
          )}

          {themeChangeError && (
            <div className={styles.errorMessage}>{themeChangeError}</div>
          )}

          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="primary"
              disabled={isChangingTheme || selectedTheme === theme}
            >
              {isChangingTheme ? "Updating..." : "Update Theme"}
            </Button>
          </div>
        </form>
      </div>

      {/* Default Database */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionSubtitle}>Default Database</h3>
        <p className={styles.sectionDescription}>
          Select which database to connect to by default when creating a new
          playground.
        </p>

        <form onSubmit={handleDatabaseChange} className={styles.form}>
          <div className={styles.formGroup}>
            <select
              value={selectedDatabase || ""}
              onChange={(e) => setSelectedDatabase(e.target.value || null)}
              className={styles.select}
            >
              <option value="">No default database</option>
              {availableDatabases.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.name}
                </option>
              ))}
            </select>
          </div>

          {databaseChangeSuccess && (
            <div className={styles.successMessage}>
              Default database updated successfully!
            </div>
          )}

          {databaseChangeError && (
            <div className={styles.errorMessage}>{databaseChangeError}</div>
          )}

          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="primary"
              disabled={
                isChangingDatabase || selectedDatabase === defaultDatabase
              }
            >
              {isChangingDatabase ? "Updating..." : "Update Default"}
            </Button>
          </div>
        </form>
      </div>

      {/* Auto-Save Settings */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionSubtitle}>Auto-Save</h3>
        <p className={styles.sectionDescription}>
          Configure automatic saving of your playground queries and results.
        </p>

        <form onSubmit={handleAutoSaveChange} className={styles.form}>
          <div className={styles.formGroup}>
            <div className={styles.toggleWrapper}>
              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={isAutoSaveEnabled}
                  onChange={() => setIsAutoSaveEnabled(!isAutoSaveEnabled)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
              <span className={styles.toggleLabel}>Enable auto-save</span>
            </div>
          </div>

          {isAutoSaveEnabled && (
            <div className={styles.formGroup}>
              <label htmlFor="save-interval">
                Save Interval (seconds)
                <span className={styles.parameterValue}>{saveInterval}</span>
              </label>
              <input
                type="range"
                id="save-interval"
                min="5"
                max="300"
                step="5"
                value={saveInterval}
                onChange={(e) => setSaveInterval(parseInt(e.target.value))}
              />
              <div className={styles.rangeLabels}>
                <span>5s</span>
                <span>5m</span>
              </div>
            </div>
          )}

          {autoSaveChangeSuccess && (
            <div className={styles.successMessage}>
              Auto-save settings updated successfully!
            </div>
          )}

          {autoSaveChangeError && (
            <div className={styles.errorMessage}>{autoSaveChangeError}</div>
          )}

          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="primary"
              disabled={
                isChangingAutoSave ||
                (isAutoSaveEnabled === autoSaveEnabled &&
                  saveInterval === autoSaveInterval)
              }
            >
              {isChangingAutoSave ? "Updating..." : "Update Settings"}
            </Button>
          </div>
        </form>
      </div>

      {/* Max Playgrounds */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionSubtitle}>Playground Limit</h3>
        <p className={styles.sectionDescription}>
          Set the maximum number of playgrounds you can create.
        </p>

        <form onSubmit={handlePlaygroundLimitChange} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="max-playgrounds">
              Maximum Playgrounds
              <span className={styles.parameterValue}>{playgroundLimit}</span>
            </label>
            <input
              type="range"
              id="max-playgrounds"
              min="1"
              max="20"
              value={playgroundLimit}
              onChange={(e) => setPlaygroundLimit(parseInt(e.target.value))}
            />
            <div className={styles.rangeLabels}>
              <span>1</span>
              <span>20</span>
            </div>
          </div>

          {playgroundLimitChangeSuccess && (
            <div className={styles.successMessage}>
              Playground limit updated successfully!
            </div>
          )}

          {playgroundLimitChangeError && (
            <div className={styles.errorMessage}>
              {playgroundLimitChangeError}
            </div>
          )}

          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="primary"
              disabled={
                isChangingPlaygroundLimit || playgroundLimit === maxPlaygrounds
              }
            >
              {isChangingPlaygroundLimit ? "Updating..." : "Update Limit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppSettings;
