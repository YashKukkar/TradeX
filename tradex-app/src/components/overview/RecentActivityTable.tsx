import { useState, useMemo } from "react";
import Icon from "../Icon";
import Card from "../Card";
import LoadingState from "../LoadingState";
import overviewStyles from "../SuperAdminOverview.module.css";
import { formatDateTime } from "../../utils/dashboardHelpers";

interface RecentActivityTableProps {
  recentAuditData: any;
  isLoading: boolean;
  onTabChange: (tab: string) => void;
}

function formatActionLabel(action: string): string {
  if (!action) return "Unknown Event";
  const map: Record<string, string> = {
    UPDATE_EMPLOYEE_PERMISSIONS: "Permissions Updated",
    CREATE_EMPLOYEE: "Staff Created",
    DISABLE_EMPLOYEE: "Staff Suspended",
    APPROVE_DEPOSIT: "Deposit Approved",
    REJECT_DEPOSIT: "Deposit Rejected",
    APPROVE_WITHDRAWAL: "Withdrawal Approved",
    REJECT_WITHDRAWAL: "Withdrawal Rejected",
    FORCE_EMAIL_VERIFY: "Email Verified",
    PASSWORD_RESET_EMAIL_SENT: "Password Reset Sent",
    POINTS_ADJUSTMENT: "Points Adjusted",
    WALLET_ADJUSTMENT: "Wallet Adjusted",
    POINTS_CONVERSION: "Points Converted",
    LOCK: "Account Locked",
    UNLOCK: "Account Unlocked",
    ENABLE: "Account Enabled",
    DISABLE: "Account Disabled",
  };
  return map[action] || action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const ACTION_CATEGORIES: { id: string; label: string; actions?: string[] }[] = [
  { id: "ALL", label: "All Categories" },
  { id: "STAFF", label: "Staff & Authorities", actions: ["CREATE_EMPLOYEE", "UPDATE_EMPLOYEE_PERMISSIONS", "DISABLE_EMPLOYEE"] },
  { id: "FINANCE", label: "Financial Approvals", actions: ["APPROVE_DEPOSIT", "REJECT_DEPOSIT", "APPROVE_WITHDRAWAL", "REJECT_WITHDRAWAL"] },
  { id: "SECURITY", label: "User Security & Status", actions: ["LOCK", "UNLOCK", "ENABLE", "DISABLE", "FORCE_EMAIL_VERIFY", "PASSWORD_RESET_EMAIL_SENT"] },
  { id: "POINTS", label: "Balances & Rewards", actions: ["POINTS_ADJUSTMENT", "WALLET_ADJUSTMENT", "POINTS_CONVERSION"] },
];

export default function RecentActivityTable({
  recentAuditData,
  isLoading,
  onTabChange,
}: RecentActivityTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const rawLogs: any[] = useMemo(() => {
    if (!recentAuditData) return [];
    if (Array.isArray(recentAuditData)) return recentAuditData;
    if (Array.isArray(recentAuditData.content)) return recentAuditData.content;
    return [];
  }, [recentAuditData]);

  const filteredLogs = useMemo(() => {
    return rawLogs.filter((log) => {
      // Category filter
      if (selectedCategory !== "ALL") {
        const cat = ACTION_CATEGORIES.find((c) => c.id === selectedCategory);
        if (cat?.actions && !cat.actions.includes(log.action)) {
          return false;
        }
      }

      // Keyword search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const actor = (log.actorEmail || log.performedByEmail || log.performedBy || "System").toLowerCase();
      const target = (log.targetEmail || log.target || "").toLowerCase();
      const actionRaw = (log.action || "").toLowerCase();
      const actionFriendly = formatActionLabel(log.action || "").toLowerCase();
      const details = (log.details || log.entityId || "").toLowerCase();

      return actor.includes(q) || target.includes(q) || actionRaw.includes(q) || actionFriendly.includes(q) || details.includes(q);
    });
  }, [rawLogs, selectedCategory, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedLogs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, safePage, pageSize]);

  return (
    <div style={{ marginTop: "24px" }}>
      <Card>
        <Card.Title>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon name="history" style={{ color: "var(--primary)" }} />
              <span>Recent System Activity</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 750,
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: "var(--surface-2)",
                  color: "var(--primary)",
                  border: "1px solid var(--border)",
                }}
              >
                {filteredLogs.length} events
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={() => onTabChange("logs")}
                style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}
              >
                View full audit log →
              </button>
            </div>
          </div>
        </Card.Title>

        {/* ── Search & Filter Controls Toolbar ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px", flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "var(--surface-recessed)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "6px 10px",
                flex: 1,
                minWidth: "200px",
                maxWidth: "320px",
              }}
            >
              <Icon name="search" style={{ fontSize: "16px", color: "var(--muted)" }} />
              <input
                type="text"
                placeholder="Search user, staff or keyword..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text)",
                  fontSize: "12.5px",
                  width: "100%",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0 }}
                >
                  <Icon name="close" style={{ fontSize: "14px" }} />
                </button>
              )}
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: "var(--surface-2)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: 650,
                cursor: "pointer",
                height: "33px",
              }}
            >
              {ACTION_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                background: "var(--surface-2)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Loading recent activity stream..." padding="24px 0" />
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
            {searchQuery ? "No activities match your search criteria." : "No recent system activity recorded."}
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className={overviewStyles.activityTable} style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ width: "160px", background: "var(--surface-2)", color: "var(--muted)", fontWeight: 700, fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>Timestamp</th>
                    <th style={{ width: "180px", background: "var(--surface-2)", color: "var(--muted)", fontWeight: 700, fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>Actor</th>
                    <th style={{ width: "155px", background: "var(--surface-2)", color: "var(--muted)", fontWeight: 700, fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>Action</th>
                    <th style={{ background: "var(--surface-2)", color: "var(--muted)", fontWeight: 700, fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log: any, idx: number) => (
                    <tr
                      key={log.id || `${log.createdAt}-${idx}`}
                      style={{
                        background: idx % 2 === 0 ? "var(--surface)" : "var(--surface-recessed)",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <td style={{ width: "160px", whiteSpace: "nowrap", color: "var(--text)", fontWeight: 450, fontSize: "12px", fontVariantNumeric: "tabular-nums", padding: "10px 14px" }}>
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td style={{ width: "180px", fontWeight: 550, fontSize: "12px", padding: "10px 14px" }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.actorEmail || log.performedByEmail || log.performedBy || "System"}>
                          {log.actorEmail || log.performedByEmail || log.performedBy || "System"}
                        </span>
                      </td>
                      <td style={{ width: "155px", padding: "10px 14px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 750,
                            background: log.action?.includes("REJECT") || log.action?.includes("DELETE") || log.action?.includes("REVOKE")
                              ? "var(--danger-bg)"
                              : log.action?.includes("APPROVE") || log.action?.includes("GRANT") || log.action?.includes("CREATE")
                              ? "var(--primary-bg)"
                              : "var(--surface-2)",
                            color: log.action?.includes("REJECT") || log.action?.includes("DELETE") || log.action?.includes("REVOKE")
                              ? "var(--danger)"
                              : log.action?.includes("APPROVE") || log.action?.includes("GRANT") || log.action?.includes("CREATE")
                              ? "var(--primary)"
                              : "var(--text)",
                            border: `1px solid ${
                              log.action?.includes("REJECT") || log.action?.includes("DELETE")
                                ? "var(--danger-border)"
                                : log.action?.includes("APPROVE") || log.action?.includes("GRANT")
                                ? "var(--primary-border)"
                                : "var(--border)"
                            }`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatActionLabel(log.action)}
                        </span>
                      </td>
                      <td style={{ color: "var(--text)", fontSize: "12px", padding: "10px 14px", lineHeight: 1.4, wordBreak: "break-word" }} title={log.details || ""}>
                        {log.details || log.entityId || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination Bar ── */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  borderTop: "1px solid var(--border)",
                  fontSize: "12px",
                  color: "var(--muted)",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <span>
                  Showing {Math.min(filteredLogs.length, (safePage - 1) * pageSize + 1)}–
                  {Math.min(filteredLogs.length, safePage * pageSize)} of {filteredLogs.length} events
                </span>

                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      cursor: safePage <= 1 ? "not-allowed" : "pointer",
                      opacity: safePage <= 1 ? 0.5 : 1,
                    }}
                  >
                    <Icon name="chevron_left" style={{ fontSize: "16px" }} />
                  </button>

                  <span>Page {safePage} of {totalPages}</span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      cursor: safePage >= totalPages ? "not-allowed" : "pointer",
                      opacity: safePage >= totalPages ? 0.5 : 1,
                    }}
                  >
                    <Icon name="chevron_right" style={{ fontSize: "16px" }} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
