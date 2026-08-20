import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";
import Icon from "./components/Icon";
import { useToast } from "./context/ToastContext";
import DashboardSkeleton from "./components/DashboardSkeleton";
import VerificationModal from "./components/VerificationModal";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import { getDisplayName, formatFullDate } from "./utils/dashboardHelpers";
import { isAdminRole } from "./utils/permissions";
import { safeStorage } from "./utils/api";
import {
  useCurrentUser,
  useVerification,
  useResendOtp,
  useLogout,
} from "./hooks/useDashboard";
import { config } from "./config";

export default function Dashboard() {
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { showToast } = useToast();

  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<"email" | "phone" | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser();

  const isAdmin = isAdminRole(user);

  const verifyMutation = useVerification(
    () => {
      setVerifySuccess(true);
      const targetLabel = verifyTarget === "email" ? "Email Address" : "Phone Number";
      showToast(`${targetLabel} verified successfully!`, "success");
      timeoutRef.current = setTimeout(() => {
        setShowVerifyModal(false);
        setVerifySuccess(false);
      }, 1500);
    },
    (err) => {
      setVerifyError(err);
      showToast(err, "error");
    }
  );

  const resendMutation = useResendOtp(
    () => { showToast("Verification OTP resent successfully!", "success"); },
    () => {}
  );

  const handleResendOtp = async () => {
    if (verifyTarget) {
      await resendMutation.mutateAsync({ target: verifyTarget });
    }
  };

  const logoutMutation = useLogout(() => {
    navigate("/login");
  });

  const startVerification = (target: "email" | "phone") => {
    setVerifyTarget(target);
    setVerifyError("");
    setVerifySuccess(false);
    setShowVerifyModal(true);
  };

  const handleVerifySubmit = (otpCode: string) => {
    if (verifyTarget) {
      verifyMutation.mutate({ target: verifyTarget, otpCode });
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  useEffect(() => {
    if (userError) {
      console.error("Dashboard initialization failed:", userError);
      safeStorage.clear();
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

  const copyInviteLink = () => {
    const link = `${config.websiteUrl}/signup?ref=${user?.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    showToast("Referral link copied to clipboard!", "success");
    timeoutRef.current = setTimeout(() => { setCopied(false); }, 2000);
  };

  const pageLoading = userLoading;
  const verifyLoading = verifyMutation.isPending;

  const email = user?.email || "";
  const displayName = user?.fullName || (user ? getDisplayName(user.email) : "");

  const getInitials = (name: string): string => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const referralCode = user?.referralCode || "";
  const pointsBalance = user?.pointsBalance ?? 0;
  const phoneNumber = user?.phoneNumber || "";
  const emailVerified = !!user?.emailVerified;
  const phoneVerified = !!user?.phoneVerified;
  const memberSince = user?.createdAt ? formatFullDate(user.createdAt) : "";

  if (pageLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className={`${styles.wrapper} ${isAdmin ? styles.adminWrapper : ""}`}>
      <header className={`${styles.header} ${isAdmin ? styles.adminHeader : ""}`}>
        <div className={styles.headerLeft}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/dashboard");
            }}
            className={styles.brand}
          >
            Trade<span className={styles.brandAccent}>X</span>
            {isAdmin && <span className={styles.brandAdminBadge}>SYSTEM</span>}
          </a>
        </div>
        <div className={styles.headerRight}>
          <div
            className={`${styles.userMenu} ${isAdmin ? styles.adminUserMenu : ""}`}
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
            <div className={`${styles.avatar} ${isAdmin ? styles.adminAvatar : ""}`}>
              {isAdmin ? "⚡" : getInitials(displayName)}
            </div>
            <span className={styles.userName}>{displayName || "Loading..."}</span>
            <span className={styles.chevron}>
              <Icon name={menuOpen ? "arrow_drop_up" : "arrow_drop_down"} />
            </span>
            {menuOpen && (
              <div className={`${styles.dropdown} ${isAdmin ? styles.adminDropdown : ""}`}>
                <div className={styles.dropdownEmail}>{email}</div>
                {memberSince && (
                  <div className={styles.dropdownMeta}>Member since {memberSince}</div>
                )}
                <div className={styles.dropdownDivider} />
                <button
                  className={styles.dropdownItem}
                  onClick={() => navigate("/settings")}
                >
                  <Icon name="manage_accounts" style={{ fontSize: "16px", color: "var(--primary)" }} />
                  Profile & Settings
                </button>
                <button className={styles.dropdownLogout} onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {isAdmin ? (
          <AdminDashboard
            displayName={displayName}
            userLoading={userLoading}
            user={user!}
          />
        ) : (
          <UserDashboard
            displayName={displayName}
            pointsBalance={pointsBalance}
            referralCode={referralCode}
            copied={copied}
            copyInviteLink={copyInviteLink}
            email={email}
            emailVerified={emailVerified}
            phoneNumber={phoneNumber}
            phoneVerified={phoneVerified}
            memberSince={memberSince}
            startVerification={startVerification}
            navigate={navigate}
            withdrawableBalance={user?.withdrawableBalance ?? 0}
            bonusBalance={user?.bonusBalance ?? 0}
          />
        )}
      </main>

      {showVerifyModal && verifyTarget && (
        <VerificationModal
          target={verifyTarget}
          onSubmit={handleVerifySubmit}
          onClose={() => setShowVerifyModal(false)}
          isLoading={verifyLoading}
          errorMsg={verifyError}
          isSuccess={verifySuccess}
          onResend={handleResendOtp}
        />
      )}

    </div>
  );
}
