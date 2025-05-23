import React, { useState } from "react";
import styles from "./SignupPage.module.css";
import Button from "../components/shared/Button";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const SignupPage: React.FC = () => {
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong" | null
  >(null);

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  // Navigation and location hooks
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state (if any)
  const from = location.state?.from || "/";

  // Auth context for signup functionality
  const { signup, isLoading, error } = useAuth();

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }

    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const score = [
      hasLowerCase,
      hasUpperCase,
      hasNumbers,
      hasSpecialChar,
      isLongEnough,
    ].filter(Boolean).length;

    if (score <= 2) {
      setPasswordStrength("weak");
    } else if (score <= 4) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("strong");
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    if (!name.trim()) {
      errors.name = "Name is required";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!agreeTerms) {
      errors.terms = "You must agree to the terms and conditions";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle signup form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await signup(name, email, password);
      // Navigate to the original intended destination or default to dashboard
      navigate(from, { replace: true });
    } catch (err) {
      // Error is handled by auth context
      console.error("Signup error:", err);
    }
  };

  return (
    <div className={styles.signupPage}>
      <div className={styles.signupContainer}>
        <div className={styles.signupImageContainer}>
          <div className={styles.signupImage}>
            <div className={styles.imageOverlay}></div>
            <div className={styles.imageContent}>
              <h2>SQL Query Generator</h2>
              <p>
                Start your journey with our powerful SQL query generation tool
              </p>
              <ul>
                <li>Connect to any database or use our trial databases</li>
                <li>Generate SQL from natural language prompts</li>
                <li>Build queries visually with an intuitive interface</li>
                <li>Save and organize your work in playgrounds</li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.signupFormContainer}>
          <div className={styles.signupHeader}>
            <div className={styles.logoContainer}>
              <div className={styles.logo}>SQL</div>
            </div>
            <h1>Create an account</h1>
            <p>Start your SQL journey with a free account</p>
          </div>

          <form className={styles.signupForm} onSubmit={handleSubmit}>
            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                autoFocus
                className={formErrors.name ? styles.inputError : ""}
              />
              {formErrors.name && (
                <div className={styles.fieldError}>{formErrors.name}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className={formErrors.email ? styles.inputError : ""}
              />
              {formErrors.email && (
                <div className={styles.fieldError}>{formErrors.email}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  checkPasswordStrength(e.target.value);
                }}
                placeholder="Create a strong password"
                required
                className={formErrors.password ? styles.inputError : ""}
              />
              {passwordStrength && (
                <div className={styles.passwordStrength}>
                  <div
                    className={`${styles.strengthBar} ${styles[passwordStrength]}`}
                  ></div>
                  <div className={styles.strengthText}>
                    Password strength: {passwordStrength}
                  </div>
                </div>
              )}
              {formErrors.password && (
                <div className={styles.fieldError}>{formErrors.password}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className={formErrors.confirmPassword ? styles.inputError : ""}
              />
              {formErrors.confirmPassword && (
                <div className={styles.fieldError}>
                  {formErrors.confirmPassword}
                </div>
              )}
            </div>

            <div className={styles.termsAgreement}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span className={styles.checkmark}></span>I agree to the{" "}
                <a href="/terms" target="_blank">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank">
                  Privacy Policy
                </a>
              </label>
              {formErrors.terms && (
                <div className={styles.fieldError}>{formErrors.terms}</div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isLoading}
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </form>

          <div className={styles.divider}>
            <span>Or continue with</span>
          </div>

          <div className={styles.socialSignups}>
            <button className={`${styles.socialButton} ${styles.google}`}>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path
                    fill="#4285F4"
                    d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                  />
                  <path
                    fill="#34A853"
                    d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                  />
                </g>
              </svg>
              <span>Google</span>
            </button>
            <button className={`${styles.socialButton} ${styles.github}`}>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          <div className={styles.loginPrompt}>
            Already have an account? <a href="/login">Log in</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
