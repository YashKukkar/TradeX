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
import { getTicketSlaInfo } from "../utils/slaHelpers";

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
    width: "100px",
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
    width: "95px",
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
    width: "95px",
  },
  {
    label: "SLA / Age",
    width: "140px",
    render: (t) => {
      const sla = getTicketSlaInfo(t.createdAt, t.status, t.resolvedAt);
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "6px",
            color: sla.color,
            background: sla.bg,
            border: `1px solid ${sla.border}`,
            whiteSpace: "nowrap",
          }}
        >
          <Icon name={sla.icon} style={{ fontSize: "13px" }} />
          {sla.label}
        </span>
      );
    },
  },
  {
    label: "Assigned To",
    render: (t) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
        {t.assignedToPermission && (
          <span style={{ fontSize: "11px", fontWeight: 600, background: "var(--primary-bg)", color: "var(--primary)", border: "1px solid var(--primary-border)", padding: "3px 8px", borderRadius: "6px" }}>
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
    width: "125px",
  },
  {
    label: "Open",
    align: "center",
    width: "50px",
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
  const [overdueOnly, setOverdueOnly] = useState(false);

  const overdueCount = useMemo(() => {
    return tickets.filter((t) => {
      const isPending = t.status === "OPEN" || t.status === "IN_PROGRESS";
      if (!isPending) return false;
      return getTicketSlaInfo(t.createdAt, t.status, t.resolvedAt).isOverdue;
    }).length;
  }, [tickets]);

  const sortedTickets = useMemo(() => {
    const filtered = tickets.filter((t) => {
      const sla = getTicketSlaInfo(t.createdAt, t.status, t.resolvedAt);
      if (overdueOnly && (!sla.isOverdue || (t.status !== "OPEN" && t.status !== "IN_PROGRESS"))) {
        return false;
      }
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
      const sla = getTicketSlaInfo(t.createdAt, t.status, t.resolvedAt);
      if (sla.isOverdue && (t.status === "OPEN" || t.status === "IN_PROGRESS")) return 0;
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
  }, [tickets, searchQuery, statusFilter, categoryFilter, overdueOnly, user]);

  return (
    <div className={styles.tableSection}>
      {/* Filtering Header controls */}
      <div className={styles.tableHeader} style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <h2 className={styles.tableTitle} style={{ marginRight: "auto" }}>Support Ticket Management</h2>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Overdue Quick Filter Chip */}
          <button
            type="button"
            onClick={() => setOverdueOnly((prev) => !prev)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: overdueOnly ? "var(--danger)" : overdueCount > 0 ? "var(--danger-bg)" : "var(--surface-2)",
              color: overdueOnly ? "var(--clr-white-a95)" : overdueCount > 0 ? "var(--danger)" : "var(--muted)",
              border: `1px solid ${overdueOnly ? "var(--danger)" : overdueCount > 0 ? "var(--danger-border)" : "var(--border)"}`,
              alignSelf: "flex-end",
              height: "35px",
            }}
          >
            <Icon name="warning" style={{ fontSize: "15px", color: overdueOnly ? "var(--clr-white-a95)" : overdueCount > 0 ? "var(--danger)" : "var(--muted)" }} />
            <span>Overdue Only</span>
            <span
              style={{
                background: overdueOnly ? "var(--clr-white-a25)" : overdueCount > 0 ? "var(--danger)" : "var(--surface-3)",
                color: overdueOnly || overdueCount > 0 ? "var(--clr-white-a95)" : "var(--muted)",
                padding: "1px 6px",
                borderRadius: "10px",
                fontSize: "10px",
                fontWeight: 800,
                minWidth: "16px",
                textAlign: "center",
                display: "inline-block",
              }}
            >
              {overdueCount ?? 0}
            </span>
          </button>

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
