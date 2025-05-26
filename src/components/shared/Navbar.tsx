import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";
import Button from "./Button";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import {
  FiUser,
  FiSettings,
  FiLogOut,
  FiChevronDown,
  FiBook,
} from "react-icons/fi";
import ThemeToggle from "./ThemeToggle";
import authService from "../../services/authService";

interface NavbarProps {
  user?: {
    name: string;
    avatarUrl?: string;
  };
  onLogin?: () => void;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onToggleSidebar?: () => void;
  isSidebarVisible?: boolean;
  onCreatePlayground?: () => void;
  onDatabaseConnect?: () => void;
  appName?: string;
  logo?: React.ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogin,
  onLogout,
  onProfileClick,
  onSettingsClick,
  onToggleSidebar,
  isSidebarVisible,
  onCreatePlayground,
  onDatabaseConnect,
  appName = "SQL Query Generator",
  logo,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsDropdownOpen(false);
    onLogout?.();
    navigate("/login");
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    onProfileClick?.();
  };

  const handleSettingsClick = () => {
    setIsDropdownOpen(false);
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      navigate("/settings");
    }
  };

  return (
    <header
      className={`${styles.navbarContainer} ${
        isScrolled ? styles.scrolled : ""
      }`}
    >
      <div className={styles.navbar}>
        <div className={styles.navbarLeft}>
          {onToggleSidebar && (
            <button
              className={styles.sidebarToggle}
              onClick={onToggleSidebar}
              aria-label={isSidebarVisible ? "Hide sidebar" : "Show sidebar"}
            >
              {isSidebarVisible ? (
                <GoSidebarCollapse size={24} />
              ) : (
                <GoSidebarExpand size={24} />
              )}
            </button>
          )}

          <div className={styles.appBranding}>
            {logo && <div className={styles.logo}>{logo}</div>}
            <h1 className={styles.appTitle}>{appName}</h1>
          </div>
        </div>

        <div
          className={`${styles.navbarRight} ${
            isMenuOpen ? styles.menuActive : ""
          }`}
        >
          <div className={styles.navActions}>
            {onCreatePlayground && (
              <Button
                variant="primary"
                size="small"
                onClick={onCreatePlayground}
                icon="+"
              >
                New Playground
              </Button>
            )}
            {onDatabaseConnect && (
              <Button
                variant="secondary"
                size="small"
                onClick={onDatabaseConnect}
              >
                Connect DB
              </Button>
            )}{" "}
            <Button
              variant="outline"
              size="small"
              onClick={() => navigate("/gui-builder")}
            >
              GUI Builder
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={() => navigate("/documentation")}
              icon={<FiBook size={16} />}
            >
              Docs
            </Button>
          </div>

          <div className={styles.navAuth}>
            <ThemeToggle />

            {/* User Profile Button */}
            {user && (
              <div className={styles.userProfile} ref={dropdownRef}>
                <div
                  className={`${styles.userProfileButton} ${
                    isDropdownOpen ? styles.userProfileButtonActive : ""
                  }`}
                  onClick={toggleDropdown}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className={styles.userAvatar}
                    />
                  ) : (
                    <div className={styles.userAvatarPlaceholder}>
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span className={styles.userName}>{user.name}</span>
                  <FiChevronDown
                    size={16}
                    className={isDropdownOpen ? styles.dropdownActive : ""}
                    color="var(--color-text-secondary)"
                  />
                </div>

                {isDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {onProfileClick && (
                      <button
                        onClick={handleProfileClick}
                        className={styles.dropdownItem}
                      >
                        <FiUser size={16} />
                        Profile
                      </button>
                    )}
                    {/* Always show Settings button if user is logged in */}
                    <button
                      onClick={handleSettingsClick}
                      className={styles.dropdownItem}
                    >
                      <FiSettings size={16} />
                      Settings
                    </button>
                    <div className={styles.dropdownDivider}></div>
                    {/* Always show Logout button if user is logged in */}
                    <button
                      onClick={handleLogout}
                      className={styles.dropdownItem}
                    >
                      <FiLogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Login Button (if not logged in) */}
            {!user && onLogin && (
              <Button variant="secondary" size="small" onClick={onLogin}>
                Log In
              </Button>
            )}
          </div>
        </div>

        <button
          className={`${styles.mobileMenuButton} ${
            isMenuOpen ? styles.mobileMenuActive : ""
          }`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span className={styles.menuBar}></span>
          <span className={styles.menuBar}></span>
          <span className={styles.menuBar}></span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
