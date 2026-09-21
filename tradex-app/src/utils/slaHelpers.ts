export type SlaStatus = "COMPLETED" | "ON_TRACK" | "APPROACHING" | "OVERDUE";

export interface SlaInfo {
  status: SlaStatus;
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
  isOverdue: boolean;
  elapsedHours: number;
}

function formatDuration(diffMs: number): string {
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(diffMinutes / 1440);
  const hours = Math.floor((diffMinutes % 1440) / 60);
  const minutes = diffMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
}

export function getTicketSlaInfo(
  createdAtInput: string | number,
  ticketStatus: string,
  resolvedAtInput?: string | number | null
): SlaInfo {
  const createdTime = new Date(createdAtInput).getTime();
  const isResolvedOrClosed = ticketStatus === "RESOLVED" || ticketStatus === "CLOSED";

  const endTime = isResolvedOrClosed && resolvedAtInput
    ? new Date(resolvedAtInput).getTime()
    : Date.now();

  const diffMs = Math.max(0, endTime - createdTime);
  const diffHours = diffMs / (1000 * 60 * 60);
  const roundedHours = Math.floor(diffHours);
  const durationStr = formatDuration(diffMs);

  if (isResolvedOrClosed) {
    return {
      status: "COMPLETED",
      label: `Resolved in ${durationStr}`,
      shortLabel: durationStr,
      color: "var(--success)",
      bg: "var(--success-bg)",
      border: "var(--success-border)",
      icon: "check_circle",
      isOverdue: false,
      elapsedHours: diffHours,
    };
  }

  // Active tickets (OPEN / IN_PROGRESS)
  if (diffHours >= 24) {
    return {
      status: "OVERDUE",
      label: `Overdue • ${durationStr}`,
      shortLabel: `${durationStr} (Overdue)`,
      color: "var(--danger)",
      bg: "var(--danger-bg)",
      border: "var(--danger-border)",
      icon: "error",
      isOverdue: true,
      elapsedHours: diffHours,
    };
  }

  if (diffHours >= 12) {
    return {
      status: "APPROACHING",
      label: `SLA Alert • ${roundedHours}h old`,
      shortLabel: `${roundedHours}h (Warning)`,
      color: "var(--warning)",
      bg: "var(--warning-bg)",
      border: "var(--warning-border)",
      icon: "warning",
      isOverdue: false,
      elapsedHours: diffHours,
    };
  }

  return {
    status: "ON_TRACK",
    label: `On Track • ${durationStr}`,
    shortLabel: `${durationStr} (Active)`,
    color: "var(--primary)",
    bg: "var(--primary-bg)",
    border: "var(--primary-border)",
    icon: "schedule",
    isOverdue: false,
    elapsedHours: diffHours,
  };
}
