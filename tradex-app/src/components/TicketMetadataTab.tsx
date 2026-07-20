import Card from "./Card";
import TicketAttachments from "./TicketAttachments";
import PermissionsTooltip from "./PermissionsTooltip";
import { formatDateTime } from "../utils/dashboardHelpers";
import { ROUTE_QUEUE_LABELS } from "../utils/permissions";
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
  };
  isAdmin: boolean;
  onClaim: () => void;
  isClaimPending: boolean;
}

export default function TicketMetadataTab({
  ticket,
  isAdmin,
  onClaim,
  isClaimPending
}: TicketMetadataTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* Status Card */}
      <div className={styles.infoCard}>
        <p className={styles.infoSectionTitle}>Metadata</p>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Status</span>
          <span className={`status-pill-${ticket.status.toLowerCase().replace("_", "")}`} style={{
            padding: "3px 8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "600",
            textTransform: "uppercase"
          }}>
            {ticket.status.replace("_", " ")}
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
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Assigned Group</span>
          <span className={styles.infoValue}>
            {ticket.assignedToPermission ? (
              <span style={{ fontSize: "11px", fontWeight: 600, background: "rgba(181, 95, 230, 0.15)", color: "#b55fe6", padding: "2px 6px", borderRadius: "4px" }}>
                {ROUTE_QUEUE_LABELS[ticket.assignedToPermission] || ticket.assignedToPermission}
              </span>
            ) : (ticket.assignedToUserEmail ? "-" : "Unassigned")}
          </span>
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
               isAdmin && ticket.status !== "CLOSED" && ticket.status !== "RESOLVED" ? (
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

      {/* Subject & Description Card */}
      <Card className={styles.descCard}>
        <p className={styles.infoSectionTitle}>Issue Summary</p>
        <h3 style={{ margin: "10px 0 6px 0", fontSize: "16px", color: "var(--text)" }}>{ticket.subject}</h3>
        <p className={styles.descText}>{ticket.description}</p>
      </Card>

      {/* Attachments Card */}
      <TicketAttachments attachments={ticket.attachments || []} />
    </div>
  );
}
