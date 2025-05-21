import { useState } from "react";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";
import { motion } from "framer-motion";
import styles from "./PasswordReset.module.css";

const PasswordReset = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password reset logic
    console.log("Password reset requested for:", email);
    setIsSubmitted(true);
  };

  return (
    <motion.div
      className={styles.resetContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <a href="/login" className={styles.backLink}>
        <FaArrowLeft /> Back to Login
      </a>

      <motion.h2
        className={styles.title}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Reset Your Password
      </motion.h2>

      {!isSubmitted ? (
        <>
          <p className={styles.instructions}>
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <FaEnvelope className={styles.inputIcon} />
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <motion.button
              type="submit"
              className={styles.resetButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Send Reset Link
            </motion.button>
          </form>
        </>
      ) : (
        <motion.div
          className={styles.successMessage}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.checkmarkContainer}>
            <motion.div
              className={styles.checkmark}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              ✓
            </motion.div>
          </div>
          <h3>Check your inbox</h3>
          <p>
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p>
            Please check your email and follow the instructions to reset your
            password.
          </p>
          <motion.button
            className={styles.returnButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSubmitted(false)}
          >
            Try another email
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PasswordReset;
