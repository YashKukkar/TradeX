import { useState, useEffect } from "react";
import Card from "./Card";
import PaymentGatewayModal from "./PaymentGatewayModal";
import WithdrawModal from "./WithdrawModal";
import ConvertPointsModal from "./ConvertPointsModal";
import Icon from "./Icon";
import { useUpdateBankDetails } from "../hooks/useDashboard";
import type { SystemSetting } from "../utils/dashboardHelpers";
import styles from "../Dashboard.module.css";
import cwStyles from "./CashWallet.module.css";

interface CashWalletSectionProps {
  pointsBalance: number;
  accountNumber: string;
  withdrawableBalance: number;
  bonusBalance: number;
  hasDeposited: boolean;
  publicSettings: SystemSetting | undefined;
  className?: string;
}

export default function CashWalletSection({
  pointsBalance,
  accountNumber,
  withdrawableBalance,
  bonusBalance,
  publicSettings,
  className,
}: CashWalletSectionProps) {
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  const [bankAcc, setBankAcc] = useState(accountNumber || "");
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankStatusMsg, setBankStatusMsg] = useState({ text: "", isError: false });

  useEffect(() => {
    setBankAcc(accountNumber || "");
  }, [accountNumber]);

  const updateBankMutation = useUpdateBankDetails(
    () => {
      setBankStatusMsg({ text: "Bank account details updated successfully!", isError: false });
      setIsEditingBank(false);
      setTimeout(() => setBankStatusMsg({ text: "", isError: false }), 4000);
    },
    (err) => {
      setBankStatusMsg({ text: err || "Failed to update bank details.", isError: true });
    }
  );

  const handleSaveBank = () => {
    if (!bankAcc.trim()) {
      setBankStatusMsg({ text: "Bank account number cannot be empty", isError: true });
      return;
    }
    setBankStatusMsg({ text: "", isError: false });
    updateBankMutation.mutate({ accountNumber: bankAcc });
  };

  return (
    <>
      <Card className={className}>
        <Card.Icon name="account_balance_wallet" />
        <Card.Title>Cash Wallet</Card.Title>
        <Card.Body>
          <div className={cwStyles.splitContainer}>
            <div className={cwStyles.leftColumn}>
              <div className={cwStyles.balancesBox}>
                <div className={styles.balanceItem} style={{ flex: 1 }}>
                  <span className={styles.balanceLabel}>Withdrawable Cash</span>
                  <span className={cwStyles.balanceValueWithdrawable}>
                    ₹{withdrawableBalance.toFixed(2)}
                  </span>
                </div>
                <div style={{ width: "1px", background: "var(--border)" }} />
                <div className={styles.balanceItem} style={{ flex: 1, paddingLeft: "10px" }}>
                  <span className={styles.balanceLabel}>Bonus Cash</span>
                  <span className={cwStyles.balanceValueBonus}>
                    ₹{bonusBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className={cwStyles.rightColumn}>
              <span className={styles.balanceLabel} style={{ fontSize: "11px", fontWeight: "700" }}>Quick Operations</span>
              <div className={cwStyles.operationsGrid}>
                <button
                  onClick={() => setShowPaymentGateway(true)}
                  className={`${cwStyles.opCard} ${cwStyles.depositCard}`}
                >
                  <div className={`${cwStyles.iconWrapper} ${cwStyles.depositIcon}`}>
                    <Icon name="add_circle" style={{ fontSize: "26px" }} />
                  </div>
                  <div className={cwStyles.opTextWrapper}>
                    <span className={cwStyles.opTitle}>Deposit</span>
                    <span className={cwStyles.opSub}>Add Cash</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowWithdrawModal(true);
                  }}
                  className={`${cwStyles.opCard} ${cwStyles.withdrawCard}`}
                >
                  <div className={`${cwStyles.iconWrapper} ${cwStyles.withdrawIcon}`}>
                    <Icon name="arrow_circle_up" style={{ fontSize: "26px" }} />
                  </div>
                  <div className={cwStyles.opTextWrapper}>
                    <span className={cwStyles.opTitle}>Withdraw</span>
                    <span className={cwStyles.opSub}>Payout</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowConvertModal(true);
                  }}
                  className={`${cwStyles.opCard} ${cwStyles.convertCard}`}
                >
                  <div className={`${cwStyles.iconWrapper} ${cwStyles.convertIcon}`}>
                    <Icon name="currency_exchange" style={{ fontSize: "26px" }} />
                  </div>
                  <div className={cwStyles.opTextWrapper}>
                    <span className={cwStyles.opTitle}>Convert</span>
                    <span className={cwStyles.opSub}>Points</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Icon name="account_balance" />
        <Card.Title>Linked Bank Account</Card.Title>
        <Card.Body>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className={styles.balanceLabel} style={{ fontSize: "11px", fontWeight: "700" }}>Linked Bank Account</span>
              <span
                className={`${cwStyles.bankStatus} ${
                  accountNumber ? cwStyles.bankStatusLinked : cwStyles.bankStatusPending
                }`}
              >
                {accountNumber ? "Linked" : "Not Linked"}
              </span>
            </div>
            
            {isEditingBank ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                <input
                  type="text"
                  placeholder="Enter account number"
                  className={styles.actionInput}
                  value={bankAcc}
                  onChange={(e) => setBankAcc(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: "160px",
                    padding: "10px 14px",
                    fontSize: "13.5px",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-2)",
                    color: "var(--text)",
                  }}
                />
                <button
                  className={styles.actionBtn}
                  onClick={handleSaveBank}
                  disabled={updateBankMutation.isPending}
                  style={{
                    padding: "10px 16px",
                    fontSize: "13px",
                    borderRadius: "10px",
                    background: "var(--primary)",
                    color: "#05231c",
                    border: "none",
                    fontWeight: "750",
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.secondaryBtn}`}
                  onClick={() => {
                    setIsEditingBank(false);
                    setBankAcc(accountNumber || "");
                  }}
                  style={{
                    padding: "10px 16px",
                    fontSize: "13px",
                    borderRadius: "10px",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className={cwStyles.bankDetailsRow}>
                <span className={cwStyles.bankAccountMask}>
                  {accountNumber ? `•••• •••• ${accountNumber.slice(-4)}` : "No bank linked"}
                </span>
                <button
                  onClick={() => {
                    setIsEditingBank(true);
                    setBankStatusMsg({ text: "", isError: false });
                  }}
                  className={cwStyles.bankChangeBtn}
                >
                  {accountNumber ? "Change" : "Link Account"}
                </button>
              </div>
            )}
            {bankStatusMsg.text && (
              <div
                style={{
                  fontSize: "12px",
                  color: bankStatusMsg.isError ? "var(--danger)" : "var(--primary)",
                  fontWeight: "600",
                  marginTop: "2px",
                }}
              >
                {bankStatusMsg.text}
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {showPaymentGateway && (
        <PaymentGatewayModal
          isOpen={showPaymentGateway}
          onClose={() => setShowPaymentGateway(false)}
          onSuccess={() => {
            setShowPaymentGateway(false);
          }}
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          withdrawableBalance={withdrawableBalance}
          accountNumber={accountNumber}
        />
      )}

      {showConvertModal && (
        <ConvertPointsModal
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          pointsBalance={pointsBalance}
          publicSettings={publicSettings}
        />
      )}
    </>
  );
}
