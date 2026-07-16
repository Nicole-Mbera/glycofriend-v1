import React from "react";
import { lang } from "../../i18n";

export default function FoodSelector({ foods, selected, onChange }) {
  function toggle(id) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
      {foods.map((food) => {
        const active = selected.includes(food.id);
        return (
          <button
            key={food.id}
            type="button"
            onClick={() => toggle(food.id)}
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius-lg)",
              border: `1px solid ${active ? "var(--color-green)" : "rgba(0,0,0,0.1)"}`,
              background: active ? "rgba(52, 199, 89, 0.1)" : "var(--bg-input)",
              color: active ? "var(--color-green)" : "var(--text-secondary)",
              fontWeight: active ? 600 : 500,
              fontSize: 14,
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              boxShadow: active ? "0 2px 8px rgba(52, 199, 89, 0.2)" : "none"
            }}
          >
            {lang === "rw" ? food.nameRw : food.nameEn}
          </button>
        );
      })}
    </div>
  );
}
