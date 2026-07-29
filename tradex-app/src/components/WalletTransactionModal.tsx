import { useState, useEffect } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import styles from "./PaymentGatewayModal.module.css";
import cwStyles from "./CashWallet.module.css";
import { useDeposit, useWithdraw, useConvertPoints } from "../hooks/useDashboard";
import type { SystemSetting } from "../utils/dashboardHelpers";
import UPIPaymentStep from "./checkout/UPIPaymentStep";
import CardPaymentStep from "./checkout/CardPaymentStep";
import OTPPaymentStep from "./checkout/OTPPaymentStep";
import NetbankingPaymentStep from "./checkout/NetbankingPaymentStep";
import PaymentStatusStep from "./checkout/PaymentStatusStep";

interface WalletTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "deposit" | "withdraw" | "convert";
  // Deposit callback
  onSuccess?: () => void;
  // Withdraw & Convert props
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
  accountNumber = "",
  pointsBalance = 0,
  publicSettings,
}: WalletTransactionModalProps) {
  // Deposit States
  const [amount, setAmount] = useState<number>(0);
  const [amountInput, setAmountInput] = useState("");
  const [step, setStep] = useState<"amount" | "select" | "upi" | "card" | "otp" | "netbanking" | "processing" | "success" | "error">("amount");
  const [selectedBank, setSelectedBank] = useState("");
  const [loadingText, setLoadingText] = useState("Connecting to checkout...");
  const [errorMsg, setErrorMsg] = useState("");

  // Withdraw States
  const [withAmt, setWithAmt] = useState("");
  const [withError, setWithError] = useState("");
  const [withSuccess, setWithSuccess] = useState(false);
  const [withFailed, setWithFailed] = useState(false);
  const [withSuccessAmt, setWithSuccessAmt] = useState("");

  // Convert States
  const [convPoints, setConvPoints] = useState("");
  const [convError, setConvError] = useState("");
  const [convSuccess, setConvSuccess] = useState(false);
  const [convFailed, setConvFailed] = useState(false);
  const [convSuccessPoints, setConvSuccessPoints] = useState("");

  // Reset all states when modal is opened/closed or type changes
  useEffect(() => {
    if (!isOpen) {
      setAmount(0);
      setAmountInput("");
      setStep("amount");
      setSelectedBank("");
      setLoadingText("Connecting to checkout...");
      setErrorMsg("");

      setWithAmt("");
      setWithError("");
      setWithSuccess(false);
      setWithFailed(false);
      setWithSuccessAmt("");

      setConvPoints("");
      setConvError("");
      setConvSuccess(false);
      setConvFailed(false);
      setConvSuccessPoints("");
    }
  }, [isOpen, type]);

  // Hook Mutations
  const depositMutation = useDeposit(
    () => {
      setStep("success");
    },
    (err) => {
      setErrorMsg(err || "We couldn't complete your deposit. Please try again.");
      setStep("error");
    }
  );

  const withdrawMutation = useWithdraw(
    () => {
      setWithSuccessAmt(withAmt);
      setWithSuccess(true);
      setWithFailed(false);
      setWithError("");
    },
    (err) => {
      setWithError(err || "We couldn't process your withdrawal. Please try again.");
      setWithSuccess(false);
      setWithFailed(true);
    }
  );

  const convertPointsMutation = useConvertPoints(
    () => {
      setConvSuccessPoints(convPoints);
      setConvSuccess(true);
      setConvFailed(false);
      setConvError("");
    },
    (err) => {
      setConvError(err || "We couldn't convert your points right now. Please try again.");
      setConvSuccess(false);
      setConvFailed(true);
    }
  );

  const startProcessing = (initialText: string) => {
    setStep("processing");
    setLoadingText(initialText);

    setTimeout(() => {
      setLoadingText("Waiting for bank approval...");
      setTimeout(() => {
        setLoadingText("Finishing up...");
        setTimeout(() => {
          depositMutation.mutate({ amount });
        }, 800);
      }, 800);
    }, 800);
  };

  const handleUpiSubmit = () => {
    startProcessing("Authorizing UPI payment request...");
  };

  const handleCardSubmit = () => {
    setStep("otp");
  };

  const handleOtpSubmit = () => {
    startProcessing("Authorizing card payment secure connection...");
  };

  const handleNetbankingSelect = (bankName: string) => {
    setSelectedBank(bankName);
    setStep("netbanking");
  };

  const handleNetbankingApprove = () => {
    startProcessing(`Redirecting to ${selectedBank}...`);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber) {
      setWithError("You'll need to link your bank account before you can withdraw funds.");
      return;
    }

    if (withAmt.includes(".") && withAmt.split(".")[1].length > 2) {
      setWithError("Withdrawal amounts can only include up to two decimal places (paise).");
      return;
    }

    const amt = parseFloat(withAmt);
    if (isNaN(amt) || amt <= 0) {
      setWithError("Please enter a withdrawal amount greater than ₹0.");
      return;
    }
    if (amt < 100) {
      setWithError("The minimum withdrawal amount is ₹100.00.");
      return;
    }
    if (amt > 50000) {
      setWithError("The maximum withdrawal amount per transaction is ₹50,000.00.");
      return;
    }
    if (amt > withdrawableBalance) {
      setWithError("You don't have enough withdrawable balance for this request.");
      return;
    }
    setWithError("");
    setWithSuccess(false);
    setWithFailed(false);
    withdrawMutation.mutate({ amount: amt });
  };

  const handleConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d+$/.test(convPoints)) {
      setConvError("Please enter a whole number of points.");
      return;
    }

    const pts = Number(convPoints);
    if (pts <= 0) {
      setConvError("Enter a points amount greater than 0 to convert.");
      return;
    }
    if (pts > pointsBalance) {
      setConvError("You don't have enough points for this conversion.");
      return;
    }

    setConvError("");
    setConvSuccess(false);
    setConvFailed(false);
    convertPointsMutation.mutate({ points: pts });
  };

  // Determine Modal Title and Subtitle
  let modalTitle = "";
  let modalSubtitle: string | undefined = undefined;

  if (type === "deposit") {
    modalTitle =
      step === "success"
        ? "Transaction Successful"
        : step === "processing"
        ? "Processing Payment"
        : step === "error"
        ? "Transaction Failed"
        : step === "amount"
        ? "Add Funds"
        : `Add ₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    modalSubtitle =
      step === "amount"
        ? "Enter the amount you wish to add to your wallet"
        : step === "select"
        ? "Choose your preferred payment method"
        : step === "upi"
        ? "Scan QR or enter UPI Address"
        : step === "card"
        ? "Enter debit or credit card details"
        : step === "otp"
        ? "Enter the verification code to complete payment"
        : step === "netbanking"
        ? "Complete transfer on bank portal"
        : undefined;
  } else if (type === "withdraw") {
    modalTitle = withSuccess ? "Transaction Successful" : withFailed ? "Transaction Failed" : "Withdraw Funds";
    modalSubtitle = (withSuccess || withFailed) ? undefined : "Transfer cash from your withdrawable balance to your bank account";
  } else if (type === "convert") {
    modalTitle = convSuccess ? "Transaction Successful" : convFailed ? "Transaction Failed" : "Convert TradeX Points";
    modalSubtitle = (convSuccess || convFailed) ? undefined : "Convert points to bonus cash balance";
  }

  const estimatedValue = parseFloat(convSuccessPoints || "0") / (publicSettings?.pointsToCashConversionRate || 1);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      size="sm"
    >
      {type === "deposit" && (
        <div className={styles.container}>
          {(() => {
            const getStepNumber = (s: typeof step): number => {
              switch (s) {
                case "amount": return 1;
                case "select": return 2;
                case "upi":
                case "card":
                case "netbanking": return 3;
                case "otp":
                case "processing": return 4;
                default: return 0;
              }
            };
            const currentStep = getStepNumber(step);
            if (currentStep > 0) {
              return (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  {[
                    { num: 1, label: "Amount" },
                    { num: 2, label: "Method" },
                    { num: 3, label: "Details" },
                    { num: 4, label: "Verify" }
                  ].map((s) => (
                    <div key={s.num} style={{ display: "flex", alignItems: "center", gap: "6px", opacity: currentStep >= s.num ? 1 : 0.4, transition: "opacity 0.2s" }}>
                      <span style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: currentStep >= s.num ? "var(--primary)" : "var(--border)",
                        color: currentStep >= s.num ? "#05231c" : "var(--muted)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "800"
                      }}>{s.num}</span>
                      <span style={{ fontSize: "11px", fontWeight: "600" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              );
            }
            return null;
          })()}

          {step !== "success" && step !== "error" && step !== "processing" && (
            <div
              style={{
                background: "rgba(255, 179, 0, 0.1)",
                border: "1px solid rgba(255, 179, 0, 0.25)",
                color: "#ffb300",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "12px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Icon name="warning" style={{ fontSize: "16px" }} />
              <span>Sandbox Mode: No real funds will be charged. Feel free to use mock details to test.</span>
            </div>
          )}

          {step === "amount" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amt = parseFloat(amountInput);
                if (isNaN(amt) || amt <= 0) {
                  setErrorMsg("Please enter a valid deposit amount greater than 0");
                  return;
                }
                setAmount(amt);
                setErrorMsg("");
                setStep("select");
              }}
              className={styles.form}
              style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}
            >
              <div className={styles.inputGroup} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className={styles.label} style={{ fontSize: "13px", fontWeight: "600" }}>
                  Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={amountInput}
                  onChange={(e) => {
                    setAmountInput(e.target.value);
                    setErrorMsg("");
                  }}
                  className={styles.input}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-2)",
                    color: "var(--text)",
                  }}
                  required
                  autoFocus
                />
              </div>
              {errorMsg && <div className={styles.error} style={{ color: "var(--danger)", fontSize: "12px" }}>{errorMsg}</div>}
              <button
                type="submit"
                className={styles.submitBtn}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--primary)",
                  color: "#05231c",
                  fontWeight: "750",
                  cursor: "pointer",
                }}
              >
                Continue
              </button>
            </form>
          )}

          {step === "select" && (
            <div className={styles.methodList}>
              <button className={styles.methodBtn} onClick={() => setStep("upi")}>
                <div className={styles.btnIconWrapper}>
                  <Icon name="qr_code_2" className={styles.upiIcon} />
                </div>
                <div className={styles.btnInfo}>
                  <span className={styles.btnTitle}>UPI / Instant Scan</span>
                  <span className={styles.btnDesc}>Google Pay, PhonePe, BHIM, QR</span>
                </div>
                <Icon name="chevron_right" className={styles.chevronIcon} />
              </button>

              <button className={styles.methodBtn} onClick={() => setStep("card")}>
                <div className={styles.btnIconWrapper}>
                  <Icon name="credit_card" className={styles.cardIcon} />
                </div>
                <div className={styles.btnInfo}>
                  <span className={styles.btnTitle}>Credit / Debit Cards</span>
                  <span className={styles.btnDesc}>Visa, MasterCard, RuPay, Maestro</span>
                </div>
                <Icon name="chevron_right" className={styles.chevronIcon} />
              </button>

              <div className={styles.nbSection}>
                <span className={styles.nbTitle}>Netbanking</span>
                <div className={styles.bankGrid}>
                  {[
                    { name: "HDFC Bank", logo: "account_balance" },
                    { name: "State Bank of India", logo: "account_balance" },
                    { name: "ICICI Bank", logo: "account_balance" },
                    { name: "Axis Bank", logo: "account_balance" },
                  ].map((bank) => (
                    <button
                      key={bank.name}
                      className={styles.bankBtn}
                      onClick={() => handleNetbankingSelect(bank.name)}
                    >
                      <Icon name={bank.logo} style={{ fontSize: "18px" }} />
                      <span>{bank.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setStep("amount")}
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text)",
                  fontWeight: "600",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Back to Amount Selection
              </button>
            </div>
          )}

          {step === "upi" && (
            <UPIPaymentStep
              amount={amount}
              onSubmit={handleUpiSubmit}
              onBack={() => setStep("select")}
              errorMsg={errorMsg}
            />
          )}

          {step === "card" && (
            <CardPaymentStep
              onSubmit={handleCardSubmit}
              onBack={() => setStep("select")}
              errorMsg={errorMsg}
            />
          )}

          {step === "otp" && (
            <OTPPaymentStep
              onSubmit={handleOtpSubmit}
              onBack={() => setStep("card")}
              errorMsg={errorMsg}
            />
          )}

          {step === "netbanking" && (
            <NetbankingPaymentStep
              bankName={selectedBank}
              onApprove={handleNetbankingApprove}
              onCancel={() => setStep("select")}
            />
          )}

          {(step === "processing" || step === "success" || step === "error") && (
            <PaymentStatusStep
              step={step}
              amount={amount}
              loadingText={loadingText}
              errorMsg={errorMsg}
              onSuccessDone={onSuccess || onClose}
              onErrorRetry={() => {
                setErrorMsg("");
                setStep("select");
              }}
            />
          )}
        </div>
      )}

      {type === "withdraw" && (
        withSuccess ? (
          <div className={styles.success}>
            <div className={styles.successCircle}>
              <Icon name="check" className={styles.checkIcon} />
            </div>
            <h4 className={styles.successAmt}>
              Withdrawal Request Submitted
            </h4>
            <p className={styles.successDesc}>
              Your withdrawal request of <strong>₹{parseFloat(withSuccessAmt || "0").toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong> has been successfully submitted and is pending admin approval.
            </p>
            <button type="button" className={styles.doneBtn} onClick={onClose}>
              Return to Dashboard
            </button>
          </div>
        ) : withFailed ? (
          <div className={styles.errorView}>
            <div className={styles.errorCircle}>
              <Icon name="error_outline" className={styles.errorIcon} />
            </div>
            <h4 className={styles.successAmt} style={{ color: "var(--danger)" }}>
              Withdrawal Failed
            </h4>
            <p className={styles.errorText}>
              {withError || "We couldn't process your withdrawal. Please try again."}
            </p>
            <button type="button" className={styles.doneBtn} onClick={() => { setWithFailed(false); setWithError(""); }}>
              Retry Withdrawal
            </button>
          </div>
        ) : (
          <form onSubmit={handleWithdrawSubmit} className={cwStyles.modalForm}>
            <div
              style={{
                background: "rgba(255, 179, 0, 0.1)",
                border: "1px solid rgba(255, 179, 0, 0.25)",
                color: "#ffb300",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "12px",
                fontWeight: "600",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Icon name="info" style={{ fontSize: "16px" }} />
              <span>Note: Withdrawals are simulated in this preview. No real money will be transferred to your bank.</span>
            </div>

            <div className={cwStyles.modalBalanceRow}>
              <span className={cwStyles.modalBalanceText}>
                Withdrawable Balance: <strong>₹{withdrawableBalance.toFixed(2)}</strong>
              </span>
              <span className={cwStyles.modalBalanceText}>
                Linked Account: <strong>{accountNumber || "None (Please link first)"}</strong>
              </span>
            </div>

            <div className={cwStyles.modalInputGroup}>
              <label className={cwStyles.modalInputLabel}>
                Withdrawal Amount (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={withAmt}
                onChange={(e) => {
                  setWithAmt(e.target.value);
                  setWithError("");
                }}
                className={cwStyles.modalInput}
                required
                disabled={withdrawMutation.isPending || !accountNumber}
              />
            </div>

            {withError && (
              <div className={cwStyles.modalError}>
                {withError}
              </div>
            )}

            <div className={cwStyles.modalActionButtons}>
              <button
                type="button"
                className={cwStyles.modalCancelBtn}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={cwStyles.modalSubmitBtn}
                disabled={withdrawMutation.isPending || !accountNumber || !withAmt}
              >
                {withdrawMutation.isPending ? (
                  <>
                    <style>{`
                      @keyframes wallet-spin { to { transform: rotate(360deg); } }
                      .wallet-spinner {
                        display: inline-block;
                        width: 14px;
                        height: 14px;
                        border: 2px solid rgba(255, 255, 255, 0.2);
                        border-top-color: currentColor;
                        border-radius: 50%;
                        animation: wallet-spin 0.8s linear infinite;
                        flex-shrink: 0;
                        margin-right: 6px;
                      }
                    `}</style>
                    <span className="wallet-spinner" />
                    <span>Processing...</span>
                  </>
                ) : (
                  "Withdraw"
                )}
              </button>
            </div>
          </form>
        )
      )}

      {type === "convert" && (
        convSuccess ? (
          <div className={styles.success}>
            <div className={styles.successCircle}>
              <Icon name="check" className={styles.checkIcon} />
            </div>
            <h4 className={styles.successAmt}>
              Points Converted Successfully
            </h4>
            <p className={styles.successDesc}>
              Your conversion of <strong>{parseInt(convSuccessPoints || "0").toLocaleString("en-IN")} TradeX Points</strong> has been successfully processed. You have received <strong>₹{estimatedValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong> in bonus cash.
            </p>
            <button type="button" className={styles.doneBtn} onClick={onClose}>
              Return to Dashboard
            </button>
          </div>
        ) : convFailed ? (
          <div className={styles.errorView}>
            <div className={styles.errorCircle}>
              <Icon name="error_outline" className={styles.errorIcon} />
            </div>
            <h4 className={styles.successAmt} style={{ color: "var(--danger)" }}>
              Conversion Failed
            </h4>
            <p className={styles.errorText}>
              {convError || "We couldn't convert your points right now. Please try again."}
            </p>
            <button type="button" className={styles.doneBtn} onClick={() => { setConvFailed(false); setConvError(""); }}>
              Retry Conversion
            </button>
          </div>
        ) : (
          <form onSubmit={handleConvertSubmit} className={cwStyles.modalForm}>
            <div className={cwStyles.modalBalanceRow}>
              <span className={cwStyles.modalBalanceText}>
                TradeX Points Balance: <strong>{pointsBalance}</strong>
              </span>
              <span className={cwStyles.modalBalanceText}>
                Conversion Rate: <strong>{publicSettings?.pointsToCashConversionRate ? `${publicSettings.pointsToCashConversionRate} Points = ₹1.00` : "..."}</strong>
              </span>
            </div>

            <div className={cwStyles.modalInputGroup}>
              <label className={cwStyles.modalInputLabel}>
                Points to Convert
              </label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={convPoints}
                onChange={(e) => {
                  setConvPoints(e.target.value);
                  setConvError("");
                }}
                className={cwStyles.modalInput}
                min="1"
                step="1"
                required
                disabled={convertPointsMutation.isPending || publicSettings?.pointsConversionEnabled === false}
              />
              {convPoints && publicSettings?.pointsToCashConversionRate && (
                <span className={cwStyles.modalEstimate}>
                  Estimate Value: ₹{(parseFloat(convPoints) / publicSettings.pointsToCashConversionRate).toFixed(2)}
                </span>
              )}
            </div>

            {convError && (
              <div className={cwStyles.modalError}>
                {convError}
              </div>
            )}

            <div className={cwStyles.modalActionButtons}>
              <button
                type="button"
                className={cwStyles.modalCancelBtn}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={cwStyles.modalSubmitBtn}
                disabled={
                  convertPointsMutation.isPending ||
                  publicSettings?.pointsConversionEnabled === false ||
                  !convPoints
                }
              >
                {convertPointsMutation.isPending ? (
                  <>
                    <style>{`
                      @keyframes wallet-spin { to { transform: rotate(360deg); } }
                      .wallet-spinner {
                        display: inline-block;
                        width: 14px;
                        height: 14px;
                        border: 2px solid rgba(255, 255, 255, 0.2);
                        border-top-color: currentColor;
                        border-radius: 50%;
                        animation: wallet-spin 0.8s linear infinite;
                        flex-shrink: 0;
                        margin-right: 6px;
                      }
                    `}</style>
                    <span className="wallet-spinner" />
                    <span>Converting...</span>
                  </>
                ) : (
                  "Convert"
                )}
              </button>
            </div>
          </form>
        )
      )}
    </Modal>
  );
}
