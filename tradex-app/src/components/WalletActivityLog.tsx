import { useState, useMemo } from "react";
import { formatDateTime, type WalletTransaction } from "../utils/dashboardHelpers";
import styles from "../Dashboard.module.css";
import adminStyles from "../AdminUsers.module.css";
import DataTable, { type ColumnDef } from "./DataTable";
import { useCurrentUser } from "../hooks/useDashboard";

interface WalletActivityLogProps {
  transactions: WalletTransaction[];
}

const COLUMNS: ColumnDef<WalletTransaction>[] = [
  {
    label: "Type",
    width: "150px",
    render: (t) => {
      const isCredit =
        t.type === "DEPOSIT" ||
        t.type === "FIRST_DEPOSIT_BONUS" ||
        t.type === "POINTS_CONVERSION";
      return (
        <span className={`${styles.verifiedPill} ${isCredit ? styles.pillVerified : styles.pillUnverified}`}>
          {t.type}
        </span>
      );
    },
  },
  {
    label: "Status",
    width: "120px",
    render: (t) => {
      const color =
        t.status === "SUCCESS"
          ? "var(--primary)"
          : t.status === "FAILED"
          ? "var(--danger)"
          : "var(--accent)";
      const bg =
        t.status === "SUCCESS"
          ? "rgba(34, 197, 94, 0.1)"
          : t.status === "FAILED"
          ? "rgba(255, 87, 87, 0.1)"
          : "rgba(181, 95, 230, 0.1)";
      const border =
        t.status === "SUCCESS"
          ? "rgba(34, 197, 94, 0.2)"
          : t.status === "FAILED"
          ? "rgba(255, 87, 87, 0.2)"
          : "rgba(181, 95, 230, 0.2)";
      return (
        <span
          style={{
            display: "inline-block",
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: "700",
            textTransform: "uppercase",
            color,
            background: bg,
            border: `1px solid ${border}`,
          }}
        >
          {t.status}
        </span>
      );
    },
  },
  {
    label: "Amount",
    width: "140px",
    render: (t) => {
      const isSuccess = t.status === "SUCCESS";
      const isDebit = t.type === "WITHDRAWAL";
      
      let color = "var(--primary)";
      if (!isSuccess) {
        color = "var(--muted)";
      } else if (isDebit) {
        color = "var(--danger)";
      }

      const prefix = !isSuccess ? "" : (isDebit ? "-" : "+");

      return (
        <span style={{ fontWeight: "700", color }}>
          {prefix}₹{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    },
  },
  {
    label: "Balance After",
    width: "140px",
    render: (t) => {
      if (t.status !== "SUCCESS") {
        return <span style={{ color: "var(--muted)", fontWeight: "500" }}>—</span>;
      }
      return (
        <span style={{ fontWeight: "600" }}>
          ₹{t.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    },
  },
  {
    label: "Notes",
    render: (t) => (
      <span style={{ color: "var(--muted)", fontSize: "13px" }}>
        {t.notes}
      </span>
    ),
  },
  {
    label: "Date & Time",
    width: "180px",
    render: (t) => (
      <span style={{ color: "var(--muted)", fontSize: "13px" }}>
        {formatDateTime(t.createdAt)}
      </span>
    ),
  },
];

export default function WalletActivityLog({ transactions }: WalletActivityLogProps) {
  const [activeTab, setActiveTab] = useState<"cash" | "bonus">("cash");

  const { data: user } = useCurrentUser();
  const withdrawableBalance = user?.withdrawableBalance ?? 0;
  const bonusBalance = user?.bonusBalance ?? 0;

  const totalDeposits = useMemo(() => 
    transactions.filter(t => t.type === "DEPOSIT" && t.status === "SUCCESS").reduce((acc, t) => acc + t.amount, 0),
    [transactions]
  );

  const totalWithdrawals = useMemo(() => 
    transactions.filter(t => t.type === "WITHDRAWAL" && t.status === "SUCCESS").reduce((acc, t) => acc + t.amount, 0),
    [transactions]
  );

  const totalBonusesEarned = useMemo(() => 
    transactions.filter(t => (t.type === "FIRST_DEPOSIT_BONUS" || t.type === "POINTS_CONVERSION") && t.status === "SUCCESS").reduce((acc, t) => acc + t.amount, 0),
    [transactions]
  );

  const totalPointsConverted = useMemo(() => 
    transactions.filter(t => t.type === "POINTS_CONVERSION" && t.status === "SUCCESS").reduce((acc, t) => acc + t.amount, 0),
    [transactions]
  );

  const firstDepositBonusTotal = useMemo(() => 
    transactions.filter(t => t.type === "FIRST_DEPOSIT_BONUS" && t.status === "SUCCESS").reduce((acc, t) => acc + t.amount, 0),
    [transactions]
  );

  const sortedAndFilteredTransactions = useMemo(() => {
    const filtered = transactions.filter((t) => {
      if (activeTab === "cash") {
        return t.type === "DEPOSIT" || t.type === "WITHDRAWAL";
      } else {
        return t.type === "FIRST_DEPOSIT_BONUS" || t.type === "POINTS_CONVERSION";
      }
    });

    return [...filtered].sort((a, b) => {
      const valA = a.approvedAt || a.createdAt;
      const valB = b.approvedAt || b.createdAt;
      return valB - valA;
    });
  }, [transactions, activeTab]);

  return (
    <>
      <div className={styles.walletDivider} style={{ margin: "40px 0 20px" }} />
      <div className={adminStyles.tableSection}>
        <div
          className={adminStyles.tableHeader}
          style={{
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <h2 className={adminStyles.tableTitle}>
            Wallet Activity log
          </h2>

          <div
            style={{
              display: "flex",
              background: "rgba(255, 255, 255, 0.04)",
              padding: "4px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setActiveTab("cash")}
              style={{
                background: activeTab === "cash" ? "var(--accent)" : "transparent",
                color: activeTab === "cash" ? "#ffffff" : "var(--muted)",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.25s ease",
              }}
            >
              Cash Wallet
            </button>
            <button
              onClick={() => setActiveTab("bonus")}
              style={{
                background: activeTab === "bonus" ? "var(--accent)" : "transparent",
                color: activeTab === "bonus" ? "#ffffff" : "var(--muted)",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.25s ease",
              }}
            >
              Bonus Wallet
            </button>
          </div>
        </div>

        {/* Compact Summary Row */}
        {activeTab === "cash" ? (
          <div
            style={{
              display: "flex",
              gap: "24px",
              padding: "16px 28px",
              background: "rgba(255, 255, 255, 0.02)",
              borderBottom: "1px solid var(--border)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: "700", textTransform: "uppercase" }}>Current Balance</span>
              <span style={{ fontSize: "16px", color: "var(--primary)", fontWeight: "800" }}>₹{withdrawableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ width: "1px", background: "var(--border)", margin: "4px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: "700", textTransform: "uppercase" }}>Total Deposits</span>
              <span style={{ fontSize: "16px", color: "var(--success)", fontWeight: "800" }}>+₹{totalDeposits.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ width: "1px", background: "var(--border)", margin: "4px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: "700", textTransform: "uppercase" }}>Total Withdrawals</span>
              <span style={{ fontSize: "16px", color: "var(--danger)", fontWeight: "800" }}>-₹{totalWithdrawals.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: "24px",
              padding: "16px 28px",
              background: "rgba(255, 255, 255, 0.02)",
              borderBottom: "1px solid var(--border)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: "700", textTransform: "uppercase" }}>Current Balance</span>
              <span style={{ fontSize: "16px", color: "var(--primary)", fontWeight: "800" }}>₹{bonusBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ width: "1px", background: "var(--border)", margin: "4px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: "700", textTransform: "uppercase" }}>Total Bonuses</span>
              <span style={{ fontSize: "16px", color: "var(--success)", fontWeight: "800" }}>+₹{totalBonusesEarned.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ width: "1px", background: "var(--border)", margin: "4px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: "700", textTransform: "uppercase" }}>Total Points Converted</span>
              <span style={{ fontSize: "16px", color: "var(--text)", fontWeight: "800" }}>₹{totalPointsConverted.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ width: "1px", background: "var(--border)", margin: "4px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: "700", textTransform: "uppercase" }}>First Deposit Bonus</span>
              <span style={{ fontSize: "16px", color: "var(--text)", fontWeight: "800" }}>₹{firstDepositBonusTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        <div className={adminStyles.transactionTableWrapper}>
          <DataTable
            columns={COLUMNS}
            data={sortedAndFilteredTransactions}
            rowKey={(t) => t.id}
            emptyMessage={
              activeTab === "cash"
                ? "No recent cash wallet transactions found."
                : "No recent bonus wallet rewards found."
            }
            clickableRow={false}
            pageSize={10}
          />
        </div>
      </div>
    </>
  );
}
