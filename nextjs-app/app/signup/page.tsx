"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./Auth.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";

function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [localPhoneNumber, setLocalPhoneNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && ref !== referralCode) {
      setReferralCode(ref);
    }
  }, [searchParams, referralCode]);

  useEffect(() => {
    const errs: Record<string, string> = {};
    if (fullName) {
      if (fullName.trim().length < 2) {
        errs.fullName = "Min. 2 characters";
      } else if (fullName.trim().length > 100) {
        errs.fullName = "Max. 100 characters";
      }
    }
    if (email) {
      if (!/\S+@\S+\.\S+/.test(email)) {
        errs.email = "Invalid format";
      }
    }
    if (localPhoneNumber) {
      const localDigits = localPhoneNumber.replace(/\D/g, "");
      if (localDigits.length > 0) {
        const combinedPhone = countryCode + localDigits;
        if (!/^\+?[0-9]{10,15}$/.test(combinedPhone)) {
          errs.phoneNumber = "Must be 10-15 digits";
        }
      }
    }
    if (password) {
      if (password.length < 8) {
        errs.password = "Min. 8 characters";
      } else if (password.length > 100) {
        errs.password = "Max. 100 characters";
      }
    }
    if (confirmPassword) {
      if (password !== confirmPassword) {
        errs.confirmPassword = "Passwords do not match";
      }
    }
    if (referralCode) {
      if (!/^[A-Z0-9]{2,10}$/.test(referralCode.toUpperCase())) {
        errs.referralCode = "2-10 uppercase alphanumeric";
      }
    }
    setErrors((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(errs)) {
        return prev;
      }
      return errs;
    });
  }, [fullName, email, password, confirmPassword, localPhoneNumber, countryCode, referralCode]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Object.keys(errors).length > 0) {
      setIsError(true);
      setMessage("Please resolve all validation errors before submitting.");
      triggerShake();
      return;
    }

    if (!fullName || fullName.trim().length < 2) {
      setIsError(true);
      setMessage("Full Name is required (minimum 2 characters).");
      triggerShake();
      return;
    }

    const localDigits = localPhoneNumber.replace(/\D/g, "");
    let combinedPhone: string | null = null;
    if (localDigits.length > 0) {
      combinedPhone = countryCode + localDigits;
    }

    setIsLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, referralCode, phoneNumber: combinedPhone, accountNumber }),
        credentials: "include"
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        setIsError(false);
        setMessage("Account created! Redirecting…");
        setIsRedirecting(true);
        setTimeout(() => { window.location.href = `${APP_URL}/dashboard?token=${encodeURIComponent(data.token)}`; }, 1500);
      } else {
        const errorText = await res.text();
        setIsError(true);
        setMessage(errorText || "Signup failed. Please try again.");
        triggerShake();
      }
    } catch {
      setIsError(true);
      setMessage("Cannot connect to server. Is the backend running?");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <a href="/" className={styles.backLink}>
        <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', fontSize: '1.2rem' }}>arrow_back</span> Back to home
      </a>
      <div className={`${styles.container} ${shake ? styles.shake : ""} ${isRedirecting ? styles.containerRedirecting : ""}`}>
        {isRedirecting && (
          <div className={styles.overlay}>
            <div className={styles.spinner}></div>
            <p className={styles.overlayText}>Preparing your dashboard...</p>
          </div>
        )}
        <div className={isRedirecting ? styles.blurBackground : ""}>
          <div className={styles.logoRow}>
            <span className={styles.brand}>Trade<span className={styles.brandAccent}>X</span></span>
          </div>
          <h2 className={styles.title}>Create your account</h2>
          <p className={styles.subtitle}>Start trading in minutes. No hidden fees.</p>
          <form onSubmit={handleSignup} className={styles.form}>
            <div className={styles.formFields}>
              <div className={styles.fieldGroup}>
                <div className={styles.labelHeader}>
                  <label className={styles.label}>Full Name</label>
                  {errors.fullName && <span className={styles.errorLabel}>{errors.fullName}</span>}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan (First / Given name first)"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setMessage(""); }}
                  required
                  className={`${styles.input} ${errors.fullName ? styles.inputInvalid : ""}`}
                />
              </div>
              <div className={styles.fieldGroup}>
                <div className={styles.labelHeader}>
                  <label className={styles.label}>Email Address</label>
                  {errors.email && <span className={styles.errorLabel}>{errors.email}</span>}
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setMessage(""); }}
                  required
                  className={`${styles.input} ${errors.email ? styles.inputInvalid : ""}`}
                />
              </div>
              <div className={styles.fieldGroup}>
                <div className={styles.labelHeader}>
                  <label className={styles.label}>Password</label>
                  {errors.password && <span className={styles.errorLabel}>{errors.password}</span>}
                </div>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setMessage(""); }}
                    required
                    minLength={8}
                    className={`${styles.input} ${styles.inputPassword} ${errors.password ? styles.inputInvalid : ""}`}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <div className={styles.labelHeader}>
                  <label className={styles.label}>Confirm Password</label>
                  {errors.confirmPassword && <span className={styles.errorLabel}>{errors.confirmPassword}</span>}
                </div>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setMessage(""); }}
                    required
                    className={`${styles.input} ${styles.inputPassword} ${errors.confirmPassword ? styles.inputInvalid : ""}`}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined">
                      {showConfirm ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <div className={styles.labelHeader}>
                  <label className={styles.label}>Phone Number <span className={styles.optionalTag}>(Optional)</span></label>
                  {errors.phoneNumber && <span className={styles.errorLabel}>{errors.phoneNumber}</span>}
                </div>
                <div className={styles.phoneInputGroup}>
                  <select
                    value={countryCode}
                    onChange={(e) => { setCountryCode(e.target.value); setMessage(""); }}
                    className={styles.countryCodeSelect}
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+65">🇸🇬 +65</option>
                    <option value="+81">🇯🇵 +81</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={localPhoneNumber}
                    onChange={(e) => { setLocalPhoneNumber(e.target.value); setMessage(""); }}
                    className={`${styles.input} ${errors.phoneNumber ? styles.inputInvalid : ""}`}
                  />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <div className={styles.labelHeader}>
                  <label className={styles.label}>Referral Code (Optional)</label>
                  {errors.referralCode && <span className={styles.errorLabel}>{errors.referralCode}</span>}
                </div>
                <input
                  type="text"
                  placeholder="e.g. ABC123"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className={`${styles.input} ${errors.referralCode ? styles.inputInvalid : ""}`}
                />
              </div>
            </div>
            <button type="submit" className={styles.button} disabled={isLoading}>
              {isLoading ? "Creating account…" : "Create Account"}
            </button>
          </form>
          {message && (
            <p className={isError ? styles.error : styles.success}>{message}</p>
          )}
          <p className={styles.footerText}>
            Already have an account?{" "}
            <a href={`${APP_URL}/login`} className={styles.link}>Log in here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#666" }}>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
