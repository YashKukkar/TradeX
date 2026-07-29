import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { config } from "./config";
import styles from "./Auth.module.css";
import { api } from "./utils/api";
import Icon from "./components/Icon";

export default function Login() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem("token", data.token);
      queryClient.clear();
      setIsRedirecting(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code: otpCode, newPassword })
      });
      setSuccessMsg("Password reset successfully! You can now log in.");
      setPassword(newPassword); // Prefill the password field for immediate login convenience
      setMode("login");
      setOtpCode("");
      setNewPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <a href={config.websiteUrl} className={styles.backLink}>
        <Icon name="arrow_back" style={{ fontSize: "1.2rem" }} /> Back to home
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

          {mode === "login" ? (
            <>
              <h2 className={styles.title}>Welcome back</h2>
              <p className={styles.subtitle}>Log in to your trading dashboard.</p>
              <form onSubmit={handleLogin} className={styles.form}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="loginEmail" className={styles.label}>Email Address</label>
                  <input
                    id="loginEmail"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); setSuccessMsg(""); }}
                    required
                    className={styles.input}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label htmlFor="loginPassword" className={styles.label}>Password</label>
                    <button
                      type="button"
                      className={styles.link}
                      onClick={() => { setMode("reset"); setError(""); setSuccessMsg(""); }}
                      style={{ background: "none", border: "none", fontSize: "12px", cursor: "pointer", padding: 0 }}
                    >
                      Reset Password?
                    </button>
                  </div>
                  <div className={styles.passwordWrapper}>
                    <input
                      id="loginPassword"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); setSuccessMsg(""); }}
                      required
                      className={`${styles.input} ${styles.inputPassword}`}
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <Icon name={showPassword ? "visibility_off" : "visibility"} />
                    </button>
                  </div>
                </div>
                <button type="submit" className={styles.button} disabled={isLoading}>
                  {isLoading ? "Logging in…" : "Login to Dashboard"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className={styles.title}>Reset Password</h2>
              <p className={styles.subtitle}>Enter the verification code sent to your email.</p>
              <form onSubmit={handleResetPassword} className={styles.form}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="resetEmail" className={styles.label}>Email Address</label>
                  <input
                    id="resetEmail"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    required
                    className={styles.input}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="resetOtp" className={styles.label}>Verification Code (OTP)</label>
                  <input
                    id="resetOtp"
                    name="otp"
                    type="text"
                    placeholder="6-digit code"
                    value={otpCode}
                    onChange={(e) => { setOtpCode(e.target.value); setError(""); }}
                    required
                    className={styles.input}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="resetNewPassword" className={styles.label}>New Password</label>
                  <div className={styles.passwordWrapper}>
                    <input
                      id="resetNewPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Choose a new password (min. 8 characters)"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                      required
                      className={`${styles.input} ${styles.inputPassword}`}
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <Icon name={showPassword ? "visibility_off" : "visibility"} />
                    </button>
                  </div>
                </div>
                <button type="submit" className={styles.button} disabled={isLoading}>
                  {isLoading ? "Resetting…" : "Reset & Back to Login"}
                </button>
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => { setMode("login"); setError(""); }}
                  style={{ background: "none", border: "none", alignSelf: "center", marginTop: "12px", cursor: "pointer" }}
                >
                  Back to login
                </button>
              </form>
            </>
          )}

          {error && <p className={styles.error}>{error}</p>}
          {successMsg && <p style={{ color: "var(--primary)", fontSize: "13px", marginTop: "12px", textAlign: "center" }}>{successMsg}</p>}
          
          <p className={styles.footerText}>
            New to TradeX?{" "}
            <a href={`${config.websiteUrl}/signup`} className={styles.link}>Create a free account</a>
          </p>
        </div>
      </div>
    </div>
  );
}
