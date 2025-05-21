/**
 * Utility functions for exporting data in different formats
 */

/**
 * Export data to JSON format and trigger a download
 */
export const exportToJson = (
  data: any[],
  filename: string = "export.json"
): void => {
  try {
    // Convert the data to a JSON string with nice formatting
    const jsonString = JSON.stringify(data, null, 2);

    // Create a blob with the JSON data
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create a download link and trigger the download
    downloadFile(blob, filename);
  } catch (error) {
    console.error("Error exporting to JSON:", error);
    throw new Error("Failed to export data to JSON");
  }
};

/**
 * Export data to CSV format and trigger a download
 */
export const exportToCsv = (
  data: any[],
  filename: string = "export.csv"
): void => {
  try {
    if (data.length === 0) {
      throw new Error("No data to export");
    }

    // Get the headers from the first row
    const headers = Object.keys(data[0]);

    // Function to format a value for CSV
    const formatCsvValue = (value: any): string => {
      if (value === null || value === undefined) return "";

      const stringValue = String(value);

      // If the value contains commas, quotes, or newlines, wrap it in quotes
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        // Escape any existing quotes by doubling them
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    };

    // Create the CSV content
    const csvContent = [
      // Header row
      headers.map((header) => formatCsvValue(header)).join(","),
      // Data rows
      ...data.map((row) =>
        headers.map((header) => formatCsvValue(row[header])).join(",")
      ),
    ].join("\n");

    // Create a blob with the CSV data
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a download link and trigger the download
    downloadFile(blob, filename);
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    throw new Error("Failed to export data to CSV");
  }
};

/**
 * Export data to XML format and trigger a download
 */
export const exportToXml = (
  data: any[],
  rootTag: string = "data",
  itemTag: string = "item",
  filename: string = "export.xml"
): void => {
  try {
    // Function to convert an object to XML
    const objectToXml = (obj: any, indent: string = "  "): string => {
      return Object.entries(obj)
        .map(([key, value]) => {
          // Skip null or undefined values
          if (value === null || value === undefined) {
            return `${indent}<${key} />`;
          }

          // Handle arrays
          if (Array.isArray(value)) {
            return `${indent}<${key}>\n${value
              .map((item) => objectToXml(item, indent + "  "))
              .join("\n")}\n${indent}</${key}>`;
          }

          // Handle nested objects
          if (typeof value === "object") {
            return `${indent}<${key}>\n${objectToXml(
              value,
              indent + "  "
            )}\n${indent}</${key}>`;
          }

          // Handle simple values
          // Escape special XML characters
          const escapedValue = String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");

          return `${indent}<${key}>${escapedValue}</${key}>`;
        })
        .join("\n");
    };

    // Create the XML content
    const xmlContent = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<${rootTag}>`,
      ...data.map(
        (item) =>
          `  <${itemTag}>\n${objectToXml(item, "    ")}\n  </${itemTag}>`
      ),
      `</${rootTag}>`,
    ].join("\n");

    // Create a blob with the XML data
    const blob = new Blob([xmlContent], { type: "application/xml" });

    // Create a download link and trigger the download
    downloadFile(blob, filename);
  } catch (error) {
    console.error("Error exporting to XML:", error);
    throw new Error("Failed to export data to XML");
  }
};

/**
 * Helper function to trigger a file download
 */
const downloadFile = (blob: Blob, filename: string): void => {
  // Create a temporary download link
  const downloadLink = document.createElement("a");

  // Set the URL to the blob
  downloadLink.href = URL.createObjectURL(blob);

  // Set the download filename
  downloadLink.download = filename;

  // Add the link to the document
  document.body.appendChild(downloadLink);

  // Trigger the download
  downloadLink.click();

  // Clean up
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(downloadLink.href);
};

/**
 * Export data to Excel format (XLSX) and trigger a download
 * Note: In a real app, you'd use a library like xlsx or exceljs
 * This is a simplified implementation that creates a basic Excel-compatible CSV
 */
export const exportToExcel = (
  data: any[],
  filename: string = "export.xlsx"
): void => {
  // For a simple implementation, we'll just use CSV which Excel can open
  // In a real app, you'd use a proper Excel library to create .xlsx files
  exportToCsv(data, filename.replace(/\.xlsx$/i, ".csv"));
};
