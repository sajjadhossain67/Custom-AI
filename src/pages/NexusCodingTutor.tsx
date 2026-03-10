import React, { useState, useRef, useEffect } from "react";
import { getSettings, getApiKeys, addActivity } from "../utils/nexusStorage";
import { streamAIResponse, AI_PERSONAS, hasApiKey } from "../utils/nexusAI";

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "rust",
  "go",
  "cpp",
  "sql",
  "java",
  "bash",
];

const LANG_TEMPLATES: Record<string, string> = {
  javascript: `// JavaScript — Type your code here\nfunction solution(arr) {\n  // Write your solution\n  \n}\n\nconsole.log(solution([1, 2, 3, 4, 5]));`,
  typescript: `// TypeScript — Type your code here\nfunction solution(arr: number[]): number {\n  // Write your solution\n  return 0;\n}\n\nconsole.log(solution([1, 2, 3, 4, 5]));`,
  python: `# Python — Type your code here\ndef solution(arr):\n    # Write your solution\n    pass\n\nprint(solution([1, 2, 3, 4, 5]))`,
  rust: `// Rust — Type your code here\nfn main() {\n    let arr = vec![1, 2, 3, 4, 5];\n    println!("{:?}", arr);\n}`,
  go: `// Go — Type your code here\npackage main\n\nimport "fmt"\n\nfunc main() {\n    arr := []int{1, 2, 3, 4, 5}\n    fmt.Println(arr)\n}`,
  cpp: `// C++ — Type your code here\n#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> arr = {1, 2, 3, 4, 5};\n    return 0;\n}`,
  sql: `-- SQL — Type your query here\nSELECT *\nFROM users\nWHERE age > 18\nORDER BY name ASC\nLIMIT 10;`,
  java: `// Java — Type your code here\npublic class Solution {\n    public static void main(String[] args) {\n        int[] arr = {1, 2, 3, 4, 5};\n        System.out.println("Hello, NEXUS AI!");\n    }\n}`,
  bash: `#!/bin/bash\n# Bash — Type your script here\necho "Hello from NEXUS AI!"\n`,
};

interface Challenge {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  topic: string;
  description: string;
  starterCode: Record<string, string>;
  hints: string[];
}

