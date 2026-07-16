import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp } from "../../api";
import { t } from "../../i18n";
import styles from "./Auth.module.css";

export default function PhoneEntry() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await sendOtp(phone);
      if (res.data.mockCode) {
        alert(`Development Mode:\nYour OTP is: ${res.data.mockCode}\n\n(In production, this would be an SMS)`);
      }
      sessionStorage.setItem("gf_otp_phone", phone);
      navigate("/auth/verify");
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>{t("appName")}</h1>
        <p className={styles.sub}>{t("enterPhone")}</p>
        <form onSubmit={handleSubmit}>
          <input
            className={styles.input}
            type="tel"
            placeholder="+250 7XX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoFocus
          />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? t("loading") : t("sendCode")}
          </button>
        </form>
      </div>
    </div>
  );
}
