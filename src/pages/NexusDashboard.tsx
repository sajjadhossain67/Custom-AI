import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { NEXUS_ROUTES } from "../shared/routes";
import {
  getSettings,
  getStudyStreak,
  updateStudyStreak,
  getExamProgress,
  getRecentActivity,
  addActivity,
  getTotalSessions,
} from "../utils/nexusStorage";

const TIPS = [
  "Break complex topics into smaller chunks and tackle each with a focused AI session.",
  "Use the Socratic persona when you want to develop critical thinking, not just get answers.",
  "Activate Voice I/O mode for language practice — speak and listen at the same time.",
  "Fork a chat thread to explore a tangent without losing your main conversation.",
  "The Coding Tutor's Pair Programming mode is great for building momentum on hard problems.",
  "Export your exam practice sessions as Markdown to review offline.",
  "A 30-minute daily study streak compounds dramatically over a semester.",
  "Try switching AI models mid-conversation to get different perspectives on the same topic.",
  "The Context Window bar tells you when to start a new session for best results.",
  "GRE Vocabulary Builder uses spaced repetition — consistency beats cramming every time.",
];

const modules = [
  {
    label: "AI Chat Hub",
    desc: "Multi-model AI with streaming, voice I/O & memory",
    icon: "◈",
    path: NEXUS_ROUTES.CHAT,
    color: "#00f5ff",
    grad: "linear-gradient(135deg,rgba(0,245,255,0.15),rgba(0,245,255,0.03))",
    border: "rgba(0,245,255,0.2)",
  },
  {
    label: "Code Tutor",
    desc: "Live IDE with Socratic AI guidance & code review",
    icon: "⟨/⟩",
    path: NEXUS_ROUTES.CODE,
    color: "#bf5fff",
    grad: "linear-gradient(135deg,rgba(191,95,255,0.15),rgba(191,95,255,0.03))",
    border: "rgba(191,95,255,0.2)",
  },
  {
    label: "Exam Prep",
    desc: "IELTS, GRE, GMAT & adaptive practice sessions",
    icon: "◆",
    path: NEXUS_ROUTES.EXAM,
    color: "#ffd93d",
    grad: "linear-gradient(135deg,rgba(255,217,61,0.15),rgba(255,217,61,0.03))",
    border: "rgba(255,217,61,0.2)",
  },
  {
    label: "Explore",
    desc: "Knowledge graph, daily challenges & deep dives",
    icon: "✦",
    path: NEXUS_ROUTES.EXPLORE,
    color: "#ff6b6b",
    grad: "linear-gradient(135deg,rgba(255,107,107,0.15),rgba(255,107,107,0.03))",
    border: "rgba(255,107,107,0.2)",
  },
];

