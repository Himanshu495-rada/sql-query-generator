import { useState, useEffect } from "react";

/**
 * Custom hook to detect if a media query matches
 * @param query The media query string to match
 * @returns Boolean indicating if the media query matches
 */
function useMediaQuery(query: string): boolean {
  // SSR check - return default value if not in browser
  const getMatches = (): boolean => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState<boolean>(getMatches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Update matches state based on the media query result
    const updateMatches = (): void => {
      setMatches(mediaQuery.matches);
    };

    // Set initial value
    updateMatches();

    // Add listener for media query changes
    try {
      // Modern API (newer browsers)
      mediaQuery.addEventListener("change", updateMatches);
      return () => mediaQuery.removeEventListener("change", updateMatches);
    } catch (e) {
      // Legacy API (older browsers)
      mediaQuery.addListener(updateMatches);
      return () => mediaQuery.removeListener(updateMatches);
    }
  }, [query]);

  return matches;
}

export default useMediaQuery;
