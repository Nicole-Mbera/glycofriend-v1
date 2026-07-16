import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateMe } from "../../api";
import { t } from "../../i18n";
import styles from "./Onboarding.module.css";

const DIABETES_TYPES = ["type1", "type2", "gestational", "other"];
const FREQUENCIES = ["weekly", "biweekly", "monthly"];

export default function Onboarding() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    diabetesType: "type2",
    medications: "",
    physicianEmail: "",
    reportFrequency: "weekly",
    chwEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await updateMe({
        ...form,
        medications: form.medications
          ? form.medications.split("\n").map((s) => s.trim()).filter(Boolean)
          : [],
      });
      navigate("/dashboard");
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>{t("setupProfile")}</h2>
        <form onSubmit={handleSubmit}>
          <label className={styles.label}>{t("name")}</label>
          <input
            className={styles.input}
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />

          <label className={styles.label}>{t("diabetesType")}</label>
          <select
            className={styles.input}
            value={form.diabetesType}
            onChange={(e) => set("diabetesType", e.target.value)}
          >
            {DIABETES_TYPES.map((dt) => (
              <option key={dt} value={dt}>{t(dt)}</option>
            ))}
          </select>

          <label className={styles.label}>{t("medications")}</label>
          <textarea
            className={styles.textarea}
            value={form.medications}
            onChange={(e) => set("medications", e.target.value)}
            rows={3}
            placeholder="Metformin&#10;Insulin"
          />

          <label className={styles.label}>{t("physicianEmail")}</label>
          <input
            className={styles.input}
            type="email"
            value={form.physicianEmail}
            onChange={(e) => set("physicianEmail", e.target.value)}
            placeholder="doctor@clinic.rw"
          />

          <label className={styles.label}>{t("reportFrequency")}</label>
          <select
            className={styles.input}
            value={form.reportFrequency}
            onChange={(e) => set("reportFrequency", e.target.value)}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>{t(f)}</option>
            ))}
          </select>

          <label className={styles.label}>{t("chwEmail")}</label>
          <input
            className={styles.input}
            type="email"
            value={form.chwEmail}
            onChange={(e) => set("chwEmail", e.target.value)}
            placeholder="chw@health.rw"
          />

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? t("loading") : t("saveProfile")}
          </button>
        </form>
      </div>
    </div>
  );
}
