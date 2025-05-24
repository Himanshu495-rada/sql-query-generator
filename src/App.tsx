import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DatabaseProvider } from "./contexts/DatabaseContext";
import authService from "./services/authService";

// Pages
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import PlaygroundPage from "./pages/PlaygroundPage";
import DatabaseConnectionPage from "./pages/DatabaseConnectionPage";
import DatabaseDetailsPage from "./pages/DatabaseDetailsPage";
import GuiBuilderPage from "./pages/GuiBuilderPage";
import SettingsPage from "./pages/SettingsPage";
import ChatPage from "./pages/ChatPage";

// Components
import LoadingSpinner from "./components/shared/LoadingSpinner";

// Styles
import "./App.css";

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="route-loader">
        <LoadingSpinner size="medium" color="primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated, and save the intended destination
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname + location.search }} 
        replace 
      />
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for valid token and preload user data if possible
    const initializeAuth = async () => {
      // Record start time to enforce minimum loading time
      const startTime = Date.now();
      
      try {
        if (authService.isAuthenticated()) {
          await authService.getCurrentUser();
        }
      } catch (error) {
        // Token invalid or expired, it will be cleared by the authService
        console.error("Auth initialization error:", error);
      } finally {
        // Enforce minimum loading time of 1 second
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 1000; // 1 second
        
        if (elapsedTime < minLoadingTime) {
          // If loading was too fast, wait for the remaining time
          setTimeout(() => {
            setIsLoading(false);
          }, minLoadingTime - elapsedTime);
        } else {
          // If loading took longer than minimum time, update immediately
          setIsLoading(false);
        }
      }
    };
    
    initializeAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="app-loader">
        <LoadingSpinner
          size="large"
          color="primary"
          text="Initializing application..."
        />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <DatabaseProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/playground/:id"
                element={
                  <ProtectedRoute>
                    <PlaygroundPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/playground"
                element={
                  <ProtectedRoute>
                    <PlaygroundPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/databases"
                element={
                  <ProtectedRoute>
                    <DatabaseConnectionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/databases/:id"
                element={
                  <ProtectedRoute>
                    <DatabaseDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gui-builder"
                element={
                  <ProtectedRoute>
                    <GuiBuilderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:templateType"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </DatabaseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
