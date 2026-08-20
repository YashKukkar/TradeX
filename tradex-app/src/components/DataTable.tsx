import { useState, useEffect } from "react";
import styles from "../AdminUsers.module.css";
import Icon from "./Icon";

export interface ColumnDef<T> {
  /** Column header label */
  label: string;
  /** Key to access data, or a render function */
  key?: keyof T;
  /** Custom render function — takes precedence over key */
  render?: (row: T) => React.ReactNode;
  /** Optional fixed width, e.g. "80px" */
  width?: string;
  /** Text alignment for this column */
  align?: "left" | "center" | "right";
  /** Suppress header rendering (useful for action columns) */
  noHeader?: boolean;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  /** Row key extractor — must be unique per row */
  rowKey: (row: T) => string | number;
  /** Called when a row is clicked */
  onRowClick?: (row: T) => void;
  /** Custom class to add to <tr> when row is clickable */
  clickableRow?: boolean;
  /** Text shown when data is empty */
  emptyMessage?: string;
  /** Use compact (dense) row height — default true */
  dense?: boolean;
  /** Optional page size for pagination */
  pageSize?: number;
  /** Custom class dynamically applied to a row */
  rowClassName?: (row: T) => string | undefined;
}

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  clickableRow = true,
  emptyMessage = "No data found.",
  dense = true,
  pageSize = 10,
  rowClassName,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  // Auto-reset page index back to 1 when source data updates (filters, searches)
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  if (data.length === 0) {
    return <div className={styles.emptyState}>{emptyMessage}</div>;
  }

  const effectivePageSize = pageSize || 10;
  const totalPages = Math.max(1, Math.ceil(data.length / effectivePageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * effectivePageSize;
  const endIndex = Math.min(startIndex + effectivePageSize, data.length);
  const paginatedData = data.slice(startIndex, endIndex);

  const tableClass = dense
    ? `${styles.table} ${styles.denseTable}`
    : styles.table;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <div className={styles.tableWrap} style={{ maxHeight: "650px", overflowY: "auto" }}>
        <table className={tableClass}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  style={{
                    width: col.width,
                    textAlign: col.align ?? "left",
                  }}
                >
                  {col.noHeader ? "" : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`${onRowClick && clickableRow ? styles.clickableRow : ""} ${rowClassName ? rowClassName(row) || "" : ""}`.trim() || undefined}
                style={onRowClick ? { cursor: "pointer" } : undefined}
              >
                {columns.map((col, i) => (
                  <td
                    key={i}
                    style={{
                      width: col.width,
                      maxWidth: col.width,
                      textAlign: col.align ?? "left",
                    }}
                  >
                    {col.render
                      ? col.render(row)
                      : col.key != null
                      ? String(row[col.key] ?? "—")
                      : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo} style={{ fontSize: "12px", color: "var(--muted)" }}>
            Showing {startIndex + 1}–{endIndex} of {data.length} records
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              disabled={activePage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={styles.pageBtn}
            >
              <Icon name="chevron_left" style={{ fontSize: "16px" }} />
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {activePage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={activePage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={styles.pageBtn}
            >
              Next
              <Icon name="chevron_right" style={{ fontSize: "16px" }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
