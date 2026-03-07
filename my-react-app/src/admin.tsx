import { useState, useRef, useEffect } from "react";

const AUDIT_LOGS = [
  { id: 1, time: "09:00:01", level: "INFO", event: "System initialized", user: "system" },
  { id: 2, time: "09:00:04", level: "INFO", event: "User session started", user: "admin@corp.io" },
  { id: 3, time: "09:01:12", level: "WARN", event: "Rate limit threshold at 80%", user: "api-gateway" },
  { id: 4, time: "09:02:45", level: "INFO", event: "Model context loaded", user: "llm-service" },
  { id: 5, time: "09:03:10", level: "ERROR", event: "Token validation failed", user: "auth-service" },
  { id: 6, time: "09:03:11", level: "INFO", event: "Retry attempt 1/3", user: "auth-service" },
  { id: 7, time: "09:03:14", level: "INFO", event: "Auth token refreshed", user: "auth-service" },
  { id: 8, time: "09:04:00", level: "INFO", event: "User query received", user: "admin@corp.io" },
  { id: 9, time: "09:04:01", level: "INFO", event: "Prompt sanitized", user: "llm-service" },
  { id: 10, time: "09:04:02", level: "INFO", event: "Response generated (312 tokens)", user: "llm-service" },
  { id: 11, time: "09:05:30", level: "WARN", event: "Memory usage at 74%", user: "monitor" },
  { id: 12, time: "09:06:00", level: "INFO", event: "Cache cleared", user: "system" },
];

const BOT_REPLIES = [
  "I've analyzed your request. Here's what I found based on the latest data available in the system.",
  "Great question! Let me break that down for you step by step so it's easier to understand.",
  "Based on the audit logs, I can see a few anomalies worth investigating. Want me to drill deeper?",
  "I've cross-referenced your query with the knowledge base. Here's a concise summary of the findings.",
  "That's an interesting pattern. The data suggests a correlation — let me explain what it might mean.",
];

type Log = {
  level: LogLevel;
  message: string;
};

