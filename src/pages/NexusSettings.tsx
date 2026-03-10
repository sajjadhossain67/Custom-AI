import React, { useState } from "react";
import {
  getSettings,
  saveSettings,
  getApiKeys,
  saveApiKeys,
  clearAllData,
  exportAllData,
  importAllData,
  NexusSettings as NexusSettingsData,
  ApiKeys,
} from "../utils/nexusStorage";
import { AI_MODELS, AI_PERSONAS } from "../utils/nexusAI";

const PROVIDER_INFO: Record<
  string,
  { label: string; icon: string; color: string; url: string }
> = {
  openai: {
    label: "OpenAI",
    icon: "⚡",
    color: "#00f5ff",
    url: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    label: "Anthropic",
    icon: "🧠",
    color: "#bf5fff",
    url: "https://console.anthropic.com",
  },
  google: {
    label: "Google AI",
    icon: "✨",
    color: "#ffd93d",
    url: "https://makersuite.google.com/app/apikey",
  },
  mistral: {
    label: "Mistral AI",
    icon: "🌀",
    color: "#ff6b6b",
    url: "https://console.mistral.ai",
  },
};

const Section: React.FC<{
  title: string;
  icon: string;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="glass" style={{ padding: 28, marginBottom: 24 }}>
    <h2
      style={{
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span> {title}
    </h2>
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode; hint?: string }> = ({
  children,
  hint,
}) => (
  <div style={{ marginBottom: 8 }}>
    <div
      style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}
    >
      {children}
    </div>
    {hint && (
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
        {hint}
      </div>
    )}
  </div>
);

const ACCENT_COLORS = [
  "#00f5ff",
  "#bf5fff",
  "#ff6b6b",
  "#ffd93d",
  "#00ff88",
  "#ff9f43",
  "#a29bfe",
  "#fd79a8",
];

const NexusSettings: React.FC = () => {
  const [settings, setSettings] = useState<NexusSettingsData>(getSettings());
  const [apiKeys, setApiKeys] = useState<ApiKeys>(getApiKeys());
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  const handleSave = () => {
    saveSettings(settings);
    saveApiKeys(apiKeys);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-ai-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        importAllData(data);
        setSettings(getSettings());
        setApiKeys(getApiKeys());
        alert("Data imported successfully!");
      } catch {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    clearAllData();
    setSettings(getSettings());
    setApiKeys({});
    setClearConfirm(false);
  };

  return (
    <div className="nexus-container nexus-page">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>
            <span className="text-gradient">Settings</span>
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Configure your AI providers, preferences, and account data.
            Everything is stored locally — nothing leaves your device.
          </p>
        </div>

        {/* ─── API Keys ──────────────────────────────────── */}
        <Section title="API Key Manager" icon="🔑">
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "rgba(0,245,255,0.06)",
              border: "1px solid rgba(0,245,255,0.15)",
              marginBottom: 24,
              fontSize: 13,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}
          >
            🔒 Your API keys are stored{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              only in your browser's localStorage
            </strong>
            . They are never transmitted to any external server — all AI calls
            go directly from your browser to the AI provider.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {Object.entries(PROVIDER_INFO).map(([provider, info]) => (
              <div key={provider}>
                <Label hint={`Get your key at ${info.url}`}>
                  <span style={{ color: info.color }}>{info.icon}</span>{" "}
                  {info.label} API Key
                </Label>
                <div style={{ position: "relative", display: "flex", gap: 8 }}>
                  <input
                    className="input-nexus"
                    type={showKeys[provider] ? "text" : "password"}
                    placeholder={`${info.label} API key...`}
                    value={(apiKeys as any)[provider] || ""}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, [provider]: e.target.value })
                    }
                    style={{ fontFamily: "JetBrains Mono", fontSize: 13 }}
                  />
                  <button
                    onClick={() =>
                      setShowKeys((s) => ({ ...s, [provider]: !s[provider] }))
                    }
                    className="btn-icon"
                    style={{ flexShrink: 0 }}
                    title={showKeys[provider] ? "Hide" : "Show"}
                  >
                    {showKeys[provider] ? "🙈" : "👁"}
                  </button>
                  {(apiKeys as any)[provider] && (
                    <button
                      onClick={() => setApiKeys({ ...apiKeys, [provider]: "" })}
                      className="btn-icon"
                      style={{ flexShrink: 0, color: "var(--coral)" }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                {(apiKeys as any)[provider] && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--green)",
                      marginTop: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    ✓ Key configured —{" "}
                    {AI_MODELS.filter((m) => m.provider === provider).length}{" "}
                    models available
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ─── AI Defaults ───────────────────────────────── */}
        <Section title="AI Defaults" icon="🤖">
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div>
              <Label hint="Model used when starting a new chat">
                Default AI Model
              </Label>
              <select
                className="input-nexus"
                value={settings.defaultModel}
                onChange={(e) =>
                  setSettings({ ...settings, defaultModel: e.target.value })
                }
                style={{ cursor: "pointer" }}
              >
                <optgroup label="OpenAI">
                  {AI_MODELS.filter((m) => m.provider === "openai").map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Anthropic">
                  {AI_MODELS.filter((m) => m.provider === "anthropic").map(
                    (m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ),
                  )}
                </optgroup>
                <optgroup label="Google AI">
                  {AI_MODELS.filter((m) => m.provider === "google").map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Mistral">
                  {AI_MODELS.filter((m) => m.provider === "mistral").map(
                    (m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ),
                  )}
                </optgroup>
              </select>
            </div>

            <div>
              <Label hint="Personality style for AI responses">
                Default Persona
              </Label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
                  gap: 10,
                }}
              >
                {Object.keys(AI_PERSONAS).map((persona) => (
                  <button
                    key={persona}
                    onClick={() =>
                      setSettings({ ...settings, defaultPersona: persona })
                    }
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      background:
                        settings.defaultPersona === persona
                          ? "rgba(0,245,255,0.08)"
                          : "rgba(255,255,255,0.04)",
                      border:
                        settings.defaultPersona === persona
                          ? "1px solid rgba(0,245,255,0.3)"
                          : "1px solid rgba(255,255,255,0.08)",
                      color:
                        settings.defaultPersona === persona
                          ? "var(--cyan)"
                          : "var(--text-secondary)",
                      fontFamily: "Outfit",
                      fontWeight: 600,
                      fontSize: 13,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {persona}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label
                hint={`Controls creativity vs. precision. Current: ${settings.temperature.toFixed(1)}`}
              >
                Temperature —{" "}
                <span style={{ color: "var(--cyan)" }}>
                  {settings.temperature.toFixed(1)}
                </span>
              </Label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    width: 70,
                  }}
                >
                  Precise 0.0
                </span>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  style={{ flex: 1 }}
                />
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    width: 80,
                    textAlign: "right",
                  }}
                >
                  Creative 2.0
                </span>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── Profile ───────────────────────────────────── */}
        <Section title="Profile" icon="👤">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <Label>Your Name (shown on Dashboard)</Label>
              <input
                className="input-nexus"
                type="text"
                placeholder="Enter your first name..."
                value={settings.userName}
                onChange={(e) =>
                  setSettings({ ...settings, userName: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Accent Color</Label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() =>
                      setSettings({ ...settings, accentColor: color })
                    }
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: color,
                      cursor: "pointer",
                      border:
                        settings.accentColor === color
                          ? `3px solid white`
                          : "3px solid transparent",
                      transform:
                        settings.accentColor === color
                          ? "scale(1.2)"
                          : "scale(1)",
                      transition: "all 0.2s ease",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  Text-to-Speech
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  Auto-read AI responses aloud
                </div>
              </div>
              <button
                onClick={() =>
                  setSettings({ ...settings, ttsEnabled: !settings.ttsEnabled })
                }
                style={{
                  width: 52,
                  height: 28,
                  borderRadius: 14,
                  cursor: "pointer",
                  border: "none",
                  background: settings.ttsEnabled
                    ? "var(--cyan)"
                    : "rgba(255,255,255,0.1)",
                  transition: "all 0.3s ease",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 3,
                    left: settings.ttsEnabled ? 27 : 3,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: settings.ttsEnabled
                      ? "#05050f"
                      : "rgba(255,255,255,0.6)",
                    transition: "all 0.3s ease",
                  }}
                />
              </button>
            </div>
          </div>
        </Section>

        {/* ─── Data Management ───────────────────────────── */}
        <Section title="Data Management" icon="💾">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: 8,
              }}
            >
              All your NEXUS AI data (chat history, exam progress, code
              sessions, API keys) is stored exclusively in your browser's
              localStorage.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                className="btn-nexus btn-secondary"
                onClick={handleExport}
                style={{ fontSize: 13, padding: "10px 18px" }}
              >
                📤 Export All Data
              </button>
              <label
                className="btn-nexus btn-secondary"
                style={{
                  cursor: "pointer",
                  fontSize: 13,
                  padding: "10px 18px",
                }}
              >
                📥 Import Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: "none" }}
                />
              </label>
              <button
                onClick={handleClearData}
                style={{
                  padding: "10px 18px",
                  borderRadius: "var(--radius-full)",
                  background: clearConfirm
                    ? "rgba(255,107,107,0.2)"
                    : "rgba(255,107,107,0.1)",
                  border: `1px solid ${clearConfirm ? "rgba(255,107,107,0.5)" : "rgba(255,107,107,0.2)"}`,
                  color: "var(--coral)",
                  fontFamily: "Outfit",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {clearConfirm
                  ? "⚠️ Confirm — This is irreversible!"
                  : "🗑 Clear All Data"}
              </button>
              {clearConfirm && (
                <button
                  className="btn-nexus btn-secondary"
                  style={{ fontSize: 13, padding: "10px 18px" }}
                  onClick={() => setClearConfirm(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* ─── Save Button ───────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 8,
            paddingBottom: 48,
          }}
        >
          {saved && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--green)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              ✓ Settings saved
            </div>
          )}
          <button
            className="btn-nexus btn-primary"
            onClick={handleSave}
            style={{ padding: "12px 32px", fontSize: 15 }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default NexusSettings;