const CHALLENGES: Challenge[] = [
  {
    id: "1",
    title: "Reverse a String",
    difficulty: "Beginner",
    topic: "Strings",
    description:
      "Write a function that reverses a string without using the built-in reverse method.",
    starterCode: {
      javascript: `function reverseString(str) {\n  // Your solution here\n}\n\nconsole.log(reverseString("hello")); // "olleh"`,
      python: `def reverse_string(s):\n    # Your solution here\n    pass\n\nprint(reverse_string("hello"))  # "olleh"`,
    },
    hints: [
      "Think about iterating backwards through the string",
      "Consider using a loop or recursion",
      "What data structure could help you build the result?",
    ],
  },
  {
    id: "2",
    title: "FizzBuzz",
    difficulty: "Beginner",
    topic: "Logic",
    description:
      'Print numbers 1-100. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", for multiples of both print "FizzBuzz".',
    starterCode: {
      javascript: `for (let i = 1; i <= 100; i++) {\n  // Your solution here\n}`,
      python: `for i in range(1, 101):\n    # Your solution here\n    pass`,
    },
    hints: [
      "The modulo operator (%) gives you the remainder",
      "Order matters — check FizzBuzz before Fizz and Buzz",
      "Test edge cases: 15, 30, 45",
    ],
  },
  {
    id: "3",
    title: "Two Sum",
    difficulty: "Intermediate",
    topic: "Arrays",
    description:
      "Given an array of integers and a target sum, return indices of two numbers that add up to the target.",
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  // Your solution here\n  // Expected time complexity: O(n)\n}\n\nconsole.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]`,
      python: `def two_sum(nums, target):\n    # Your solution here\n    # Expected time complexity: O(n)\n    pass\n\nprint(two_sum([2, 7, 11, 15], 9))  # [0, 1]`,
    },
    hints: [
      "A hash map can give O(n) time complexity",
      "For each number, check if its complement exists",
      "The complement of nums[i] is target - nums[i]",
    ],
  },
  {
    id: "4",
    title: "Valid Parentheses",
    difficulty: "Intermediate",
    topic: "Stack",
    description:
      "Given a string of brackets, determine if the parentheses are valid and properly nested.",
    starterCode: {
      javascript: `function isValid(s) {\n  // Valid: "()", "()[]{}", "{[]}"\n  // Invalid: "(]", "([)]"\n}\n\nconsole.log(isValid("()[]{}"));  // true\nconsole.log(isValid("([)]"));    // false`,
    },
    hints: [
      "A stack is perfect for this problem",
      "Push opening brackets, pop when you see closing brackets",
      "Check if the popped bracket matches the current closing bracket",
    ],
  },
  {
    id: "5",
    title: "Longest Substring",
    difficulty: "Advanced",
    topic: "Sliding Window",
    description:
      "Find the length of the longest substring without repeating characters.",
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {\n  // "abcabcbb" → 3 ("abc")\n  // "bbbbb" → 1 ("b")\n  // Expected time complexity: O(n)\n}\n\nconsole.log(lengthOfLongestSubstring("abcabcbb")); // 3`,
    },
    hints: [
      "The sliding window technique is ideal here",
      "Use a Set or Map to track characters in the current window",
      "When you find a duplicate, shrink the window from the left",
    ],
  },
  {
    id: "6",
    title: "Binary Search",
    difficulty: "Intermediate",
    topic: "Search",
    description:
      "Implement binary search to find a target in a sorted array. Return -1 if not found.",
    starterCode: {
      javascript: `function binarySearch(nums, target) {\n  // Must be O(log n)\n}\n\nconsole.log(binarySearch([-1, 0, 3, 5, 9, 12], 9)); // 4\nconsole.log(binarySearch([-1, 0, 3, 5, 9, 12], 2)); // -1`,
    },
    hints: [
      "Maintain left and right pointers",
      "Calculate mid = Math.floor((left + right) / 2)",
      "Eliminate half the search space at each step",
    ],
  },
];

