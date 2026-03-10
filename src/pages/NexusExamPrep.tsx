import React, { useState, useRef } from "react";
import {
  getSettings,
  getApiKeys,
  getExamProgress,
  saveExamProgress,
  addActivity,
} from "../utils/nexusStorage";
import { streamAIResponse, hasApiKey } from "../utils/nexusAI";

const EXAMS = ["IELTS", "GRE", "GMAT", "TOEFL", "SAT", "LSAT"];
const EXAM_COLORS: Record<string, string> = {
  IELTS: "#00f5ff",
  GRE: "#bf5fff",
  GMAT: "#ffd93d",
  TOEFL: "#ff6b6b",
  SAT: "#00ff88",
  LSAT: "#ff9f43",
};

const GRE_VOCAB = [
  {
    word: "Abstruse",
    def: "Difficult to understand; obscure",
    ex: "The physicist's abstruse theories baffled most students.",
  },
  {
    word: "Ameliorate",
    def: "To make something bad better; improve",
    ex: "The medication ameliorated her chronic pain significantly.",
  },
  {
    word: "Cacophony",
    def: "A harsh, discordant mixture of sounds",
    ex: "The cacophony of the construction site made it impossible to concentrate.",
  },
  {
    word: "Diffident",
    def: "Modest; lacking confidence; shy",
    ex: "The diffident student rarely volunteered answers in class.",
  },
  {
    word: "Enervate",
    def: "To weaken; drain of energy",
    ex: "The oppressive heat enervated even the most enthusiastic hikers.",
  },
  {
    word: "Facetious",
    def: "Treating serious matters lightly; joking inappropriately",
    ex: "His facetious remarks at the funeral upset many attendees.",
  },
  {
    word: "Garrulous",
    def: "Excessively talkative, especially on trivial matters",
    ex: "The garrulous neighbor's endless stories tested everyone's patience.",
  },
  {
    word: "Harbinger",
    def: "A person or thing that signals the approach of something",
    ex: "Dark clouds are often a harbinger of storms.",
  },
  {
    word: "Impugn",
    def: "To dispute the truth or honesty of; call into question",
    ex: "The lawyer attempted to impugn the credibility of the witness.",
  },
  {
    word: "Laconic",
    def: "Using very few words; brief and concise",
    ex: "The general's laconic reply conveyed more than a lengthy speech.",
  },
];

const IELTS_PROMPT_W2 = `You are an IELTS examiner. Score the following IELTS Writing Task 2 essay on a band scale of 1-9.

Evaluate on four criteria:
1. Task Achievement (TA): Does it fully address the task? Are positions clear and supported?
2. Coherence and Cohesion (CC): Is it well-organized? Are paragraphs logical?
3. Lexical Resource (LR): Range and accuracy of vocabulary.
4. Grammatical Range and Accuracy (GRA): Range and accuracy of grammar.

For each criterion, provide:
- Band score (1-9)
- Specific strengths
- Specific weaknesses with examples from the text
- Actionable improvement tips

Then provide the Overall Band Score (average of four, rounded to nearest 0.5).
Be specific and constructive. Actual IELTS examiners use this level of detail.`;

interface FlashcardState {
  index: number;
  flipped: boolean;
  known: string[];
  unknown: string[];
}

type ExamSection =
  | "writing"
  | "vocab"
  | "reading"
  | "speaking"
  | "quant"
  | "verbal";

