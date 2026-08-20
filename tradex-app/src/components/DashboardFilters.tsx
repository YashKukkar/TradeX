import { useState, useEffect } from "react";
import Icon from "./Icon";
import ActionButton from "./ActionButton";
import styles from "./SuperAdminOverview.module.css";


interface DashboardFiltersProps {
  onChange: (startDate: string, endDate: string) => void;
  onExport?: () => void;
  isExporting?: boolean;
}

export function getStartDate(filterType: string, customStart?: string): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (filterType === "today") {
    return d;
  } else if (filterType === "yesterday") {
    d.setDate(d.getDate() - 1);
    return d;
  } else if (filterType === "7days") {
    d.setDate(d.getDate() - 6);
    return d;
  } else if (filterType === "30days") {
    d.setDate(d.getDate() - 29);
    return d;
  } else if (filterType === "thisMonth") {
    d.setDate(1);
    return d;
  } else if (filterType === "custom" && customStart) {
    const custom = new Date(customStart);
    custom.setHours(0, 0, 0, 0);
    return custom;
  }
  return d;
}

export function getEndDate(filterType: string, customEnd?: string): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  if (filterType === "yesterday") {
    d.setDate(d.getDate() - 1);
    d.setHours(23, 59, 59, 999);
    return d;
  } else if (filterType === "custom" && customEnd) {
    const custom = new Date(customEnd);
    custom.setHours(23, 59, 59, 999);
    return custom;
  }
  return d;
}

export function toLocalISOString(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export default function DashboardFilters({ onChange, onExport, isExporting }: DashboardFiltersProps) {
  const [filterType, setFilterType] = useState<string>("today");

  const todayStr = new Date().toISOString().split("T")[0];
  const [customStart, setCustomStart] = useState<string>(todayStr);
  const [customEnd, setCustomEnd] = useState<string>(todayStr);

  useEffect(() => {
    const start = getStartDate(filterType, customStart);
    const end = getEndDate(filterType, customEnd);
    onChange(toLocalISOString(start), toLocalISOString(end));
  }, [filterType, customStart, customEnd]);

  return (
    <div className={styles.filtersContainer}>
      <button
        className={`${styles.filterBtn} ${filterType === "today" ? styles.filterBtnActive : ""}`}
        onClick={() => setFilterType("today")}
      >
        Today
      </button>
      <button
        className={`${styles.filterBtn} ${filterType === "yesterday" ? styles.filterBtnActive : ""}`}
        onClick={() => setFilterType("yesterday")}
      >
        Yesterday
      </button>
      <button
        className={`${styles.filterBtn} ${filterType === "7days" ? styles.filterBtnActive : ""}`}
        onClick={() => setFilterType("7days")}
      >
        Last 7 Days
      </button>
      <button
        className={`${styles.filterBtn} ${filterType === "30days" ? styles.filterBtnActive : ""}`}
        onClick={() => setFilterType("30days")}
      >
        Last 30 Days
      </button>
      <button
        className={`${styles.filterBtn} ${filterType === "thisMonth" ? styles.filterBtnActive : ""}`}
        onClick={() => setFilterType("thisMonth")}
      >
        This Month
      </button>
      <button
        className={`${styles.filterBtn} ${filterType === "custom" ? styles.filterBtnActive : ""}`}
        onClick={() => setFilterType("custom")}
      >
        <Icon name="date_range" style={{ fontSize: "14px", verticalAlign: "middle", marginRight: "4px" }} />
        Custom Range
      </button>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        {filterType === "custom" && (
          <div className={styles.customDateContainer} style={{ marginLeft: 0 }}>
            <div className={styles.dateFieldGroup}>
              <span className={styles.dateLabel}>From:</span>
              <input
                type="date"
                value={customStart}
                max={customEnd}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val || !customEnd || val <= customEnd) {
                    setCustomStart(val);
                  }
                }}
                className={styles.dateInput}
              />
            </div>
            <span style={{ color: "var(--muted)", opacity: 0.5 }}>➔</span>
            <div className={styles.dateFieldGroup}>
              <span className={styles.dateLabel}>To:</span>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val || !customStart || val >= customStart) {
                    setCustomEnd(val);
                  }
                }}
                className={styles.dateInput}
              />
            </div>
          </div>
        )}

        {onExport && (
          <ActionButton
            iconName="download"
            loading={!!isExporting}
            loadingText="Exporting..."
            onClick={onExport}
            className={styles.exportBtn}
            title="Export Analytics CSV"
          >
            Export CSV
          </ActionButton>
        )}
      </div>

      <div style={{ width: "100%", marginTop: "2px", fontSize: "11.5px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "6px" }}>
        <Icon name="info" style={{ fontSize: "13px", color: "var(--primary)" }} />
        <span>Telemetry period: <strong>{filterType === "today" ? "Today (Live)" : filterType === "yesterday" ? "Yesterday" : filterType === "7days" ? "Last 7 Days" : filterType === "30days" ? "Last 30 Days" : filterType === "thisMonth" ? "This Month" : "Custom Range"}</strong></span>
      </div>
    </div>
  );
}

