import { useState } from "react";
import { FaDatabase, FaEdit, FaTrash, FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";
import styles from "./RecentPlaygrounds.module.css";

type Playground = {
  id: string;
  name: string;
  database: string;
  lastModified: string;
  queries: number;
};

const RecentPlaygrounds = () => {
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([
    {
      id: "1",
      name: "Sales Analysis",
      database: "Sales DB",
      lastModified: "2 hours ago",
      queries: 12,
    },
    {
      id: "2",
      name: "User Metrics",
      database: "Analytics DB",
      lastModified: "1 day ago",
      queries: 8,
    },
    {
      id: "3",
      name: "Inventory Check",
      database: "Inventory DB",
      lastModified: "3 days ago",
      queries: 5,
    },
    {
      id: "4",
      name: "Monthly Reports",
      database: "Reports DB",
      lastModified: "1 week ago",
      queries: 15,
    },
  ]);

  const handleDelete = (id: string) => {
    setPlaygrounds(playgrounds.filter((pg) => pg.id !== id));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <motion.div
      className={styles.recentContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>Recent Playgrounds</h2>
        <a href="/playgrounds" className={styles.viewAll}>
          View All <FaChevronRight />
        </a>
      </div>

      <motion.div
        className={styles.playgroundsList}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {playgrounds.length > 0 ? (
          playgrounds.map((playground) => (
            <motion.div
              key={playground.id}
              className={styles.playgroundCard}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
            >
              <div className={styles.playgroundInfo}>
                <h3 className={styles.playgroundName}>{playground.name}</h3>
                <div className={styles.playgroundMeta}>
                  <span className={styles.database}>
                    <FaDatabase /> {playground.database}
                  </span>
                  <span className={styles.lastModified}>
                    Last modified: {playground.lastModified}
                  </span>
                  <span className={styles.queries}>
                    {playground.queries} queries
                  </span>
                </div>
              </div>
              <div className={styles.playgroundActions}>
                <motion.button
                  className={`${styles.actionButton} ${styles.editButton}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    console.log(`Edit playground ${playground.id}`)
                  }
                >
                  <FaEdit />
                </motion.button>
                <motion.button
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(playground.id)}
                >
                  <FaTrash />
                </motion.button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className={styles.noPlaygrounds}>
            <p>You don't have any playgrounds yet.</p>
            <motion.a
              href="/playground/new"
              className={styles.createButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Your First Playground
            </motion.a>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RecentPlaygrounds;
