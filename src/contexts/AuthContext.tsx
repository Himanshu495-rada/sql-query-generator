import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
}

const initialAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  signup: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  updatePassword: async () => {},
};

const AuthContext = createContext<AuthContextType>(initialAuthContext);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session when the app loads
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // In a real app, this would be an API call to validate the session token
        const token = localStorage.getItem("authToken");

        if (token) {
          // Simulate fetching user data based on token
          // In a real app, you'd make an API call to fetch user data
          const userData = await simulateUserFetch(token);
          setUser(userData);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        localStorage.removeItem("authToken");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Mock function to simulate fetching user data
  const simulateUserFetch = async (token: string): Promise<User> => {
    // This would be an API call in a real application
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock user data
        const mockUser: User = {
          id: "123",
          name: "Demo User",
          email: "demo@example.com",
          avatarUrl: null,
        };
        resolve(mockUser);
      }, 500);
    });
  };

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, this would be an API call to your backend
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful login - would be your API response in a real app
      const mockUser: User = {
        id: "123",
        name: "Demo User",
        email: email,
        avatarUrl: null,
      };

      // Mock token - would come from your backend
      const mockToken = "mock-auth-token";

      // Store token in localStorage
      localStorage.setItem("authToken", mockToken);
      setUser(mockUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log in");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);

    try {
      // In a real app, you might also make an API call to invalidate the token on the server
      localStorage.removeItem("authToken");
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log out");
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate input
      if (!name || !email || !password) {
        throw new Error("Name, email, and password are required");
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful signup - would be your API response in a real app
      const mockUser: User = {
        id: "123",
        name: name,
        email: email,
        avatarUrl: null,
      };

      // Mock token - would come from your backend
      const mockToken = "mock-auth-token";

      // Store token in localStorage
      localStorage.setItem("authToken", mockToken);
      setUser(mockUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Password reset function
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!email) {
        throw new Error("Email is required");
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, this would send a reset email to the user
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("You must be logged in to update your profile");
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update user data - would be your API response in a real app
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update password
  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!currentPassword || !newPassword) {
        throw new Error("Current password and new password are required");
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, you would validate the current password and update to the new one
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update password"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create the context value
  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    signup,
    resetPassword,
    updateProfile,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
