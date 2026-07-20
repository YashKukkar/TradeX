import Icon from "./Icon";
import { ALL_PERMISSIONS, ROUTE_QUEUE_LABELS } from "../utils/permissions";
import styles from "./TicketDetailDrawer.module.css";

interface TicketAdminToolsTabProps {
  ticketStatus: string;
  assignedPermission?: string | null;
  adminNotes: string;
  setAdminNotes: (notes: string) => void;
  onStatusChange: (status: string) => void;
  onAssignChange: (permission: string) => void;
  onSaveNotes: () => void;
  isAssignPending: boolean;
  isNotesPending: boolean;
}

export default function TicketAdminToolsTab({
  ticketStatus,
  assignedPermission,
  adminNotes,
  setAdminNotes,
  onStatusChange,
  onAssignChange,
  onSaveNotes,
  isAssignPending,
  isNotesPending
}: TicketAdminToolsTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Status Modification */}
      <div className={styles.infoCard}>
        <p className={styles.infoSectionTitle}>Update Status</p>
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <select
            value={ticketStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            style={{
              flex: 1,
              padding: "12px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text)",
              fontSize: "14px",
              outline: "none"
            }}
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Ticket Assignment */}
      <div className={styles.infoCard}>
        <p className={styles.infoSectionTitle}>Assign Responsibility</p>
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <select
            value={assignedPermission || ""}
            onChange={(e) => onAssignChange(e.target.value)}
            disabled={isAssignPending}
            style={{
              flex: 1,
              padding: "12px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text)",
              fontSize: "14px",
              outline: "none"
            }}
          >
            <option value="">Unassigned</option>
            {ALL_PERMISSIONS.map(perm => (
              <option key={perm} value={perm}>{ROUTE_QUEUE_LABELS[perm]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Private Admin Notes */}
      <div className={styles.infoCard} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <p className={styles.infoSectionTitle}>Private Admin Notes</p>
        <textarea
          placeholder="Enter internal notes visible only to admins..."
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          className={styles.notesArea}
        />
        <button
          type="button"
          onClick={onSaveNotes}
          disabled={isNotesPending}
          className={styles.saveNotesBtn}
        >
          <Icon name="save" style={{ fontSize: "16px" }} />
          {isNotesPending ? "Saving notes..." : "Save Admin Notes"}
        </button>
      </div>
    </div>
  );
}
