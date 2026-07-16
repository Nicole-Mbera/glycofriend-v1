import React from "react";
import { PlayCircle, Clock, Users, Target, Book, Brain, ExternalLink, Activity, Award } from "lucide-react";
import styles from "./Resources.module.css";

const ARTICLES = [
  {
    id: "type-2-diabetes",
    title: "Understanding Type 2 Diabetes",
    description: "A comprehensive guide by the CDC on managing and understanding your diagnosis.",
    readTime: "8 min read",
    icon: Brain,
    tips: ["Learn the root causes", "Understand insulin resistance", "Identify early symptoms"],
    url: "https://www.cdc.gov/diabetes/basics/type2.html"
  },
  {
    id: "diet-tips",
    title: "10 Diet Tips for Stable Glucose",
    description: "Evidence-based nutritional advice to help prevent sudden sugar spikes.",
    readTime: "5 min read",
    icon: Target,
    tips: ["Prioritize fiber-rich foods", "Balance carbs with protein", "Stay hydrated"],
    url: "https://www.who.int/news-room/fact-sheets/detail/diabetes"
  },
  {
    id: "exercise-impact",
    title: "How Exercise Impacts Blood Sugar",
    description: "Learn how different types of workouts affect your glucose levels.",
    readTime: "6 min read",
    icon: Activity,
    tips: ["Morning vs evening workouts", "Strength training benefits", "Avoiding hypoglycemia"],
    url: "https://diabetes.org/health-wellness/fitness"
  }
];

const VIDEO_CATEGORIES = [
  {
    category: "Nutrition & Diet",
    videos: [
      { id: "MhqRhuYF4A0", title: "What is the Best Diet for Diabetics?", duration: "12:45", views: "1.2M", channel: "Dr. Eric Berg DC" },
      { id: "X9ivR4y03IE", title: "Foods That Lower Blood Sugar", duration: "15:20", views: "850K", channel: "Healthline" }
    ]
  },
  {
    category: "Understanding Your Body",
    videos: [
      { id: "r1oOItx1hP8", title: "Insulin Resistance Explained", duration: "18:30", views: "2.1M", channel: "Mayo Clinic" },
      { id: "aX0R9a-8x4U", title: "How to Reverse Prediabetes", duration: "22:15", views: "3.4M", channel: "Cleveland Clinic" }
    ]
  }
];

export default function Resources() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Learning Hub</h1>
        <p className={styles.subtitle}>Evidence-based content to accelerate your health journey.</p>
      </div>

      <div className={styles.featureGrid} style={{ marginBottom: 40 }}>
        <div className={styles.featureDark}>
          <div className={styles.featureHeader}>
            <Target className="w-6 h-6" />
            <h3 className={styles.featureTitle}>Learning Path</h3>
          </div>
          <p className={styles.featureDesc}>Follow our recommended playlist order for structured learning on diabetes management.</p>
        </div>

        <div className={styles.featureLight}>
          <div className={styles.featureHeader}>
            <Award className="w-6 h-6" />
            <h3 className={styles.featureTitle}>Daily Habits</h3>
          </div>
          <p className={styles.featureDesc}>Small, consistent nutritional and tracking practices that yield big results.</p>
        </div>

        <div className={styles.featureLight}>
          <div className={styles.featureHeader}>
            <Activity className="w-6 h-6" />
            <h3 className={styles.featureTitle}>Progress Tracking</h3>
          </div>
          <p className={styles.featureDesc}>Use the Analytics tab to monitor your improvement with real-time assessments.</p>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Featured Articles</h2>
      <div className={styles.gridList}>
        {ARTICLES.map((article) => {
          const Icon = article.icon;
          return (
            <div key={article.id} className={styles.articleCard}>
              <div className={styles.articleHeader}>
                <div className={styles.iconBox}>
                  <Icon size={24} />
                </div>
                <span className={styles.readTime}>{article.readTime}</span>
              </div>
              
              <h3 className={styles.articleTitle}>{article.title}</h3>
              <p className={styles.articleDesc}>{article.description}</p>
              
              <div className={styles.tipsSection}>
                <h4 className={styles.tipsTitle}>Key Takeaways</h4>
                <ul className={styles.tipsList}>
                  {article.tips.map((tip, idx) => (
                    <li key={idx} className={styles.tipItem}>
                      <span className={styles.tipDot} />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <a href={article.url} target="_blank" rel="noreferrer" className={styles.readBtn}>
                <span>Read Article</span>
                <ExternalLink size={16} className={styles.readBtnIcon} />
              </a>
            </div>
          );
        })}
      </div>

      <h2 className={styles.sectionTitle} style={{ marginTop: 48 }}>Video Lessons & Tutorials</h2>
      <div className={styles.gridList}>
        {VIDEO_CATEGORIES.map((cat, idx) => (
          <div key={idx} className={styles.videoCategory}>
            <h3 className={styles.videoCategoryTitle}>{cat.category}</h3>
            <div className={styles.videoList}>
              {cat.videos.map((video) => (
                <a key={video.id} href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer" className={styles.videoRow}>
                  <div className={styles.thumbnailWrapper}>
                    <div className={styles.thumbnailPlaceholder}>
                      <PlayCircle size={32} className={styles.thumbnailIcon} />
                    </div>
                    <span className={styles.durationBadge}>{video.duration}</span>
                  </div>
                  <div className={styles.videoInfo}>
                    <h4 className={styles.videoTitle}>{video.title}</h4>
                    <p className={styles.videoChannel}>{video.channel}</p>
                    <div className={styles.videoMeta}>
                      <div className={styles.metaItem}>
                        <Clock size={14} />
                        <span>{video.duration}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <Users size={14} />
                        <span>{video.views} views</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