const NexusExamPrep: React.FC = () => {
  const settings = getSettings();
  const apiKeys = getApiKeys();
  const progress = getExamProgress();
  const [exam, setExam] = useState("IELTS");
  const [section, setSection] = useState<ExamSection>("writing");
  const [essay, setEssay] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isScoring, setIsScoring] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [flashcard, setFlashcard] = useState<FlashcardState>({
    index: 0,
    flipped: false,
    known: [],
    unknown: [],
  });
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speakingFeedback, setSpeakingFeedback] = useState("");
  const [greVerbalAnswer, setGreVerbalAnswer] = useState("");
  const [greVerbalFeedback, setGreVerbalFeedback] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  const examColor = EXAM_COLORS[exam] || "#00f5ff";
  const currentCard = GRE_VOCAB[flashcard.index];

  const examSections: Record<
    string,
    { sections: { id: ExamSection; label: string; icon: string }[] }
  > = {
    IELTS: {
      sections: [
        { id: "writing", label: "Writing Task 2", icon: "✍️" },
        { id: "reading", label: "Reading Practice", icon: "📖" },
        { id: "vocab", label: "Vocabulary", icon: "📚" },
        { id: "speaking", label: "Speaking Practice", icon: "🎙" },
      ],
    },
    GRE: {
      sections: [
        { id: "verbal", label: "Verbal Reasoning", icon: "📝" },
        { id: "quant", label: "Quant Reasoning", icon: "🔢" },
        { id: "vocab", label: "Vocabulary Builder", icon: "📚" },
        { id: "writing", label: "Analytical Writing", icon: "✍️" },
      ],
    },
    GMAT: {
      sections: [
        { id: "quant", label: "Quantitative", icon: "🔢" },
        { id: "verbal", label: "Verbal", icon: "📝" },
        { id: "writing", label: "AWA Essay", icon: "✍️" },
      ],
    },
    TOEFL: {
      sections: [
        { id: "reading", label: "Reading", icon: "📖" },
        { id: "writing", label: "Writing", icon: "✍️" },
        { id: "speaking", label: "Speaking", icon: "🎙" },
        { id: "vocab", label: "Vocabulary", icon: "📚" },
      ],
    },
    SAT: {
      sections: [
        { id: "reading", label: "Reading & Writing", icon: "📖" },
        { id: "quant", label: "Math", icon: "🔢" },
        { id: "vocab", label: "Vocabulary", icon: "📚" },
      ],
    },
    LSAT: {
      sections: [
        { id: "reading", label: "Reading Comprehension", icon: "📖" },
        { id: "verbal", label: "Logical Reasoning", icon: "🧠" },
      ],
    },
  };

  const scoreIELTS = async () => {
    if (essay.trim().length < 100) return;
    if (!hasApiKey(settings.defaultModel, apiKeys)) {
      setFeedback("⚠️ Configure an API key in Settings first.");
      return;
    }
    setIsScoring(true);
    setFeedback("");
    const userSub = `IELTS Writing Task 2 Essay (${wordCount} words):\n\n${essay}`;
    const messages = [
      { role: "system" as const, content: IELTS_PROMPT_W2 },
      { role: "user" as const, content: userSub },
    ];
    let result = "";
    await streamAIResponse(messages, settings.defaultModel, apiKeys, 0.3, {
      onChunk: (c) => {
        result += c;
        setFeedback(result);
      },
      onDone: () => {
        setIsScoring(false);
        const p = getExamProgress();
        const match = result.match(/Overall Band[^:]*:\s*(\d+\.?\d*)/i);
        const score = match ? parseFloat(match[1]) : 0;
        saveExamProgress({
          ielts: {
            ...p.ielts,
            sessions: p.ielts.sessions + 1,
            writing: [...p.ielts.writing, score],
          },
        });
        addActivity({
          type: "exam",
          title: `IELTS Writing scored: Band ${score}`,
          icon: "◆",
        });
      },
      onError: (err) => {
        setFeedback(`⚠️ ${err}`);
        setIsScoring(false);
      },
    });
  };

  const startListening = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice not supported in this browser.");
      return;
    }
    const r = new SR();
    recognitionRef.current = r;
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (e: any) => {
      const t = Array.from(e.results)
        .map((res: any) => res[0].transcript)
        .join("");
      setTranscript(t);
    };
    r.onend = () => setIsListening(false);
    r.start();
    setIsListening(true);
    setSpeakingFeedback("");
  };

  const stopAndEvaluate = async () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    if (!transcript.trim() || !hasApiKey(settings.defaultModel, apiKeys)) {
      setSpeakingFeedback("⚠️ No transcript captured or API key missing.");
      return;
    }
    const messages = [
      {
        role: "system" as const,
        content:
          "You are a language fluency evaluator. Score the following spoken response on: Fluency (1-9), Pronunciation markers (coherence of speech), Vocabulary, Grammar. Give specific feedback and an overall band score.",
      },
      {
        role: "user" as const,
        content: `Spoken response transcript:\n\n${transcript}`,
      },
    ];
    let result = "";
    await streamAIResponse(messages, settings.defaultModel, apiKeys, 0.4, {
      onChunk: (c) => {
        result += c;
        setSpeakingFeedback(result);
      },
      onDone: () => {},
      onError: (err) => setSpeakingFeedback(`⚠️ ${err}`),
    });
  };

  const submitGreVerbal = async () => {
    if (!greVerbalAnswer.trim() || !hasApiKey(settings.defaultModel, apiKeys))
      return;
    setIsProcessing(true);
    setGreVerbalFeedback("");
    const messages = [
      {
        role: "system" as const,
        content:
          "You are a GRE verbal reasoning tutor. Evaluate the student's answer to a text completion or reading comprehension question. Explain what's correct, what's wrong, and why the correct answer is right. Reference specific reasoning strategies.",
      },
      { role: "user" as const, content: greVerbalAnswer },
    ];
    let result = "";
    await streamAIResponse(messages, settings.defaultModel, apiKeys, 0.5, {
      onChunk: (c) => {
        result += c;
        setGreVerbalFeedback(result);
      },
      onDone: () => setIsProcessing(false),
      onError: (err) => {
        setGreVerbalFeedback(`⚠️ ${err}`);
        setIsProcessing(false);
      },
    });
  };

  const nextCard = (known: boolean) => {
    setFlashcard((prev) => {
      const newKnown = known ? [...prev.known, currentCard.word] : prev.known;
      const newUnknown = !known
        ? [...prev.unknown, currentCard.word]
        : prev.unknown;
      const next = (prev.index + 1) % GRE_VOCAB.length;
      return {
        index: next,
        flipped: false,
        known: newKnown,
        unknown: newUnknown,
      };
    });
  };

  const renderSection = () => {
    switch (section) {
      case "writing":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="glass" style={{ padding: 20 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {exam} Writing Task — Sample Prompt
              </div>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                }}
              >
                {exam === "IELTS"
                  ? '"Some people believe that it is best to live in a horizontal city while others believe that it is better to live in a vertical city. Discuss both views and give your own opinion."'
                  : exam === "GRE" || exam === "GMAT"
                    ? '"The best leaders are those who are willing to admit their mistakes. Discuss the extent to which you agree or disagree with this claim, providing specific examples."'
                    : '"Technology has made modern life more convenient but has created new problems. Discuss advantages and disadvantages."'}
              </p>
              <div
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                {exam === "IELTS"
                  ? "Target: 250+ words · 40 minutes"
                  : "Target: 350-450 words · 30 minutes"}
              </div>
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  Your response:
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: wordCount >= 250 ? "var(--green)" : "var(--gold)",
                  }}
                >
                  {wordCount} words
                </span>
              </div>
              <textarea
                className="input-nexus"
                placeholder="Write your essay here..."
                value={essay}
                onChange={(e) => {
                  setEssay(e.target.value);
                  setWordCount(
                    e.target.value.trim().split(/\s+/).filter(Boolean).length,
                  );
                }}
                rows={12}
                style={{
                  resize: "vertical",
                  fontFamily: "Outfit",
                  lineHeight: 1.8,
                  fontSize: 14,
                }}
              />
            </div>
            <button
              className="btn-nexus btn-primary"
              onClick={scoreIELTS}
              disabled={wordCount < 100 || isScoring}
              style={{ alignSelf: "flex-start", padding: "12px 28px" }}
            >
              {isScoring ? "⏳ Scoring..." : `✦ Get ${exam} Score`}
            </button>
            {feedback && (
              <div
                className="glass"
                style={{
                  padding: 20,
                  whiteSpace: "pre-wrap",
                  fontSize: 14,
                  lineHeight: 1.7,
                  borderColor: `${examColor}30`,
                }}
              >
                {feedback}
              </div>
            )}
          </div>
        );

      case "vocab":
        const pct = Math.round(
          (flashcard.known.length / GRE_VOCAB.length) * 100,
        );
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
              <span style={{ color: "var(--green)" }}>
                ✓ Known: {flashcard.known.length}
              </span>
              <span style={{ color: "var(--coral)" }}>
                ✗ Learning: {flashcard.unknown.length}
              </span>
              <span style={{ color: "var(--text-muted)" }}>
                Remaining: {GRE_VOCAB.length - flashcard.index}
              </span>
            </div>
            {/* Progress bar */}
            <div
              style={{
                width: "100%",
                maxWidth: 480,
                height: 6,
                borderRadius: 3,
                background: "rgba(255,255,255,0.1)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background:
                    "linear-gradient(90deg,var(--cyan),var(--violet))",
                  borderRadius: 3,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            {/* Flashcard */}
            <div
              onClick={() =>
                setFlashcard((prev) => ({ ...prev, flipped: !prev.flipped }))
              }
              style={{
                width: "100%",
                maxWidth: 480,
                minHeight: 220,
                borderRadius: 24,
                cursor: "pointer",
                background: flashcard.flipped
                  ? "rgba(0,245,255,0.08)"
                  : "rgba(255,255,255,0.05)",
                border: `1px solid ${flashcard.flipped ? "rgba(0,245,255,0.25)" : "rgba(255,255,255,0.1)"}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 32,
                textAlign: "center",
                transition: "all 0.3s ease",
              }}
            >
              {!flashcard.flipped ? (
                <>
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 900,
                      color: "var(--cyan)",
                      marginBottom: 12,
                    }}
                  >
                    {currentCard.word}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Click to reveal definition
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}
                  >
                    {currentCard.word}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      color: "var(--text-secondary)",
                      marginBottom: 16,
                      lineHeight: 1.5,
                    }}
                  >
                    {currentCard.def}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                      lineHeight: 1.6,
                    }}
                  >
                    "{currentCard.ex}"
                  </div>
                </>
              )}
            </div>
            {flashcard.flipped && (
              <div style={{ display: "flex", gap: 16 }}>
                <button
                  onClick={() => nextCard(false)}
                  className="btn-nexus btn-secondary"
                  style={{
                    padding: "10px 24px",
                    borderColor: "rgba(255,107,107,0.3)",
                    color: "var(--coral)",
                  }}
                >
                  ✗ Still Learning
                </button>
                <button
                  onClick={() => nextCard(true)}
                  className="btn-nexus btn-primary"
                  style={{ padding: "10px 24px" }}
                >
                  ✓ I Know This
                </button>
              </div>
            )}
          </div>
        );

      case "speaking":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="glass" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
                Speaking Practice — Cue Card
              </h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                }}
              >
                <strong style={{ color: "var(--text-primary)" }}>
                  Describe a place you have visited that has left a strong
                  impression.
                </strong>
                <br />
                <br />
                You should say:
                <br />
                • Where the place is
                <br />
                • When you visited it
                <br />
                • What you did there
                <br />• And explain why it left a strong impression on you.
              </p>
              <div
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                Preparation: 1 minute · Talk for 1–2 minutes
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              {/* Waveform visualization */}
              {isListening && (
                <div
                  style={{
                    display: "flex",
                    gap: 3,
                    alignItems: "flex-end",
                    height: 40,
                  }}
                >
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 4,
                        borderRadius: 2,
                        background: "var(--cyan)",
                        height: `${20 + Math.random() * 20}px`,
                        animation: `waveform ${0.5 + Math.random() * 0.5}s ${i * 0.05}s ease-in-out infinite`,
                      }}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={isListening ? stopAndEvaluate : startListening}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  background: isListening
                    ? "rgba(255,107,107,0.2)"
                    : "linear-gradient(135deg,var(--cyan),var(--violet))",
                  color: isListening ? "var(--coral)" : "#05050f",
                  fontSize: isListening ? 28 : 28,
                  boxShadow: isListening
                    ? "0 0 30px rgba(255,107,107,0.4)"
                    : "0 0 30px rgba(0,245,255,0.4)",
                  transition: "all 0.3s ease",
                  animation: isListening
                    ? "glow 1s ease-in-out infinite"
                    : "none",
                }}
              >
                {isListening ? "⏹" : "🎙"}
              </button>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {isListening
                  ? "Recording... Click stop to evaluate"
                  : "Click to start recording your response"}
              </div>
            </div>
            {transcript && (
              <div className="glass" style={{ padding: 16 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 8,
                  }}
                >
                  Your transcript:
                </div>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "var(--text-secondary)",
                  }}
                >
                  {transcript}
                </p>
              </div>
            )}
            {speakingFeedback && (
              <div
                className="glass"
                style={{
                  padding: 20,
                  whiteSpace: "pre-wrap",
                  fontSize: 14,
                  lineHeight: 1.7,
                  borderColor: "rgba(0,245,255,0.2)",
                }}
              >
                {speakingFeedback}
              </div>
            )}
          </div>
        );

      case "quant":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="glass" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
                GRE Quantitative — Sample Problem
              </h3>
              <div
                style={{
                  padding: "16px",
                  background: "rgba(255,217,61,0.06)",
                  borderRadius: 12,
                  border: "1px solid rgba(255,217,61,0.15)",
                  marginBottom: 16,
                }}
              >
                <p style={{ fontSize: 15, lineHeight: 1.7 }}>
                  A cylindrical tank has radius 3 meters and height 8 meters.
                  Water is being pumped in at a rate of 6π cubic meters per
                  minute.
                  <br />
                  <br />
                  <strong>Quantity A:</strong> Time (in minutes) to fill the
                  tank
                  <br />
                  <strong>Quantity B:</strong> 12
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Quantity A is greater",
                  "Quantity B is greater",
                  "The two quantities are equal",
                  "Cannot be determined",
                ].map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => sendQuantAnswer(opt)}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 12,
                      textAlign: "left",
                      cursor: "pointer",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "var(--text-primary)",
                      fontFamily: "Outfit",
                      fontSize: 14,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,217,61,0.08)";
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(255,217,61,0.25)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(255,255,255,0.08)";
                    }}
                  >
                    <strong style={{ color: "var(--gold)", marginRight: 8 }}>
                      {String.fromCharCode(65 + i)}.
                    </strong>{" "}
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            {greVerbalFeedback && (
              <div
                className="glass"
                style={{
                  padding: 20,
                  whiteSpace: "pre-wrap",
                  fontSize: 14,
                  lineHeight: 1.7,
                  borderColor: "rgba(255,217,61,0.2)",
                }}
              >
                {greVerbalFeedback}
              </div>
            )}
          </div>
        );

      case "verbal":
      default:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="glass" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
                {exam} Verbal — Text Completion
              </h3>
              <div
                style={{
                  padding: "16px",
                  background: "rgba(191,95,255,0.06)",
                  borderRadius: 12,
                  border: "1px solid rgba(191,95,255,0.15)",
                  marginBottom: 16,
                }}
              >
                <p style={{ fontSize: 15, lineHeight: 1.8 }}>
                  The scientist's _______ approach to the data was surprising;
                  rather than drawing broad conclusions, she remained focused
                  only on what could be directly observed, refusing to _______
                  beyond the evidence.
                </p>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  Your answer and reasoning:
                </div>
                <textarea
                  className="input-nexus"
                  placeholder="e.g., I choose 'empirical' for blank 1 because... and 'speculate' for blank 2 because..."
                  value={greVerbalAnswer}
                  onChange={(e) => setGreVerbalAnswer(e.target.value)}
                  rows={4}
                  style={{ resize: "none", fontSize: 14 }}
                />
                <button
                  className="btn-nexus btn-primary"
                  onClick={submitGreVerbal}
                  disabled={!greVerbalAnswer.trim() || isProcessing}
                  style={{ alignSelf: "flex-start", padding: "10px 24px" }}
                >
                  {isProcessing ? "⏳ Evaluating..." : "Submit Answer"}
                </button>
              </div>
            </div>
            {greVerbalFeedback && (
              <div
                className="glass"
                style={{
                  padding: 20,
                  whiteSpace: "pre-wrap",
                  fontSize: 14,
                  lineHeight: 1.7,
                  borderColor: "rgba(191,95,255,0.2)",
                }}
              >
                {greVerbalFeedback}
              </div>
            )}
          </div>
        );

      case "reading":
        return (
          <div className="glass" style={{ padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
              Reading Comprehension
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                maxWidth: 400,
                margin: "0 auto 16px",
              }}
            >
              Reading passages with AI-generated comprehension questions are
              loaded dynamically. Configure your AI provider in Settings to
              enable adaptive reading practice.
            </p>
            <button
              className="btn-nexus btn-primary"
              onClick={() =>
                sendToTutorSection(
                  "Generate a {exam} reading comprehension passage with 5 multiple choice questions and answers.",
                )
              }
              style={{ padding: "12px 24px" }}
            >
              Generate Practice Passage
            </button>
          </div>
        );
    }
  };

  const sendQuantAnswer = async (answer: string) => {
    if (!hasApiKey(settings.defaultModel, apiKeys)) {
      setGreVerbalFeedback("⚠️ Configure API key in Settings.");
      return;
    }
    setGreVerbalFeedback("");
    const messages = [
      {
        role: "system" as const,
        content:
          "You are a GRE quantitative reasoning tutor. Evaluate the student's answer, explain the correct solution step-by-step, and provide the reasoning strategy.",
      },
      {
        role: "user" as const,
        content: `My answer: ${answer}. The problem was about a cylinder with radius 3m, height 8m, filled at 6π m³/min. Is my answer correct?`,
      },
    ];
    let result = "";
    await streamAIResponse(messages, settings.defaultModel, apiKeys, 0.3, {
      onChunk: (c) => {
        result += c;
        setGreVerbalFeedback(result);
      },
      onDone: () => {},
      onError: (err) => setGreVerbalFeedback(`⚠️ ${err}`),
    });
  };

  const sendToTutorSection = async (prompt: string) => {
    if (!hasApiKey(settings.defaultModel, apiKeys)) {
      setGreVerbalFeedback("⚠️ Configure API key in Settings.");
      return;
    }
    const filled = prompt.replace("{exam}", exam);
    setGreVerbalFeedback("");
    const messages = [{ role: "user" as const, content: filled }];
    let result = "";
    await streamAIResponse(messages, settings.defaultModel, apiKeys, 0.7, {
      onChunk: (c) => {
        result += c;
        setGreVerbalFeedback(result);
      },
      onDone: () => {},
      onError: (err) => setGreVerbalFeedback(`⚠️ ${err}`),
    });
  };

  const currentSections =
    examSections[exam]?.sections || examSections.IELTS.sections;

  return (
    <div className="nexus-container nexus-page">
      <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>
        <span className="text-gradient">Exam Prep</span>
      </h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>
        AI-powered adaptive practice for your target exam
      </p>

      {/* Exam selector */}
      <div
        style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}
      >
        {EXAMS.map((e) => (
          <button
            key={e}
            onClick={() => {
              setExam(e);
              setSection(examSections[e].sections[0].id);
              setFeedback("");
              setGreVerbalFeedback("");
            }}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--radius-full)",
              cursor: "pointer",
              background:
                exam === e
                  ? `rgba(${e === "IELTS" ? "0,245,255" : e === "GRE" ? "191,95,255" : "255,217,61"},0.15)`
                  : "rgba(255,255,255,0.04)",
              border:
                exam === e
                  ? `1px solid ${EXAM_COLORS[e]}40`
                  : "1px solid rgba(255,255,255,0.08)",
              color: exam === e ? EXAM_COLORS[e] : "var(--text-secondary)",
              fontFamily: "Outfit",
              fontWeight: 700,
              fontSize: 14,
              transition: "all 0.2s ease",
            }}
          >
            {e}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Section Tabs */}
        <div className="glass" style={{ padding: "8px" }}>
          {currentSections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                cursor: "pointer",
                background:
                  section === s.id
                    ? `rgba(${exam === "IELTS" ? "0,245,255" : "191,95,255"},0.1)`
                    : "transparent",
                border:
                  section === s.id
                    ? `1px solid ${examColor}30`
                    : "1px solid transparent",
                color: section === s.id ? examColor : "var(--text-secondary)",
                fontFamily: "Outfit",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.2s ease",
                marginBottom: 4,
                textAlign: "left",
              }}
            >
              <span>{s.icon}</span> {s.label}
            </button>
          ))}

          {/* Stats */}
          <hr className="divider" style={{ margin: "12px 0" }} />
          <div
            style={{
              padding: "0 0 8px",
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            <div style={{ marginBottom: 6 }}>
              Sessions:{" "}
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                {exam === "IELTS"
                  ? progress.ielts.sessions
                  : exam.toLowerCase().includes("gre")
                    ? progress.gre.sessions
                    : progress.gmat.sessions}
              </span>
            </div>
            {exam === "IELTS" && progress.ielts.writing.length > 0 && (
              <div>
                Avg Writing Band:{" "}
                <span style={{ color: "var(--green)", fontWeight: 700 }}>
                  {(
                    progress.ielts.writing.reduce((a, b) => a + b, 0) /
                    progress.ielts.writing.length
                  ).toFixed(1)}
                </span>
              </div>
            )}
            <div style={{ marginTop: 6 }}>
              Vocab Known:{" "}
              <span style={{ color: "var(--green)", fontWeight: 700 }}>
                {progress.vocab.learned.length}
              </span>
            </div>
          </div>
        </div>

        {/* Section Content */}
        <div>{renderSection()}</div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .exam-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes waveform { 0%,100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
      `}</style>
    </div>
  );
};

export default NexusExamPrep;
