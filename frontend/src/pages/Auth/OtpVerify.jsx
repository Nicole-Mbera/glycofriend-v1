import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyOtp, sendOtp } from "../../api";
import { t } from "../../i18n";
import styles from "./Auth.module.css";

export default function OtpVerify() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const navigate = useNavigate();
  const phone = sessionStorage.getItem("gf_otp_phone") || "";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await verifyOtp(phone, code);
      localStorage.setItem("gf_token", res.data.token);
      if (res.data.isNewUser) {
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError("Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    const res = await sendOtp(phone);
    if (res.data.mockCode) {
      alert(`Development Mode:\nYour OTP is: ${res.data.mockCode}\n\n(In production, this would be an SMS)`);
    }
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>{t("appName")}</h1>
        <p className={styles.sub}>{t("enterCode")}</p>
        <p className={styles.hint}>Sent to {phone}</p>
        <form onSubmit={handleSubmit}>
          <input
            className={`${styles.input} ${styles.otpInput}`}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            autoFocus
          />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? t("loading") : t("verify")}
          </button>
        </form>
        <button className={styles.link} onClick={handleResend} disabled={resent}>
          {resent ? "Code resent!" : t("resend")}
        </button>
      </div>
    </div>
  );
}
