import React from 'react';
import styles from './DatabaseSelector.module.css';

interface Database {
  id: string;
  name: string;
  type?: string;
  status?: 'connected' | 'disconnected' | 'error';
}

interface DatabaseSelectorProps {
  databases: Database[];
  selectedDatabase?: string;
  onDatabaseChange: (databaseId: string) => void;
}

export const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({
  databases,
  selectedDatabase,
  onDatabaseChange,
}) => {
  const getDatabaseIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'mysql':
        return '🐬';
      case 'postgresql':
        return '🐘';
      case 'sqlserver':
        return '🔷';
      case 'oracle':
        return '🔶';
      case 'sqlite':
        return '📄';
      default:
        return '💾';
    }
  };

  const getStatusIcon = (status?: 'connected' | 'disconnected' | 'error') => {
    switch (status) {
      case 'connected':
        return <span className={`${styles.statusIndicator} ${styles.connected}`}>●</span>;
      case 'disconnected':
        return <span className={`${styles.statusIndicator} ${styles.disconnected}`}>●</span>;
      case 'error':
        return <span className={`${styles.statusIndicator} ${styles.error}`}>●</span>;
      default:
        return null;
    }
  };

  return (
    <div className={styles.databaseSelector}>
      <select
        value={selectedDatabase || ''}
        onChange={(e) => onDatabaseChange(e.target.value)}
        className={styles.select}
      >
        {databases.map((db) => (
          <option key={db.id} value={db.id}>
            {getDatabaseIcon(db.type)} {db.name} {getStatusIcon(db.status)}
          </option>
        ))}
      </select>
    </div>
  );
}; 