import type { ReactNode } from "react";

interface PermissionsTooltipProps {
  email: string;
  permissions?: string[];
  isAdmin: boolean;
  align?: "flex-start" | "flex-end" | "center";
  children?: ReactNode;
}

export default function PermissionsTooltip({ email, permissions, isAdmin, align = "flex-end", children }: PermissionsTooltipProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align, gap: "2px" }}>
      {isAdmin ? (
        <div className="tooltip-container">
          {children ? (
            children
          ) : (
            <span style={{ color: "var(--primary)", fontWeight: "600", borderBottom: "1px dashed var(--primary)", paddingBottom: "1px", cursor: "pointer" }}>
              {email}
            </span>
          )}
          <div className="tooltip-box">
            <div style={{ fontWeight: "600", marginBottom: "6px", color: "var(--text)", fontSize: "11px" }}>Agent Permissions:</div>
            {permissions && permissions.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {permissions.map((perm) => (
                  <span
                    key={perm}
                    style={{
                      fontSize: "9px",
                      background: "rgba(0, 224, 164, 0.15)",
                      color: "var(--primary)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontWeight: "bold"
                    }}
                  >
                    {perm.replace("MANAGE_", "")}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontStyle: "italic", color: "var(--muted)" }}>No administrative permissions</span>
            )}
          </div>
        </div>
      ) : (
        children ? (
          children
        ) : (
          <span style={{ fontWeight: "600", color: "var(--text)" }}>
            {email}
          </span>
        )
      )}
    </div>
  );
}
