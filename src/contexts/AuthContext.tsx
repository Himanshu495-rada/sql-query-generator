import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import authService from "../services/authService";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session when the app loads
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if token exists and set authentication state accordingly
        const hasToken = authService.isAuthenticated();
        setIsAuthenticated(hasToken);
        
        // If we have a token, try to get the user data
        if (hasToken) {
          const userData = await authService.getCurrentUser();
          if (userData) {
            setUser(userData);
          } else {
            // If we have a token but couldn't get user data, we'll still treat them as logged in
            // This prevents unnecessary logouts on temporary API issues
            console.log("Could not fetch user data, but token exists. Keeping user logged in.");
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        // Only log out if it's a critical auth error
        // For network issues, let's preserve the session
        if (err instanceof Error && err.message.includes("unauthorized")) {
          authService.logout();
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const userData = await authService.login({ 
        email, 
        password 
      });
      
      setUser(userData);
      setIsAuthenticated(true);
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
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
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
      if (!name || !email || !password) {
        throw new Error("Name, email, and password are required");
      }

      const userData = await authService.signup({
        name,
        email,
        password
      });
      
      setUser(userData);
      setIsAuthenticated(true);
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

      await authService.resetPassword(email);
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

      const updatedUser = await authService.updateProfile(data);
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

      await authService.updatePassword(currentPassword, newPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Auth context value is provided directly to the provider

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        signup,
        resetPassword,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
