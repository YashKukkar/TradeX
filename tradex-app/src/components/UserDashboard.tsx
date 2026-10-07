import Icon from "./Icon";
import Card from "./Card";
import Modal from "./Modal";
import styles from "../Dashboard.module.css";
import { branding } from "../config";
import { useEffect, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import { useWalletData, usePublicSettings, useCurrentUser } from "../hooks/useDashboard";
import CashWalletSection from "./CashWalletSection";
import WalletActivityLog from "./WalletActivityLog";

const REDIRECT_SECONDS = 5;
const REDIRECT_URL = "https://www.google.com";

interface UserDashboardProps {
  displayName: string;
  pointsBalance: number;
  referralCode: string;
  copied: boolean;
  copyInviteLink: () => void;
  email: string;
  emailVerified: boolean;
  phoneNumber: string;
  phoneVerified: boolean;
  memberSince: string;
  startVerification: (target: "email" | "phone") => void;
  navigate: NavigateFunction;
  withdrawableBalance: number;
  bonusBalance: number;
}

export default function UserDashboard({
  displayName,
  pointsBalance,
  referralCode,
  copied,
  copyInviteLink,
  email,
  emailVerified,
  phoneNumber,
  phoneVerified,
  memberSince,
  startVerification,
  navigate,
  withdrawableBalance,
  bonusBalance,
}: UserDashboardProps) {
  const [tradingInfoOpen, setTradingInfoOpen] = useState(false);
  const [redirectSeconds, setRedirectSeconds] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!tradingInfoOpen) {
      setRedirectSeconds(REDIRECT_SECONDS);
      return;
    }
    if (redirectSeconds <= 0) {
      window.location.href = REDIRECT_URL;
      return;
    }
    const timer = setTimeout(() => setRedirectSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [tradingInfoOpen, redirectSeconds]);
  const { data: user } = useCurrentUser();
  const primaryBank = user?.bankAccounts?.find((b: any) => b.isPrimary);
  const accountNumber = primaryBank?.accountNumber || "";
  const { data: walletData } = useWalletData();
  const { data: publicSettings } = usePublicSettings();
  const transactions = walletData?.transactions || [];
  const hasDeposited = transactions.some(t => t.type === "DEPOSIT" && t.status === "SUCCESS");

  const getInitials = (name: string): string => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <>
      {/* Premium Welcome Hero Card */}
      <div className={styles.welcomeHero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <div className={styles.userAvatar}>
              <span>{getInitials(user?.fullName || displayName)}</span>
            </div>
            <div>
              <h1 className={styles.heroTitle}>
                Welcome back, <span className={styles.heroName}>{user?.firstName || displayName}</span>
              </h1>
              <p className={styles.heroSub}>
                Manage your funds, points and referrals, then head to trading.
              </p>
            </div>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.heroPointsCard}>
              <div className={styles.pointsBadge}>
                <Icon name="stars" style={{ fontSize: "var(--fs-lg)", color: "var(--accent)" }} />
                <span>{branding.pointsName}</span>
              </div>
              <div className={styles.pointsValue}>
                {pointsBalance.toLocaleString()} <span className={styles.ptsLabel}>PTS</span>
              </div>
            </div>
            <div className={styles.tradeBlock}>
              <button
                type="button"
                className={styles.tradeBtn}
                onClick={() => setTradingInfoOpen(true)}
              >
                Start trading
                <Icon name="arrow_outward" style={{ fontSize: "var(--fs-xl)" }} />
              </button>
              <div className={styles.tradeNote}>NSE futures, MCX and COMEX</div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={tradingInfoOpen}
        onClose={() => setTradingInfoOpen(false)}
        title="Redirecting to Google"
        subtitle="The trading platform is still being set up."
      >
        <p className={styles.tradeModalText}>
          We are redirecting you to Google in {redirectSeconds} second{redirectSeconds === 1 ? "" : "s"}.
          Your wallet, points and referrals here stay exactly as they are.
        </p>
        <button type="button" className={styles.tradeBtn} onClick={() => setTradingInfoOpen(false)}>
          Cancel
        </button>
      </Modal>

      <div className={styles.grid}>
        <CashWalletSection
          pointsBalance={pointsBalance}
          withdrawableBalance={withdrawableBalance}
          bonusBalance={bonusBalance}
          hasDeposited={hasDeposited}
          publicSettings={publicSettings}
          className={styles.fullWidthCard}
        />

        <Card>
          <Card.Icon name="share" />
          <Card.Title>Referral Hub & Rewards</Card.Title>
          <Card.Body>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                You have <strong style={{ color: "var(--accent)", fontSize: "var(--fs-lg)" }}>{pointsBalance}</strong> {branding.pointsName}.
              </div>
              <div style={{ fontSize: "var(--fs-base)", color: "var(--muted)" }}>
                Invite Code: <strong style={{ color: "var(--text)" }}>{referralCode || "..."}</strong>
              </div>
              <span className={styles.metaLabel} style={{ marginTop: "4px" }}>
                Earn bonus cash and points by inviting friends to join and trade on {branding.appName}.
              </span>
            </div>
          </Card.Body>
          <Card.Actions>
            <Card.ActionBtn onClick={copyInviteLink}>
              {copied ? "Link Copied!" : "Copy Invite Link"}
            </Card.ActionBtn>
            <Card.ActionBtn onClick={() => navigate("/referrals")}>
              My Network
            </Card.ActionBtn>
          </Card.Actions>
        </Card>

        <Card>
          <Card.Icon name="person" />
          <Card.Title>Your Account</Card.Title>
          <Card.Body className={styles.accountDetails}>
            <div className={styles.accountRow}>
              <span className={styles.accountLabel}>Email</span>
              <div className={styles.accountValueWrapper}>
                <span
                  className={`${styles.verifiedPill} ${
                    emailVerified ? styles.pillVerified : styles.pillUnverified
                  }`}
                >
                  <Icon
                    name={emailVerified ? "mark_email_read" : "mail_lock"}
                    style={{ fontSize: "var(--fs-md)" }}
                  />
                  {email}
                  <span className={styles.pillStatus}>
                    {emailVerified ? "Verified" : "Unverified"}
                  </span>
                </span>
                {!emailVerified && (
                  <button
                    className={styles.verifyBtnInline}
                    onClick={() => startVerification("email")}
                  >
                    Verify Now
                  </button>
                )}
              </div>
            </div>
            {phoneNumber && (
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Phone</span>
                <div className={styles.accountValueWrapper}>
                  <span
                    className={`${styles.verifiedPill} ${
                      phoneVerified ? styles.pillVerified : styles.pillUnverified
                    }`}
                  >
                    <Icon
                      name={phoneVerified ? "phonelink_ring" : "phonelink_lock"}
                      style={{ fontSize: "var(--fs-md)" }}
                    />
                    {phoneNumber}
                    <span className={styles.pillStatus}>
                      {phoneVerified ? "Verified" : "Unverified"}
                    </span>
                  </span>
                  {!phoneVerified && (
                    <button
                      className={styles.verifyBtnInline}
                      onClick={() => startVerification("phone")}
                    >
                      Verify Now
                    </button>
                  )}
                </div>
              </div>
            )}
            {accountNumber && (
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Account</span>
                <span className={styles.accountValue}>{accountNumber}</span>
              </div>
            )}
            {memberSince && (
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Member since</span>
                <span className={styles.accountValue}>{memberSince}</span>
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Icon name="support_agent" />
          <Card.Title>Help & Support</Card.Title>
          <Card.Body>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                Need assistance with your wallet, transactions, or account?
              </div>
              <span className={styles.metaLabel} style={{ marginTop: "4px" }}>
                Our ticket resolution system tracks your requests in real-time. Open a support ticket, upload evidence, and chat directly with our admins.
              </span>
            </div>
          </Card.Body>
          <Card.Actions>
            <Card.ActionBtn onClick={() => navigate("/support")}>
              Contact Support
            </Card.ActionBtn>
          </Card.Actions>
        </Card>
      </div>


      <WalletActivityLog transactions={transactions} />
    </>
  );
}