interface TutorMsg {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const NexusCodingTutor: React.FC = () => {
  const settings = getSettings();
  const apiKeys = getApiKeys();
  const [lang, setLang] = useState("javascript");
  const [code, setCode] = useState(LANG_TEMPLATES.javascript);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<TutorMsg[]>([
    {
      role: "assistant",
      content:
        "👋 Welcome to the Code Tutor! I'll guide you using the Socratic method — I'll ask questions to help you discover solutions yourself.\n\nLoad a challenge from the right panel, or start coding freely. When you're stuck, ask me for a hint rather than the answer!",
    },
  ]);
  const [tutorInput, setTutorInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null,
  );
  const [showChallenges, setShowChallenges] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tutorMessages]);

  const runCode = () => {
    if (lang !== "javascript" && lang !== "typescript") {
      setOutput(
        `⚡ Browser execution is only available for JavaScript.\n\nFor ${lang}, the code would be sent to an execution service.\nCopy the code and try it in an online IDE like repl.it or ideone.`,
      );
      return;
    }
    setIsRunning(true);
    setOutput("");
    try {
      const logs: string[] = [];
      const mockConsole = {
        log: (...args: any[]) =>
          logs.push(
            args
              .map((a) =>
                typeof a === "object" ? JSON.stringify(a, null, 2) : String(a),
              )
              .join(" "),
          ),
        error: (...args: any[]) => logs.push("⚠️ " + args.join(" ")),
        warn: (...args: any[]) => logs.push("⚠️ " + args.join(" ")),
      };
      // eslint-disable-next-line no-new-func
      const fn = new Function("console", code);
      fn(mockConsole);
      setOutput(logs.join("\n") || "(no output)");
    } catch (err: any) {
      setOutput(`💥 Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const sendToTutor = async (userMsg?: string) => {
    const msg = userMsg || tutorInput.trim();
    if (!msg || isStreaming) return;
    if (!userMsg) setTutorInput("");

    const userTutorMsg: TutorMsg = { role: "user", content: msg };
    const assistantPlaceholder: TutorMsg = {
      role: "assistant",
      content: "",
      isStreaming: true,
    };
    setTutorMessages((prev) => [...prev, userTutorMsg, assistantPlaceholder]);
    setIsStreaming(true);
    abortRef.current = false;

    const model = settings.defaultModel;
    if (!hasApiKey(model, apiKeys)) {
      setTutorMessages((prev) =>
        prev.slice(0, -1).concat({
          role: "assistant",
          content:
            "⚠️ No API key configured. Go to Settings to add your AI provider key.",
        }),
      );
      setIsStreaming(false);
      return;
    }

    const systemPrompt = `${AI_PERSONAS.Socratic}

You are a coding tutor specializing in teaching through guided discovery.
Current challenge: ${selectedChallenge ? selectedChallenge.title + " — " + selectedChallenge.description : "Free coding session"}
Language: ${lang}
Student's current code:
\`\`\`${lang}
${code}
\`\`\`

Code output: ${output || "Not run yet"}

Guide the student with questions and hints. Never give the complete solution directly unless explicitly asked to explain after multiple failed attempts. Provide specific, actionable hints.`;

    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...tutorMessages
        .filter((m) => !m.isStreaming)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      { role: "user" as const, content: msg },
    ];

    let accumulated = "";
    await streamAIResponse(apiMessages, model, apiKeys, 0.5, {
      onChunk: (chunk) => {
        if (abortRef.current) return;
        accumulated += chunk;
        setTutorMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: accumulated, isStreaming: true },
        ]);
      },
      onDone: () => {
        setTutorMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: accumulated, isStreaming: false },
        ]);
        setIsStreaming(false);
        addActivity({
          type: "code",
          title: `Code: ${selectedChallenge?.title || "Free session"} (${lang})`,
          icon: "⟨/⟩",
        });
      },
      onError: (err) => {
        setTutorMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: `⚠️ ${err}` },
        ]);
        setIsStreaming(false);
      },
    });
  };

  const loadChallenge = (ch: Challenge) => {
    setSelectedChallenge(ch);
    setCurrentHintIndex(0);
    const starter =
      (ch.starterCode as any)[lang] ||
      (ch.starterCode as any)["javascript"] ||
      LANG_TEMPLATES[lang];
    setCode(starter);
    setOutput("");
    setShowChallenges(false);
    setTutorMessages([
      {
        role: "assistant",
        content: `🎯 **Challenge loaded: ${ch.title}**\n\n${ch.description}\n\nDifficulty: ${ch.difficulty} · Topic: ${ch.topic}\n\nI'll guide you using the Socratic method. Start coding when you're ready, and ask me when you need a push in the right direction!`,
      },
    ]);
  };

  const getNextHint = () => {
    if (!selectedChallenge) return;
    const hint =
      selectedChallenge.hints[
        currentHintIndex % selectedChallenge.hints.length
      ];
    sendToTutor(`Give me hint #${currentHintIndex + 1}: ${hint}`);
    setCurrentHintIndex((i) => i + 1);
  };

  const requestReview = () =>
    sendToTutor(
      `Please review my current code and give me specific feedback on correctness, efficiency, and style:\n\`\`\`${lang}\n${code}\n\`\`\``,
    );

  const diffColors: Record<string, string> = {
    Beginner: "var(--green)",
    Intermediate: "var(--gold)",
    Advanced: "var(--coral)",
  };
  const filteredChallenges =
    filterDifficulty === "All"
      ? CHALLENGES
      : CHALLENGES.filter((c) => c.difficulty === filterDifficulty);

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
      {/* ─── Left: Code Editor ────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          minWidth: 0,
        }}
      >
        {/* Editor Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "rgba(5,5,15,0.8)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <select
            value={lang}
            onChange={(e) => {
              setLang(e.target.value);
              setCode(LANG_TEMPLATES[e.target.value]);
            }}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--cyan)",
              borderRadius: 8,
              padding: "5px 10px",
              fontFamily: "JetBrains Mono",
              fontSize: 12,
              cursor: "pointer",
              outline: "none",
            }}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          {selectedChallenge && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {selectedChallenge.title}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 20,
                  background: `${diffColors[selectedChallenge.difficulty]}20`,
                  color: diffColors[selectedChallenge.difficulty],
                }}
              >
                {selectedChallenge.difficulty}
              </span>
            </div>
          )}

          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button
              className="btn-icon"
              onClick={() => setShowChallenges(true)}
              title="Challenges"
            >
              📚
            </button>
            {selectedChallenge && (
              <button
                className="btn-icon"
                onClick={getNextHint}
                title="Get a hint"
                style={{ color: "var(--gold)" }}
              >
                💡
              </button>
            )}
            <button
              className="btn-icon"
              onClick={requestReview}
              title="AI code review"
              style={{ color: "var(--violet)" }}
            >
              🔍
            </button>
            <button
              className="btn-nexus btn-primary"
              onClick={runCode}
              style={{ padding: "6px 14px", fontSize: 12 }}
            >
              {isRunning ? "⌛" : "▶ Run"}
            </button>
          </div>
        </div>

        {/* Code Editor */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "rgba(255,255,255,0.9)",
              fontFamily: "JetBrains Mono",
              fontSize: 13,
              lineHeight: 1.7,
              padding: "16px 16px 16px 56px",
              resize: "none",
              tabSize: 2,
            }}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                const newCode = code.slice(0, start) + "  " + code.slice(end);
                setCode(newCode);
                setTimeout(() => {
                  e.currentTarget.selectionStart =
                    e.currentTarget.selectionEnd = start + 2;
                }, 0);
              }
            }}
          />
          {/* Line numbers overlay */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 48,
              background: "rgba(0,0,0,0.2)",
              borderRight: "1px solid rgba(255,255,255,0.05)",
              padding: "16px 8px",
              fontFamily: "JetBrains Mono",
              fontSize: 12,
              color: "rgba(255,255,255,0.2)",
              lineHeight: 1.7,
              userSelect: "none",
              overflowY: "hidden",
              textAlign: "right",
              pointerEvents: "none",
            }}
          >
            {code.split("\n").map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        </div>

        {/* Output Panel */}
        <div
          style={{
            height: 160,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "8px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontSize: 12,
              fontFamily: "JetBrains Mono",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>▶</span> Output{" "}
            {lang !== "javascript" && lang !== "typescript" && (
              <span style={{ color: "var(--gold)" }}>— browser JS only</span>
            )}
          </div>
          <pre
            style={{
              padding: 12,
              margin: 0,
              fontFamily: "JetBrains Mono",
              fontSize: 12,
              lineHeight: 1.6,
              overflowY: "auto",
              color: output.includes("💥") ? "var(--coral)" : "var(--green)",
              flex: 1,
            }}
          >
            {output || (
              <span style={{ color: "var(--text-muted)" }}>
                Press Run ▶ to execute your code
              </span>
            )}
          </pre>
        </div>
      </div>

      {/* ─── Right: AI Tutor Chat ──────────────────────────── */}
      <div
        style={{
          width: 360,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "rgba(5,5,15,0.6)",
          backdropFilter: "blur(30px)",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>⟨/⟩</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>
            Socratic Code Tutor
          </span>
          <span className="badge badge-violet" style={{ marginLeft: "auto" }}>
            Socratic
          </span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
          {tutorMessages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                {msg.role === "user" ? "👤 You" : "⟨/⟩ Tutor"}
              </div>
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius:
                    msg.role === "user"
                      ? "14px 4px 14px 14px"
                      : "4px 14px 14px 14px",
                  background:
                    msg.role === "user"
                      ? "rgba(0,245,255,0.08)"
                      : "rgba(255,255,255,0.05)",
                  border: `1px solid ${msg.role === "user" ? "rgba(0,245,255,0.15)" : "rgba(255,255,255,0.07)"}`,
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                <span className={msg.isStreaming ? "typing-cursor" : ""}>
                  {msg.content || (msg.isStreaming ? "" : "")}
                  {msg.isStreaming && msg.content === "" && (
                    <span
                      style={{
                        display: "inline-flex",
                        gap: 4,
                        alignItems: "center",
                      }}
                    >
                      {[0, 1, 2].map((j) => (
                        <span
                          key={j}
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "var(--cyan)",
                            display: "inline-block",
                            animation: `pulse 1s ${j * 0.15}s infinite`,
                          }}
                        />
                      ))}
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        <div
          style={{
            padding: "8px 12px",
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {[
            "Explain this error",
            "Show me a hint",
            "Review my code",
            "What am I missing?",
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendToTutor(prompt)}
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--text-secondary)",
                fontFamily: "Outfit",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--cyan)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(0,245,255,0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--text-secondary)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,255,255,0.08)";
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Tutor input */}
        <div
          style={{
            padding: "10px 12px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            gap: 8,
          }}
        >
          <textarea
            className="input-nexus"
            placeholder="Ask the tutor..."
            value={tutorInput}
            onChange={(e) => setTutorInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendToTutor();
              }
            }}
            rows={2}
            style={{ resize: "none", fontSize: 13, padding: "10px 12px" }}
          />
          <button
            className="btn-nexus btn-primary"
            onClick={() => sendToTutor()}
            disabled={!tutorInput.trim() || isStreaming}
            style={{ alignSelf: "flex-end", padding: "10px 14px" }}
          >
            ↑
          </button>
        </div>
      </div>

      {/* ─── Challenges Modal ──────────────────────────────── */}
      {showChallenges && (
        <div className="modal-overlay" onClick={() => setShowChallenges(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 680,
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>
                📚 Challenge Library
              </h3>
              <button
                onClick={() => setShowChallenges(false)}
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
            {/* Filter */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["All", "Beginner", "Intermediate", "Advanced"].map((d) => (
                <button
                  key={d}
                  onClick={() => setFilterDifficulty(d)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    cursor: "pointer",
                    fontFamily: "Outfit",
                    fontWeight: 600,
                    fontSize: 12,
                    border: "none",
                    transition: "all 0.15s ease",
                    background:
                      filterDifficulty === d
                        ? "rgba(0,245,255,0.15)"
                        : "rgba(255,255,255,0.05)",
                    color:
                      filterDifficulty === d
                        ? "var(--cyan)"
                        : "var(--text-secondary)",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
            <div
              style={{
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {filteredChallenges.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => loadChallenge(ch)}
                  style={{
                    padding: "16px",
                    borderRadius: 14,
                    cursor: "pointer",
                    background:
                      selectedChallenge?.id === ch.id
                        ? "rgba(0,245,255,0.08)"
                        : "rgba(255,255,255,0.04)",
                    border:
                      selectedChallenge?.id === ch.id
                        ? "1px solid rgba(0,245,255,0.25)"
                        : "1px solid rgba(255,255,255,0.07)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedChallenge?.id !== ch.id)
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    if (selectedChallenge?.id !== ch.id)
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.04)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 700 }}>
                      {ch.title}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 20,
                        background: `${diffColors[ch.difficulty]}20`,
                        color: diffColors[ch.difficulty],
                      }}
                    >
                      {ch.difficulty}
                    </span>
                    <span
                      className="badge badge-cyan"
                      style={{ marginLeft: "auto" }}
                    >
                      {ch.topic}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {ch.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        select option { background: #0d0d1e; color: white; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default NexusCodingTutor;
