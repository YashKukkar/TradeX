import { useState, useEffect, useRef } from "react";
import AdminSettingsForm from "./AdminSettingsForm";
import { useAdminTelemetry } from "../hooks/useDashboard";
import { useSaveSystemSettings } from "../hooks/useAdmin";
import { validateSystemSettings } from "../utils/validation";
import type { SystemSetting } from "../utils/dashboardHelpers";

export default function SettingsTab() {
  const [settings, setSettings] = useState<SystemSetting>({
    welcomeCoinsEnabled: true,
    welcomeCoinsAmount: 1000,
    referralCoinsEnabled: true,
    referralCoinsL1Amount: 500,
    referralCoinsL2Amount: 200,
    referralCoinsL3Amount: 100,
    referralCoinsSubsequentEnabled: true,
    referralCoinsSubsequentAmount: 50,
    referralCoinsLimitTier: 3,
    emailVerificationEnabled: false,
    phoneVerificationEnabled: false,
    firstDepositRewardEnabled: true,
    firstDepositRewardAmount: 100,
    firstDepositRewardThreshold: 500,
    pointsToCashConversionRate: 10,
    pointsConversionEnabled: true,
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    smtpFromEmail: "noreply@tradex.com",
    smtpFromName: "TradeX",
    emailNotificationsEnabled: false,
    appTimezone: "Asia/Kolkata",
    appCurrency: "INR",
  });

  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: adminData } = useAdminTelemetry(true);

  useEffect(() => {
    if (adminData?.settingsConfig) {
      setSettings(adminData.settingsConfig);
    }
  }, [adminData]);

  useEffect(() => {
    setErrors(validateSystemSettings(settings));
  }, [settings]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const saveSettingsMutation = useSaveSystemSettings({
    onSuccess: (data) => {
      if (data) setSettings(data);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setSettingsSuccess(true);
      timeoutRef.current = setTimeout(() => setSettingsSuccess(false), 3000);
    },
    onError: (err: any) => setSettingsError(err.message || "An error occurred"),
  });

  const savingSettings = saveSettingsMutation.isPending;

  return (
    <AdminSettingsForm
      settings={settings}
      setSettings={setSettings}
      errors={errors}
      settingsSuccess={settingsSuccess}
      settingsError={settingsError}
      savingSettings={savingSettings}
      saveSettings={() => saveSettingsMutation.mutate(settings)}
    />
  );
}
