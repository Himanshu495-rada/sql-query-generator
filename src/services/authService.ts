import axios from "axios";
import api from "../utils/api";

// Define types for authentication
interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

// API base URL - use the same value from window.__ENV__ that api.ts uses
const API_URL = window.__ENV__?.REACT_APP_API_URL || "http://localhost:3000/api";

/**
 * Authentication service for handling user authentication operations
 */
class AuthService {
  /**
   * Logs in a user with email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/login`,
        credentials
      );

      if (!response.data.success) {
        throw new Error("Login failed");
      }

      // Store auth token in localStorage
      localStorage.setItem("authToken", response.data.data.token);

      return response.data.data.user;
    } catch (error: any) {
      // Handle common error cases with user-friendly messages
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error("Invalid email or password");
          case 403:
            throw new Error("Account is locked. Please contact support");
          default:
            throw new Error(
              `Login failed: ${error.response.data.error?.message || "Unknown error"}`
            );
        }
      }

      throw new Error(
        "Network error. Please check your connection and try again."
      );
    }
  }

  /**
   * Registers a new user
   */
  async signup(data: SignupData): Promise<User> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/register`,
        data
      );

      if (!response.data.success) {
        throw new Error("Registration failed");
      }

      // Store auth token in localStorage
      localStorage.setItem("authToken", response.data.data.token);

      return response.data.data.user;
    } catch (error: any) {
      // Handle common error cases with user-friendly messages
      if (error.response) {
        switch (error.response.status) {
          case 409:
            throw new Error("Email is already registered");
          case 400:
            throw new Error(
              `Registration failed: ${
                error.response.data.error?.message || "Invalid data"
              }`
            );
          default:
            throw new Error(
              `Registration failed: ${
                error.response.data.error?.message || "Unknown error"
              }`
            );
        }
      }

      throw new Error(
        "Network error. Please check your connection and try again."
      );
    }
  }

  /**
   * Logs out the current user
   */
  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem("authToken");
      
      if (token) {
        await axios.post(
          `${API_URL}/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("authToken");
    }
  }

  /**
   * Checks if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem("authToken");
  }

  /**
   * Gets the current user's information
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        return null;
      }

      const response = await api.get<{ user: User }>('auth/me');
      return response.user;
    } catch (error) {
      // If there's an error, clear the token and return null
      localStorage.removeItem("authToken");
      return null;
    }
  }

  /**
   * Updates user profile information
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await api.put<{ user: User }>('users/profile', data);
      return response.user;
    } catch (error: any) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to update profile");
    }
  }

  /**
   * Updates user password
   */
  async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      await api.put('users/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to update password");
    }
  }

  /**
   * Initiates password reset flow
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await api.post('auth/forgot-password', { email });
    } catch (error: any) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to reset password");
    }
  }
}

export default new AuthService();
