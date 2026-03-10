// NEXUS AI — LocalStorage Utilities
// All user data is stored locally in the browser. No data leaves the device.

const KEYS = {
  API_KEYS: "nexus_api_keys",
  SETTINGS: "nexus_settings",
  CHAT_HISTORY: "nexus_chat_history",
  USER_PROFILE: "nexus_user_profile",
  EXAM_PROGRESS: "nexus_exam_progress",
  CODE_SESSIONS: "nexus_code_sessions",
  STUDY_STREAK: "nexus_study_streak",
  AI_MEMORY: "nexus_ai_memory",
  RECENT_ACTIVITY: "nexus_recent_activity",
};

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
  mistral?: string;
}

export interface NexusSettings {
  defaultModel: string;
  defaultPersona: string;
  temperature: number;
  accentColor: string;
  ttsEnabled: boolean;
  userName: string;
  ttsVoice?: string;
  ttsSpeed?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  model?: string;
  persona?: string;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  model: string;
  persona: string;
}

export interface ExamProgress {
  ielts: {
    sessions: number;
    avgScore: number;
    writing: number[];
    verbal: number[];
  };
  gre: { sessions: number; quantScores: number[]; verbalScores: number[] };
  gmat: { sessions: number; scores: number[] };
  vocab: { learned: string[]; streak: number; lastDate?: string };
}

export interface ActivityItem {
  type: "chat" | "code" | "exam" | "explore";
  title: string;
  timestamp: number;
  icon: string;
}

export const defaultSettings: NexusSettings = {
  defaultModel: "gpt-4o",
  defaultPersona: "Professor",
  temperature: 0.7,
  accentColor: "#00f5ff",
  ttsEnabled: false,
  userName: "",
  ttsSpeed: 1.0,
};

