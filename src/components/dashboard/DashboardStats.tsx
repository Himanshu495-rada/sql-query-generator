import { FaDatabase, FaCode, FaHistory, FaClock } from "react-icons/fa";
import { motion } from "framer-motion";
import styles from "./DashboardStats.module.css";

type StatsProps = {
  playgroundCount: number;
  queriesRun: number;
  connectedDatabases: number;
  lastActive: string;
};

const DashboardStats = ({
  playgroundCount,
  queriesRun,
  connectedDatabases,
  lastActive,
}: StatsProps) => {
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const stats = [
    {
      icon: <FaCode />,
      label: "Playgrounds",
      value: playgroundCount,
      color: "#3498db",
    },
    {
      icon: <FaHistory />,
      label: "Queries Run",
      value: queriesRun,
      color: "#e74c3c",
    },
    {
      icon: <FaDatabase />,
      label: "Connected DBs",
      value: connectedDatabases,
      color: "#2ecc71",
    },
    {
      icon: <FaClock />,
      label: "Last Active",
      value: lastActive,
      color: "#f39c12",
      isText: true,
    },
  ];

  return (
    <motion.div
      className={styles.statsContainer}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          className={styles.statCard}
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          style={{ borderColor: stat.color }}
        >
          <div
            className={styles.iconContainer}
            style={{ backgroundColor: stat.color }}
          >
            {stat.icon}
          </div>
          <div className={styles.statInfo}>
            <h3 className={styles.statValue}>
              {stat.isText ? stat.value : stat.value.toLocaleString()}
            </h3>
            <p className={styles.statLabel}>{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default DashboardStats;
