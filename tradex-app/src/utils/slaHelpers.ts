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
  const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const roundedHours = Math.floor(diffHours);

  if (isResolvedOrClosed) {
    let resolutionTimeStr = "";
    if (roundedHours >= 24) {
      const days = Math.floor(roundedHours / 24);
      const remainingHours = roundedHours % 24;
      resolutionTimeStr = `${days}d ${remainingHours}h`;
    } else if (roundedHours > 0) {
      resolutionTimeStr = `${roundedHours}h ${diffMinutes}m`;
    } else {
      resolutionTimeStr = `${Math.max(1, diffMinutes)}m`;
    }

    return {
      status: "COMPLETED",
      label: `Resolved in ${resolutionTimeStr}`,
      shortLabel: resolutionTimeStr,
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
    const days = Math.floor(diffHours / 24);
    const remainingHours = roundedHours % 24;
    const timeStr = days >= 1 ? `${days}d ${remainingHours}h` : `${roundedHours}h`;

    return {
      status: "OVERDUE",
      label: `Overdue • ${timeStr}`,
      shortLabel: `${timeStr} (Overdue)`,
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

  const timeStr = roundedHours > 0 ? `${roundedHours}h ${diffMinutes}m` : `${Math.max(1, diffMinutes)}m`;
  return {
    status: "ON_TRACK",
    label: `On Track • ${timeStr}`,
    shortLabel: `${timeStr} (Active)`,
    color: "var(--primary)",
    bg: "var(--primary-bg)",
    border: "var(--primary-border)",
    icon: "schedule",
    isOverdue: false,
    elapsedHours: diffHours,
  };
}
