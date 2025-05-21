/**
 * Utility functions for browser storage operations
 */

/**
 * Save data to localStorage with error handling
 */
export const saveToLocalStorage = <T>(key: string, data: T): boolean => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (key: ${key}):`, error);
    return false;
  }
};

/**
 * Load data from localStorage with error handling and type safety
 */
export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return defaultValue;
    }
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error(`Error loading from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
};

/**
 * Remove data from localStorage with error handling
 */
export const removeFromLocalStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (key: ${key}):`, error);
    return false;
  }
};

/**
 * Save data to sessionStorage with error handling
 */
export const saveToSessionStorage = <T>(key: string, data: T): boolean => {
  try {
    const serialized = JSON.stringify(data);
    sessionStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Error saving to sessionStorage (key: ${key}):`, error);
    return false;
  }
};

/**
 * Load data from sessionStorage with error handling and type safety
 */
export const loadFromSessionStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const serialized = sessionStorage.getItem(key);
    if (serialized === null) {
      return defaultValue;
    }
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error(`Error loading from sessionStorage (key: ${key}):`, error);
    return defaultValue;
  }
};

/**
 * Get the total usage of localStorage in bytes
 */
export const getLocalStorageUsage = (): number => {
  let totalBytes = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key !== null) {
      const value = localStorage.getItem(key) || "";
      // Calculate bytes using 2 bytes per character (approximation for UTF-16)
      totalBytes += (key.length + value.length) * 2;
    }
  }

  return totalBytes;
};

/**
 * Check if localStorage is available and working
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, testKey);
    const result = localStorage.getItem(testKey) === testKey;
    localStorage.removeItem(testKey);
    return result;
  } catch (e) {
    return false;
  }
};

/**
 * Clear all data in localStorage except for specified keys
 */
export const clearLocalStorageExcept = (exceptKeys: string[]): void => {
  try {
    // Save the values of excepted keys
    const savedValues: Record<string, string> = {};
    exceptKeys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        savedValues[key] = value;
      }
    });

    // Clear all localStorage
    localStorage.clear();

    // Restore excepted keys
    Object.entries(savedValues).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};
