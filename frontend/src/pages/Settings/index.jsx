import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, updateMe, sendReport, sendCHWAlert, getReportPreview } from "../../api";
import { t } from "../../i18n";
import { User, Activity, FileText, Edit2, LogOut, Mail, DownloadCloud, AlertTriangle } from "lucide-react";
import styles from "./Settings.module.css";

const DIABETES_TYPES = ["type1", "type2", "gestational", "other"];
const FREQUENCIES = ["weekly", "biweekly", "monthly"];

export default function Settings() {
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reportStatus, setReportStatus] = useState("");
  const [chwStatus, setChwStatus] = useState("");

  useEffect(() => {
    getMe().then((r) => {
      const u = r.data;
      setForm({
        name: u.name || "",
        diabetesType: u.diabetesType || "type2",
        medications: (u.medications || []).join("\n"),
        physicianEmail: u.physicianEmail || "",
        reportFrequency: u.reportFrequency || "weekly",
        chwEmail: u.chwEmail || "",
      });
    });
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMe({
        ...form,
        medications: form.medications
          ? form.medications.split("\n").map((s) => s.trim()).filter(Boolean)
          : [],
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendReport() {
    setReportStatus(t("sending"));
    try {
      const res = await sendReport();
      if (res.data.previewUrl) {
        alert(`Email Sent! View it here:\n${res.data.previewUrl}`);
      }
    } catch (err) {
      alert("Error sending report");
    }
    setReportStatus("");
  }

  async function handleSendCHW() {
    setChwStatus(t("sending"));
    try {
      const res = await sendCHWAlert();
      if (res.data.previewUrl) {
        alert(`Email Sent! View it here:\n${res.data.previewUrl}`);
      }
    } catch (err) {
      alert("Error sending alert");
    }
    setChwStatus("");
  }

  async function handlePreviewReport() {
    try {
      const res = await getReportPreview();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      window.open(url);
    } catch (err) {
      alert("Failed to load preview.");
    }
  }

  function handleSignOut() {
    localStorage.removeItem("gf_token");
    navigate("/auth");
  }

  if (!form) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "var(--text-secondary)" }}>{t("loading")}</div>;

  const initial = form.name ? form.name.charAt(0).toUpperCase() : "U";
  const diabetesLabel = t(form.diabetesType);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Profile</h1>
          <p className={styles.subtitle}>Manage your settings and data.</p>
        </div>
        {!isEditing && (
          <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
            <Edit2 size={16} /> Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className={styles.infoCard}>
          <form onSubmit={handleSave}>
            <label className={styles.label}>{t("name")}</label>
            <input className={styles.input} type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required />

            <label className={styles.label}>{t("diabetesType")}</label>
            <select className={styles.input} value={form.diabetesType} onChange={(e) => set("diabetesType", e.target.value)}>
              {DIABETES_TYPES.map((dt) => <option key={dt} value={dt}>{t(dt)}</option>)}
            </select>

            <label className={styles.label}>{t("medications")}</label>
            <textarea className={styles.textarea} rows={3} value={form.medications} onChange={(e) => set("medications", e.target.value)} />

            <label className={styles.label}>{t("physicianEmail")}</label>
            <input className={styles.input} type="email" value={form.physicianEmail} onChange={(e) => set("physicianEmail", e.target.value)} />

            <label className={styles.label}>{t("reportFrequency")}</label>
            <select className={styles.input} value={form.reportFrequency} onChange={(e) => set("reportFrequency", e.target.value)}>
              {FREQUENCIES.map((f) => <option key={f} value={f}>{t(f)}</option>)}
            </select>

            <label className={styles.label}>{t("chwEmail")}</label>
            <input className={styles.input} type="email" value={form.chwEmail} onChange={(e) => set("chwEmail", e.target.value)} />

            <button className={styles.btn} type="submit" disabled={saving}>
              {saving ? t("loading") : "Save Changes"}
            </button>
            <button className={styles.btnSecondary} type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>{initial}</div>
            <h2 className={styles.profileName}>{form.name || "User"}</h2>
            <p className={styles.profileType}>{diabetesLabel} Diabetes</p>
          </div>

          <div className={styles.cardList}>
            <div className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <Activity size={20} className={styles.cardIcon} />
                <span className={styles.cardTitle}>Medical Profile</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Medications</span>
                <span className={styles.infoValue}>{form.medications || "None listed"}</span>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <FileText size={20} className={styles.cardIcon} />
                <span className={styles.cardTitle}>Care Team & Reports</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Physician Email</span>
                <span className={styles.infoValue}>{form.physicianEmail || "Not provided"}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>CHW Email</span>
                <span className={styles.infoValue}>{form.chwEmail || "Not provided"}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Report Frequency</span>
                <span className={styles.infoValue}>{t(form.reportFrequency)}</span>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <DownloadCloud size={20} className={styles.cardIcon} />
                <span className={styles.cardTitle}>Actions</span>
              </div>
              
              <button className={styles.actionBtnOutline} onClick={handlePreviewReport}>
                <DownloadCloud size={18} /> Preview PDF Report
              </button>
              
              <button className={styles.actionBtn} onClick={handleSendReport} disabled={!!reportStatus}>
                <Mail size={18} /> {reportStatus || "Email Report to Physician"}
              </button>

              <button className={styles.actionBtn} style={{ background: "#E74C3C" }} onClick={handleSendCHW} disabled={!!chwStatus}>
                <AlertTriangle size={18} /> {chwStatus || "Send Alert to CHW"}
              </button>
            </div>
          </div>

          <button className={styles.signOutBtn} onClick={handleSignOut}>
            <LogOut size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
            Sign out
          </button>
        </>
      )}
    </div>
  );
}
