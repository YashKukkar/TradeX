import React from "react";
import Icon from "./Icon";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconName?: string;
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export default function ActionButton({
  iconName,
  loading = false,
  loadingText,
  children,
  style,
  disabled,
  ...props
}: ActionButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.65 : 1,
        transition: "all 0.2s ease",
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <>
          <style>{`
            @keyframes action-btn-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .action-btn-spinner {
              display: inline-block;
              animation: action-btn-spin 1s linear infinite;
            }
          `}</style>
          <Icon name="progress_activity" className="action-btn-spinner" style={{ fontSize: "16px" }} />
          <span>{loadingText || "Processing..."}</span>
        </>
      ) : (
        <>
          {iconName && <Icon name={iconName} style={{ fontSize: "16px" }} />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
