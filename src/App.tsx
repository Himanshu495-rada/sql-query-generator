import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { DatabaseProvider } from "./contexts/DatabaseContext";

// Pages
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import PlaygroundPage from "./pages/PlaygroundPage";
import DatabaseConnectionPage from "./pages/DatabaseConnectionPage";
import DatabaseDetailsPage from "./pages/DatabaseDetailsPage";
import GuiBuilderPage from "./pages/GuiBuilderPage";
import SettingsPage from "./pages/SettingsPage";

// Components
import LoadingSpinner from "./components/shared/LoadingSpinner";

// Styles
import "./App.css";

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isAuthenticated = localStorage.getItem("authToken") !== null;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
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
