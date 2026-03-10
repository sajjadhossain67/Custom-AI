import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  getSettings,
  getApiKeys,
  getChatHistory,
  saveChatSession,
  deleteChatSession,
  getAIMemory,
  addAIMemory,
  addActivity,
  ChatSession,
  ChatMessage,
} from "../utils/nexusStorage";
import {
  AI_MODELS,
  AI_PERSONAS,
  streamAIResponse,
  getContextUsage,
  getModelInfo,
  hasApiKey,
} from "../utils/nexusAI";

// ─── Markdown code block parser ───────────────────────────────────────────────
function parseContent(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <InlineText key={key++} text={text.slice(lastIndex, match.index)} />,
      );
    }
    parts.push(
      <CodeBlock
        key={key++}
        lang={match[1] || "text"}
        code={match[2].trimEnd()}
      />,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length)
    parts.push(<InlineText key={key++} text={text.slice(lastIndex)} />);
  return parts;
}

function InlineText({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      '<code style="background:rgba(0,245,255,0.1);color:#00f5ff;padding:2px 6px;border-radius:5px;font-family:JetBrains Mono,monospace;font-size:0.9em">$1</code>',
    )
    .replace(/\n/g, "<br/>");
  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ lineHeight: 1.7 }}
    />
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="code-block" style={{ margin: "12px 0" }}>
      <div className="code-block-header">
        <span style={{ color: "var(--cyan)" }}>{lang || "code"}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: copied ? "var(--green)" : "var(--text-muted)",
            fontFamily: "Outfit",
            fontSize: 11,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {copied ? "✓ Copied" : "⎘ Copy"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Main Chat Component ──────────────────────────────────────────────────────
const NexusChat: React.FC = () => {
  const settings = getSettings();
  const [sessions, setSessions] = useState<ChatSession[]>(getChatHistory);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(settings.defaultModel);
  const [persona, setPersona] = useState(settings.defaultPersona);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [memory, setMemory] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeys] = useState(getApiKeys());
  const [contextPct, setContextPct] = useState(0);
  const [promptTemplateOpen, setPromptTemplateOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortRef = useRef<boolean>(false);

  const currentModelInfo = getModelInfo(model);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    setMemory(getAIMemory());
  }, []);

  const newSession = useCallback(() => {
    const id = uuidv4();
    const session: ChatSession = {
      id,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model,
      persona,
    };
    saveChatSession(session);
    setSessions(getChatHistory());
    setCurrentSessionId(id);
    setMessages([]);
    setError(null);
  }, [model, persona]);

  useEffect(() => {
    if (!currentSessionId) newSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userText = input.trim();
    setInput("");
    setError(null);

    if (!hasApiKey(model, apiKeys)) {
      setError(
        `No API key for ${currentModelInfo?.name}. Go to Settings → API Keys to add yours.`,
      );
      return;
    }

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: userText,
      timestamp: Date.now(),
      model,
    };
    const assistantMsgId = uuidv4();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      model,
      persona,
      isStreaming: true,
    };

    const newMessages = [...messages, userMsg, assistantMsg];
    setMessages(newMessages);
    setIsStreaming(true);
    abortRef.current = false;

    const systemMsg = {
      role: "system" as const,
      content: `${AI_PERSONAS[persona] || AI_PERSONAS.Professor}\n\nUser memory context: ${memory.slice(0, 5).join("; ")}`,
    };
    const apiMessages = [
      systemMsg,
      ...messages
        .filter((m) => !m.isStreaming)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      { role: "user" as const, content: userText },
    ];

    let accumulated = "";
    await streamAIResponse(apiMessages, model, apiKeys, settings.temperature, {
      onChunk: (chunk) => {
        if (abortRef.current) return;
        accumulated += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulated } : m,
          ),
        );
        setContextPct(
          getContextUsage(
            apiMessages.map((m) => ({
              ...m,
              content: m.content + accumulated,
            })),
          ),
        );
      },
      onDone: () => {
        if (abortRef.current) return;
        const finalMessages = newMessages.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: accumulated, isStreaming: false }
            : m,
        );
        setMessages(finalMessages);
        setIsStreaming(false);
        // Save session
        const sessionId = currentSessionId!;
        const title = userText.slice(0, 50) + (userText.length > 50 ? "…" : "");
        const session: ChatSession = {
          id: sessionId,
          title,
          messages: finalMessages,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model,
          persona,
        };
        saveChatSession(session);
        setSessions(getChatHistory());
        addActivity({ type: "chat", title: `Chat: ${title}`, icon: "◈" });
        // TTS
        if (settings.ttsEnabled && accumulated)
          speakText(accumulated.slice(0, 500));
      },
      onError: (err) => {
        setError(err);
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
        setIsStreaming(false);
      },
    });
  };

  const stopStreaming = () => {
    abortRef.current = true;
    setIsStreaming(false);
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(
      text.replace(/```[\s\S]*?```/g, "code block"),
    );
    utt.rate = settings.ttsSpeed || 1;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  const exportChat = () => {
    const md = messages
      .map(
        (m) => `**${m.role === "user" ? "You" : "NEXUS AI"}:**\n${m.content}`,
      )
      .join("\n\n---\n\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const forkThread = (msgIndex: number) => {
    const forkedMsgs = messages.slice(0, msgIndex + 1);
    const id = uuidv4();
    const session: ChatSession = {
      id,
      title: `Fork: ${messages[msgIndex].content.slice(0, 40)}…`,
      messages: forkedMsgs,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model,
      persona,
    };
    saveChatSession(session);
    setSessions(getChatHistory());
    setCurrentSessionId(id);
    setMessages(forkedMsgs);
  };

  const PROMPT_TEMPLATES = [
    {
      label: "Explain Simply",
      text: "Explain [topic] as if I'm a complete beginner, using analogies and real-world examples.",
    },
    {
      label: "Step-by-Step",
      text: "Walk me through [task] step by step with clear explanations at each stage.",
    },
    {
      label: "Pros & Cons",
      text: "Give me a balanced analysis of the pros and cons of [topic].",
    },
    {
      label: "Debug Help",
      text: "Help me debug this code. Here's what it does and what's going wrong:\n\n```\n[paste code here]\n```",
    },
    {
      label: "Essay Outline",
      text: "Create a detailed outline for an essay on [topic] including thesis, main points, and conclusion.",
    },
    {
      label: "Socratic Mode",
      text: "I want to learn about [topic]. Don't just tell me — ask me questions to help me discover it myself.",
    },
    {
      label: "Time Complexity",
      text: "Analyze the time and space complexity of this algorithm and suggest optimizations:\n\n```\n[code]\n```",
    },
    {
      label: "Interview Prep",
      text: "Act as an interviewer. Give me a challenging interview question about [topic] and then evaluate my answer.",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - var(--nav-height))",
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* ─── Sessions Sidebar ─────────────────────────────── */}
      <div
        style={{
          width: showSidebar ? 280 : 0,
          flexShrink: 0,
          overflow: "hidden",
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          flexDirection: "column",
          background: "rgba(5,5,15,0.6)",
          backdropFilter: "blur(30px)",
        }}
      >
        <div style={{ padding: "20px 16px 12px", flexShrink: 0 }}>
          <button
            className="btn-nexus btn-primary"
            onClick={newSession}
            style={{
              width: "100%",
              justifyContent: "center",
              fontSize: 13,
              padding: "9px",
            }}
          >
            + New Chat
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px" }}>
          {sessions.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
                padding: "32px 16px",
              }}
            >
              No chats yet.
              <br />
              Start a conversation!
            </div>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => {
                setCurrentSessionId(s.id);
                setMessages(s.messages);
                setModel(s.model);
                setPersona(s.persona);
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                cursor: "pointer",
                marginBottom: 4,
                background:
                  currentSessionId === s.id
                    ? "rgba(0,245,255,0.08)"
                    : "transparent",
                border:
                  currentSessionId === s.id
                    ? "1px solid rgba(0,245,255,0.2)"
                    : "1px solid transparent",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (currentSessionId !== s.id)
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                if (currentSessionId !== s.id)
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
              }}
            >
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  {getModelInfo(s.model)?.name || s.model}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChatSession(s.id);
                  setSessions(getChatHistory());
                  if (currentSessionId === s.id) newSession();
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 14,
                  padding: "2px 4px",
                  borderRadius: 4,
                  flexShrink: 0,
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "var(--coral)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "var(--text-muted)")
                }
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Main Chat Area ───────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(5,5,15,0.6)",
            backdropFilter: "blur(30px)",
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn-icon"
            onClick={() => setShowSidebar((s) => !s)}
            title="Toggle sidebar"
            style={{
              color: showSidebar ? "var(--cyan)" : "var(--text-secondary)",
            }}
          >
            ☰
          </button>

          {/* Model selector */}
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: currentModelInfo?.color || "var(--cyan)",
              borderRadius: 10,
              padding: "6px 10px",
              fontFamily: "Outfit",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              outline: "none",
            }}
          >
            {AI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.icon} {m.name}
              </option>
            ))}
          </select>

          {/* Persona selector */}
          <div style={{ display: "flex", gap: 4 }}>
            {Object.keys(AI_PERSONAS).map((p) => (
              <button
                key={p}
                onClick={() => setPersona(p)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  background:
                    persona === p
                      ? "rgba(191,95,255,0.15)"
                      : "rgba(255,255,255,0.04)",
                  color: persona === p ? "var(--violet)" : "var(--text-muted)",
                  fontFamily: "Outfit",
                  fontWeight: 600,
                  fontSize: 11,
                  transition: "all 0.15s ease",
                  border:
                    persona === p
                      ? "1px solid rgba(191,95,255,0.3)"
                      : "1px solid transparent",
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {/* Context usage */}
            {contextPct > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 80,
                    height: 4,
                    borderRadius: 2,
                    background: "rgba(255,255,255,0.1)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${contextPct}%`,
                      background:
                        contextPct > 80
                          ? "var(--coral)"
                          : contextPct > 50
                            ? "var(--gold)"
                            : "var(--cyan)",
                      transition: "width 0.3s ease",
                      borderRadius: 2,
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  {Math.round(contextPct)}%
                </span>
              </div>
            )}
            <button
              className="btn-icon"
              title="Prompt templates"
              onClick={() => setPromptTemplateOpen(true)}
            >
              📋
            </button>
            <button
              className="btn-icon"
              title="AI Memory"
              onClick={() => setShowMemory((s) => !s)}
              style={{
                color: showMemory ? "var(--violet)" : "var(--text-secondary)",
              }}
            >
              🧠
            </button>
            <button
              className="btn-icon"
              title="Export chat"
              onClick={exportChat}
            >
              ⬇
            </button>
            <button className="btn-icon" title="New chat" onClick={newSession}>
              +
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {messages.length === 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                textAlign: "center",
                padding: 32,
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16 }}>◈</div>
              <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
                <span className="text-gradient">NEXUS AI Chat</span>
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  maxWidth: 400,
                  lineHeight: 1.7,
                  marginBottom: 24,
                }}
              >
                Ask anything. Switch models mid-conversation. Choose a persona.
                Use voice I/O.
              </p>
              {!hasApiKey(model, apiKeys) && (
                <div
                  style={{
                    padding: "12px 20px",
                    borderRadius: 12,
                    background: "rgba(255,107,107,0.1)",
                    border: "1px solid rgba(255,107,107,0.2)",
                    fontSize: 14,
                    color: "var(--coral)",
                    maxWidth: 400,
                  }}
                >
                  ⚠️ No API key for <strong>{currentModelInfo?.name}</strong>.
                  <br />
                  <span style={{ color: "var(--text-secondary)" }}>
                    Go to Settings → API Keys to add yours.
                  </span>
                </div>
              )}
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className="animate-fade-in"
              style={{
                display: "flex",
                gap: 14,
                marginBottom: 20,
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                alignItems: "flex-start",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  flexShrink: 0,
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg,rgba(0,245,255,0.2),rgba(191,95,255,0.2))"
                      : "linear-gradient(135deg,rgba(191,95,255,0.2),rgba(0,245,255,0.2))",
                  border: `1px solid ${msg.role === "user" ? "rgba(0,245,255,0.2)" : "rgba(191,95,255,0.2)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                {msg.role === "user" ? "👤" : "◈"}
              </div>
              {/* Bubble */}
              <div style={{ maxWidth: "72%" }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginBottom: 4,
                    textAlign: msg.role === "user" ? "right" : "left",
                  }}
                >
                  {msg.role === "user"
                    ? "You"
                    : `${getModelInfo(msg.model || model)?.name || "AI"} · ${msg.persona || persona}`}
                </div>
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius:
                      msg.role === "user"
                        ? "18px 4px 18px 18px"
                        : "4px 18px 18px 18px",
                    background:
                      msg.role === "user"
                        ? "rgba(0,245,255,0.08)"
                        : "rgba(255,255,255,0.05)",
                    border: `1px solid ${msg.role === "user" ? "rgba(0,245,255,0.15)" : "rgba(255,255,255,0.07)"}`,
                    fontSize: 14,
                    lineHeight: 1.7,
                  }}
                >
                  {msg.isStreaming && msg.content === "" ? (
                    <div
                      style={{ display: "flex", gap: 6, alignItems: "center" }}
                    >
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "var(--cyan)",
                            animation: `pulse 1s ${i * 0.15}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className={msg.isStreaming ? "typing-cursor" : ""}>
                      {parseContent(msg.content)}
                    </span>
                  )}
                </div>
                {/* Message actions */}
                {msg.role === "assistant" && !msg.isStreaming && (
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button
                      onClick={() => navigator.clipboard.writeText(msg.content)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: 11,
                        padding: "2px 6px",
                        borderRadius: 6,
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "var(--text-primary)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "var(--text-muted)")
                      }
                    >
                      ⎘ Copy
                    </button>
                    <button
                      onClick={() => speakText(msg.content)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: 11,
                        padding: "2px 6px",
                        borderRadius: 6,
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "var(--text-primary)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "var(--text-muted)")
                      }
                    >
                      🔊 Speak
                    </button>
                    <button
                      onClick={() => forkThread(i)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: 11,
                        padding: "2px 6px",
                        borderRadius: 6,
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "var(--text-primary)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "var(--text-muted)")
                      }
                    >
                      ⑃ Fork
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {error && (
            <div
              style={{
                padding: "14px 18px",
                borderRadius: 12,
                background: "rgba(255,107,107,0.1)",
                border: "1px solid rgba(255,107,107,0.2)",
                color: "var(--coral)",
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              ⚠️ {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(5,5,15,0.7)",
            backdropFilter: "blur(30px)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              className="input-nexus input-glow"
              placeholder={`Message ${currentModelInfo?.name || "AI"} as ${persona}...`}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 200) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              rows={1}
              style={{
                resize: "none",
                overflow: "hidden",
                maxHeight: 200,
                minHeight: 48,
                lineHeight: 1.6,
                paddingTop: 14,
                paddingBottom: 14,
              }}
            />
            <button
              className="btn-icon"
              onClick={toggleVoiceInput}
              style={{
                color: isListening ? "var(--coral)" : "var(--text-secondary)",
                flexShrink: 0,
                animation: isListening ? "pulse 1s infinite" : "none",
              }}
              title={isListening ? "Stop listening" : "Voice input"}
            >
              {isListening ? "🔴" : "🎙"}
            </button>
            {isSpeaking && (
              <button
                className="btn-icon"
                onClick={() => window.speechSynthesis.cancel()}
                style={{ flexShrink: 0, color: "var(--cyan)" }}
                title="Stop speaking"
              >
                🔇
              </button>
            )}
            {isStreaming ? (
              <button
                className="btn-nexus btn-secondary"
                onClick={stopStreaming}
                style={{ flexShrink: 0, padding: "12px 18px" }}
              >
                ⏹ Stop
              </button>
            ) : (
              <button
                className="btn-nexus btn-primary"
                onClick={sendMessage}
                disabled={!input.trim()}
                style={{ flexShrink: 0, padding: "12px 18px" }}
              >
                ↑
              </button>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {currentModelInfo?.icon} {currentModelInfo?.name} · Persona:{" "}
            {persona} · Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>

      {/* ─── Memory Panel ─────────────────────────────────── */}
      {showMemory && (
        <div
          style={{
            width: 260,
            flexShrink: 0,
            borderLeft: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(5,5,15,0.7)",
            backdropFilter: "blur(30px)",
            display: "flex",
            flexDirection: "column",
            animation: "slideInRight 0.3s ease",
          }}
        >
          <div
            style={{
              padding: "16px 16px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{ fontSize: 14, fontWeight: 700, color: "var(--violet)" }}
            >
              🧠 AI Memory
            </span>
            <button
              onClick={() => setShowMemory(false)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginBottom: 12,
                lineHeight: 1.5,
              }}
            >
              Things NEXUS AI remembers about this session:
            </p>
            {memory.length === 0 ? (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  textAlign: "center",
                  padding: 16,
                }}
              >
                No memories yet.
                <br />
                Chat to build context.
              </div>
            ) : (
              memory.map((m, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "rgba(191,95,255,0.08)",
                    border: "1px solid rgba(191,95,255,0.15)",
                    marginBottom: 8,
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {m}
                </div>
              ))
            )}
          </div>
          <div style={{ padding: 12 }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              Add a memory note:
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                id="memInput"
                className="input-nexus"
                placeholder="I prefer TypeScript..."
                style={{ fontSize: 12, padding: "8px 10px" }}
              />
              <button
                className="btn-icon"
                onClick={() => {
                  const val = (
                    document.getElementById("memInput") as HTMLInputElement
                  )?.value.trim();
                  if (val) {
                    addAIMemory(val);
                    setMemory(getAIMemory());
                    (
                      document.getElementById("memInput") as HTMLInputElement
                    ).value = "";
                  }
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Prompt Templates Modal ───────────────────────── */}
      {promptTemplateOpen && (
        <div
          className="modal-overlay"
          onClick={() => setPromptTemplateOpen(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 600 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                📋 Prompt Templates
              </h3>
              <button
                onClick={() => setPromptTemplateOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 20,
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {PROMPT_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => {
                    setInput(t.text);
                    setPromptTemplateOpen(false);
                    inputRef.current?.focus();
                  }}
                  style={{
                    padding: "14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    textAlign: "left",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--text-primary)",
                    fontFamily: "Outfit",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(0,245,255,0.08)";
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "rgba(0,245,255,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "rgba(255,255,255,0.08)";
                  }}
                >
                  <div
                    style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}
                  >
                    {t.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {t.text.slice(0, 60)}…
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes inputPulse { 0%,100% { box-shadow: 0 0 0 2px rgba(0,245,255,0.3),0 0 20px rgba(0,245,255,0.1); } 50% { box-shadow: 0 0 0 2px rgba(0,245,255,0.5),0 0 35px rgba(0,245,255,0.2); } }
        .input-glow:focus { animation: inputPulse 2s ease-in-out infinite; }
        select option { background: #0d0d1e; color: white; }
      `}</style>
    </div>
  );
};

export default NexusChat;
