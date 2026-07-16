import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLog, getFoods } from "../../api";
import { t } from "../../i18n";
import { Coffee, Utensils, Activity, Plus, Minus } from "lucide-react";
import ColorBadge from "../../components/ColorBadge";
import SuggestionCard from "../../components/SuggestionCard";
import FoodSelector from "../../components/FoodSelector";
import styles from "./Log.module.css";

const LOG_TYPES = [
  { id: "fasting", label: "Fasting", icon: Coffee },
  { id: "pre_meal", label: "Pre-meal", icon: Utensils },
  { id: "post_meal", label: "Post-meal", icon: Activity }
];

export default function Log() {
  const navigate = useNavigate();
  const [logType, setLogType] = useState("fasting");
  const [reading, setReading] = useState("");
  const [foods, setFoods] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [notes, setNotes] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getFoods().then((r) => setFoods(r.data)).catch(() => {});
  }, []);

  const showMeal = logType === "pre_meal" || logType === "post_meal";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!reading) return;
    setLoading(true);
    try {
      const res = await createLog({
        readingMgdl: parseFloat(reading),
        logType,
        foods: selectedFoods,
        notes: notes || undefined,
      });
      setResult(res.data);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className={styles.container}>
        <div style={{ marginBottom: 16 }}>
          <h1 className={styles.title}>Result Saved</h1>
          <p className={styles.subtitle}>Your reading has been securely recorded.</p>
        </div>
        
        <div className={styles.card}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <ColorBadge color={result.color} value={Math.round(result.log.readingMgdl)} size="large" />
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {result.suggestions.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} />
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
            <button className={styles.btn} onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => { setResult(null); setReading(""); setSelectedFoods([]); setNotes(""); }}
            >
              Log another reading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div style={{ marginBottom: 16 }}>
        <h1 className={styles.title}>{t("logNewReading")}</h1>
        <p className={styles.subtitle}>Track your current glucose levels.</p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          
          <div className={styles.typeGrid}>
            {LOG_TYPES.map((lt) => {
              const Icon = lt.icon;
              const active = logType === lt.id;
              return (
                <button
                  key={lt.id}
                  type="button"
                  className={`${styles.typeCard} ${active ? styles.typeCardActive : ""}`}
                  onClick={() => { setLogType(lt.id); setSelectedFoods([]); }}
                >
                  <Icon size={24} className={styles.typeIcon} />
                  <span className={styles.typeLabel}>{lt.label}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.readingSection}>
            <div className={styles.readingInputBox}>
              <input
                className={styles.readingInput}
                type="number"
                inputMode="numeric"
                min={20}
                max={600}
                step={1}
                placeholder="0"
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                required
                autoFocus
              />
              <span className={styles.unit}>{t("mgdl")}</span>
            </div>
          </div>

          {showMeal && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
              <p className={styles.label}>What did you eat?</p>
              <FoodSelector foods={foods} selected={selectedFoods} onChange={setSelectedFoods} />
              
              <button
                type="button"
                className={styles.otherToggle}
                onClick={() => setShowOther((v) => !v)}
              >
                {showOther ? <Minus size={16} /> : <Plus size={16} />}
                <span>Add notes</span>
              </button>
              
              {showOther && (
                <textarea
                  className={styles.textarea}
                  rows={2}
                  placeholder="Any extra context (e.g., missed medication, felt dizzy)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              )}
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.btn} type="submit" disabled={loading || !reading}>
            {loading ? t("loading") : "Save Reading"}
          </button>
        </form>
      </div>
    </div>
  );
}
