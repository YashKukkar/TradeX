import { useState } from "react";
import Card from "./Card";
import WalletTransactionModal from "./WalletTransactionModal";
import Icon from "./Icon";
import { useCurrentUser } from "../hooks/useDashboard";
import { getPrimaryAccountNumber } from "../utils/dashboardHelpers";
import type { SystemSetting } from "../utils/dashboardHelpers";
import styles from "../Dashboard.module.css";
import cwStyles from "./CashWallet.module.css";

interface CashWalletSectionProps {
  pointsBalance: number;
  withdrawableBalance: number;
  bonusBalance: number;
  hasDeposited: boolean;
  publicSettings: SystemSetting | undefined;
  className?: string;
}

export default function CashWalletSection({
  pointsBalance,
  withdrawableBalance,
  bonusBalance,
  publicSettings,
  className,
}: CashWalletSectionProps) {
  const { data: user } = useCurrentUser();
  const accountNumber = getPrimaryAccountNumber(user) || "";

  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

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

      {showPaymentGateway && (
        <WalletTransactionModal
          isOpen={showPaymentGateway}
          onClose={() => setShowPaymentGateway(false)}
          type="deposit"
          onSuccess={() => {
            setShowPaymentGateway(false);
          }}
        />
      )}

      {showWithdrawModal && (
        <WalletTransactionModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          type="withdraw"
          withdrawableBalance={withdrawableBalance}
          accountNumber={accountNumber}
        />
      )}

      {showConvertModal && (
        <WalletTransactionModal
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          type="convert"
          pointsBalance={pointsBalance}
          publicSettings={publicSettings}
        />
      )}
    </>
  );
}
