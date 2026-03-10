import React, { useState } from "react";
import { getSettings, getApiKeys, addActivity } from "../utils/nexusStorage";
import { streamAIResponse, hasApiKey } from "../utils/nexusAI";

const DEPTH_LEVELS = ["ELI5", "Beginner", "Intermediate", "Advanced", "PhD"];
const DEPTH_COLORS = ["#00ff88", "#00f5ff", "#bf5fff", "#ffd93d", "#ff6b6b"];

const TOPIC_CATEGORIES = [
  {
    label: "Mathematics",
    icon: "∑",
    topics: [
      "Calculus",
      "Linear Algebra",
      "Probability",
      "Number Theory",
      "Topology",
    ],
  },
  {
    label: "Computer Science",
    icon: "◈",
    topics: [
      "Algorithms",
      "Machine Learning",
      "Distributed Systems",
      "Cryptography",
      "Compilers",
    ],
  },
  {
    label: "Physics",
    icon: "⚛",
    topics: [
      "Quantum Mechanics",
      "Thermodynamics",
      "Relativity",
      "Electromagnetism",
      "Cosmology",
    ],
  },
  {
    label: "Economics",
    icon: "◆",
    topics: [
      "Game Theory",
      "Behavioral Economics",
      "Macroeconomics",
      "Market Structures",
      "Monetary Policy",
    ],
  },
  {
    label: "Philosophy",
    icon: "∞",
    topics: [
      "Epistemology",
      "Ethics",
      "Logic",
      "Philosophy of Mind",
      "Existentialism",
    ],
  },
  {
    label: "Biology",
    icon: "⬡",
    topics: [
      "Genetics",
      "Evolution",
      "Neuroscience",
      "Cell Biology",
      "Ecology",
    ],
  },
];

const DAILY_CHALLENGES = [
  {
    title: "The Halting Problem",
    desc: "Explain why we can't write a program to determine if any given program will halt or run forever.",
    icon: "🔄",
    color: "#00f5ff",
  },
  {
    title: "Gödel's Incompleteness",
    desc: "Why did Gödel prove that some truths in mathematics can never be proven within mathematics itself?",
    icon: "∞",
    color: "#bf5fff",
  },
  {
    title: "The Trolley Problem",
    desc: "You can divert a runaway trolley to kill 1 person instead of 5. Should you? What does your answer reveal?",
    icon: "🚃",
    color: "#ffd93d",
  },
  {
    title: "Fermi Estimation",
    desc: "How many piano tuners are in Chicago? walk through a Fermi estimation from first principles.",
    icon: "🎹",
    color: "#ff6b6b",
  },
  {
    title: "The Ship of Theseus",
    desc: "If every part of a ship is replaced, is it the same ship? How does this apply to human identity?",
    icon: "⚓",
    color: "#00ff88",
  },
];

const COMMUNITY_PROMPTS = [
  {
    text: "Explain neural networks using only food analogies",
    likes: 847,
    category: "AI",
  },
  {
    text: "What would Socrates say about social media?",
    likes: 632,
    category: "Philosophy",
  },
  {
    text: "Debug this code and explain each bug like I'm 5",
    likes: 589,
    category: "Coding",
  },
  {
    text: "Write a proof that √2 is irrational, step by step",
    likes: 421,
    category: "Math",
  },
  {
    text: "Compare how Python, Rust, and Go handle memory",
    likes: 398,
    category: "CS",
  },
  {
    text: "Explain game theory using The Prisoner's Dilemma",
    likes: 376,
    category: "Strategy",
  },
];

