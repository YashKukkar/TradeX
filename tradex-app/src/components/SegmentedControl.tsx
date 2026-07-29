interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  activeColor?: string;
  activeBg?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  loading = false,
}: SegmentedControlProps<T>) {
  const isControlDisabled = disabled || loading;

  return (
    <div
      style={{
        display: "flex",
        background: "rgba(0, 0, 0, 0.18)",
        borderRadius: "8px",
        padding: "3px",
        border: "1px solid var(--border)",
        width: "100%",
        gap: "4px",
        opacity: isControlDisabled ? 0.6 : 1,
        pointerEvents: isControlDisabled ? "none" : "auto",
        boxSizing: "border-box",
      }}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        const activeBg = opt.activeBg || "var(--surface-3)";
        const activeColor = opt.activeColor || "var(--text)";

        return (
          <button
            key={opt.value}
            type="button"
            disabled={isControlDisabled}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              background: isActive ? activeBg : "transparent",
              color: isActive ? activeColor : "var(--muted)",
              border: "none",
              borderRadius: "6px",
              padding: "8px 6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: isControlDisabled ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              boxShadow: isActive ? "0 2px 6px rgba(0, 0, 0, 0.2)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {isActive && loading && (
              <>
                <style>{`
                  @keyframes segmented-control-spin {
                    to { transform: rotate(360deg); }
                  }
                  .segmented-spinner {
                    display: inline-block;
                    width: 10px;
                    height: 10px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    border-top-color: currentColor;
                    animation: segmented-control-spin 0.8s linear infinite;
                    flex-shrink: 0;
                  }
                `}</style>
                <span className="segmented-spinner" />
              </>
            )}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
