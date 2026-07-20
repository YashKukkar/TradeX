import Icon from "./Icon";
import Card from "./Card";
import styles from "../Dashboard.module.css";
import { TICKERS_DATA } from "../utils/dashboardHelpers";
import type { NavigateFunction } from "react-router-dom";
import { useWalletData, usePublicSettings } from "../hooks/useDashboard";
import CashWalletSection from "./CashWalletSection";
import WalletActivityLog from "./WalletActivityLog";

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
  accountNumber: string;
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
  accountNumber,
  memberSince,
  startVerification,
  navigate,
  withdrawableBalance,
  bonusBalance,
}: UserDashboardProps) {
  const { data: walletData } = useWalletData();
  const { data: publicSettings } = usePublicSettings();
  const transactions = walletData?.transactions || [];
  const hasDeposited = transactions.some(t => t.type === "DEPOSIT" && t.status === "SUCCESS");

  return (
    <>
      {/* Premium Welcome Hero Card */}
      <div className={styles.welcomeHero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <div className={styles.userAvatar}>
              <span>{displayName.charAt(0).toUpperCase() || "U"}</span>
            </div>
            <div>
              <h1 className={styles.heroTitle}>
                Welcome back, <span className={styles.heroName}>{displayName}</span>
              </h1>
              <p className={styles.heroSub}>
                Manage your funds, track referrals, and trace your wallet history in real-time.
              </p>
            </div>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.heroPointsCard}>
              <div className={styles.pointsBadge}>
                <Icon name="toll" style={{ fontSize: "16px", color: "var(--accent)" }} />
                <span>TradeX Points</span>
              </div>
              <div className={styles.pointsValue}>
                {pointsBalance.toLocaleString()} <span className={styles.ptsLabel}>PTS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Market Ticker Row */}
      <div className={styles.tickerRow}>
        {TICKERS_DATA.map((t) => (
          <div key={t.symbol} className={styles.tickerCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <div className={styles.tickerSymbol}>{t.symbol}</div>
              <span className={styles.tickerLivePulse} />
            </div>
            <div className={styles.tickerValue}>{t.value}</div>
            <div className={`${styles.tickerChange} ${t.up ? styles.up : styles.down}`}>
              <Icon name={t.up ? "arrow_drop_up" : "arrow_drop_down"} style={{ fontSize: "18px" }} />
              {t.change}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        <CashWalletSection
          pointsBalance={pointsBalance}
          accountNumber={accountNumber}
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
                You have <strong style={{ color: "var(--accent)", fontSize: "16px" }}>{pointsBalance}</strong> TradeX Points.
              </div>
              <div style={{ fontSize: "13.5px", color: "var(--muted)" }}>
                Invite Code: <strong style={{ color: "var(--text)" }}>{referralCode || "..."}</strong>
              </div>
              <span className={styles.metaLabel} style={{ marginTop: "4px" }}>
                Earn bonus cash and points by inviting friends to join and trade on TradeX.
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
                    style={{ fontSize: "13px" }}
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
                      style={{ fontSize: "13px" }}
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
