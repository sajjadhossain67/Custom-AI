// NEXUS AI — Multi-Provider AI Streaming Utilities
// All API calls go directly from browser to AI provider using the user's own key.
// No proxy server, no backend. User's keys are stored only in localStorage.

import { ApiKeys } from "./nexusStorage";

export const AI_MODELS = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    icon: "⚡",
    color: "#00f5ff",
    badge: "Latest",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    icon: "🔮",
    color: "#00f5ff",
    badge: "",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    icon: "💨",
    color: "#00f5ff",
    badge: "Fast",
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    icon: "🧠",
    color: "#bf5fff",
    badge: "Smart",
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    icon: "🌸",
    color: "#bf5fff",
    badge: "Fast",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    icon: "✨",
    color: "#ffd93d",
    badge: "Pro",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    icon: "💫",
    color: "#ffd93d",
    badge: "Fast",
  },
  {
    id: "mistral-large-latest",
    name: "Mixtral Large",
    provider: "mistral",
    icon: "🌀",
    color: "#ff6b6b",
    badge: "Open",
  },
] as const;

export type AIModelId = (typeof AI_MODELS)[number]["id"];

export const AI_PERSONAS: Record<string, string> = {
  Professor:
    "You are a distinguished professor who teaches with clarity, depth, and academic rigor. You use proper terminology, provide structured explanations with examples, and draw connections to broader concepts. You are patient, thorough, and intellectually stimulating.",
  Hacker:
    "You are a seasoned hacker/engineer who speaks in practical, no-nonsense terms. You focus on real-world implementations, performance, and elegant technical solutions. You appreciate clever hacks, use technical jargon freely, and cut to the chase.",
  Socratic:
    "You are a Socratic tutor. You NEVER give direct answers. Instead, you ask probing questions that guide the student to discover answers themselves. You challenge assumptions, expose contradictions, and encourage first-principles thinking.",
  Friendly:
    "You are a warm, encouraging, and approachable learning buddy. You use casual language, relatable analogies, fun metaphors, and lots of positive reinforcement. You make complex topics feel fun, accessible, and exciting.",
  "Strict Coach":
    "You are a demanding coach who holds high standards. You push learners hard, point out mistakes directly and constructively, challenge them to do better, and celebrate only genuine mastery. You are tough but fair, and your goal is excellence.",
};

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}

export interface StreamMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function streamAIResponse(
  messages: StreamMessage[],
  model: string,
  apiKeys: ApiKeys,
  temperature: number = 0.7,
  callbacks: StreamCallbacks,
) {
  const modelInfo = AI_MODELS.find((m) => m.id === model);
  if (!modelInfo) {
    callbacks.onError("Unknown model selected.");
    return;
  }

  try {
    switch (modelInfo.provider) {
      case "openai":
        await streamOpenAI(
          messages,
          model,
          apiKeys.openai!,
          temperature,
          callbacks,
        );
        break;
      case "anthropic":
        await streamAnthropic(
          messages,
          model,
          apiKeys.anthropic!,
          temperature,
          callbacks,
        );
        break;
      case "google":
        await streamGoogle(
          messages,
          model,
          apiKeys.google!,
          temperature,
          callbacks,
        );
        break;
      case "mistral":
        await streamMistral(
          messages,
          model,
          apiKeys.mistral!,
          temperature,
          callbacks,
        );
        break;
      default:
        callbacks.onError("Unsupported model provider.");
    }
  } catch (err: any) {
    callbacks.onError(err.message || "An unexpected error occurred.");
  }
}

async function streamOpenAI(
  messages: StreamMessage[],
  model: string,
  apiKey: string,
  temperature: number,
  callbacks: StreamCallbacks,
) {
  if (!apiKey) {
    throw new Error(
      "OpenAI API key not configured. Go to Settings → API Keys to add yours.",
    );
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature, stream: true }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message || `OpenAI error ${res.status}: ${res.statusText}`,
    );
  }
  await readSSEStream(res, (data) => {
    if (data === "[DONE]") {
      callbacks.onDone();
      return true;
    }
    try {
      const json = JSON.parse(data);
      const chunk = json.choices?.[0]?.delta?.content;
      if (chunk) callbacks.onChunk(chunk);
    } catch {}
    return false;
  });
  callbacks.onDone();
}

