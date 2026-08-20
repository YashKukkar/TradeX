import { useState, useEffect } from "react";
import Icon from "./Icon";
import PhoneInput from "./PhoneInput";
import localStyles from "./Settings.module.css";
import { useUpdateProfile, useChangePassword } from "../hooks/useDashboard";
import type { UserProfile } from "../utils/dashboardHelpers";

interface SecuritySettingsSectionProps {
  user?: UserProfile;
  showToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
  setErrorMsg: (msg: string) => void;
  setSuccessMsg: (msg: string) => void;
}

export default function SecuritySettingsSection({
  user,
  showToast,
  setErrorMsg,
  setSuccessMsg,
}: SecuritySettingsSectionProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullNameState, setFullNameState] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (user) {
      setPhoneNumber(user.phoneNumber || "");
      setFullNameState(user.fullName || "");
    }
  }, [user]);

  const updateProfileMutation = useUpdateProfile(
    () => {
      setSuccessMsg("Profile details updated successfully!");
      setErrorMsg("");
      showToast("Profile details updated successfully!", "success");
    },
    (err) => {
      setErrorMsg(err || "Failed to update profile");
      setSuccessMsg("");
      showToast(err || "Failed to update profile", "error");
    }
  );

  const changePasswordMutation = useChangePassword(
    () => {
      setSuccessMsg("Password changed successfully!");
      setErrorMsg("");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password changed successfully!", "success");
    },
    (err) => {
      setErrorMsg(err || "Failed to change password");
      setSuccessMsg("");
      showToast(err || "Failed to change password", "error");
    }
  );

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    updateProfileMutation.mutate({
      fullName: fullNameState,
      phoneNumber,
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirm password do not match");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters");
      return;
    }
    setErrorMsg("");
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className={localStyles.settingsCard}>
      <div className={localStyles.sectionHeader}>
        <h3 className={localStyles.sectionTitle}>Personal Details & Security</h3>
      </div>

      <form onSubmit={handleUpdateProfile} className={localStyles.profileForm}>
        <div className={localStyles.disabledInputContainer}>
          <label className={localStyles.fieldLabel}>Email Address</label>
          <input
            type="email"
            className={localStyles.inputField}
            value={user?.email || ""}
            disabled
          />
          <span className={localStyles.fieldHintHidden}>
            <Icon name="info" style={{ fontSize: "14px", marginRight: "4px" }} />
            Email address cannot be changed
          </span>
        </div>

        <div>
          <label className={localStyles.fieldLabel}>Full Name</label>
          <input
            type="text"
            className={localStyles.inputField}
            placeholder="e.g. Roshan Kumar"
            value={fullNameState}
            onChange={(e) => setFullNameState(e.target.value)}
          />
        </div>

        <div>
          <label className={localStyles.fieldLabel}>Phone Number</label>
          <PhoneInput
            value={phoneNumber}
            onChange={setPhoneNumber}
          />
        </div>

        <div className={localStyles.formActions}>
          <button
            type="submit"
            className={localStyles.saveBtn}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      <div className={localStyles.divider} />

      <div className={localStyles.passwordSection}>
        <div className={localStyles.sectionHeader}>
          <h3 className={localStyles.sectionTitle}>Password & Auth</h3>
          {!showPasswordForm && (
            <button
              type="button"
              onClick={() => setShowPasswordForm(true)}
              className={localStyles.linkBtn}
            >
              <Icon name="lock_reset" style={{ fontSize: "16px" }} />
              Change Password
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className={localStyles.passwordForm}>
            <div>
              <label className={localStyles.fieldLabel}>Current Password</label>
              <input
                type="password"
                className={localStyles.inputField}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={localStyles.fieldLabel}>New Password</label>
              <input
                type="password"
                className={localStyles.inputField}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={localStyles.fieldLabel}>Confirm New Password</label>
              <input
                type="password"
                className={localStyles.inputField}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className={localStyles.formActions}>
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className={localStyles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={localStyles.saveBtn}
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
