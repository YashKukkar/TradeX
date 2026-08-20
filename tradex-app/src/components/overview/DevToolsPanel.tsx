import { useState } from "react";
import Icon from "../Icon";
import styles from "../../Dashboard.module.css";
import overviewStyles from "../SuperAdminOverview.module.css";

interface DevToolsPanelProps {
  onSeedTestData: () => void;
  isPending: boolean;
}

export default function DevToolsPanel({ onSeedTestData, isPending }: DevToolsPanelProps) {
  const [showDevTools, setShowDevTools] = useState(false);

  return (
    <div style={{ marginTop: "24px" }}>
      <button
        onClick={() => setShowDevTools(!showDevTools)}
        className={overviewStyles.devToolsToggle}
      >
        <Icon name={showDevTools ? "expand_less" : "expand_more"} style={{ fontSize: "16px" }} />
        Developer Tools (Dev Mode Only)
      </button>
      {showDevTools && (
        <div className={`${styles.fadeInContainer} ${overviewStyles.devToolsPanel}`}>
          <h4 className={overviewStyles.dangerZoneTitle} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon name="database" style={{ fontSize: "16px" }} />
            Database Reset & Seeding Environment
          </h4>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>
            Reset & Seed Test Data: This will wipe all test transactions, audit logs, and test accounts (u1–u5), repopulating the database with synchronized test telemetry.
          </p>
          <button
            onClick={onSeedTestData}
            disabled={isPending}
            className={overviewStyles.dangerZoneBtn}
          >
            {isPending ? "Seeding..." : "⚡ Reset & Seed Test Data"}
          </button>
        </div>
      )}
    </div>
  );
}
