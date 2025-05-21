import React, { useState } from "react";
import styles from "./Sidebar.module.css";
import { GoSidebarExpand } from "react-icons/go";

interface PlaygroundItem {
  id: string;
  name: string;
  lastUpdated: Date;
  isActive?: boolean;
}

interface DatabaseItem {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "error";
}

interface SidebarProps {
  isVisible: boolean;
  playgrounds: PlaygroundItem[];
  databases: DatabaseItem[];
  onPlaygroundClick: (id: string) => void;
  onCreatePlayground: () => void;
  onDatabaseClick: (id: string) => void;
  onConnectDatabase: () => void;
  onCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isVisible,
  playgrounds,
  databases,
  onPlaygroundClick,
  onCreatePlayground,
  onDatabaseClick,
  onConnectDatabase,
  onCollapse,
}) => {
  const [expandedSection, setExpandedSection] = useState<
    "playgrounds" | "databases" | null
  >("playgrounds");
  const [searchTerm, setSearchTerm] = useState("");

  const toggleSection = (section: "playgrounds" | "databases") => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getStatusIcon = (status: "connected" | "disconnected" | "error") => {
    switch (status) {
      case "connected":
        return (
          <span className={`${styles.statusIndicator} ${styles.connected}`}>
            ●
          </span>
        );
      case "disconnected":
        return (
          <span className={`${styles.statusIndicator} ${styles.disconnected}`}>
            ●
          </span>
        );
      case "error":
        return (
          <span className={`${styles.statusIndicator} ${styles.error}`}>●</span>
        );
    }
  };

  // Filter playgrounds and databases based on search term
  const filteredPlaygrounds = playgrounds.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDatabases = databases.filter((db) =>
    db.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`${styles.sidebar} ${isVisible ? "" : styles.collapsed}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        {onCollapse && (
          <button
            className={styles.collapseButton}
            onClick={onCollapse}
            aria-label="Collapse sidebar"
          >
            <GoSidebarExpand size={24} />
          </button>
        )}
      </div>

      <div className={styles.sidebarContent}>
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection("playgrounds")}
        >
          <h3>Playgrounds</h3>
          <span
            className={`${styles.expandIcon} ${
              expandedSection === "playgrounds" ? styles.expanded : ""
            }`}
          >
            ▼
          </span>
        </div>

        {expandedSection === "playgrounds" && (
          <div className={styles.sectionContent}>
            <button
              className={styles.createButton}
              onClick={onCreatePlayground}
            >
              <span className={styles.createIcon}>+</span>
              New Playground
            </button>

            {filteredPlaygrounds.length === 0 ? (
              searchTerm ? (
                <div className={styles.emptyMessage}>No playgrounds found</div>
              ) : (
                <div className={styles.emptyMessage}>No playgrounds yet</div>
              )
            ) : (
              <ul className={styles.itemList}>
                {filteredPlaygrounds.map((playground) => (
                  <li
                    key={playground.id}
                    className={`${styles.item} ${
                      playground.isActive ? styles.active : ""
                    }`}
                    onClick={() => onPlaygroundClick(playground.id)}
                  >
                    <div className={styles.itemIcon}>📝</div>
                    <div className={styles.itemDetails}>
                      <div className={styles.itemName}>{playground.name}</div>
                      <div className={styles.itemMeta}>
                        {playground.lastUpdated.toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection("databases")}
        >
          <h3>Databases</h3>
          <span
            className={`${styles.expandIcon} ${
              expandedSection === "databases" ? styles.expanded : ""
            }`}
          >
            ▼
          </span>
        </div>

        {expandedSection === "databases" && (
          <div className={styles.sectionContent}>
            <button className={styles.createButton} onClick={onConnectDatabase}>
              <span className={styles.createIcon}>+</span>
              Connect Database
            </button>

            {filteredDatabases.length === 0 ? (
              searchTerm ? (
                <div className={styles.emptyMessage}>No databases found</div>
              ) : (
                <div className={styles.emptyMessage}>
                  No databases connected
                </div>
              )
            ) : (
              <ul className={styles.itemList}>
                {filteredDatabases.map((database) => (
                  <li
                    key={database.id}
                    className={styles.item}
                    onClick={() => onDatabaseClick(database.id)}
                  >
                    {getStatusIcon(database.status)}
                    <div className={styles.itemIcon}>🗄️</div>
                    <div className={styles.itemName}>{database.name}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
