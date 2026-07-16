import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BarChart2, Plus, BookOpen, User } from "lucide-react";
import styles from "./Layout.module.css";
import { t } from "../../i18n";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", icon: <Home size={24} />, label: t("home") || "Home" },
    { path: "/analytics", icon: <BarChart2 size={24} />, label: "Analytics" },
    { path: "/log", isFab: true },
    { path: "/resources", icon: <BookOpen size={24} />, label: "Resources" },
    { path: "/settings", icon: <User size={24} />, label: "Profile" }
  ];

  return (
    <div className={styles.wrapper}>
      <main className={styles.content}>
        {children}
      </main>

      <nav className={styles.bottomNav}>
        {navItems.map((item, idx) => {
          if (item.isFab) {
            return (
              <div key="fab" className={styles.fabWrapper}>
                <button className={styles.fab} onClick={() => navigate(item.path)}>
                  <Plus className={styles.fabIcon} />
                </button>
              </div>
            );
          }

          const active = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
