import { useState } from "react";
import Icon from "./Icon";
import localStyles from "./Settings.module.css";
import { getDisplayName } from "../utils/dashboardHelpers";
import {
  useAddBankAccount,
  useSetPrimaryBankAccount,
  useDeleteBankAccount,
} from "../hooks/useDashboard";
import type { UserProfile } from "../utils/dashboardHelpers";

interface BankAccountsSectionProps {
  user?: UserProfile;
  showToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
  setErrorMsg: (msg: string) => void;
  setSuccessMsg: (msg: string) => void;
}

function getBankLogo(bankName: string) {
  const name = bankName.toLowerCase();
  let initials = name.substring(0, 2).toUpperCase();

  if (name.includes("hdfc")) {
    initials = "HD";
  } else if (name.includes("state bank") || name.includes("sbi")) {
    initials = "SB";
  } else if (name.includes("icici")) {
    initials = "IC";
  } else if (name.includes("axis")) {
    initials = "AX";
  } else if (name.includes("kotak")) {
    initials = "KO";
  } else if (name.includes("paytm")) {
    initials = "PY";
  } else {
    const words = bankName.trim().split(/\s+/);
    if (words.length > 1 && words[0] && words[1]) {
      initials = (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    } else {
      initials = bankName.substring(0, 2).toUpperCase();
    }
  }

  return (
    <div className={localStyles.bankLogoPlaceholder}>
      {initials}
    </div>
  );
}

export default function BankAccountsSection({
  user,
  showToast,
  setErrorMsg,
  setSuccessMsg,
}: BankAccountsSectionProps) {
  const [bankName, setBankName] = useState("");
  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const addBankMutation = useAddBankAccount(
    () => {
      setSuccessMsg("Bank account linked successfully!");
      setErrorMsg("");
      setShowAddForm(false);
      setBankName("");
      setHolderName("");
      setAccountNumber("");
      setIfscCode("");
      setIsPrimary(false);
      showToast("Bank account linked successfully!", "success");
    },
    (err) => {
      setErrorMsg(err || "Failed to link bank account");
      setSuccessMsg("");
      showToast(err || "Failed to link bank account", "error");
    }
  );

  const setPrimaryMutation = useSetPrimaryBankAccount(
    () => {
      setSuccessMsg("Primary bank account updated!");
      setErrorMsg("");
      showToast("Primary bank account updated!", "success");
    },
    (err) => {
      setErrorMsg(err || "Failed to set primary bank account");
      setSuccessMsg("");
      showToast(err || "Failed to set primary bank account", "error");
    }
  );

  const deleteBankMutation = useDeleteBankAccount(
    () => {
      setSuccessMsg("Bank account removed successfully!");
      setErrorMsg("");
      showToast("Bank account removed successfully!", "success");
    },
    (err) => {
      setErrorMsg(err || "Failed to remove bank account");
      setSuccessMsg("");
      showToast(err || "Failed to remove bank account", "error");
    }
  );

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !holderName || !accountNumber || !ifscCode) {
      setErrorMsg("Please fill in all bank details");
      return;
    }
    setErrorMsg("");
    addBankMutation.mutate({ bankName, holderName, accountNumber, ifscCode, isPrimary });
  };

  return (
    <div className={localStyles.settingsCard}>
      <div className={localStyles.sectionHeader}>
        <h3 className={localStyles.sectionTitle}>Linked Bank Accounts</h3>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className={localStyles.linkBtn}
          >
            <Icon name="add" style={{ fontSize: "16px" }} />
            Link New Bank
          </button>
        )}
      </div>

      <div className={localStyles.bankList}>
        {(!user || !user.bankAccounts || user.bankAccounts.length === 0) ? (
          <div className={localStyles.emptyState}>No bank accounts linked yet.</div>
        ) : (
          [...user.bankAccounts]
            .sort((a, b) => (a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1))
            .map((account: any) => {
              const cleanHolderName = account.holderName.includes("@")
                ? getDisplayName(account.holderName)
                : account.holderName;
              return (
                <div
                  key={account.id}
                  className={`${localStyles.bankCard} ${account.isPrimary ? localStyles.bankCardPrimary : ""}`}
                >
                  <div className={localStyles.bankLeft}>
                    {getBankLogo(account.bankName)}
                    <div className={localStyles.bankInfo}>
                      <div className={localStyles.bankNameRow}>
                        <span className={localStyles.bankName}>{account.bankName}</span>
                        {account.isPrimary && (
                          <span className={localStyles.primaryBadge}>Primary</span>
                        )}
                      </div>
                      <div className={localStyles.bankDetailsText}>
                        {cleanHolderName} &bull; A/C: {account.accountNumber} &bull; IFSC: {account.ifscCode}
                      </div>
                    </div>
                  </div>

                  <div className={localStyles.bankActions}>
                    {!account.isPrimary && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPrimaryMutation.mutate({ id: account.id })}
                          className={localStyles.makePrimaryBtn}
                          disabled={setPrimaryMutation.isPending}
                        >
                          Make Primary
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBankMutation.mutate({ id: account.id })}
                          className={localStyles.deleteBtn}
                          disabled={deleteBankMutation.isPending}
                          aria-label="Remove bank account"
                        >
                          <Icon name="delete" style={{ fontSize: "18px" }} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleAddBank} className={localStyles.addBankForm}>
          <h4 className={localStyles.addBankTitle}>Link New Bank Account</h4>

          <div className={localStyles.inputGrid}>
            <div>
              <label className={localStyles.fieldLabel}>Bank Name</label>
              <input
                type="text"
                className={localStyles.inputField}
                placeholder="e.g. HDFC Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div>
              <label className={localStyles.fieldLabel}>Account Holder Name</label>
              <input
                type="text"
                className={localStyles.inputField}
                placeholder="e.g. John Doe"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
              />
            </div>
          </div>

          <div className={localStyles.inputGrid}>
            <div>
              <label className={localStyles.fieldLabel}>Account Number</label>
              <input
                type="text"
                className={localStyles.inputField}
                placeholder="e.g. 50100234567"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div>
              <label className={localStyles.fieldLabel}>IFSC Code</label>
              <input
                type="text"
                className={localStyles.inputField}
                placeholder="e.g. HDFC0001234"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value)}
              />
            </div>
          </div>

          <div className={localStyles.checkboxRow}>
            <input
              type="checkbox"
              id="isPrimaryCheckbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
            />
            <label htmlFor="isPrimaryCheckbox" className={localStyles.checkboxLabel}>
              Set as Primary Bank Account
            </label>
          </div>

          <div className={localStyles.formActions}>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className={localStyles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={localStyles.saveBtn}
              disabled={addBankMutation.isPending}
            >
              {addBankMutation.isPending ? "Linking..." : "Link Bank Account"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
