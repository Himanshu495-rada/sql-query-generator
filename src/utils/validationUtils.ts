/**
 * Utility functions for form and data validation
 */

/**
 * Checks if a string is a valid email address
 */
export const isValidEmail = (email: string): boolean => {
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Checks if a password meets minimum security requirements
 */
export const validatePassword = (
  password: string
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Checks if a string is a valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Checks if a value is a valid number
 */
export const isValidNumber = (value: any): boolean => {
  if (typeof value === "number") return !isNaN(value);
  if (typeof value !== "string") return false;

  return !isNaN(Number(value));
};

/**
 * Checks if a value is a valid integer
 */
export const isValidInteger = (value: any): boolean => {
  if (!isValidNumber(value)) return false;

  const num = Number(value);
  return Number.isInteger(num);
};

/**
 * Checks if a value is within a specified range
 */
export const isInRange = (
  value: number,
  min?: number,
  max?: number
): boolean => {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
};

/**
 * Validates a form field based on rules
 */
export const validateField = (
  value: any,
  rules: ValidationRule[]
): ValidationResult => {
  for (const rule of rules) {
    switch (rule.type) {
      case "required":
        if (value === undefined || value === null || value === "") {
          return {
            isValid: false,
            error: rule.message || "This field is required",
          };
        }
        break;

      case "email":
        if (value && !isValidEmail(value)) {
          return {
            isValid: false,
            error: rule.message || "Please enter a valid email address",
          };
        }
        break;
      case "minLength":
        if (value && rule.value && value.length < rule.value) {
          return {
            isValid: false,
            error: rule.message || `Must be at least ${rule.value} characters`,
          };
        }
        break;
      case "maxLength":
        if (value && rule.value && value.length > rule.value) {
          return {
            isValid: false,
            error: rule.message || `Cannot exceed ${rule.value} characters`,
          };
        }
        break;

      case "pattern":
        if (value && !rule.pattern?.test(value)) {
          return { isValid: false, error: rule.message || "Invalid format" };
        }
        break;

      case "custom":
        if (rule.validator) {
          const isValid = rule.validator(value);
          if (!isValid) {
            return { isValid: false, error: rule.message || "Invalid value" };
          }
        }
        break;
    }
  }

  return { isValid: true };
};

/**
 * Validates a complete form
 */
export const validateForm = (
  formData: Record<string, any>,
  validationRules: Record<string, ValidationRule[]>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  Object.keys(validationRules).forEach((field) => {
    const rules = validationRules[field];
    const value = formData[field];

    const result = validateField(value, rules);
    if (!result.isValid && result.error) {
      errors[field] = result.error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Types for validation
interface ValidationRule {
  type: "required" | "email" | "minLength" | "maxLength" | "pattern" | "custom";
  message?: string;
  value?: number;
  pattern?: RegExp;
  validator?: (value: any) => boolean;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}
