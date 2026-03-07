import { useState, useRef, useEffect } from "react";

declare global {
  interface Window {
    puter: any;
  }
}

// ── Palette ──────────────────────────────────────────────
const C = {
  bg:        "#0C0C0C",   // matte black (not pure #000 — softer)
  surface:   "#151515",
  surface2:  "#1F1F1F",
  borderSub: "#2A2A2A",
  borderHi:  "#F5F0E8",  // cream white
  textPri:   "#F5F0E8",  // cream white for AI voice
  textSec:   "#9E9689",  // muted warm grey
  textDim:   "#4A4540",
  purple:    "#7C3AED",  // rich violet-purple
};



const SUGGESTIONS = [
  { icon: "◈", label: "How can you help me?" },
  { icon: "✦", label: "Help me write something" },
  { icon: "⟡", label: "Explain a complex topic" },
  { icon: "◎", label: "Brainstorm ideas with me" },
];

function useTypewriter(text, active, speed = 14) {
  const [displayed, setDisplayed] = useState(active ? "" : text);
  useEffect(() => {
    if (!active) { setDisplayed(text); return; }
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, active]);
  return displayed;
}

function AssistantMessage({ text, isLatest }) {
  const displayed = useTypewriter(text, isLatest);
  const typing = isLatest && displayed.length < text.length;

  return (
    <div style={{
      display: "flex", gap: 14, alignItems: "flex-start",
      marginBottom: 24, animation: "fadeUp 0.3s ease forwards",
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: C.surface, border: `1px solid ${C.borderSub}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginTop: 2,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={C.textPri}/>
        </svg>
      </div>
      <div style={{ flex: 1, paddingTop: 4 }}>
        <div style={{
          fontSize: 11, fontWeight: 500, color: C.textSec,
          letterSpacing: "0.08em", textTransform: "uppercase",
          marginBottom: 6, fontFamily: "'Sora', sans-serif",
        }}>Nova</div>
        <p style={{
          margin: 0, fontSize: 15, lineHeight: 1.85,
          color: C.textPri, fontFamily: "'Sora', sans-serif",
          fontWeight: 300, letterSpacing: "0.01em",
        }}>
          {displayed}
          {typing && (
            <span style={{
              display: "inline-block", width: 2, height: 15,
              background: C.textPri, marginLeft: 2, verticalAlign: "middle",
              animation: "blink 0.7s step-end infinite",
            }} />
          )}
        </p>
      </div>
    </div>
  );
}

function UserMessage({ text, time }) {
  return (
    <div style={{
      display: "flex", justifyContent: "flex-end",
      marginBottom: 24, animation: "fadeUp 0.3s ease forwards",
    }}>
      <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
        <div style={{
          padding: "12px 16px",
          background: C.surface, border: `1px solid ${C.borderSub}`,
          borderRadius: "16px 2px 16px 16px",
          fontSize: 15, lineHeight: 1.8,
          color: C.textPri, fontFamily: "'Sora', sans-serif", fontWeight: 300,
          letterSpacing: "0.01em",
        }}>
          {text}
        </div>
        <span style={{ fontSize: 11, color: C.textSec, fontFamily: "'Sora', sans-serif" }}>{time}</span>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: C.surface, border: `1px solid ${C.borderSub}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={C.textPri}/>
        </svg>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", height: 30 }}>
        {[0,1,2].map(i => (
          <span key={i} style={{
            width: 5, height: 5, borderRadius: "50%",
            background: C.textSec, display: "inline-block",
            animation: `dotBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

function DateDivider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, marginTop: 4 }}>
      <div style={{ flex: 1, height: 1, background: C.borderSub }} />
      <span style={{ fontSize: 11, color: C.textSec, fontFamily: "'Sora', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.borderSub }} />
    </div>
  );
}

export default function ClientChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const send = async (text?: string) => {

  const t = (text ?? input).trim();
  if (!t) return;

  if (!started) setStarted(true);

  const userMessage = {
    id: Date.now(),
    role: "user",
    text: t,
    time: now()
  };

  const newMessages = [...messages, userMessage];

  setMessages(newMessages);
  setInput("");

  if (textareaRef.current) {
    textareaRef.current.style.height = "auto";
  }

  setIsTyping(true);

  try {

    // Convert UI messages to Puter format
    const conversation = newMessages.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.text
    }));

    // Call Puter AI
    const response = await window.puter.ai.chat(conversation, {
      model: "gpt-4.1-nano"
    });

    const aiReply = response?.message?.content || response;

    setIsTyping(false);

    const assistantMessage = {
      id: Date.now() + 1,
      role: "assistant",
      text: aiReply,
      time: now()
    };

    setMessages(prev => [...prev, assistantMessage]);

  } catch (err) {

    console.error(err);

    setIsTyping(false);

    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        role: "assistant",
        text: "AI failed to respond.",
        time: now()
      }
    ]);

  }
};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0C0C0C; font-family: 'Sora', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes dotBounce {
          0%,80%,100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes greetIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(30px,-40px) scale(1.1); }
        }
        @keyframes orbFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-25px,35px) scale(1.08); }
        }
        @keyframes orbFloat3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(20px,28px) scale(1.12); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(0.94); opacity: 0.5; }
          70%  { transform: scale(1.08); opacity: 0; }
          100% { opacity: 0; }
        }

        textarea { outline: none; }
        textarea::placeholder { color: #4A4540; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #3A3A3A; }

        .chip { transition: all 0.18s ease; }
        .chip:hover {
          background: rgba(124,58,237,0.12) !important;
          border-color: rgba(167,139,250,0.5) !important;
          color: #EDE9FE !important;
        }
        .nav-link { transition: color 0.15s; }
        .nav-link:hover { color: #F5F0E8 !important; }
        .icon-btn { transition: background 0.15s; }
        .icon-btn:hover { background: #1F1F1F !important; }
        .input-wrap { transition: border-color 0.2s, box-shadow 0.2s; }
        .input-wrap:focus-within {
          border-color: rgba(124,58,237,0.6) !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.08) !important;
        }
        .send-btn { transition: all 0.18s ease; }
        .send-btn:hover:not(:disabled) { opacity: 0.88; transform: scale(1.04); }
        .send-btn:active:not(:disabled) { transform: scale(0.94); }
      `}</style>

      <div style={{
        width: "100vw", height: "100vh",
        display: "flex", flexDirection: "column",
        background: C.bg, overflow: "hidden",
        position: "relative",
      }}>

        {/* ── GRADIENT BACKGROUND ── */}

        {/* Soft base gradient: matte black → deep purple → back to matte black */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          background: `
            radial-gradient(ellipse 70% 60% at 15% 20%, rgba(109,40,217,0.18) 0%, transparent 65%),
            radial-gradient(ellipse 55% 50% at 85% 75%, rgba(124,58,237,0.14) 0%, transparent 65%),
            radial-gradient(ellipse 45% 45% at 50% 50%, rgba(91,33,182,0.08) 0%, transparent 70%),
            #0C0C0C
          `,
        }} />

        {/* Floating purple orb — top left */}
        <div style={{
          position: "absolute",
          width: 650, height: 650, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(109,40,217,0.15) 0%, transparent 68%)",
          top: "-200px", left: "-150px",
          zIndex: 0, pointerEvents: "none",
          animation: "orbFloat1 18s ease-in-out infinite",
        }} />

        {/* Floating cream-tinted orb — bottom right */}
        <div style={{
          position: "absolute",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,240,232,0.04) 0%, transparent 68%)",
          bottom: "-120px", right: "-100px",
          zIndex: 0, pointerEvents: "none",
          animation: "orbFloat2 22s ease-in-out infinite",
        }} />

        {/* Floating deep violet orb — center */}
        <div style={{
          position: "absolute",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 68%)",
          top: "38%", left: "48%",
          zIndex: 0, pointerEvents: "none",
          animation: "orbFloat3 26s ease-in-out infinite",
        }} />

        {/* Subtle noise grain */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }} />

        {/* ── TOP BAR ── */}
        <div style={{
          position: "relative", zIndex: 10,
          height: 56, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px",
          borderBottom: `1px solid ${C.borderSub}`,
          background: "rgba(12,12,12,0.7)",
          backdropFilter: "blur(20px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 14px rgba(124,58,237,0.35)",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#F5F0E8"/>
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 500, color: C.textPri, letterSpacing: "0.02em" }}>Nova</span>
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 4,
              background: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.3)",
              color: "#C4B5FD", fontWeight: 400, letterSpacing: "0.06em", textTransform: "uppercase",
            }}>AI</span>
          </div>

          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            {["New Chat", "History", "Settings"].map(l => (
              <span key={l} className="nav-link" style={{
                fontSize: 13, color: C.textSec, cursor: "pointer", fontWeight: 300,
              }}>{l}</span>
            ))}
            <div style={{ width: 1, height: 18, background: C.borderSub }} />
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: C.surface2, border: `1px solid ${C.borderSub}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 500, color: C.textSec, cursor: "pointer",
            }}>U</div>
          </div>
        </div>

        {/* ── WELCOME STATE ── */}
        {!started && (
          <div style={{
            position: "relative", zIndex: 10,
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "0 16px 56px",
          }}>

            {/* Pulsing icon */}
            <div style={{ position: "relative", marginBottom: 28, animation: "greetIn 0.5s cubic-bezier(0.16,1,0.3,1) both" }}>
              <div style={{
                position: "absolute", inset: -8, borderRadius: 20,
                border: "1px solid rgba(124,58,237,0.35)",
                animation: "pulseRing 2.8s ease-out infinite",
              }} />
              <div style={{
                position: "absolute", inset: -18, borderRadius: 28,
                border: "1px solid rgba(124,58,237,0.12)",
                animation: "pulseRing 2.8s ease-out 0.7s infinite",
              }} />
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "linear-gradient(135deg, #1A1A1A, #151515)",
                border: `1px solid ${C.borderSub}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", zIndex: 1,
                boxShadow: "0 0 20px rgba(124,58,237,0.2)",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#F5F0E8"/>
                </svg>
              </div>
            </div>

            <h1 style={{
              fontSize: 32, fontWeight: 500,
              color: C.textPri,
              letterSpacing: "-0.02em", textAlign: "center", lineHeight: 1.25,
              marginBottom: 10,
              animation: "greetIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.07s both",
            }}>
              How can I help you today?
            </h1>

            <p style={{
              fontSize: 14, color: C.textSec,
              textAlign: "center", maxWidth: 340,
              lineHeight: 1.75, fontWeight: 300,
              marginBottom: 40,
              animation: "greetIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.13s both",
            }}>
              Ask me anything — write, analyse, explain,<br />or explore ideas together.
            </p>

            {/* Input card */}
            <div style={{
              width: "100%", maxWidth: 680,
              animation: "greetIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.17s both",
            }}>
              <div className="input-wrap" style={{
                background: "rgba(21,21,21,0.85)",
                backdropFilter: "blur(20px)",
                border: `1px solid ${C.borderSub}`,
                borderRadius: 16,
                padding: "16px 14px 12px 20px",
                boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
              }}>
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={input}
                  placeholder="Ask Nova anything…"
                  onChange={e => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                  }}
                  style={{
                    width: "100%", background: "transparent",
                    border: "none", resize: "none",
                    fontSize: 15.5, color: C.textPri,
                    fontFamily: "'Sora', sans-serif", fontWeight: 300,
                    lineHeight: 1.65, minHeight: 52, maxHeight: 160,
                    overflowY: "auto", marginBottom: 12,
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={C.textSec} strokeWidth="1.7" strokeLinecap="round"/></svg>,
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="11" rx="3" stroke={C.textSec} strokeWidth="1.7"/><path d="M5 11a7 7 0 0014 0M12 18v4M8 22h8" stroke={C.textSec} strokeWidth="1.7" strokeLinecap="round"/></svg>,
                    ].map((icon, i) => (
                      <button key={i} className="icon-btn" style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: "transparent", border: "1px solid transparent",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{icon}</button>
                    ))}
                  </div>
                  <button className="send-btn" onClick={() => send()} style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: input.trim()
                      ? "linear-gradient(135deg, #7C3AED, #5B21B6)"
                      : C.surface2,
                    border: `1px solid ${input.trim() ? "transparent" : C.borderSub}`,
                    cursor: input.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: input.trim() ? "0 0 14px rgba(124,58,237,0.4)" : "none",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 3L12 21M12 3L5 10M12 3L19 10"
                        stroke={input.trim() ? "#F5F0E8" : "#4A4540"}
                        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Suggestion chips */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 8, marginTop: 16, width: "100%", maxWidth: 680,
              animation: "greetIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.22s both",
            }}>
              {SUGGESTIONS.map(s => (
                <button key={s.label} className="chip" onClick={() => send(s.label)} style={{
                  padding: "12px 16px",
                  background: "rgba(21,21,21,0.8)",
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${C.borderSub}`,
                  borderRadius: 12, color: C.textSec,
                  fontSize: 13.5, fontWeight: 300,
                  fontFamily: "'Sora', sans-serif", cursor: "pointer",
                  textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── CHAT STATE ── */}
        {started && (
          <>
            <div style={{
              position: "relative", zIndex: 10,
              flex: 1, overflowY: "auto",
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "0 16px",
            }}>
              <div style={{ width: "100%", maxWidth: 700, paddingTop: 28 }}>
                <DateDivider label="Today" />
                {messages.map((msg, idx) =>
                  msg.role === "user"
                    ? <UserMessage key={msg.id} text={msg.text} time={msg.time} />
                    : <AssistantMessage key={msg.id} text={msg.text} isLatest={idx === messages.length - 1} />
                )}
                {isTyping && <TypingDots />}
                <div ref={bottomRef} style={{ height: 12 }} />
              </div>
            </div>

            {/* ── CHAT INPUT BAR ── */}
            <div style={{
              position: "relative", zIndex: 10,
              flexShrink: 0, padding: "12px 16px 20px",
              borderTop: `1px solid ${C.borderSub}`,
              background: "rgba(12,12,12,0.8)",
              backdropFilter: "blur(20px)",
              display: "flex", flexDirection: "column", alignItems: "center",
            }}>
              <div style={{ width: "100%", maxWidth: 700 }}>
                <div className="input-wrap" style={{
                  display: "flex", flexDirection: "column",
                  background: "rgba(21,21,21,0.9)",
                  backdropFilter: "blur(16px)",
                  border: `1px solid ${C.borderSub}`,
                  borderRadius: 14, padding: "12px 12px 10px 18px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                }}>
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    placeholder="Message Nova…"
                    onChange={e => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                    }}
                    style={{
                      width: "100%", background: "transparent",
                      border: "none", resize: "none",
                      fontSize: 15, color: C.textPri,
                      fontFamily: "'Sora', sans-serif", fontWeight: 300,
                      lineHeight: 1.65, minHeight: 24, maxHeight: 140,
                      overflowY: "auto", marginBottom: 8,
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 2 }}>
                      <button className="icon-btn" style={{ width: 30, height: 30, borderRadius: 7, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 5v14M5 12h14" stroke={C.textSec} strokeWidth="1.7" strokeLinecap="round"/>
                        </svg>
                      </button>
                      <button className="icon-btn" style={{ width: 30, height: 30, borderRadius: 7, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <rect x="9" y="2" width="6" height="11" rx="3" stroke={C.textSec} strokeWidth="1.7"/>
                          <path d="M5 11a7 7 0 0014 0M12 18v4M8 22h8" stroke={C.textSec} strokeWidth="1.7" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    <button className="send-btn" onClick={() => send()} style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: input.trim()
                        ? "linear-gradient(135deg, #7C3AED, #5B21B6)"
                        : C.surface2,
                      border: `1px solid ${input.trim() ? "transparent" : C.borderSub}`,
                      cursor: input.trim() ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: input.trim() ? "0 0 12px rgba(124,58,237,0.35)" : "none",
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3L12 21M12 3L5 10M12 3L19 10"
                          stroke={input.trim() ? "#F5F0E8" : "#4A4540"}
                          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.borderSub }} />
                  <p style={{ fontSize: 11, color: C.textDim, letterSpacing: "0.02em", fontFamily: "'Sora', sans-serif" }}>
                    Nova can make mistakes. Consider checking important information.
                  </p>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.borderSub }} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}