import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type ThemeType = "light" | "dark" | "system";
type ActualThemeType = "light" | "dark";

interface ThemeContextType {
  theme: ThemeType;
  actualTheme: ActualThemeType;
  setTheme: (theme: ThemeType) => void;
}

const initialContext: ThemeContextType = {
  theme: "system",
  actualTheme: "light",
  setTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(initialContext);

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeType;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = "system",
}) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    // Try to get theme from localStorage first
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme &&
      (savedTheme === "light" ||
        savedTheme === "dark" ||
        savedTheme === "system")
    ) {
      return savedTheme as ThemeType;
    }
    return initialTheme;
  });

  const [actualTheme, setActualTheme] = useState<ActualThemeType>("light");

  // Function to determine and apply the actual theme
  const applyTheme = (themePreference: ThemeType) => {
    let effectiveTheme: ActualThemeType = "light";

    if (themePreference === "system") {
      // Check system preference
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      effectiveTheme = systemPrefersDark ? "dark" : "light";
    } else {
      effectiveTheme = themePreference as ActualThemeType;
    }

    setActualTheme(effectiveTheme);

    // Apply theme to document
    if (effectiveTheme === "dark") {
      document.documentElement.classList.add("dark-theme");
      document.documentElement.classList.remove("light-theme");
    } else {
      document.documentElement.classList.add("light-theme");
      document.documentElement.classList.remove("dark-theme");
    }
  };

  // Set theme with persistence to localStorage
  const setTheme = (newTheme: ThemeType) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  // Initialize theme
  useEffect(() => {
    applyTheme(theme);

    // Listen for system preference changes if using system theme
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = () => {
        applyTheme("system");
      };

      // Modern browsers
      mediaQuery.addEventListener("change", handleChange);

      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }
  }, [theme]);

  const contextValue: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
