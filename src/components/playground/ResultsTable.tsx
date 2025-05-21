import React, { useState } from "react";
import styles from "./ResultsTable.module.css";
import Button from "../shared/Button";
import { RiExpandDiagonalFill } from "react-icons/ri";
import Modal from "../shared/Modal";

interface ResultsTableProps {
  data: Record<string, any>[] | null;
  isLoading: boolean;
  error: string | null;
  onExportData: (format: "json" | "csv" | "xml") => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({
  data,
  isLoading,
  error,
  onExportData,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Executing query...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <div className={styles.errorIcon}>⚠️</div>
        <p>Error executing query</p>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📊</div>
        <p>No results to display</p>
        <p className={styles.emptyDescription}>
          Execute a query to see results here
        </p>
      </div>
    );
  }

  // Get column headers from the first row
  const columns = Object.keys(data[0]);

  // Apply filters
  const filteredData = data.filter((row) => {
    return Object.entries(filters).every(([column, filterValue]) => {
      if (!filterValue) return true;
      const cellValue = String(row[column]);
      return cellValue.toLowerCase().includes(filterValue.toLowerCase());
    });
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  const handleFilterChange = (column: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Expanded view content
  const expandedContent = (
    <div className={styles.expandedTableContainer}>
      <div className={styles.tableHeader}>
        <h2>Query Results</h2>
        <div className={styles.exportButtons}>
          <Button
            variant="secondary"
            size="small"
            onClick={() => onExportData("json")}
          >
            Export JSON
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => onExportData("csv")}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => onExportData("xml")}
          >
            Export XML
          </Button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.resultsTable}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
            <tr className={styles.filterRow}>
              {columns.map((column) => (
                <th key={`filter-${column}`}>
                  <input
                    type="text"
                    placeholder="Filter"
                    value={filters[column] || ""}
                    onChange={(e) => handleFilterChange(column, e.target.value)}
                    className={styles.filterInput}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column}`}>
                    {row[column] === null ? (
                      <span className={styles.nullValue}>NULL</span>
                    ) : (
                      String(row[column])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.tablePagination}>
        <div className={styles.paginationControls}>
          <span>Rows per page:</span>
          <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className={styles.pageNavigation}>
          <span>{`${startIndex + 1}-${Math.min(
            startIndex + rowsPerPage,
            filteredData.length
          )} of ${filteredData.length}`}</span>
          <div className={styles.pageButtons}>
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className={styles.pageButton}
            >
              ⟪
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={styles.pageButton}
            >
              ⟨
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={styles.pageButton}
            >
              ⟩
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className={styles.pageButton}
            >
              ⟫
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.resultsTableContainer}>
      <div className={styles.tableHeader}>
        <div className={styles.tableInfo}>
          <span className={styles.resultCount}>
            {filteredData.length} results
          </span>
        </div>
        <div className={styles.tableActions}>
          <button
            className={styles.expandButton}
            onClick={() => setIsExpanded(true)}
            title="Expand results"
          >
            <RiExpandDiagonalFill size={18} />
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.resultsTable}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
            <tr className={styles.filterRow}>
              {columns.map((column) => (
                <th key={`filter-${column}`}>
                  <input
                    type="text"
                    placeholder="Filter"
                    value={filters[column] || ""}
                    onChange={(e) => handleFilterChange(column, e.target.value)}
                    className={styles.filterInput}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column}`}>
                    {row[column] === null ? (
                      <span className={styles.nullValue}>NULL</span>
                    ) : (
                      String(row[column])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.tablePagination}>
        <div className={styles.paginationControls}>
          <span>Rows per page:</span>
          <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className={styles.pageNavigation}>
          <span>{`${startIndex + 1}-${Math.min(
            startIndex + rowsPerPage,
            filteredData.length
          )} of ${filteredData.length}`}</span>
          <div className={styles.pageButtons}>
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className={styles.pageButton}
            >
              ⟪
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={styles.pageButton}
            >
              ⟨
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={styles.pageButton}
            >
              ⟩
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className={styles.pageButton}
            >
              ⟫
            </button>
          </div>
        </div>
      </div>

      {/* Expanded view modal */}
      <Modal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title="Query Results"
        size="fullscreen"
      >
        {expandedContent}
      </Modal>
    </div>
  );
};

export default ResultsTable;
