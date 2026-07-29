import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./components/Icon";
import dashboardStyles from "./Dashboard.module.css";
import localStyles from "./components/Settings.module.css";
import DashboardSkeleton from "./components/DashboardSkeleton";
import { getDisplayName, formatDate } from "./utils/dashboardHelpers";
import { isAdminRole } from "./utils/permissions";
import {
  useCurrentUser,
  useUpdateProfile,
  useChangePassword,
  useAddBankAccount,
  useSetPrimaryBankAccount,
  useDeleteBankAccount,
  useLogout,
} from "./hooks/useDashboard";
import { useToast } from "./context/ToastContext";

// ── Bank Logo Stylist ──────────────────────────────────────────────────────────

function getBankLogo(bankName: string) {
  const name = bankName.toLowerCase();
  let initials = name.substring(0, 2).toUpperCase();
  let bgColor = "rgba(255, 255, 255, 0.03)";
  let textColor = "var(--muted)";
  
  if (name.includes("hdfc")) {
    bgColor = "#1e3a8a"; // HDFC Dark Blue
    textColor = "#ffffff";
    initials = "HD";
  } else if (name.includes("state bank") || name.includes("sbi")) {
    bgColor = "#00a2e8"; // SBI Light Blue
    textColor = "#ffffff";
    initials = "SB";
  } else if (name.includes("icici")) {
    bgColor = "#ea580c"; // ICICI Orange
    textColor = "#ffffff";
    initials = "IC";
  } else if (name.includes("axis")) {
    bgColor = "#800020"; // Axis Maroon
    textColor = "#ffffff";
    initials = "AX";
  } else if (name.includes("kotak")) {
    bgColor = "#e11d48"; // Kotak Red
    textColor = "#ffffff";
    initials = "KO";
  } else if (name.includes("paytm")) {
    bgColor = "#002e6e"; // Paytm Blue
    textColor = "#ffffff";
    initials = "PY";
  } else {
    // Dynamically derive initials from space separated words
    const words = bankName.trim().split(/\s+/);
    if (words.length > 1 && words[0] && words[1]) {
      initials = (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    } else {
      initials = bankName.substring(0, 2).toUpperCase();
    }
  }

  return (
    <div className={localStyles.bankLogoPlaceholder} style={{ backgroundColor: bgColor, color: textColor }}>
      {initials}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Settings() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser();
  const isAdmin = isAdminRole(user);

  const [phoneNumber, setPhoneNumber] = useState("");
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

  useEffect(() => {
    if (user) {
      setPhoneNumber(user.phoneNumber || "");
    }
  }, [user]);

  useEffect(() => {
    if (userError) {
      localStorage.clear();
      navigate("/login");
    }
  }, [userError, navigate]);

  useEffect(() => {
    if (isAdminRole(user)) {
      document.documentElement.setAttribute("data-theme", "admin");
    }
    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, [user]);

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const updateProfileMutation = useUpdateProfile(
    () => {
      setSuccessMsg("Phone number updated successfully!");
      showToast("Phone number updated successfully!", "success");
      setTimeout(clearMessages, 3000);
    },
    (err) => {
      setErrorMsg(err);
      showToast(err, "error");
    }
  );

  const changePasswordMutation = useChangePassword(
    () => {
      setSuccessMsg("Password changed successfully!");
      showToast("Password changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      setTimeout(clearMessages, 3000);
    },
    (err) => {
      setErrorMsg(err);
      showToast(err, "error");
    }
  );

  const addBankMutation = useAddBankAccount(
    () => {
      setSuccessMsg("Bank account linked successfully!");
      showToast("Bank account linked successfully!", "success");
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
      showToast(err, "error");
    }
  );

  const setPrimaryMutation = useSetPrimaryBankAccount(
    () => {
      setSuccessMsg("Primary bank account updated!");
      showToast("Primary bank account updated!", "success");
      setTimeout(clearMessages, 3000);
    },
    (err) => {
      setErrorMsg(err);
      showToast(err, "error");
    }
  );

  const deleteBankMutation = useDeleteBankAccount(
    () => {
      setSuccessMsg("Bank account removed successfully!");
      showToast("Bank account removed successfully!", "success");
      setTimeout(clearMessages, 3000);
    },
    (err) => {
      setErrorMsg(err);
      showToast(err, "error");
    }
  );

  const logoutMutation = useLogout(() => {
    navigate("/login");
  });

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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (userLoading) {
    return <DashboardSkeleton />;
  }

  const email = user?.email || "";
  const displayName = user ? getDisplayName(user.email) : "";
  const memberSince = user?.createdAt ? formatDate(user.createdAt) : "";

  return (
    <div className={`${dashboardStyles.wrapper} ${isAdmin ? dashboardStyles.adminWrapper : ""}`}>
      
      {/* Universal Header */}
      <header className={`${dashboardStyles.header} ${isAdmin ? dashboardStyles.adminHeader : ""}`}>
        <div className={dashboardStyles.headerLeft}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/dashboard");
            }}
            className={dashboardStyles.brand}
          >
            Trade<span className={dashboardStyles.brandAccent}>X</span>
            {isAdmin && <span className={dashboardStyles.brandAdminBadge}>SYSTEM</span>}
          </a>
        </div>
        <div className={dashboardStyles.headerRight}>
          <div
            className={`${dashboardStyles.userMenu} ${isAdmin ? dashboardStyles.adminUserMenu : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setMenuOpen(!menuOpen);
              }
            }}
            role="button"
            tabIndex={0}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <div className={`${dashboardStyles.avatar} ${isAdmin ? dashboardStyles.adminAvatar : ""}`}>
              {isAdmin ? "⚡" : (displayName.charAt(0) || "U")}
            </div>
            <span className={dashboardStyles.userName}>{displayName || "Loading..."}</span>
            <span className={dashboardStyles.chevron}>
              <Icon name={menuOpen ? "arrow_drop_up" : "arrow_drop_down"} />
            </span>
            {menuOpen && (
              <div className={`${dashboardStyles.dropdown} ${isAdmin ? dashboardStyles.adminDropdown : ""}`}>
                <div className={dashboardStyles.dropdownEmail}>{email}</div>
                {memberSince && (
                  <div className={dashboardStyles.dropdownMeta}>Member since {memberSince}</div>
                )}
                <div className={dashboardStyles.dropdownDivider} />
                <button
                  className={dashboardStyles.dropdownItem}
                  onClick={() => navigate("/dashboard")}
                >
                  <Icon name="dashboard" style={{ fontSize: "16px", color: "var(--primary)" }} />
                  Dashboard
                </button>
                <button className={dashboardStyles.dropdownLogout} onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Settings Body */}
      <main className={dashboardStyles.main}>
        <div className={localStyles.container}>
          
          <div className={localStyles.pageHeader}>
            <button
              onClick={() => navigate("/dashboard")}
              className={localStyles.backBtn}
            >
              <Icon name="arrow_back" style={{ fontSize: "18px" }} />
              Back
            </button>
            <div className={localStyles.pageTitleSection}>
              <h1 className={localStyles.pageTitle}>Account Settings</h1>
              <p className={localStyles.pageSubtitle}>
                Manage your profile details, security settings, and bank accounts
              </p>
            </div>
          </div>

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

          <div className={localStyles.settingsGrid}>
            
            {/* Left Card: Bank Accounts */}
            <div className={localStyles.settingsCard}>
              <div className={localStyles.sectionHeader}>
                <h3 className={localStyles.sectionTitle}>Linked Bank Accounts</h3>
                {!showAddForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className={localStyles.linkBtn}
                  >
                    <Icon name="add" style={{ fontSize: "16px" }} />
                    Link New Bank
                  </button>
                )}
              </div>

              <div className={localStyles.bankList}>
                {(!user || !user.bankAccounts || user.bankAccounts.length === 0) ? (
                  <div className={localStyles.emptyState}>No bank accounts linked yet.</div>
                ) : (
                  [...user.bankAccounts]
                    .sort((a, b) => (a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1))
                    .map((account) => {
                      const cleanHolderName = account.holderName.includes("@")
                        ? getDisplayName(account.holderName)
                        : account.holderName;
                      return (
                        <div
                          key={account.id}
                          className={`${localStyles.bankCard} ${account.isPrimary ? localStyles.bankCardPrimary : ""}`}
                        >
                          <div className={localStyles.bankLeft}>
                            {getBankLogo(account.bankName)}
                            <div className={localStyles.bankInfo}>
                              <div className={localStyles.bankNameRow}>
                                <span className={localStyles.bankName}>{account.bankName}</span>
                                {account.isPrimary && (
                                  <span className={localStyles.primaryBadge}>Primary</span>
                                )}
                              </div>
                              <div className={localStyles.bankDetailsText}>
                                {cleanHolderName} &bull; A/C: {account.accountNumber} &bull; IFSC: {account.ifscCode}
                              </div>
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
                                  aria-label="Remove bank account"
                                >
                                  <Icon name="delete" style={{ fontSize: "18px" }} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
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

            {/* Right Card: Profile Info & Change Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              
              {/* Profile Details Settings */}
              <div className={localStyles.settingsCard}>
                <div className={localStyles.sectionHeader}>
                  <h3 className={localStyles.sectionTitle}>Profile Information</h3>
                </div>

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
              </div>

              {/* Password Section */}
              <div className={localStyles.settingsCard}>
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

          </div>

        </div>
      </main>

    </div>
  );
}
