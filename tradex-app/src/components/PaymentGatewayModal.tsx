import { useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import styles from "./PaymentGatewayModal.module.css";
import { useDeposit } from "../hooks/useDashboard";
import UPIPaymentStep from "./checkout/UPIPaymentStep";
import CardPaymentStep from "./checkout/CardPaymentStep";
import OTPPaymentStep from "./checkout/OTPPaymentStep";
import NetbankingPaymentStep from "./checkout/NetbankingPaymentStep";
import PaymentStatusStep from "./checkout/PaymentStatusStep";

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "amount" | "select" | "upi" | "card" | "otp" | "netbanking" | "processing" | "success" | "error";

export default function PaymentGatewayModal({
  isOpen,
  onClose,
  onSuccess,
}: PaymentGatewayModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [amountInput, setAmountInput] = useState("");
  const [step, setStep] = useState<Step>("amount");
  const [selectedBank, setSelectedBank] = useState("");
  const [loadingText, setLoadingText] = useState("Connecting to checkout...");
  const [errorMsg, setErrorMsg] = useState("");

  const depositMutation = useDeposit(
    () => {
      setStep("success");
    },
    (err) => {
      setErrorMsg(err || "We couldn't complete your deposit. Please try again.");
      setStep("error");
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === "success"
          ? "Payment Successful"
          : step === "processing"
          ? "Processing Payment"
          : step === "error"
          ? "Payment Failed"
          : step === "amount"
          ? "Add Funds"
          : `Add ₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      }
      subtitle={
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
          : undefined
      }
      size="sm"
    >
      <div className={styles.container}>
        {(() => {
          const getStepNumber = (s: Step): number => {
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

        {/* TODO-PROD: Connect real PG provider and remove local sandbox indicators/timeout simulators. */}
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
            onSuccessDone={onSuccess}
            onErrorRetry={() => {
              setErrorMsg("");
              setStep("select");
            }}
          />
        )}
      </div>
    </Modal>
  );
}
