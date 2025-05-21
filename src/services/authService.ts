import axios from "axios";

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
  user: User;
  token: string;
}

// API base URL - in a real app, this would be in an environment variable
const API_URL =
  process.env.REACT_APP_API_URL || "https://api.sqlquerygenerator.com";

/**
 * Authentication service for handling user authentication operations
 */
class AuthService {
  /**
   * Logs in a user with email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      // For development/demo purposes, simulate a successful login
      if (process.env.NODE_ENV === "development") {
        const mockUser: User = {
          id: "123",
          name: "Demo User",
          email: credentials.email,
          avatarUrl: null,
        };

        // Store auth token in localStorage
        localStorage.setItem("authToken", "mock-auth-token");
        return mockUser;
      }

      // In production, make an actual API call
      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/login`,
        credentials
      );

      // Store auth token in localStorage
      localStorage.setItem("authToken", response.data.token);

      return response.data.user;
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
              `Login failed: ${error.response.data.message || "Unknown error"}`
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
      // For development/demo purposes, simulate a successful signup
      if (process.env.NODE_ENV === "development") {
        const mockUser: User = {
          id: "123",
          name: data.name,
          email: data.email,
          avatarUrl: null,
        };

        // Store auth token in localStorage
        localStorage.setItem("authToken", "mock-auth-token");
        return mockUser;
      }

      // In production, make an actual API call
      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/signup`,
        data
      );

      // Store auth token in localStorage
      localStorage.setItem("authToken", response.data.token);

      return response.data.user;
    } catch (error: any) {
      // Handle common error cases with user-friendly messages
      if (error.response) {
        switch (error.response.status) {
          case 409:
            throw new Error("Email is already registered");
          case 400:
            throw new Error(
              `Registration failed: ${
                error.response.data.message || "Invalid data"
              }`
            );
          default:
            throw new Error(
              `Registration failed: ${
                error.response.data.message || "Unknown error"
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
  logout(): void {
    localStorage.removeItem("authToken");
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

      // For development/demo purposes, return a mock user
      if (process.env.NODE_ENV === "development") {
        return {
          id: "123",
          name: "Demo User",
          email: "demo@example.com",
          avatarUrl: null,
        };
      }

      // In production, make an actual API call
      const response = await axios.get<User>(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
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
      const token = localStorage.getItem("authToken");

      if (!token) {
        throw new Error("Not authenticated");
      }

      // For development/demo purposes, return updated mock user
      if (process.env.NODE_ENV === "development") {
        return {
          id: "123",
          name: data.name || "Demo User",
          email: data.email || "demo@example.com",
          avatarUrl: data.avatarUrl || null,
        };
      }

      // In production, make an actual API call
      const response = await axios.put<User>(`${API_URL}/auth/profile`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to update profile: ${
            error.response.data.message || "Unknown error"
          }`
        );
      }

      throw new Error(
        "Network error. Please check your connection and try again."
      );
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
      const token = localStorage.getItem("authToken");

      if (!token) {
        throw new Error("Not authenticated");
      }

      // For development/demo purposes, do nothing
      if (process.env.NODE_ENV === "development") {
        return;
      }

      // In production, make an actual API call
      await axios.put(
        `${API_URL}/auth/password`,
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error: any) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error("Current password is incorrect");
          default:
            throw new Error(
              `Failed to update password: ${
                error.response.data.message || "Unknown error"
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
   * Sends a password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      // For development/demo purposes, do nothing
      if (process.env.NODE_ENV === "development") {
        return;
      }

      // In production, make an actual API call
      await axios.post(`${API_URL}/auth/reset-password`, { email });
    } catch (error: any) {
      // Even if the email doesn't exist, we don't want to reveal that for security reasons
      // So we just silently return instead of throwing an error
      console.error("Error sending password reset email", error);
    }
  }
}

export default new AuthService();
