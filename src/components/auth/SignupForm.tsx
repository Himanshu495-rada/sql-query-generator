import { useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaCheck,
  FaGoogle,
  FaGithub,
} from "react-icons/fa";
import { motion } from "framer-motion";
import styles from "./SignupForm.module.css";

const SignupForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle signup logic
    console.log("Signup attempted with:", {
      username,
      email,
      password,
      agreeTerms,
    });
  };

  return (
    <motion.div
      className={styles.signupContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2
        className={styles.title}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Create Your Account
      </motion.h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <FaUser className={styles.inputIcon} />
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
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
        <div className={styles.inputGroup}>
          <FaLock className={styles.inputIcon} />
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <FaCheck className={styles.inputIcon} />
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className={styles.termsCheckbox}>
          <input
            type="checkbox"
            id="terms"
            checked={agreeTerms}
            onChange={() => setAgreeTerms(!agreeTerms)}
            required
          />
          <label htmlFor="terms">
            I agree to the{" "}
            <a href="/terms" className={styles.termsLink}>
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className={styles.termsLink}>
              Privacy Policy
            </a>
          </label>
        </div>

        <motion.button
          type="submit"
          className={styles.signupButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!agreeTerms}
        >
          Sign Up
        </motion.button>
      </form>

      <div className={styles.divider}>
        <span>or sign up with</span>
      </div>

      <div className={styles.socialSignups}>
        <motion.button
          className={`${styles.socialButton} ${styles.googleButton}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaGoogle /> Google
        </motion.button>
        <motion.button
          className={`${styles.socialButton} ${styles.githubButton}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaGithub /> GitHub
        </motion.button>
      </div>

      <p className={styles.loginPrompt}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </motion.div>
  );
};

export default SignupForm;
