import React, { useState, useEffect } from "react";
import styles from "./Navbar.module.css";
import Button from "./Button";
import { GoSidebarCollapse } from "react-icons/go";

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

  const handleLogout = () => {
    setIsDropdownOpen(false);
    onLogout?.();
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    onProfileClick?.();
  };

  const handleSettingsClick = () => {
    setIsDropdownOpen(false);
    onSettingsClick?.();
  };

  return (
    <header
      className={`${styles.navbarContainer} ${
        isScrolled ? styles.scrolled : ""
      }`}
    >
      <div className={styles.navbar}>
        <div className={styles.navbarLeft}>
          {/* I want to display sidebarcollapse button if sidebar is not visible */}
          {onToggleSidebar && !isSidebarVisible && (
            <button
              className={styles.sidebarToggle}
              onClick={onToggleSidebar}
              aria-label="Show sidebar"
            >
              <GoSidebarCollapse size={24} />
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
            )}
          </div>

          <div className={styles.navAuth}>
            {user ? (
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
                  <span
                    className={`${styles.dropdownArrow} ${
                      isDropdownOpen ? styles.dropdownActive : ""
                    }`}
                  ></span>
                </div>

                {isDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {onProfileClick && (
                      <button
                        onClick={handleProfileClick}
                        className={styles.dropdownItem}
                      >
                        Profile
                      </button>
                    )}
                    {onSettingsClick && (
                      <button
                        onClick={handleSettingsClick}
                        className={styles.dropdownItem}
                      >
                        Settings
                      </button>
                    )}
                    <div className={styles.dropdownDivider}></div>
                    {onLogout && (
                      <button
                        onClick={handleLogout}
                        className={styles.dropdownItem}
                      >
                        Logout
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              onLogin && (
                <Button variant="secondary" size="small" onClick={onLogin}>
                  Log In
                </Button>
              )
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
