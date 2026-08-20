import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./components/Icon";
import dashboardStyles from "./Dashboard.module.css";
import localStyles from "./components/Settings.module.css";
import DashboardSkeleton from "./components/DashboardSkeleton";
import { getDisplayName, formatFullDate } from "./utils/dashboardHelpers";
import { isAdminRole } from "./utils/permissions";
import { safeStorage } from "./utils/api";
import { useCurrentUser, useLogout } from "./hooks/useDashboard";
import { useToast } from "./context/ToastContext";
import BankAccountsSection from "./components/BankAccountsSection";
import SecuritySettingsSection from "./components/SecuritySettingsSection";

export default function Settings() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { data: user, isLoading: userLoading } = useCurrentUser();
  const isAdmin = isAdminRole(user);

  const logoutMutation = useLogout();

  const handleLogout = () => {
    try {
      logoutMutation.mutate();
    } finally {
      safeStorage.clear();
      showToast("Logged out successfully", "info");
      navigate("/login");
    }
  };

  if (userLoading) {
    return <DashboardSkeleton />;
  }

  const email = user?.email || "";
  const displayName = user?.fullName || (user ? getDisplayName(user.email) : "");

  const getInitials = (name: string): string => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const memberSince = user?.createdAt ? formatFullDate(user.createdAt) : "";

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
              {isAdmin ? "⚡" : getInitials(displayName)}
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
            <BankAccountsSection
              user={user}
              showToast={showToast}
              setErrorMsg={setErrorMsg}
              setSuccessMsg={setSuccessMsg}
            />

            <SecuritySettingsSection
              user={user}
              showToast={showToast}
              setErrorMsg={setErrorMsg}
              setSuccessMsg={setSuccessMsg}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
