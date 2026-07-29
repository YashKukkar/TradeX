import { useState, useMemo } from "react";
import Icon from "./Icon";
import { useAdminTickets } from "../hooks/useTickets";
import type { Ticket } from "../hooks/useTickets";
import TicketDetailModal from "./TicketDetailModal";
import styles from "../AdminUsers.module.css";
import { formatDateTime } from "../utils/dashboardHelpers";
import type { UserProfile } from "../utils/dashboardHelpers";
import { ROUTE_QUEUE_LABELS } from "../utils/permissions";
import PermissionsTooltip from "./PermissionsTooltip";
import LoadingState from "./LoadingState";
import DataTable, { type ColumnDef } from "./DataTable";

interface AdminTicketsTabProps {
  user: UserProfile;
}

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

const TICKET_COLUMNS: ColumnDef<Ticket>[] = [
  {
    label: "Ticket #",
    render: (t) => <span className={styles.idBadge}>{t.ticketNumber}</span>,
    width: "110px",
  },
  {
    label: "User Email",
    render: (t) => <span className={styles.userEmail}>{t.userEmail}</span>,
  },
  {
    label: "Category",
    render: (t) => (
      <span
        className={`category-tag-${t.category.toLowerCase().replace("_", "")}`}
        style={{ fontSize: "11px", fontWeight: 700, padding: "4px 8px", borderRadius: "6px", textTransform: "uppercase", letterSpacing: "0.03em", display: "inline-block" }}
      >
        {getCategoryLabel(t.category)}
      </span>
    ),
    width: "100px",
  },
  {
    label: "Subject",
    render: (t) => <span style={{ fontWeight: 500 }}>{t.subject}</span>,
  },
  {
    label: "Status",
    render: (t) => (
      <span className={`${styles.statusPill} status-pill-${t.status.toLowerCase().replace("_", "")}`}>
        {t.status.replace("_", " ")}
      </span>
    ),
    width: "100px",
  },
  {
    label: "Assigned To",
    render: (t) => (
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
    ),
  },
  {
    label: "Created At",
    render: (t) => (
      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", letterSpacing: "0.03em" }}>
        {formatDateTime(t.createdAt)}
      </span>
    ),
    width: "130px",
  },
  {
    label: "Open",
    align: "center",
    width: "60px",
    noHeader: true,
    render: () => (
      <Icon name="open_in_new" style={{ fontSize: "16px", color: "var(--primary)" }} />
    ),
  },
];

export default function AdminTicketsTab({ user }: AdminTicketsTabProps) {
  const { data: tickets = [], isLoading } = useAdminTickets(true);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const sortedTickets = useMemo(() => {
    const filtered = tickets.filter((t) => {
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
      if (t.assignedToUserEmail === user?.email) return 1;
      if (t.assignedToPermission && user?.permissions?.includes(t.assignedToPermission)) return 2;
      return 3;
    };

    return [...filtered].sort((a, b) => {
      const priorityA = getTicketPriority(a);
      const priorityB = getTicketPriority(b);
      if (priorityA !== priorityB) return priorityA - priorityB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tickets, searchQuery, statusFilter, categoryFilter, user]);

  return (
    <div className={styles.tableSection}>
      {/* Filtering Header controls */}
      <div className={styles.tableHeader} style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <h2 className={styles.tableTitle} style={{ marginRight: "auto" }}>Support Ticket Management</h2>

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
                style={{ padding: "8px 12px 8px 32px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", outline: "none", width: "200px" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "8px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", outline: "none" }}
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
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: "8px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", outline: "none" }}
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
        <LoadingState message="Retrieving tickets from database..." />
      ) : (
        <DataTable
          columns={TICKET_COLUMNS}
          data={sortedTickets}
          rowKey={(t) => t.id}
          emptyMessage="No support tickets found matching these filters."
          onRowClick={(t) => setSelectedTicketId(t.id)}
        />
      )}

      <TicketDetailModal
        isOpen={selectedTicketId !== null}
        onClose={() => setSelectedTicketId(null)}
        ticketId={selectedTicketId}
        isAdmin={true}
      />
    </div>
  );
}