async function streamAnthropic(
  messages: StreamMessage[],
  model: string,
  apiKey: string,
  temperature: number,
  callbacks: StreamCallbacks,
) {
  if (!apiKey) {
    throw new Error(
      "Anthropic API key not configured. Go to Settings → API Keys to add yours.",
    );
  }
  const systemMsg = messages.find((m) => m.role === "system");
  const chatMsgs = messages.filter((m) => m.role !== "system");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature,
      stream: true,
      system: systemMsg?.content,
      messages: chatMsgs,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic error ${res.status}`);
  }
  await readSSEStream(res, (data) => {
    try {
      const json = JSON.parse(data);
      if (json.type === "content_block_delta") {
        callbacks.onChunk(json.delta?.text || "");
      } else if (json.type === "message_stop") {
        callbacks.onDone();
        return true;
      }
    } catch {}
    return false;
  });
  callbacks.onDone();
}

async function streamGoogle(
  messages: StreamMessage[],
  model: string,
  apiKey: string,
  temperature: number,
  callbacks: StreamCallbacks,
) {
  if (!apiKey) {
    throw new Error(
      "Google AI API key not configured. Go to Settings → API Keys to add yours.",
    );
  }
  const systemMsg = messages.find((m) => m.role === "system");
  const chatMsgs = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: chatMsgs,
      systemInstruction: systemMsg
        ? { parts: [{ text: systemMsg.content }] }
        : undefined,
      generationConfig: { temperature },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini error ${res.status}`);
  }
  await readSSEStream(res, (data) => {
    try {
      const json = JSON.parse(data);
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) callbacks.onChunk(text);
    } catch {}
    return false;
  });
  callbacks.onDone();
}

async function streamMistral(
  messages: StreamMessage[],
  model: string,
  apiKey: string,
  temperature: number,
  callbacks: StreamCallbacks,
) {
  if (!apiKey) {
    throw new Error(
      "Mistral API key not configured. Go to Settings → API Keys to add yours.",
    );
  }
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature, stream: true }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Mistral error ${res.status}`);
  }
  await readSSEStream(res, (data) => {
    if (data === "[DONE]") {
      callbacks.onDone();
      return true;
    }
    try {
      const json = JSON.parse(data);
      const chunk = json.choices?.[0]?.delta?.content;
      if (chunk) callbacks.onChunk(chunk);
    } catch {}
    return false;
  });
  callbacks.onDone();
}

// ─── SSE Stream Reader ────────────────────────────────────────────────────────
async function readSSEStream(res: Response, onLine: (data: string) => boolean) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const isDone = onLine(line.slice(6).trim());
        if (isDone) return;
      }
    }
  }
}

// ─── Provider Helpers ─────────────────────────────────────────────────────────
export const getModelInfo = (modelId: string) =>
  AI_MODELS.find((m) => m.id === modelId);
export const getProvider = (modelId: string) =>
  getModelInfo(modelId)?.provider || "openai";

export const hasApiKey = (modelId: string, apiKeys: ApiKeys): boolean => {
  const provider = getProvider(modelId);
  return !!(apiKeys as any)[provider];
};

// ─── Token Estimation ─────────────────────────────────────────────────────────
export const estimateTokens = (text: string): number =>
  Math.ceil(text.length / 4);

export const getContextUsage = (
  messages: StreamMessage[],
  maxTokens = 128000,
): number => {
  const total = messages.reduce((acc, m) => acc + estimateTokens(m.content), 0);
  return Math.min((total / maxTokens) * 100, 100);
};
