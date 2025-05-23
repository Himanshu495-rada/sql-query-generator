import React, { useState, useEffect } from "react";
import styles from "./LoadingSpinner.module.css";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "white";
  text?: string;
  overlay?: boolean;
  minDisplayTime?: number; // Minimum time to display the spinner in milliseconds
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  color = "primary",
  text,
  overlay = false,
  minDisplayTime = 1000, // Default to 1 second minimum display time
}) => {
  // Track if the spinner should be visible (for minimum display time)
  const [isVisible, setIsVisible] = useState(true);
  
  // Apply minimum display time when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, minDisplayTime);
    
    // Clean up timer on unmount
    return () => clearTimeout(timer);
  }, [minDisplayTime]);
  if (overlay) {
    // If minDisplayTime is set to 0, don't use the timer logic
    if (minDisplayTime === 0 || isVisible) {
      return (
        <div className={styles.overlay}>
          <div className={styles.container}>
            <div
              className={`${styles.spinner} ${styles[size]} ${styles[color]}`}
            ></div>
            {text && <p className={styles.text}>{text}</p>}
          </div>
        </div>
      );
    }
    return null;
  }

  // Regular non-overlay spinner with minimum display time
  if (minDisplayTime === 0 || isVisible) {
    return (
      <div className={styles.container}>
        <div
          className={`${styles.spinner} ${styles[size]} ${styles[color]}`}
        ></div>
        {text && <p className={styles.text}>{text}</p>}
      </div>
    );
  }
  return null;
};

export default LoadingSpinner;
