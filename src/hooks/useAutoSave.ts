import { useEffect, useRef } from "react";
import useDebounce from "./useDebounce";

interface AutoSaveOptions {
  data: any;
  onSave: (data: any) => Promise<void> | void;
  interval?: number;
  enabled?: boolean;
}

/**
 * Custom hook to automatically save data at regular intervals
 * @param options Options for controlling auto-save behavior
 */
function useAutoSave({
  data,
  onSave,
  interval = 30000,
  enabled = true,
}: AutoSaveOptions): void {
  // Store latest data in a ref to avoid triggering the debounce unnecessarily
  const latestData = useRef(data);

  // Update the ref whenever data changes
  useEffect(() => {
    latestData.current = data;
  }, [data]);

  // Debounce data to avoid saving too frequently during rapid changes
  const debouncedData = useDebounce(data, 1000);

  // Handle debounced data changes
  useEffect(() => {
    if (enabled && debouncedData) {
      // Save data when it stabilizes
      onSave(debouncedData);
    }
  }, [debouncedData, onSave, enabled]);

  // Set up interval for periodic saving
  useEffect(() => {
    if (!enabled || interval <= 0) return;

    const intervalId = setInterval(() => {
      // Use the ref value to ensure we're saving the latest data
      onSave(latestData.current);
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval, onSave, enabled]);
}

export default useAutoSave;
