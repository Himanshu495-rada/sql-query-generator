import { FaPlus, FaDatabase, FaPuzzlePiece, FaCog } from "react-icons/fa";
import { motion } from "framer-motion";
import styles from "./QuickActions.module.css";

const QuickActions = () => {
  const actions = [
    {
      icon: <FaPlus />,
      label: "New Playground",
      description: "Create a new SQL playground",
      path: "/playground/new",
      color: "#3498db",
    },
    {
      icon: <FaDatabase />,
      label: "Connect Database",
      description: "Connect to a new database",
      path: "/database/connect",
      color: "#2ecc71",
    },
    {
      icon: <FaPuzzlePiece />,
      label: "GUI Builder",
      description: "Create queries visually",
      path: "/gui-builder",
      color: "#f39c12",
    },
    {
      icon: <FaCog />,
      label: "Settings",
      description: "Manage your preferences",
      path: "/settings",
      color: "#9b59b6",
    },
  ];

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

  return (
    <motion.div
      className={styles.actionsContainer}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {actions.map((action, index) => (
        <motion.a
          key={index}
          href={action.path}
          className={styles.actionCard}
          variants={itemVariants}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
          }}
          whileTap={{ scale: 0.95 }}
        >
          <div
            className={styles.iconContainer}
            style={{ backgroundColor: action.color }}
          >
            {action.icon}
          </div>
          <h3 className={styles.actionLabel}>{action.label}</h3>
          <p className={styles.actionDescription}>{action.description}</p>
        </motion.a>
      ))}
    </motion.div>
  );
};

export default QuickActions;