// ─── API Keys ──────────────────────────────────────────────────────────────────
export const getApiKeys = (): ApiKeys => {
  try {
    const stored = localStorage.getItem(KEYS.API_KEYS);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const saveApiKeys = (keys: ApiKeys) => {
  localStorage.setItem(KEYS.API_KEYS, JSON.stringify(keys));
};

// ─── Settings ──────────────────────────────────────────────────────────────────
export const getSettings = (): NexusSettings => {
  try {
    const stored = localStorage.getItem(KEYS.SETTINGS);
    return stored
      ? { ...defaultSettings, ...JSON.parse(stored) }
      : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = (settings: Partial<NexusSettings>) => {
  const current = getSettings();
  localStorage.setItem(
    KEYS.SETTINGS,
    JSON.stringify({ ...current, ...settings }),
  );
};

// ─── Chat History ─────────────────────────────────────────────────────────────
export const getChatHistory = (): ChatSession[] => {
  try {
    const stored = localStorage.getItem(KEYS.CHAT_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveChatSession = (session: ChatSession) => {
  const history = getChatHistory();
  const index = history.findIndex((s) => s.id === session.id);
  if (index >= 0) history[index] = session;
  else history.unshift(session);
  if (history.length > 50) history.pop();
  localStorage.setItem(KEYS.CHAT_HISTORY, JSON.stringify(history));
};

export const deleteChatSession = (sessionId: string) => {
  const history = getChatHistory().filter((s) => s.id !== sessionId);
  localStorage.setItem(KEYS.CHAT_HISTORY, JSON.stringify(history));
};

// ─── Exam Progress ────────────────────────────────────────────────────────────
const defaultExamProgress: ExamProgress = {
  ielts: { sessions: 0, avgScore: 0, writing: [], verbal: [] },
  gre: { sessions: 0, quantScores: [], verbalScores: [] },
  gmat: { sessions: 0, scores: [] },
  vocab: { learned: [], streak: 0 },
};

export const getExamProgress = (): ExamProgress => {
  try {
    const stored = localStorage.getItem(KEYS.EXAM_PROGRESS);
    return stored
      ? { ...defaultExamProgress, ...JSON.parse(stored) }
      : defaultExamProgress;
  } catch {
    return defaultExamProgress;
  }
};

export const saveExamProgress = (progress: Partial<ExamProgress>) => {
  const current = getExamProgress();
  localStorage.setItem(
    KEYS.EXAM_PROGRESS,
    JSON.stringify({ ...current, ...progress }),
  );
};

// ─── Code Sessions ────────────────────────────────────────────────────────────
export const getCodeSessions = (): any[] => {
  try {
    const stored = localStorage.getItem(KEYS.CODE_SESSIONS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveCodeSession = (session: any) => {
  const sessions = getCodeSessions();
  const index = sessions.findIndex((s: any) => s.id === session.id);
  if (index >= 0) sessions[index] = session;
  else sessions.unshift(session);
  if (sessions.length > 20) sessions.pop();
  localStorage.setItem(KEYS.CODE_SESSIONS, JSON.stringify(sessions));
};

// ─── AI Memory ────────────────────────────────────────────────────────────────
export const getAIMemory = (): string[] => {
  try {
    const stored = localStorage.getItem(KEYS.AI_MEMORY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addAIMemory = (fact: string) => {
  const memory = getAIMemory();
  if (!memory.includes(fact)) {
    memory.unshift(fact);
    if (memory.length > 20) memory.pop();
    localStorage.setItem(KEYS.AI_MEMORY, JSON.stringify(memory));
  }
};

export const clearAIMemory = () => localStorage.removeItem(KEYS.AI_MEMORY);

// ─── Study Streak ─────────────────────────────────────────────────────────────
export const getStudyStreak = (): number => {
  try {
    const data = localStorage.getItem(KEYS.STUDY_STREAK);
    if (!data) return 0;
    const { lastDate, streak } = JSON.parse(data);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const lastD = new Date(lastDate);
    const today = new Date();
    if (lastD.toDateString() === today.toDateString()) return streak;
    if (lastD.toDateString() === yesterday.toDateString()) return streak;
    return 0;
  } catch {
    return 0;
  }
};

export const updateStudyStreak = () => {
  const today = new Date().toDateString();
  try {
    const data = localStorage.getItem(KEYS.STUDY_STREAK);
    if (!data) {
      localStorage.setItem(
        KEYS.STUDY_STREAK,
        JSON.stringify({ lastDate: today, streak: 1 }),
      );
      return;
    }
    const { lastDate, streak } = JSON.parse(data);
    if (lastDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive =
      new Date(lastDate).toDateString() === yesterday.toDateString();
    const newStreak = isConsecutive ? streak + 1 : 1;
    localStorage.setItem(
      KEYS.STUDY_STREAK,
      JSON.stringify({ lastDate: today, streak: newStreak }),
    );
  } catch {
    localStorage.setItem(
      KEYS.STUDY_STREAK,
      JSON.stringify({ lastDate: today, streak: 1 }),
    );
  }
};

// ─── Recent Activity ──────────────────────────────────────────────────────────
export const getRecentActivity = (): ActivityItem[] => {
  try {
    const stored = localStorage.getItem(KEYS.RECENT_ACTIVITY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addActivity = (item: Omit<ActivityItem, "timestamp">) => {
  const activity = getRecentActivity();
  activity.unshift({ ...item, timestamp: Date.now() });
  if (activity.length > 20) activity.pop();
  localStorage.setItem(KEYS.RECENT_ACTIVITY, JSON.stringify(activity));
};

// ─── Data Management ──────────────────────────────────────────────────────────
export const clearAllData = () => {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
};

export const exportAllData = (): any => {
  const data: any = {};
  Object.entries(KEYS).forEach(([k, v]) => {
    const stored = localStorage.getItem(v);
    if (stored) {
      try {
        data[k] = JSON.parse(stored);
      } catch {
        data[k] = stored;
      }
    }
  });
  return data;
};

export const importAllData = (data: any) => {
  const keyMap: Record<string, string> = { ...KEYS };
  Object.entries(keyMap).forEach(([k, v]) => {
    if (data[k] !== undefined) {
      localStorage.setItem(v, JSON.stringify(data[k]));
    }
  });
};

// ─── Stat Helpers ─────────────────────────────────────────────────────────────
export const getTotalSessions = (): number => {
  return (
    getChatHistory().length +
    getCodeSessions().length +
    getExamProgress().ielts.sessions
  );
};
