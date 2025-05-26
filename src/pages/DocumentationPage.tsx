import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/shared/Navbar";
import { useAuth } from "../contexts/AuthContext";
import {
  FiDatabase,
  FiCode,
  FiShield,
  FiZap,
  FiLayers,
  FiSettings,
  FiEdit3,
  FiArrowRight,
} from "react-icons/fi";
import styles from "./DocumentationPage.module.css";

const DocumentationPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleCreatePlayground = () => {
    navigate("/playground");
  };

  const handleDatabaseConnect = () => {
    navigate("/databases");
  };

  return (
    <div className={styles.documentationContainer}>
      {" "}
      <Navbar
        user={
          user
            ? {
                name: user.name,
                avatarUrl: user.avatarUrl || undefined,
              }
            : undefined
        }
        onLogout={logout}
        onCreatePlayground={handleCreatePlayground}
        onDatabaseConnect={handleDatabaseConnect}
        appName="SQL Query Generator"
      />
      <main className={styles.documentationMain}>
        <div className={styles.documentationContent}>
          {/* Header Section */}
          <section className={styles.heroSection}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                SQL Query Generator Documentation
              </h1>
              <p className={styles.heroDescription}>
                A comprehensive guide to using our advanced SQL playground and
                GUI builder platform
              </p>
            </div>
          </section>

          {/* Quick Start Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FiZap className={styles.sectionIcon} />
              Quick Start
            </h2>
            <div className={styles.quickStartGrid}>
              <div className={styles.quickStartCard}>
                <div className={styles.cardHeader}>
                  <FiDatabase className={styles.cardIcon} />
                  <h3>1. Connect Database</h3>
                </div>
                <p>
                  Connect to your SQLite, MySQL, PostgreSQL, or MongoDB database
                </p>
                <button
                  className={styles.actionButton}
                  onClick={() => navigate("/databases")}
                >
                  Connect Now <FiArrowRight />
                </button>
              </div>
              <div className={styles.quickStartCard}>
                <div className={styles.cardHeader}>
                  <FiCode className={styles.cardIcon} />
                  <h3>2. Create Playground</h3>
                </div>
                <p>
                  Start writing and testing SQL queries in our interactive
                  playground
                </p>
                <button
                  className={styles.actionButton}
                  onClick={() => navigate("/playground")}
                >
                  Create Playground <FiArrowRight />
                </button>
              </div>
              <div className={styles.quickStartCard}>
                <div className={styles.cardHeader}>
                  <FiEdit3 className={styles.cardIcon} />
                  <h3>3. Use GUI Builder</h3>
                </div>
                <p>
                  Build queries visually with our intuitive drag-and-drop
                  interface
                </p>
                <button
                  className={styles.actionButton}
                  onClick={() => navigate("/gui-builder")}
                >
                  Open GUI Builder <FiArrowRight />
                </button>
              </div>
            </div>
          </section>

          {/* Core Features Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FiLayers className={styles.sectionIcon} />
              Core Features
            </h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureHeader}>
                  <FiCode className={styles.featureIcon} />
                  <h3>SQL Playground</h3>
                </div>
                <p>
                  Interactive SQL editor with syntax highlighting,
                  auto-completion, and real-time query execution. Write, test,
                  and debug your SQL queries with ease.
                </p>
                <ul className={styles.featureList}>
                  <li>Syntax highlighting and error detection</li>
                  <li>Query history and saved queries</li>
                  <li>Real-time result visualization</li>
                  <li>Export results in multiple formats</li>
                </ul>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureHeader}>
                  <FiEdit3 className={styles.featureIcon} />
                  <h3>GUI Query Builder</h3>
                </div>
                <p>
                  Visual query builder that generates SQL without writing code.
                  Perfect for beginners or complex join operations.
                </p>
                <ul className={styles.featureList}>
                  <li>Drag-and-drop table selection</li>
                  <li>Visual join configuration</li>
                  <li>Filter and sorting conditions</li>
                  <li>Automatic SQL generation</li>
                </ul>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureHeader}>
                  <FiDatabase className={styles.featureIcon} />
                  <h3>SandboxDB Technology</h3>
                </div>
                <p>
                  Our innovative SandboxDB creates optimized, secure copies of
                  your data for fast querying without affecting production
                  systems.
                </p>
                <ul className={styles.featureList}>
                  <li>Isolated testing environment</li>
                  <li>Optimized data structures</li>
                  <li>No impact on production</li>
                  <li>Automatic data synchronization</li>
                </ul>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureHeader}>
                  <FiShield className={styles.featureIcon} />
                  <h3>Security & Safety</h3>
                </div>
                <p>
                  Advanced security features protect your data and prevent
                  destructive operations on production databases.
                </p>
                <ul className={styles.featureList}>
                  <li>DML query restrictions</li>
                  <li>Read-only playground mode</li>
                  <li>Secure connection protocols</li>
                  <li>Audit trail and logging</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Database Support Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FiDatabase className={styles.sectionIcon} />
              Supported Databases
            </h2>
            <div className={styles.databaseGrid}>
              <div className={styles.databaseCard}>
                <h3>SQLite</h3>
                <p>
                  Lightweight, file-based database perfect for development and
                  small applications
                </p>
                <div className={styles.databaseFeatures}>
                  <span className={styles.feature}>Zero Configuration</span>
                  <span className={styles.feature}>Local Files</span>
                  <span className={styles.feature}>ACID Compliant</span>
                </div>
              </div>
              <div className={styles.databaseCard}>
                <h3>MySQL</h3>
                <p>
                  Popular open-source relational database with excellent
                  performance
                </p>
                <div className={styles.databaseFeatures}>
                  <span className={styles.feature}>High Performance</span>
                  <span className={styles.feature}>ACID Transactions</span>
                  <span className={styles.feature}>Replication</span>
                </div>
              </div>
              <div className={styles.databaseCard}>
                <h3>PostgreSQL</h3>
                <p>
                  Advanced open-source database with powerful features and
                  extensibility
                </p>
                <div className={styles.databaseFeatures}>
                  <span className={styles.feature}>JSON Support</span>
                  <span className={styles.feature}>Advanced Types</span>
                  <span className={styles.feature}>Full-text Search</span>
                </div>
              </div>
              <div className={styles.databaseCard}>
                <h3>MongoDB</h3>
                <p>
                  NoSQL document database for modern applications and big data
                </p>
                <div className={styles.databaseFeatures}>
                  <span className={styles.feature}>Document Store</span>
                  <span className={styles.feature}>Flexible Schema</span>
                  <span className={styles.feature}>Horizontal Scaling</span>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FiSettings className={styles.sectionIcon} />
              How It Works
            </h2>
            <div className={styles.workflowSteps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h3>Database Connection</h3>
                  <p>
                    Connect to your database using secure connection strings. We
                    support all major database types with encrypted connections.
                  </p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h3>SandboxDB Creation</h3>
                  <p>
                    Our system creates an optimized, secure copy of your data in
                    our SandboxDB for safe querying and testing.
                  </p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h3>Query Execution</h3>
                  <p>
                    Execute queries against the sandbox environment with
                    real-time results and performance metrics.
                  </p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>4</div>
                <div className={styles.stepContent}>
                  <h3>Results & Export</h3>
                  <p>
                    View results in interactive tables, charts, and export in
                    various formats for further analysis.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FiZap className={styles.sectionIcon} />
              Keyboard Shortcuts
            </h2>
            <div className={styles.shortcutsGrid}>
              <div className={styles.shortcutGroup}>
                <h3>Playground</h3>
                <div className={styles.shortcut}>
                  <kbd>Ctrl + Enter</kbd>
                  <span>Execute Query</span>
                </div>
                <div className={styles.shortcut}>
                  <kbd>Ctrl + S</kbd>
                  <span>Save Playground</span>
                </div>
                <div className={styles.shortcut}>
                  <kbd>Ctrl + /</kbd>
                  <span>Toggle Comment</span>
                </div>
              </div>
              <div className={styles.shortcutGroup}>
                <h3>Editor</h3>
                <div className={styles.shortcut}>
                  <kbd>Ctrl + F</kbd>
                  <span>Find in Query</span>
                </div>
                <div className={styles.shortcut}>
                  <kbd>Ctrl + H</kbd>
                  <span>Find & Replace</span>
                </div>
                <div className={styles.shortcut}>
                  <kbd>Ctrl + D</kbd>
                  <span>Duplicate Line</span>
                </div>
              </div>
            </div>
          </section>

          {/* Support Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Support & Resources</h2>
            <div className={styles.supportGrid}>
              <div className={styles.supportCard}>
                <h3>Getting Help</h3>
                <p>
                  Need assistance? Our support team is here to help you make the
                  most of your SQL playground experience.
                </p>
                <ul>
                  <li>Check our FAQ section</li>
                  <li>Browse example queries</li>
                  <li>Contact support team</li>
                </ul>
              </div>
              <div className={styles.supportCard}>
                <h3>Best Practices</h3>
                <p>
                  Follow these guidelines to get the best performance and
                  results from your queries.
                </p>
                <ul>
                  <li>Use indexes effectively</li>
                  <li>Limit result sets</li>
                  <li>Optimize JOIN operations</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DocumentationPage;
