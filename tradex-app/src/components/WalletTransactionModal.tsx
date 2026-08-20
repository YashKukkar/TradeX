import DepositRequestModal from "./DepositRequestModal";
import WithdrawalRequestModal from "./WithdrawalRequestModal";
import PointsConvertModal from "./PointsConvertModal";
import type { SystemSetting } from "../utils/dashboardHelpers";

interface WalletTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "deposit" | "withdraw" | "convert";
  onSuccess?: () => void;
  withdrawableBalance?: number;
  accountNumber?: string;
  pointsBalance?: number;
  publicSettings?: SystemSetting;
}

export default function WalletTransactionModal({
  isOpen,
  onClose,
  type,
  onSuccess,
  withdrawableBalance = 0,
  accountNumber: _accountNumber = "",
  pointsBalance = 0,
  publicSettings,
}: WalletTransactionModalProps) {
  if (type === "deposit") {
    return (
      <DepositRequestModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (type === "withdraw") {
    return (
      <WithdrawalRequestModal
        isOpen={isOpen}
        onClose={onClose}
        withdrawableBalance={withdrawableBalance}
      />
    );
  }

  if (type === "convert") {
    return (
      <PointsConvertModal
        isOpen={isOpen}
        onClose={onClose}
        pointsBalance={pointsBalance}
        publicSettings={publicSettings}
      />
    );
  }

  return null;
}
