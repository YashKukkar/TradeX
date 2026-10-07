import { useState, useMemo } from "react";
import { type WalletTransaction } from "../utils/dashboardHelpers";
import { formatDateTime, formatCurrency, formatTxType, amountScale } from "../utils/formatters";
import styles from "../Dashboard.module.css";
import adminStyles from "../AdminUsers.module.css";
import DataTable, { type ColumnDef } from "./DataTable";
import SegmentedControl from "./SegmentedControl";
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
        <span
          style={{
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "var(--fs-xs)",
            fontWeight: "750",
            textTransform: "uppercase",
            color: isCredit ? "var(--success)" : "var(--danger)",
            background: isCredit ? "var(--success-bg)" : "var(--danger-bg)",
            border: `1px solid ${isCredit ? "var(--success-border)" : "var(--danger-border)"}`,
          }}
        >
          {formatTxType(t.type)}
        </span>
      );
    },
  },
  {
    label: "Status",
    width: "120px",
    render: (t) => {
      const isSuccess = t.status === "SUCCESS";
      const isFailed = t.status === "FAILED";
      const color = isSuccess
        ? "var(--success)"
        : isFailed
          ? "var(--danger)"
          : "var(--warning)";
      const bg = isSuccess
        ? "var(--success-bg)"
        : isFailed
          ? "var(--danger-bg)"
          : "var(--warning-bg)";
      const border = isSuccess
        ? "var(--success-border)"
        : isFailed
          ? "var(--danger-border)"
          : "var(--warning-border)";
      return (
        <span
          style={{
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "var(--fs-xs)",
            fontWeight: "750",
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

      let color = "var(--success)";
      if (!isSuccess) {
        color = "var(--muted)";
      } else if (isDebit) {
        color = "var(--danger)";
      }

      const prefix = !isSuccess ? "" : (isDebit ? "-" : "+");

      return (
        <span style={{ fontWeight: "700", color }}>
          {prefix}{formatCurrency(t.amount)}
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
          {formatCurrency(t.balanceAfter)}
        </span>
      );
    },
  },
  {
    label: "Notes",
    render: (t) => (
      <span style={{ color: "var(--muted)", fontSize: "var(--fs-md)" }}>
        {t.notes}
      </span>
    ),
  },
  {
    label: "Date & Time",
    width: "180px",
    render: (t) => (
      <span style={{ color: "var(--muted)", fontSize: "var(--fs-md)" }}>
        {formatDateTime(t.createdAt)}
      </span>
    ),
  },
];

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: "primary" | "success" | "danger" }) {
  return (
    <div className={styles.summaryItem}>
      <span className={styles.summaryLabel}>{label}</span>
      <span
        className={`${styles.summaryValue} ${tone ? styles["tone_" + tone] : ""} ${styles[amountScale(value) || "base"]}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

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

          <div style={{ width: "100%", maxWidth: "260px" }}>
            <SegmentedControl
              options={[
                { value: "cash", label: "Cash Wallet" },
                { value: "bonus", label: "Bonus Wallet" },
              ]}
              value={activeTab}
              onChange={(val) => setActiveTab(val as "cash" | "bonus")}
            />
          </div>
        </div>

        {/* Compact Summary Row */}
        <div className={styles.summaryRow}>
          {activeTab === "cash" ? (
            <>
              <SummaryStat label="Current Balance" value={formatCurrency(withdrawableBalance)} tone="primary" />
              <SummaryStat label="Total Deposits" value={`+${formatCurrency(totalDeposits)}`} tone="success" />
              <SummaryStat label="Total Withdrawals" value={`-${formatCurrency(totalWithdrawals)}`} tone="danger" />
            </>
          ) : (
            <>
              <SummaryStat label="Current Balance" value={formatCurrency(bonusBalance)} tone="primary" />
              <SummaryStat label="Total Bonuses" value={`+${formatCurrency(totalBonusesEarned)}`} tone="success" />
              <SummaryStat label="Points Converted" value={formatCurrency(totalPointsConverted)} />
              <SummaryStat label="First Deposit Bonus" value={formatCurrency(firstDepositBonusTotal)} />
            </>
          )}
        </div>

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
