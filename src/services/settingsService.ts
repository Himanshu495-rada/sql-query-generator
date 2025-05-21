import axios from "axios";

// Types for settings
export interface AppSettings {
  theme: "light" | "dark" | "system";
  defaultDatabaseId: string | null;
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // in seconds
  maxPlaygrounds: number;
}

export interface AiSettings {
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

// API base URL - in a real app, this would be in an environment variable
const API_URL =
  process.env.REACT_APP_API_URL || "https://api.sqlquerygenerator.com";

// Default settings values
const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "system",
  defaultDatabaseId: null,
  autoSaveEnabled: true,
  autoSaveInterval: 30,
  maxPlaygrounds: 10,
};

const DEFAULT_AI_SETTINGS: AiSettings = {
  defaultModel: "gpt-3.5-turbo",
  temperature: 0.7,
  maxTokens: 2000,
  topP: 1.0,
};

/**
 * Service for managing application settings
 */
class SettingsService {
  /**
   * Get application settings
   */
  async getAppSettings(): Promise<AppSettings> {
    try {
      // For development/demo, get from localStorage or use defaults
      if (process.env.NODE_ENV === "development") {
        const rawData = localStorage.getItem("appSettings");
        if (rawData) {
          return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(rawData) };
        }
        return DEFAULT_APP_SETTINGS;
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      if (!token) {
        return DEFAULT_APP_SETTINGS;
      }

      const response = await axios.get<AppSettings>(`${API_URL}/settings/app`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return { ...DEFAULT_APP_SETTINGS, ...response.data };
    } catch (error) {
      return DEFAULT_APP_SETTINGS;
    }
  }

  /**
   * Update application settings
   */
  async updateAppSettings(
    settings: Partial<AppSettings>
  ): Promise<AppSettings> {
    try {
      // For development/demo, save to localStorage
      if (process.env.NODE_ENV === "development") {
        const currentSettings = await this.getAppSettings();
        const updatedSettings = { ...currentSettings, ...settings };
        localStorage.setItem("appSettings", JSON.stringify(updatedSettings));
        return updatedSettings;
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await axios.put<AppSettings>(
        `${API_URL}/settings/app`,
        settings,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to update settings: ${
            error.response.data.message || "Unknown error"
          }`
        );
      }

      throw new Error(
        "Network error. Please check your connection and try again."
      );
    }
  }

  /**
   * Get AI settings
   */
  async getAiSettings(): Promise<AiSettings> {
    try {
      // For development/demo, get from localStorage or use defaults
      if (process.env.NODE_ENV === "development") {
        const rawData = localStorage.getItem("aiSettings");
        if (rawData) {
          return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(rawData) };
        }
        return DEFAULT_AI_SETTINGS;
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      if (!token) {
        return DEFAULT_AI_SETTINGS;
      }

      const response = await axios.get<AiSettings>(`${API_URL}/settings/ai`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return { ...DEFAULT_AI_SETTINGS, ...response.data };
    } catch (error) {
      return DEFAULT_AI_SETTINGS;
    }
  }

  /**
   * Update AI settings
   */
  async updateAiSettings(settings: Partial<AiSettings>): Promise<AiSettings> {
    try {
      // For development/demo, save to localStorage
      if (process.env.NODE_ENV === "development") {
        const currentSettings = await this.getAiSettings();
        const updatedSettings = { ...currentSettings, ...settings };
        localStorage.setItem("aiSettings", JSON.stringify(updatedSettings));
        return updatedSettings;
      }

      // In production, make an API call
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await axios.put<AiSettings>(
        `${API_URL}/settings/ai`,
        settings,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to update AI settings: ${
            error.response.data.message || "Unknown error"
          }`
        );
      }

      throw new Error(
        "Network error. Please check your connection and try again."
      );
    }
  }

  /**
   * Set application theme
   * This is a convenience method that works without authentication
   */
  setTheme(theme: "light" | "dark" | "system"): void {
    localStorage.setItem("theme", theme);

    // If user is authenticated, also save to server
    const token = localStorage.getItem("authToken");
    if (token && process.env.NODE_ENV !== "development") {
      axios
        .put(
          `${API_URL}/settings/theme`,
          { theme },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .catch((error) => {
          console.error("Failed to save theme setting to server", error);
        });
    }
  }

  /**
   * Get application theme
   * This is a convenience method that works without authentication
   */
  getTheme(): "light" | "dark" | "system" {
    const theme = localStorage.getItem("theme");
    if (theme === "light" || theme === "dark" || theme === "system") {
      return theme;
    }
    return "system";
  }
}

export default new SettingsService();