type LogLevel = "INFO" | "WARN" | "ERROR";
const levelStyles: Record<LogLevel, string> = {
  INFO: "text-blue-500",
  WARN: "text-yellow-500",
  ERROR: "text-red-500",
};

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "10px 0 4px" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#818cf8",
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      gap: 10,
      alignItems: "flex-end",
      marginBottom: 18,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 700,
        background: isUser ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "linear-gradient(135deg,#0ea5e9,#6366f1)",
        boxShadow: isUser ? "0 0 12px rgba(99,102,241,0.5)" : "0 0 12px rgba(14,165,233,0.4)",
        color: "#fff",
      }}>
        {isUser ? "U" : "AI"}
      </div>
      <div style={{
        maxWidth: "72%",
        padding: "11px 15px",
        borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
        background: isUser
          ? "linear-gradient(135deg,rgba(99,102,241,0.28),rgba(139,92,246,0.22))"
          : "rgba(255,255,255,0.05)",
        border: isUser
          ? "1px solid rgba(99,102,241,0.4)"
          : "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(6px)",
        color: "#e2e8f0",
        fontSize: 13.5,
        lineHeight: 1.65,
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: "0.01em",
        boxShadow: isUser
          ? "0 4px 20px rgba(99,102,241,0.15)"
          : "0 4px 12px rgba(0,0,0,0.2)",
      }}>
        {msg.text}
        <div style={{
          fontSize: 10, color: "rgba(148,163,184,0.6)",
          marginTop: 5, textAlign: isUser ? "right" : "left",
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {msg.time}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    { id: 1, role: "assistant", text: "Hello! I'm your AI assistant. Ask me anything about the system, audit logs, or anything else you need help with.", time: "09:00:05" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [logs, setLogs] = useState(AUDIT_LOGS.slice(0, 6));
  const chatEndRef = useRef(null);
  const logEndRef = useRef(null);
  const replyIdx = useRef(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    let idx = 6;
    const interval = setInterval(() => {
      if (idx < AUDIT_LOGS.length) {
        setLogs(prev => [...prev, AUDIT_LOGS[idx]]);
        idx++;
      }
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const now = () => {
    const d = new Date();
    return d.toTimeString().slice(0, 8);
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg = { id: Date.now(), role: "user", text, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setLogs(prev => [...prev, {
      id: Date.now(),
      time: now(),
      level: "INFO",
      event: `User query received: "${text.slice(0, 28)}${text.length > 28 ? "…" : ""}"`,
      user: "admin@corp.io",
    }]);

    setTimeout(() => {
      const reply = BOT_REPLIES[replyIdx.current % BOT_REPLIES.length];
      const replyTime = now();
      replyIdx.current++;
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "assistant",
        text: reply,
        time: replyTime,
      }]);
      setLogs(prev => [...prev.filter(Boolean), {
        id: Date.now() + 2,
        time: replyTime,
        level: "INFO",
        event: "Response generated successfully",
        user: "llm-service",
      }]);
    }, 1800);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #050810; font-family: 'DM Sans', sans-serif; }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .log-row { animation: fadeSlideIn 0.35s ease forwards; }

        .send-btn:hover {
          transform: scale(1.06);
          box-shadow: 0 0 20px rgba(99,102,241,0.6) !important;
        }
        .send-btn:active { transform: scale(0.96); }

        textarea:focus { outline: none; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.55); }
      `}</style>

      <div style={{
        width: "100vw", height: "100vh",
        display: "flex", flexDirection: "column",
        background: "radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(14,165,233,0.05) 0%, transparent 55%), #050810",
        overflow: "hidden",
      }}>

        {/* ── Top Bar ── */}
        <div style={{
          height: 52,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(12px)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg,#6366f1,#0ea5e9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff",
              boxShadow: "0 0 16px rgba(99,102,241,0.5)",
            }}>A</div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: "#e2e8f0", letterSpacing: "0.08em" }}>
              AUDITFLOW<span style={{ color: "#6366f1" }}>.ai</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            {["Dashboard", "Reports", "Settings"].map(label => (
              <span key={label} style={{
                fontSize: 12, color: "rgba(148,163,184,0.6)",
                cursor: "pointer", fontWeight: 500,
              }}>{label}</span>
            ))}
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff",
            }}>AD</div>
          </div>
        </div>

        {/* ── Main Two-Panel Area ── */}
        <div style={{
          flex: 1,
          display: "flex",
          gap: 16,
          padding: 16,
          overflow: "hidden",
          minHeight: 0,
        }}>

          {/* ── LEFT: Audit Log Panel (38%) ── */}
          <div style={{
            width: "38%",
            flexShrink: 0,
            display: "flex", flexDirection: "column",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.025)",
            backdropFilter: "blur(20px)",
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}>
            {/* Panel header */}
            <div style={{
              padding: "14px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(0,0,0,0.2)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#4ade80",
                  boxShadow: "0 0 8px #4ade80",
                  animation: "pulse-dot 2s ease-in-out infinite",
                }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, fontWeight: 700,
                  color: "#94a3b8", letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}>Audit Log Stream</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["INFO", "WARN", "ERR"].map((l, i) => (
                  <span key={l} style={{
                    fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                    padding: "2px 6px", borderRadius: 4,
                    background: ["rgba(74,222,128,0.1)", "rgba(250,204,21,0.1)", "rgba(248,113,113,0.1)"][i],
                    color: ["#4ade80","#facc15","#f87171"][i],
                    border: `1px solid ${["rgba(74,222,128,0.2)","rgba(250,204,21,0.2)","rgba(248,113,113,0.2)"][i]}`,
                    fontWeight: 600,
                  }}>{l}</span>
                ))}
              </div>
            </div>

            {/* Log entries */}
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
              {logs.map((log) => {
                if (!log || !log.level) return null;
                const s = levelStyles[log.level] || levelStyles.INFO;
                return (
                  <div key={log.id} className="log-row" style={{
                    padding: "8px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    transition: "background 0.2s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9.5, color: "rgba(148,163,184,0.5)", flexShrink: 0,
                      }}>{log.time}</span>
                      <span style={{
                        fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                        padding: "1px 6px", borderRadius: 3,
                        background: s.bg, color: s.color,
                        border: `1px solid ${s.border}`,
                        fontWeight: 700, letterSpacing: "0.06em", flexShrink: 0,
                      }}>{log.level}</span>
                    </div>
                    <div style={{
                      fontSize: 12, color: "#cbd5e1", lineHeight: 1.5,
                      fontFamily: "'DM Sans', sans-serif", marginBottom: 2,
                    }}>{log.event}</div>
                    <div style={{
                      fontSize: 10, color: "rgba(99,102,241,0.7)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>→ {log.user}</div>
                  </div>
                );
              })}
              <div ref={logEndRef} />
            </div>

            {/* Footer */}
            <div style={{
              padding: "10px 16px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(0,0,0,0.15)",
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#4ade80", flexShrink: 0,
                animation: "pulse-dot 1.5s ease-in-out infinite",
              }} />
              <span style={{
                fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                color: "rgba(148,163,184,0.5)", letterSpacing: "0.05em",
              }}>
                {logs.length} events · live stream active
              </span>
            </div>
          </div>

          {/* ── RIGHT: Chatbot Panel (62%) ── */}
          <div style={{
            flex: 1,
            display: "flex", flexDirection: "column",
            borderRadius: 16,
            border: "1px solid rgba(99,102,241,0.15)",
            background: "rgba(255,255,255,0.022)",
            backdropFilter: "blur(20px)",
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}>
            {/* Chat header */}
            <div style={{
              padding: "14px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", gap: 12,
              background: "rgba(0,0,0,0.2)",
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: "linear-gradient(135deg,#6366f1,#0ea5e9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, fontWeight: 800, color: "#fff",
                boxShadow: "0 0 18px rgba(99,102,241,0.45)",
                flexShrink: 0,
              }}>✦</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>AuditFlow Assistant</div>
                <div style={{ fontSize: 11, color: "#4ade80", display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pulse-dot 2s infinite" }} />
                  Online · GPT-grade reasoning
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                {["⊞ Expand", "⋯ Options"].map(btn => (
                  <button key={btn} style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8, padding: "5px 12px",
                    color: "rgba(148,163,184,0.7)", fontSize: 11,
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}>{btn}</button>
                ))}
              </div>
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ animation: "fadeSlideIn 0.3s ease" }}>
                  <ChatMessage msg={msg} />
                </div>
              ))}
              {isTyping && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 18 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, color: "#fff",
                    boxShadow: "0 0 12px rgba(14,165,233,0.4)",
                  }}>AI</div>
                  <div style={{
                    padding: "10px 16px",
                    borderRadius: "4px 18px 18px 18px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested prompts */}
            <div style={{
              padding: "0 24px 10px",
              display: "flex", gap: 8, flexWrap: "wrap",
            }}>
              {["Summarize recent errors", "Show WARN events", "What triggered the retry?"].map(p => (
                <button key={p} onClick={() => setInput(p)} style={{
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 20, padding: "5px 13px",
                  color: "rgba(167,170,255,0.85)", fontSize: 11.5,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; }}
                >{p}</button>
              ))}
            </div>

            {/* Input area */}
            <div style={{
              padding: "12px 20px 16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.15)",
            }}>
              <div style={{
                display: "flex", gap: 10, alignItems: "flex-end",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: "10px 12px 10px 16px",
                transition: "border-color 0.2s",
              }}
                onFocusCapture={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.45)"}
                onBlurCapture={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              >
                <textarea
                  rows={1}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder="Ask about logs, anomalies, or anything else…"
                  style={{
                    flex: 1, background: "transparent",
                    border: "none", resize: "none",
                    color: "#e2e8f0", fontSize: 13.5,
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: 1.6, minHeight: 24,
                    maxHeight: 120, overflowY: "auto",
                  }}
                />
                <button
                  className="send-btn"
                  onClick={sendMessage}
                  style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: input.trim()
                      ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                      : "rgba(99,102,241,0.15)",
                    border: "none", cursor: input.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, color: input.trim() ? "#fff" : "rgba(148,163,184,0.4)",
                    transition: "all 0.2s",
                    boxShadow: input.trim() ? "0 0 16px rgba(99,102,241,0.35)" : "none",
                  }}
                >↑</button>
              </div>
              <div style={{
                fontSize: 10.5, color: "rgba(148,163,184,0.35)",
                textAlign: "center", marginTop: 8,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                Press Enter to send · Shift+Enter for new line
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}