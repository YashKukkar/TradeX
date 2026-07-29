import { useState } from "react";
import Icon from "./Icon";
import Modal from "./Modal";
import adminStyles from "../AdminUsers.module.css";
import localStyles from "./ProfileSettingsModal.module.css";
import type { UserProfile } from "../utils/dashboardHelpers";
import {
  useUpdateProfile,
  useChangePassword,
  useAddBankAccount,
  useSetPrimaryBankAccount,
  useDeleteBankAccount,
} from "../hooks/useDashboard";

interface ProfileSettingsModalProps {
  user: UserProfile;
  onClose: () => void;
}

export default function ProfileSettingsModal({ user, onClose }: ProfileSettingsModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [bankName, setBankName] = useState("");
  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const updateProfileMutation = useUpdateProfile(
    () => {
      setSuccessMsg("Phone number updated successfully!");
      setTimeout(clearMessages, 3000);
    },
    (err) => {
      setErrorMsg(err);
    }
  );

  const changePasswordMutation = useChangePassword(
    () => {
      setSuccessMsg("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      setTimeout(clearMessages, 3000);
    },
    (err) => {
      setErrorMsg(err);
    }
  );

  const addBankMutation = useAddBankAccount(
    () => {
      setSuccessMsg("Bank account linked successfully!");
      setBankName("");
      setHolderName("");
      setAccountNumber("");
      setIfscCode("");
      setIsPrimary(false);
      setShowAddForm(false);
      setTimeout(clearMessages, 3000);
    },
    (err) => {
      setErrorMsg(err);
    }
  );

  const setPrimaryMutation = useSetPrimaryBankAccount(
    () => {
      setSuccessMsg("Primary bank account updated!");
      setTimeout(clearMessages, 3000);
    },
    (err) => {
      setErrorMsg(err);
    }
  );

  const deleteBankMutation = useDeleteBankAccount(
    () => {
      setSuccessMsg("Bank account removed successfully!");
      setTimeout(clearMessages, 3000);
    },
    (err) => {
      setErrorMsg(err);
    }
  );

  const handleUpdatePhone = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!phoneNumber.trim()) {
      setErrorMsg("Phone number cannot be empty");
      return;
    }
    updateProfileMutation.mutate({ phoneNumber: phoneNumber.trim() });
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!bankName.trim() || !holderName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
      setErrorMsg("All bank account fields are required");
      return;
    }
    addBankMutation.mutate({
      bankName: bankName.trim(),
      holderName: holderName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim(),
      isPrimary,
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters");
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <div className={localStyles.headerTitleWrapper}>
          <div className={localStyles.iconWrapper}>
            <Icon name="manage_accounts" style={{ color: "var(--primary)", fontSize: "20px" }} />
          </div>
          <div className={localStyles.headerText}>
            <h2 className={localStyles.headerTitle}>Manage Profile & Banks</h2>
          </div>
        </div>
      }
      subtitle="Update security options and payment destination accounts"
      size="lg"
    >
      <div className={adminStyles.modalBody}>
        {errorMsg && (
          <div className={`${localStyles.alert} ${localStyles.alertError}`}>
            <Icon name="error" style={{ fontSize: "16px" }} />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className={`${localStyles.alert} ${localStyles.alertSuccess}`}>
            <Icon name="check_circle" style={{ fontSize: "16px" }} />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleUpdatePhone} className={localStyles.formGroup}>
          <label className={localStyles.label}>Phone Number</label>
          <div className={localStyles.inputRow}>
            <input
              type="text"
              className={localStyles.inputField}
              placeholder="+919876543210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button
              type="submit"
              className={localStyles.primaryBtn}
              disabled={updateProfileMutation.isPending}
            >
              <Icon name="save" style={{ fontSize: "16px" }} />
              Save
            </button>
          </div>
        </form>

        {/* Linked Bank Accounts */}
        <div>
          <div className={localStyles.sectionHeader}>
            <h3 className={localStyles.sectionTitle}>Linked Bank Accounts</h3>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className={localStyles.linkBtn}
              >
                <Icon name="add" style={{ fontSize: "16px" }} />
                Link Bank
              </button>
            )}
          </div>

          <div className={localStyles.bankList}>
            {(user.bankAccounts || []).length === 0 ? (
              <div className={localStyles.emptyState}>No bank accounts linked yet.</div>
            ) : (
              (user.bankAccounts || []).map((account) => (
                <div key={account.id} className={localStyles.bankCard}>
                  <div className={localStyles.bankInfo}>
                    <div className={localStyles.bankNameRow}>
                      <span className={localStyles.bankName}>{account.bankName}</span>
                      {account.isPrimary && (
                        <span className={localStyles.primaryBadge}>Primary</span>
                      )}
                    </div>
                    <div className={localStyles.bankDetailsText}>
                      {account.holderName} &bull; A/C: {account.accountNumber} &bull; IFSC: {account.ifscCode}
                    </div>
                  </div>

                  <div className={localStyles.bankActions}>
                    {!account.isPrimary && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPrimaryMutation.mutate({ id: account.id })}
                          className={localStyles.makePrimaryBtn}
                          disabled={setPrimaryMutation.isPending}
                        >
                          Make Primary
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBankMutation.mutate({ id: account.id })}
                          className={localStyles.deleteBtn}
                          disabled={deleteBankMutation.isPending}
                        >
                          <Icon name="delete" style={{ fontSize: "18px" }} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Bank Form */}
          {showAddForm && (
            <form onSubmit={handleAddBank} className={localStyles.addBankForm}>
              <h4 className={localStyles.addBankTitle}>Link New Bank Account</h4>

              <div className={localStyles.inputGrid}>
                <div>
                  <label className={localStyles.fieldLabel}>Bank Name</label>
                  <input
                    type="text"
                    className={localStyles.inputField}
                    placeholder="e.g. HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div>
                  <label className={localStyles.fieldLabel}>Account Holder Name</label>
                  <input
                    type="text"
                    className={localStyles.inputField}
                    placeholder="e.g. John Doe"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                  />
                </div>
              </div>

              <div className={localStyles.inputGrid}>
                <div>
                  <label className={localStyles.fieldLabel}>Account Number</label>
                  <input
                    type="text"
                    className={localStyles.inputField}
                    placeholder="e.g. 50100234567"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className={localStyles.fieldLabel}>IFSC Code</label>
                  <input
                    type="text"
                    className={localStyles.inputField}
                    placeholder="e.g. HDFC0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                  />
                </div>
              </div>

              <div className={localStyles.checkboxRow}>
                <input
                  type="checkbox"
                  id="isPrimaryCheckbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                />
                <label htmlFor="isPrimaryCheckbox" className={localStyles.checkboxLabel}>
                  Set as my primary bank account
                </label>
              </div>

              <div className={localStyles.buttonRow}>
                <button
                  type="button"
                  className={localStyles.secondaryBtn}
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={localStyles.primaryBtn}
                  style={{ height: "38px" }}
                  disabled={addBankMutation.isPending}
                >
                  <Icon name="link" style={{ fontSize: "16px" }} />
                  Link Account
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Change Password */}
        <div className={localStyles.changePasswordSection}>
          <div className={localStyles.sectionHeader}>
            <h3 className={localStyles.sectionTitle}>Security & Credentials</h3>
            {!showPasswordForm && (
              <button
                type="button"
                onClick={() => setShowPasswordForm(true)}
                className={localStyles.linkBtn}
              >
                <Icon name="vpn_key" style={{ fontSize: "16px" }} />
                Change Password
              </button>
            )}
          </div>

          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className={localStyles.changePasswordForm}>
              <h4 className={localStyles.addBankTitle}>Change Password</h4>

              <div>
                <label className={localStyles.fieldLabel}>Current Password</label>
                <input
                  type="password"
                  className={localStyles.inputField}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className={localStyles.inputGrid}>
                <div>
                  <label className={localStyles.fieldLabel}>New Password</label>
                  <input
                    type="password"
                    className={localStyles.inputField}
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className={localStyles.fieldLabel}>Confirm New Password</label>
                  <input
                    type="password"
                    className={localStyles.inputField}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className={localStyles.buttonRow}>
                <button
                  type="button"
                  className={localStyles.secondaryBtn}
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={localStyles.primaryBtn}
                  style={{ height: "38px" }}
                  disabled={changePasswordMutation.isPending}
                >
                  <Icon name="save" style={{ fontSize: "16px" }} />
                  Update Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}
