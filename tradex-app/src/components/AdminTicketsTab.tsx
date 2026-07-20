import { useState } from "react";
import Icon from "./Icon";
import { useAdminTickets } from "../hooks/useTickets";
import type { Ticket } from "../hooks/useTickets";
import TicketDetailModal from "./TicketDetailModal";
import styles from "../AdminUsers.module.css";
import { formatDateTime } from "../utils/dashboardHelpers";
import type { UserProfile } from "../utils/dashboardHelpers";
import { ROUTE_QUEUE_LABELS } from "../utils/permissions";
import PermissionsTooltip from "./PermissionsTooltip";

interface AdminTicketsTabProps {
  user: UserProfile;
}

export default function AdminTicketsTab({ user }: AdminTicketsTabProps) {
  const { data: tickets = [], isLoading } = useAdminTickets(true);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Status colors are globally configured in index.css

  // Category styles are globally configured in index.css

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "ACCOUNT_ISSUE": return "Account";
      case "PAYMENT_ISSUE": return "Payment";
      case "GENERAL": return "General";
      case "TECHNICAL": return "Technical";
      case "OTHER": return "Other";
      default: return category;
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchCategory = categoryFilter === "ALL" || t.category === categoryFilter;
    const matchSearch =
      !searchQuery.trim() ||
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchCategory && matchSearch;
  });

  const getTicketPriority = (t: Ticket) => {
    if (t.assignedToUserEmail === user?.email) {
      return 1;
    }
    if (t.assignedToPermission && user?.permissions?.includes(t.assignedToPermission)) {
      return 2;
    }
    return 3;
  };

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const priorityA = getTicketPriority(a);
    const priorityB = getTicketPriority(b);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className={styles.tableSection}>
      {/* Filtering Header controls */}
      <div className={styles.tableHeader} style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <h2 className={styles.tableTitle} style={{ marginRight: "auto" }}>Support Ticket Management</h2>

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Search</span>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Icon name="search" style={{ position: "absolute", left: "10px", color: "var(--muted)", fontSize: "16px", pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Search ticket #, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "8px 12px 8px 32px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--text)",
                  fontSize: "13px",
                  outline: "none",
                  width: "200px"
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--text)",
                fontSize: "13px",
                outline: "none"
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>


          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--text)",
                fontSize: "13px",
                outline: "none"
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="GENERAL">General</option>
              <option value="ACCOUNT_ISSUE">Account Issue</option>
              <option value="PAYMENT_ISSUE">Payment Issue</option>
              <option value="TECHNICAL">Technical</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Retrieving tickets from database...</p>
        </div>
      ) : sortedTickets.length === 0 ? (
        <div className={styles.emptyState}>No support tickets found matching these filters.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ticket Number</th>
                <th>User Email</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Created At</th>
                <th style={{ width: "80px", textAlign: "center" }}>Manage</th>
              </tr>
            </thead>
            <tbody>
              {sortedTickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={styles.clickableRow}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <span className={styles.idBadge}>{t.ticketNumber}</span>
                  </td>
                  <td>
                    <span className={styles.userEmail}>{t.userEmail}</span>
                  </td>
                  <td>
                    <span className={`category-tag-${t.category.toLowerCase().replace("_", "")}`} style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      display: "inline-block"
                    }}>
                      {getCategoryLabel(t.category)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: "500" }}>{t.subject}</span>
                  </td>
                  <td>
                    <span className={`${styles.statusPill} status-pill-${t.status.toLowerCase().replace("_", "")}`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                      {t.assignedToPermission && (
                        <span style={{ fontSize: "11px", fontWeight: 600, background: "rgba(181, 95, 230, 0.15)", color: "#b55fe6", padding: "4px 8px", borderRadius: "6px" }}>
                          {ROUTE_QUEUE_LABELS[t.assignedToPermission] || t.assignedToPermission}
                        </span>
                      )}
                      {!t.assignedToPermission && !t.assignedToUserEmail && (
                        <span style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic" }}>Unassigned</span>
                      )}
                      {t.assignedToUserEmail && (
                        <PermissionsTooltip
                          email={t.assignedToUserEmail}
                          permissions={t.assignedToUserPermissions || undefined}
                          isAdmin={true}
                          align="flex-start"
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text)", letterSpacing: "0.03em" }}>
                      {formatDateTime(t.createdAt)}
                    </span>
                  </td>

                  <td style={{ textAlign: "center" }}>
                    <button
                      className={styles.controlBtn}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary)",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center"
                      }}
                    >
                      <Icon name="open_in_new" style={{ fontSize: "16px" }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ticket Detail Modal for Admins */}
      <TicketDetailModal
        isOpen={selectedTicketId !== null}
        onClose={() => setSelectedTicketId(null)}
        ticketId={selectedTicketId}
        isAdmin={true}
      />
    </div>
  );
}
