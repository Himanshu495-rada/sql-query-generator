import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { BsSun, BsMoon } from 'react-icons/bs';
import styles from './ThemeToggle.module.css'; // We can reuse existing styles if they are generic enough

const ThemeToggle: React.FC = () => {
  const { theme, actualTheme, setTheme } = useTheme();

  const handleToggle = () => {
    // Cycle between light and dark mode. 
    // If current preference is 'system', toggling will switch to 'dark' if system is light, or 'light' if system is dark.
    // Or, more simply, always toggle between explicit 'light' and 'dark'.
    const newTheme = actualTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Determine which icon to show based on the *actual* applied theme
  const Icon = actualTheme === 'light' ? BsSun : BsMoon;

  return (
    <button
      onClick={handleToggle}
      className={styles.themeToggle} // Use class from CSS module for styling the button itself
      aria-label={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} mode`}
      title={`Current theme: ${actualTheme} (Preference: ${theme}). Click to switch.`}
    >
      <Icon size={20} />
    </button>
  );
};

export default ThemeToggle;