const activityIcons: Record<string, string> = {
  chat: "◈",
  code: "⟨/⟩",
  exam: "◆",
  explore: "✦",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const NexusDashboard: React.FC = () => {
  const [settings] = useState(getSettings());
  const [streak] = useState(getStudyStreak());
  const [tipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [activity, setActivity] = useState(getRecentActivity());
  const [examProgress] = useState(getExamProgress());
  const [hour] = useState(new Date().getHours());

  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = settings.userName || "Explorer";

  useEffect(() => {
    updateStudyStreak();
    addActivity({ type: "explore", title: "Opened Dashboard", icon: "⬡" });
    setActivity(getRecentActivity());
  }, []);

  const totalSessions = getTotalSessions();
  const vocabLearned = examProgress.vocab.learned.length;

  return (
    <div className="nexus-container nexus-page">
      {/* ─── Hero Welcome ─────────────────────────────────── */}
      <div style={{ marginBottom: 48 }} className="animate-fade-in-up">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <h1
          style={{
            fontSize: "clamp(36px,5vw,60px)",
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          {greeting}, <span className="text-gradient">{name}</span> ✦
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "var(--text-secondary)",
            maxWidth: 500,
          }}
        >
          Your AI-powered learning universe is ready. What are we mastering
          today?
        </p>
      </div>

      {/* ─── Stats Row ─────────────────────────────────────── */}
      <div
        className="stagger-children"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 16,
          marginBottom: 48,
        }}
      >
        {[
          {
            label: "Study Streak",
            value: `${streak}`,
            unit: "days",
            icon: "🔥",
            color: "#ff6b6b",
          },
          {
            label: "AI Sessions",
            value: `${totalSessions}`,
            unit: "total",
            icon: "◈",
            color: "#00f5ff",
          },
          {
            label: "Vocab Learned",
            value: `${vocabLearned}`,
            unit: "words",
            icon: "📚",
            color: "#bf5fff",
          },
          {
            label: "Exam Sessions",
            value: `${examProgress.ielts.sessions + examProgress.gre.sessions}`,
            unit: "completed",
            icon: "◆",
            color: "#ffd93d",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card"
            style={{ padding: "20px", textAlign: "center" }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>{stat.icon}</div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: stat.color,
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginTop: 2,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {stat.unit}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginTop: 4,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 28,
          alignItems: "start",
        }}
      >
        {/* ─── Left: Modules ──────────────────────────────── */}
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 20,
              color: "var(--text-secondary)",
            }}
          >
            Quick Launch
          </h2>
          <div
            className="grid-cards stagger-children"
            style={{
              gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
            }}
          >
            {modules.map((mod) => (
              <Link
                key={mod.path}
                to={mod.path}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="glass-card"
                  style={{
                    padding: 24,
                    cursor: "pointer",
                    background: mod.grad,
                    borderColor: mod.border,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      marginBottom: 16,
                      background: `rgba(${mod.color === "#00f5ff" ? "0,245,255" : mod.color === "#bf5fff" ? "191,95,255" : mod.color === "#ffd93d" ? "255,217,61" : "255,107,107"},0.15)`,
                      border: `1px solid ${mod.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      color: mod.color,
                    }}
                  >
                    {mod.icon}
                  </div>
                  <div
                    style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}
                  >
                    {mod.label}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {mod.desc}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 16,
                      color: mod.color,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Launch <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ─── Recent Activity ─────────────────────────── */}
          {activity.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 20,
                  color: "var(--text-secondary)",
                }}
              >
                Recent Activity
              </h2>
              <div className="glass" style={{ padding: "8px 0" }}>
                {activity.slice(0, 8).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 20px",
                      borderBottom:
                        i < Math.min(activity.length, 8) - 1
                          ? "1px solid rgba(255,255,255,0.05)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: "rgba(255,255,255,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                      }}
                    >
                      {activityIcons[item.type] || "⬡"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          marginTop: 1,
                        }}
                      >
                        {timeAgo(item.timestamp)}
                      </div>
                    </div>
                    <span
                      className={`badge badge-${item.type === "chat" ? "cyan" : item.type === "code" ? "violet" : item.type === "exam" ? "gold" : "coral"}`}
                    >
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Right: Sidebar ─────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* AI Tip of the Day */}
          <div
            className="glass-iridescent"
            style={{ padding: 24, position: "relative", zIndex: 1 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 20 }}>💡</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--cyan)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Tip of the Day
              </span>
            </div>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                lineHeight: 1.7,
              }}
            >
              {TIPS[tipIndex]}
            </p>
          </div>

          {/* Daily Challenge */}
          <div
            className="glass-card"
            style={{ padding: 24, borderColor: "rgba(255,107,107,0.2)" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 20 }}>🎯</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--coral)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Daily Challenge
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              Explain Recursion
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              Can you explain recursion to a 10-year-old using a real-world
              analogy? Ask the AI to critique your explanation.
            </p>
            <Link to={NEXUS_ROUTES.CHAT}>
              <button
                className="btn-nexus btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  fontSize: 13,
                  padding: "9px 16px",
                }}
              >
                Start Challenge →
              </button>
            </Link>
          </div>

          {/* Study Streak Card */}
          <div
            className="glass-card"
            style={{
              padding: 24,
              textAlign: "center",
              borderColor: "rgba(255,107,107,0.2)",
            }}
          >
            <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 8 }}>
              🔥
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#ff6b6b" }}>
              {streak}
            </div>
            <div
              style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}
            >
              Day Streak
            </div>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 4,
                justifyContent: "center",
              }}
            >
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background:
                      i < (streak % 7 || (streak > 0 ? 7 : 0))
                        ? "rgba(255,107,107,0.3)"
                        : "rgba(255,255,255,0.06)",
                    border: `1px solid ${i < (streak % 7 || (streak > 0 ? 7 : 0)) ? "rgba(255,107,107,0.4)" : "rgba(255,255,255,0.08)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                  }}
                >
                  {i < (streak % 7 || (streak > 0 ? 7 : 0)) ? "🔥" : ""}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="glass" style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              Quick Access
            </div>
            {[
              {
                label: "Configure API Keys",
                path: NEXUS_ROUTES.SETTINGS,
                icon: "🔑",
                hint: "Required to use AI",
              },
              {
                label: "IELTS Writing Practice",
                path: NEXUS_ROUTES.EXAM,
                icon: "✍️",
                hint: "Get band score feedback",
              },
              {
                label: "JavaScript Challenges",
                path: NEXUS_ROUTES.CODE,
                icon: "💻",
                hint: "Beginner → Advanced",
              },
            ].map((link, i) => (
              <Link key={i} to={link.path} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 8px",
                    borderRadius: 10,
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.05)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "transparent")
                  }
                >
                  <span
                    style={{ fontSize: 18, width: 28, textAlign: "center" }}
                  >
                    {link.icon}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {link.label}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {link.hint}
                    </div>
                  </div>
                  <span
                    style={{
                      marginLeft: "auto",
                      color: "var(--text-muted)",
                      fontSize: 12,
                    }}
                  >
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .nexus-dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default NexusDashboard;