const NexusExplore: React.FC = () => {
  const settings = getSettings();
  const apiKeys = getApiKeys();
  const [query, setQuery] = useState("");
  const [depthLevel, setDepthLevel] = useState(2);
  const [explanation, setExplanation] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState<
    (typeof DAILY_CHALLENGES)[0] | null
  >(null);
  const [challengeResponse, setChallengeResponse] = useState("");
  const [isChallenge, setIsChallenge] = useState(false);

  const explainTopic = async (topic: string, depth: number) => {
    if (!topic.trim()) return;
    const depthLabel = DEPTH_LEVELS[depth];
    if (!hasApiKey(settings.defaultModel, apiKeys)) {
      setExplanation("⚠️ Configure an API key in Settings to use AI features.");
      return;
    }
    setIsGenerating(true);
    setExplanation("");
    setIsChallenge(false);
    addActivity({
      type: "explore",
      title: `Explored: ${topic} (${depthLabel})`,
      icon: "✦",
    });

    const systemMsg = `You are an expert teacher and explainer. Explain topics at exactly the requested depth level.

Depth levels guide:
- ELI5: Use a simple analogy a 5-year-old would understand. No jargon. Maximum 3 short paragraphs.
- Beginner: Accessible to someone with no prior knowledge. Use analogies and examples. 4-5 paragraphs.
- Intermediate: Assume basic familiarity. Use proper terminology. Include nuances and edge cases.
- Advanced: Technical depth. Include mathematical notation where appropriate. Address subtleties.
- PhD: Full academic rigor. Reference key papers, theorems, open problems. Assume expert reader.

Format your response with clear structure. Use headers, bullet points, and code examples where appropriate.`;

    const messages = [
      { role: "system" as const, content: systemMsg },
      {
        role: "user" as const,
        content: `Explain "${topic}" at the ${depthLabel} level.`,
      },
    ];

    let result = "";
    await streamAIResponse(messages, settings.defaultModel, apiKeys, 0.7, {
      onChunk: (c) => {
        result += c;
        setExplanation(result);
      },
      onDone: () => setIsGenerating(false),
      onError: (err) => {
        setExplanation(`⚠️ ${err}`);
        setIsGenerating(false);
      },
    });
  };

  const exploreChallenge = async (challenge: (typeof DAILY_CHALLENGES)[0]) => {
    setSelectedChallenge(challenge);
    setChallengeResponse("");
    if (!hasApiKey(settings.defaultModel, apiKeys)) {
      setChallengeResponse("⚠️ Configure an API key in Settings.");
      return;
    }
    setIsChallenge(true);
    setIsGenerating(true);
    setExplanation("");

    const messages = [
      {
        role: "system" as const,
        content:
          "You are a brilliant intellectual companion who makes deep concepts accessible and thought-provoking. Engage with ideas rigorously but playfully.",
      },
      {
        role: "user" as const,
        content:
          challenge.desc +
          "\n\nProvide a rich, multi-perspective exploration of this concept. Include historical context, key thinkers, practical implications, and thought experiments.",
      },
    ];

    let result = "";
    await streamAIResponse(messages, settings.defaultModel, apiKeys, 0.8, {
      onChunk: (c) => {
        result += c;
        setChallengeResponse(result);
      },
      onDone: () => setIsGenerating(false),
      onError: (err) => {
        setChallengeResponse(`⚠️ ${err}`);
        setIsGenerating(false);
      },
    });
  };

  const handleSearch = () => {
    if (query.trim()) {
      setSelectedTopic(query);
      explainTopic(query, depthLevel);
    }
  };

  return (
    <div className="nexus-container nexus-page">
      <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>
        <span className="text-gradient">Explore</span>
      </h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 36 }}>
        Dive deep into any topic. Adjust the depth level to match your
        expertise.
      </p>

      {/* ─── Search + Depth ────────────────────────────────── */}
      <div
        className="glass-iridescent"
        style={{
          padding: 28,
          marginBottom: 36,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--cyan)",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 16,
          }}
        >
          ✦ Ask Anything
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <input
            className="input-nexus"
            placeholder="Explain quantum entanglement, Gödel's theorem, dynamic programming..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{ fontSize: 16, padding: "14px 18px" }}
          />
          <button
            className="btn-nexus btn-primary"
            onClick={handleSearch}
            disabled={isGenerating || !query.trim()}
            style={{ padding: "14px 24px", flexShrink: 0 }}
          >
            {isGenerating ? "⏳" : "✦ Explore"}
          </button>
        </div>

        {/* Depth selector */}
        <div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 10,
            }}
          >
            Explanation depth:
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {DEPTH_LEVELS.map((level, i) => (
              <button
                key={level}
                onClick={() => setDepthLevel(i)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "var(--radius-full)",
                  cursor: "pointer",
                  background:
                    depthLevel === i
                      ? `${DEPTH_COLORS[i]}20`
                      : "rgba(255,255,255,0.04)",
                  border:
                    depthLevel === i
                      ? `1px solid ${DEPTH_COLORS[i]}50`
                      : "1px solid rgba(255,255,255,0.08)",
                  color:
                    depthLevel === i
                      ? DEPTH_COLORS[i]
                      : "var(--text-secondary)",
                  fontFamily: "Outfit",
                  fontWeight: 600,
                  fontSize: 12,
                  transition: "all 0.2s ease",
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Result ────────────────────────────────────────── */}
      {(explanation || isGenerating) && !isChallenge && (
        <div className="glass" style={{ padding: 28, marginBottom: 36 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <span className="badge badge-cyan">
              ✦ {DEPTH_LEVELS[depthLevel]}
            </span>
            {selectedTopic && (
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                {selectedTopic}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
            }}
            className={isGenerating ? "typing-cursor" : ""}
          >
            {explanation || ""}
          </div>
        </div>
      )}

      {/* ─── Challenge Result ──────────────────────────────── */}
      {(challengeResponse || isChallenge) &&
        isChallenge &&
        selectedChallenge && (
          <div
            className="glass"
            style={{
              padding: 28,
              marginBottom: 36,
              borderColor: `${selectedChallenge.color}25`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 28 }}>{selectedChallenge.icon}</span>
              <span style={{ fontSize: 18, fontWeight: 800 }}>
                {selectedChallenge.title}
              </span>
            </div>
            <div
              style={{
                fontSize: 15,
                lineHeight: 1.8,
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
              }}
              className={isGenerating ? "typing-cursor" : ""}
            >
              {challengeResponse}
            </div>
          </div>
        )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 28,
          alignItems: "start",
        }}
      >
        {/* ─── Topic Categories ──────────────────────────── */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Curated Topics
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {TOPIC_CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className="glass"
                style={{ padding: "16px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 18, color: "var(--cyan)" }}>
                    {cat.icon}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>
                    {cat.label}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {cat.topics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => {
                        setQuery(topic);
                        setSelectedTopic(topic);
                        explainTopic(topic, depthLevel);
                      }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "var(--radius-full)",
                        cursor: "pointer",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "var(--text-secondary)",
                        fontFamily: "Outfit",
                        fontSize: 12,
                        fontWeight: 600,
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--cyan)";
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "rgba(0,245,255,0.3)";
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(0,245,255,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--text-secondary)";
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "rgba(255,255,255,0.08)";
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(255,255,255,0.05)";
                      }}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Right Column ──────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Daily Challenges */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              🎯 Daily Challenges
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DAILY_CHALLENGES.map((ch, i) => (
                <div
                  key={i}
                  onClick={() => exploreChallenge(ch)}
                  className="glass-card"
                  style={{
                    padding: "16px",
                    cursor: "pointer",
                    borderColor:
                      selectedChallenge?.title === ch.title
                        ? `${ch.color}40`
                        : "rgba(255,255,255,0.08)",
                    background:
                      selectedChallenge?.title === ch.title
                        ? `${ch.color}08`
                        : "var(--glass-bg)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 24, flexShrink: 0 }}>
                      {ch.icon}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          marginBottom: 4,
                          color: ch.color,
                        }}
                      >
                        {ch.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          lineHeight: 1.5,
                        }}
                      >
                        {ch.desc}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Prompts */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              🌐 Trending Prompts
            </h2>
            <div className="glass" style={{ padding: "8px 0" }}>
              {COMMUNITY_PROMPTS.map((p, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setQuery(p.text);
                    setSelectedTopic(p.text);
                    explainTopic(p.text, depthLevel);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderBottom:
                      i < COMMUNITY_PROMPTS.length - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.04)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "transparent")
                  }
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                      "{p.text}"
                    </div>
                    <span
                      className={`badge badge-${p.category === "AI" ? "cyan" : p.category === "Math" ? "gold" : p.category === "Coding" ? "violet" : "coral"}`}
                      style={{ marginTop: 6 }}
                    >
                      {p.category}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  >
                    ❤ {p.likes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .explore-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default NexusExplore;
