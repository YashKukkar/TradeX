import React from "react";
import Icon from "./Icon";
import type { SystemSetting } from "../utils/dashboardHelpers";
import styles from "../AdminUsers.module.css";
import SettingToggle from "./SettingToggle";
import SettingInput from "./SettingInput";

interface AdminSettingsFormProps {
  settings: SystemSetting;
  setSettings: (settings: SystemSetting) => void;
  errors: Record<string, string>;
  settingsSuccess: boolean;
  settingsError: string;
  savingSettings: boolean;
  saveSettings: () => void;
}

export default function AdminSettingsForm({
  settings,
  setSettings,
  errors,
  settingsSuccess,
  settingsError,
  savingSettings,
  saveSettings,
}: AdminSettingsFormProps) {
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({
    onboarding: false,
    referrals: false,
    security: false,
  });

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div id="platform-settings-controls" className={styles.settingsSection}>
      <h2 className={styles.settingsTitle}>
        <Icon name="settings_suggest" style={{ color: "var(--primary)" }} />
        Platform Settings
      </h2>
      <div className={styles.settingsGrid}>
        {/* Column 1: Onboarding & Deposits */}
        <div className={styles.settingsColumn}>
          <h3
            onClick={() => toggleCollapse("onboarding")}
            style={{
              fontSize: "14px",
              fontWeight: "750",
              color: "var(--primary)",
              margin: "0 0 8px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderBottom: "1px dashed var(--border)",
              paddingBottom: "8px",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            <Icon name="rocket_launch" style={{ fontSize: "18px" }} />
            <span style={{ flex: 1 }}>Onboarding & Deposits</span>
            <Icon name={collapsed.onboarding ? "expand_more" : "expand_less"} style={{ fontSize: "18px", opacity: 0.6 }} />
          </h3>

          {!collapsed.onboarding && (
            <div>
              <SettingToggle
                title="Welcome Points"
                desc="Reward new users with signup points"
                checked={settings.welcomeCoinsEnabled}
                onChange={checked => setSettings({ ...settings, welcomeCoinsEnabled: checked })}
              />
              <SettingInput
                label="Welcome Amount (Points)"
                disabled={!settings.welcomeCoinsEnabled}
                value={settings.welcomeCoinsAmount}
                error={errors.welcomeCoinsAmount}
                onChange={val => setSettings({ ...settings, welcomeCoinsAmount: val })}
              />

              <div style={{ marginTop: "12px", borderTop: "1px dashed var(--border)", paddingTop: "16px" }}>
                <SettingToggle
                  title="First Deposit Bonus"
                  desc="Reward users on first wallet load"
                  checked={settings.firstDepositRewardEnabled}
                  onChange={checked => setSettings({ ...settings, firstDepositRewardEnabled: checked })}
                />
                <SettingInput
                  label="First Deposit Reward (₹)"
                  disabled={!settings.firstDepositRewardEnabled}
                  value={settings.firstDepositRewardAmount}
                  error={errors.firstDepositRewardAmount}
                  onChange={val => setSettings({ ...settings, firstDepositRewardAmount: val })}
                />
                <SettingInput
                  label="Min Deposit Threshold (₹)"
                  disabled={!settings.firstDepositRewardEnabled}
                  value={settings.firstDepositRewardThreshold}
                  error={errors.firstDepositRewardThreshold}
                  onChange={val => setSettings({ ...settings, firstDepositRewardThreshold: val })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Referral Incentive System */}
        <div className={styles.settingsColumn}>
          <h3
            onClick={() => toggleCollapse("referrals")}
            style={{
              fontSize: "14px",
              fontWeight: "750",
              color: "var(--accent)",
              margin: "0 0 8px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderBottom: "1px dashed var(--border)",
              paddingBottom: "8px",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            <Icon name="groups" style={{ fontSize: "18px" }} />
            <span style={{ flex: 1 }}>Referral Program</span>
            <Icon name={collapsed.referrals ? "expand_more" : "expand_less"} style={{ fontSize: "18px", opacity: 0.6 }} />
          </h3>

          {!collapsed.referrals && (
            <div>
              <SettingToggle
                title="Referral Program"
                desc="Reward referrers up the chain"
                checked={settings.referralCoinsEnabled}
                onChange={checked => setSettings({ ...settings, referralCoinsEnabled: checked })}
              />
              <SettingInput
                label="Specific Tiers Reward Limit (1-3)"
                disabled={!settings.referralCoinsEnabled}
                value={settings.referralCoinsLimitTier}
                error={errors.referralCoinsLimitTier}
                min="1"
                max="3"
                onChange={val => setSettings({ ...settings, referralCoinsLimitTier: val })}
              />
              <SettingInput
                label="Level 1 Reward (Points)"
                disabled={!settings.referralCoinsEnabled}
                value={settings.referralCoinsL1Amount}
                error={errors.referralCoinsL1Amount}
                onChange={val => setSettings({ ...settings, referralCoinsL1Amount: val })}
              />
              <SettingInput
                label={`Level 2 Reward (Points) ${settings.referralCoinsLimitTier < 2 ? "(Disabled by Limit)" : ""}`}
                disabled={!settings.referralCoinsEnabled || settings.referralCoinsLimitTier < 2}
                value={settings.referralCoinsL2Amount}
                error={errors.referralCoinsL2Amount}
                onChange={val => setSettings({ ...settings, referralCoinsL2Amount: val })}
              />
              <SettingInput
                label={`Level 3 Reward (Points) ${settings.referralCoinsLimitTier < 3 ? "(Disabled by Limit)" : ""}`}
                disabled={!settings.referralCoinsEnabled || settings.referralCoinsLimitTier < 3}
                value={settings.referralCoinsL3Amount}
                error={errors.referralCoinsL3Amount}
                onChange={val => setSettings({ ...settings, referralCoinsL3Amount: val })}
              />

              <div style={{ marginTop: "12px", borderTop: "1px dashed var(--border)", paddingTop: "16px" }}>
                <SettingToggle
                  title="Subsequent Levels Incentive"
                  desc="Reward remaining chain (infinite depth)"
                  checked={settings.referralCoinsSubsequentEnabled}
                  disabled={!settings.referralCoinsEnabled}
                  onChange={checked => setSettings({ ...settings, referralCoinsSubsequentEnabled: checked })}
                />
                <SettingInput
                  label="Subsequent Level Reward (Points)"
                  disabled={!settings.referralCoinsEnabled || !settings.referralCoinsSubsequentEnabled}
                  value={settings.referralCoinsSubsequentAmount}
                  error={errors.referralCoinsSubsequentAmount}
                  onChange={val => setSettings({ ...settings, referralCoinsSubsequentAmount: val })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Security & Conversions */}
        <div className={styles.settingsColumn}>
          <h3
            onClick={() => toggleCollapse("security")}
            style={{
              fontSize: "14px",
              fontWeight: "750",
              color: "var(--primary)",
              margin: "0 0 8px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderBottom: "1px dashed var(--border)",
              paddingBottom: "8px",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            <Icon name="security" style={{ fontSize: "18px" }} />
            <span style={{ flex: 1 }}>Security & Conversions</span>
            <Icon name={collapsed.security ? "expand_more" : "expand_less"} style={{ fontSize: "18px", opacity: 0.6 }} />
          </h3>

          {!collapsed.security && (
            <div>
              <SettingToggle
                title="Email Verification"
                desc="Require OTP / link to verify email on signup"
                checked={settings.emailVerificationEnabled}
                onChange={checked => setSettings({ ...settings, emailVerificationEnabled: checked })}
              />
              <SettingToggle
                title="Phone Verification"
                desc="Require OTP to verify phone number on signup"
                checked={settings.phoneVerificationEnabled}
                onChange={checked => setSettings({ ...settings, phoneVerificationEnabled: checked })}
                style={{ marginTop: "12px", borderTop: "1px dashed var(--border)", paddingTop: "16px" }}
              />

              <div style={{ marginTop: "24px", borderTop: "1px dashed var(--border)", paddingTop: "16px" }}>
                <SettingToggle
                  title="Points Conversion"
                  desc="Allow converting points to cash"
                  checked={settings.pointsConversionEnabled}
                  onChange={checked => setSettings({ ...settings, pointsConversionEnabled: checked })}
                />
                <SettingInput
                  label="Points to ₹1.00 Cash Rate"
                  disabled={!settings.pointsConversionEnabled}
                  value={settings.pointsToCashConversionRate}
                  error={errors.pointsToCashConversionRate}
                  onChange={val => setSettings({ ...settings, pointsToCashConversionRate: val })}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.settingsFooter}>
        {settingsSuccess && <span className={styles.successText}>Settings saved successfully!</span>}
        {settingsError && <span className={styles.errorText}>{settingsError}</span>}
        <button
          className={styles.saveBtn}
          onClick={saveSettings}
          disabled={savingSettings || Object.keys(errors).length > 0}
        >
          <Icon name={savingSettings ? "sync" : "save"} style={{ fontSize: "16px" }} />
          {savingSettings ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
