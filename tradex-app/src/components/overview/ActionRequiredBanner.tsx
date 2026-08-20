import Icon from "../Icon";
import LoadingState from "../LoadingState";
import overviewStyles from "../SuperAdminOverview.module.css";

interface ActionRequiredBannerProps {
  isLoading: boolean;
  pendingDepositsCount: number;
  pendingDepositsAmount: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
  openTicketsCount: number;
  onTabChange: (tab: string) => void;
}

export default function ActionRequiredBanner({
  isLoading,
  pendingDepositsCount,
  pendingDepositsAmount,
  pendingWithdrawalsCount,
  pendingWithdrawalsAmount,
  openTicketsCount,
  onTabChange,
}: ActionRequiredBannerProps) {
  const totalPendingActions = pendingDepositsCount + pendingWithdrawalsCount + openTicketsCount;

  if (isLoading) {
    return (
      <div className={overviewStyles.topActionBanner}>
        <LoadingState message="Checking platform action queues..." padding="8px 0" />
      </div>
    );
  }

  if (totalPendingActions === 0) {
    return (
      <div className={overviewStyles.topActionClean}>
        <Icon name="check_circle" style={{ fontSize: "18px" }} />
        <span>All platform operational queues are clear! No pending actions require attention.</span>
      </div>
    );
  }

  return (
    <div className={overviewStyles.topActionBanner}>
      <div className={overviewStyles.actionBannerHeader}>
        <span>
          <Icon name="error_outline" style={{ fontSize: "16px", verticalAlign: "middle", marginRight: "6px" }} />
          Action Required ({totalPendingActions})
        </span>
        <span style={{ fontSize: "11.5px", color: "var(--muted)", textTransform: "none" }}>
          Live Real-Time Operational Queue
        </span>
      </div>
      <div className={overviewStyles.actionBannerItems}>
        {pendingDepositsCount > 0 && (
          <div className={overviewStyles.actionBannerPill} onClick={() => onTabChange("pending")}>
            <span style={{ color: "var(--warning)", fontWeight: 700 }}>● {pendingDepositsCount} Pending Deposits</span>
            <span style={{ color: "var(--muted)" }}>(₹{pendingDepositsAmount.toLocaleString()})</span>
            <Icon name="arrow_forward" style={{ fontSize: "14px", color: "var(--muted)" }} />
          </div>
        )}
        {pendingWithdrawalsCount > 0 && (
          <div className={overviewStyles.actionBannerPill} onClick={() => onTabChange("pending")}>
            <span style={{ color: "var(--danger)", fontWeight: 700 }}>● {pendingWithdrawalsCount} Pending Withdrawals</span>
            <span style={{ color: "var(--muted)" }}>(₹{pendingWithdrawalsAmount.toLocaleString()})</span>
            <Icon name="arrow_forward" style={{ fontSize: "14px", color: "var(--muted)" }} />
          </div>
        )}
        {openTicketsCount > 0 && (
          <div className={overviewStyles.actionBannerPill} onClick={() => onTabChange("tickets")}>
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>● {openTicketsCount} Open Tickets</span>
            <span style={{ color: "var(--muted)" }}>(Awaiting support response)</span>
            <Icon name="arrow_forward" style={{ fontSize: "14px", color: "var(--muted)" }} />
          </div>
        )}
      </div>
    </div>
  );
}
