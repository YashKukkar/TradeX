import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "./config";
import styles from "./Auth.module.css";
import { api } from "./utils/api";
import Icon from "./components/Icon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
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
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem("token", data.token);
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
          <h2 className={styles.title}>Welcome back</h2>
          <p className={styles.subtitle}>Log in to your trading dashboard.</p>
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
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
          {error && <p className={styles.error}>{error}</p>}
          <p className={styles.footerText}>
            New to TradeX?{" "}
            <a href={`${config.websiteUrl}/signup`} className={styles.link}>Create a free account</a>
          </p>
        </div>
      </div>
    </div>
  );
}
