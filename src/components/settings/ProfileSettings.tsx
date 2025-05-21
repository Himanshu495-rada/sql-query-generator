import React, { useState, useRef } from "react";
import styles from "./ProfileSettings.module.css";
import Button from "../shared/Button";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface ProfileSettingsProps {
  userProfile: UserProfile;
  onUpdateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  onUpdatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  userProfile,
  onUpdateProfile,
  onUpdatePassword,
}) => {
  // Profile form state
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    userProfile.avatarUrl
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState<string | null>(
    null
  );

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong" | null
  >(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);
  const [passwordUpdateError, setPasswordUpdateError] = useState<string | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);

      // In a real implementation, you would upload the file to a server here
      // and get back a URL to use for the avatar
    }
  };

  // Trigger file input click when avatar is clicked
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Evaluate password strength
  const evaluatePasswordStrength = (
    password: string
  ): "weak" | "medium" | "strong" | null => {
    if (!password) return null;

    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const score = [
      hasLowerCase,
      hasUpperCase,
      hasNumbers,
      hasSpecialChars,
      isLongEnough,
    ].filter(Boolean).length;

    if (score <= 2) return "weak";
    if (score <= 4) return "medium";
    return "strong";
  };

  // Handle password input change
  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setNewPassword(password);
    setPasswordStrength(evaluatePasswordStrength(password));
  };

  // Submit profile update form
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setProfileUpdateSuccess(false);
    setProfileUpdateError(null);

    try {
      await onUpdateProfile({
        name,
        email,
        // In a real implementation, you would include the avatar URL here
        // after it has been uploaded to a server
      });
      setProfileUpdateSuccess(true);
    } catch (error) {
      setProfileUpdateError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Submit password update form
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordUpdateError("New passwords do not match");
      return;
    }

    if (passwordStrength === "weak") {
      setPasswordUpdateError("Password is too weak");
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordUpdateSuccess(false);
    setPasswordUpdateError(null);

    try {
      await onUpdatePassword(currentPassword, newPassword);
      setPasswordUpdateSuccess(true);
      // Reset form fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStrength(null);
    } catch (error) {
      setPasswordUpdateError(
        error instanceof Error ? error.message : "Failed to update password"
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className={styles.profileSettingsContainer}>
      <h2 className={styles.sectionTitle}>Account Settings</h2>

      {/* Profile Section */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionSubtitle}>Profile Information</h3>

        <form onSubmit={handleProfileSubmit} className={styles.form}>
          <div className={styles.avatarSection}>
            <div
              className={styles.avatar}
              onClick={handleAvatarClick}
              style={{
                backgroundImage: avatarPreview
                  ? `url(${avatarPreview})`
                  : "none",
              }}
            >
              {!avatarPreview && (
                <div className={styles.avatarPlaceholder}>
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={styles.avatarOverlay}>
                <span className={styles.avatarOverlayText}>Change</span>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className={styles.fileInput}
            />
            <div className={styles.avatarHint}>
              Click on the avatar to upload a new image
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
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
            />
          </div>

          {profileUpdateSuccess && (
            <div className={styles.successMessage}>
              Profile updated successfully!
            </div>
          )}

          {profileUpdateError && (
            <div className={styles.errorMessage}>{profileUpdateError}</div>
          )}

          <div className={styles.formActions}>
            <Button type="submit" variant="primary" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </div>

      {/* Password Section */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionSubtitle}>Change Password</h3>

        <form onSubmit={handlePasswordSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="current-password">Current Password</label>
            <input
              type="password"
              id="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="new-password">New Password</label>
            <input
              type="password"
              id="new-password"
              value={newPassword}
              onChange={handleNewPasswordChange}
              placeholder="Enter new password"
              required
            />

            {passwordStrength && (
              <div
                className={`${styles.passwordStrengthIndicator} ${styles[passwordStrength]}`}
              >
                <div className={styles.passwordStrengthBar}></div>
                <span className={styles.passwordStrengthText}>
                  Password strength:{" "}
                  {passwordStrength.charAt(0).toUpperCase() +
                    passwordStrength.slice(1)}
                </span>
              </div>
            )}

            <ul className={styles.passwordRequirements}>
              <li className={newPassword.length >= 8 ? styles.fulfilled : ""}>
                At least 8 characters long
              </li>
              <li className={/[A-Z]/.test(newPassword) ? styles.fulfilled : ""}>
                Contains an uppercase letter
              </li>
              <li className={/[a-z]/.test(newPassword) ? styles.fulfilled : ""}>
                Contains a lowercase letter
              </li>
              <li className={/\d/.test(newPassword) ? styles.fulfilled : ""}>
                Contains a number
              </li>
              <li
                className={
                  /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                    ? styles.fulfilled
                    : ""
                }
              >
                Contains a special character
              </li>
            </ul>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirm-password">Confirm New Password</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />

            {confirmPassword && newPassword !== confirmPassword && (
              <div className={styles.passwordMismatch}>
                Passwords do not match
              </div>
            )}
          </div>

          {passwordUpdateSuccess && (
            <div className={styles.successMessage}>
              Password updated successfully!
            </div>
          )}

          {passwordUpdateError && (
            <div className={styles.errorMessage}>{passwordUpdateError}</div>
          )}

          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="primary"
              disabled={isUpdatingPassword || newPassword !== confirmPassword}
            >
              {isUpdatingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
