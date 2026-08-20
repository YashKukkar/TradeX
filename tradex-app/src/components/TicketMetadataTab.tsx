import PermissionsTooltip from "./PermissionsTooltip";
import SegmentedControl from "./SegmentedControl";
import SearchablePopover from "./SearchablePopover";
import ActionButton from "./ActionButton";
import Icon from "./Icon";
import { formatDateTime } from "../utils/dashboardHelpers";
import { ALL_PERMISSIONS, ROUTE_QUEUE_LABELS } from "../utils/permissions";
import { getTicketSlaInfo } from "../utils/slaHelpers";
import styles from "./TicketDetailDrawer.module.css";

interface TicketMetadataTabProps {
  ticket: {
    status: string;
    category: string;
    assignedToPermission?: string | null;
    assignedToUserEmail?: string | null;
    assignedToUserPermissions?: string[] | null;
    claimedAt?: string | null;
    createdAt: string;
    resolvedAt?: string | null;
    subject: string;
    description: string;
    attachments?: any[] | null;
    reopenCount?: number;
  };
  isAdmin: boolean;
  onClaim: () => void;
  isClaimPending: boolean;
  onStatusChange: (status: string) => void;
  onAssignChange: (permission: string) => void;
  isAssignPending: boolean;
  isStatusPending?: boolean;
  onCloseTicket: () => void;
  onReopen: () => void;
  isClosePending: boolean;
  isReopenPending: boolean;
}

const statusOptions = [
  { value: "OPEN", label: "Open", activeColor: "var(--warning)", activeBg: "var(--warning-bg)" },
  { value: "IN_PROGRESS", label: "In Progress", activeColor: "var(--primary)", activeBg: "var(--primary-bg)" },
  { value: "RESOLVED", label: "Resolved", activeColor: "var(--success)", activeBg: "var(--success-bg)" },
  { value: "CLOSED", label: "Closed", activeColor: "var(--muted)", activeBg: "var(--surface-elevated)" },
];

export default function TicketMetadataTab({
  ticket,
  isAdmin,
  onClaim,
  isClaimPending,
  onStatusChange,
  onAssignChange,
  isAssignPending,
  isStatusPending = false,
  onCloseTicket,
  isClosePending,
}: TicketMetadataTabProps) {
  const sla = getTicketSlaInfo(ticket.createdAt, ticket.status, ticket.resolvedAt);

  const getPermissionColor = (perm: string) => {
    switch (perm) {
      case "MANAGE_DEPOSITS": return "var(--success)";
      case "MANAGE_WITHDRAWALS": return "var(--danger)";
      case "MANAGE_USERS": return "var(--clr-sky)";
      case "MANAGE_POINTS": return "var(--clr-amber)";
      case "MANAGE_SETTINGS": return "var(--warning)";
      default: return "var(--muted)";
    }
  };

  const assignOptions = [
    { value: "", label: "Unassigned", color: "var(--muted)" },
    ...ALL_PERMISSIONS.map((perm) => ({
      value: perm,
      label: ROUTE_QUEUE_LABELS[perm] || perm,
      color: getPermissionColor(perm)
    })),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Status Card */}
      <div className={styles.infoCard}>
        <p className={styles.infoSectionTitle}>Metadata</p>
        <div className={styles.infoRow} style={{ flexDirection: isAdmin ? "column" : "row", alignItems: isAdmin ? "flex-start" : "center", gap: isAdmin ? "8px" : "0" }}>
          <span className={styles.infoLabel}>Status</span>
          {isAdmin ? (
            <SegmentedControl
              options={statusOptions}
              value={ticket.status}
              onChange={onStatusChange}
              loading={isStatusPending}
            />
          ) : (
            <span className={`status-pill-${ticket.status.toLowerCase().replace("_", "")}`} style={{
              padding: "3px 8px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "600",
              textTransform: "uppercase"
            }}>
              {ticket.status.replace("_", " ")}
            </span>
          )}
        </div>

        {/* SLA / Resolution Turnaround */}
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>SLA Status</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "6px",
              color: sla.color,
              background: sla.bg,
              border: `1px solid ${sla.border}`,
            }}
          >
            <Icon name={sla.icon} style={{ fontSize: "13px" }} />
            {sla.label}
          </span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Category</span>
          <span className={`category-tag-${ticket.category.toLowerCase().replace("_", "")}`} style={{
            padding: "3px 8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.03em"
          }}>
            {ticket.category.replace("_", " ")}
          </span>
        </div>

        {/* Assigned Group and Assigned Agent are Admin/Employee Only */}
        {isAdmin && (
          <>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Assigned Group</span>
              <div style={{ width: "200px" }}>
                <SearchablePopover
                  options={assignOptions}
                  value={ticket.assignedToPermission || ""}
                  onChange={onAssignChange}
                  disabled={isAssignPending}
                />
              </div>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Assigned Agent</span>
              <span className={styles.infoValue}>
                {ticket.assignedToUserEmail ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                    <PermissionsTooltip
                      email={ticket.assignedToUserEmail}
                      permissions={ticket.assignedToUserPermissions || undefined}
                      isAdmin={isAdmin}
                    />
                    {ticket.claimedAt && (
                      <span style={{ fontSize: "10px", color: "var(--muted)", fontStyle: "italic" }}>
                        assigned {formatDateTime(ticket.claimedAt)}
                      </span>
                    )}
                  </div>
                ) : (
                  ticket.status !== "CLOSED" && ticket.status !== "RESOLVED" ? (
                    <button
                      onClick={onClaim}
                      disabled={isClaimPending}
                      className={styles.claimBtn}
                      style={{ marginLeft: 0 }}
                    >
                      {isClaimPending ? "Assigning..." : "Assign to Me"}
                    </button>
                  ) : (
                    <span style={{ fontStyle: "italic", color: "var(--muted)" }}>Unassigned</span>
                  )
                )}
              </span>
            </div>
          </>
        )}

        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Created At</span>
          <span className={styles.infoValue}>{formatDateTime(ticket.createdAt)}</span>
        </div>
        {ticket.resolvedAt && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Resolved At</span>
            <span className={styles.infoValue}>{formatDateTime(ticket.resolvedAt)}</span>
          </div>
        )}
      </div>

      {/* Customer Close Action (Only visible to customers if the ticket is OPEN or IN_PROGRESS) */}
      {!isAdmin && ticket.status !== "CLOSED" && ticket.status !== "RESOLVED" && (
        <div style={{ marginTop: "4px" }}>
          <ActionButton
            onClick={onCloseTicket}
            loading={isClosePending}
            loadingText="Closing..."
            iconName="check_circle"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Close This Ticket
          </ActionButton>
        </div>
      )}

    </div>
  );
}
