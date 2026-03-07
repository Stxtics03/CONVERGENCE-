import { useState, useRef, useEffect, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
interface LogEntry {
  id: number;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  event: string;
  user: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

// ── Static data ───────────────────────────────────────────────────────────────
const AUDIT_LOGS: LogEntry[] = [
  { id: 1,  time: '09:00:01', level: 'INFO',  event: 'System initialized',              user: 'system'        },
  { id: 2,  time: '09:00:04', level: 'INFO',  event: 'User session started',            user: 'admin@corp.io' },
  { id: 3,  time: '09:01:12', level: 'WARN',  event: 'Rate limit threshold at 80%',     user: 'api-gateway'   },
  { id: 4,  time: '09:02:45', level: 'INFO',  event: 'Model context loaded',            user: 'llm-service'   },
  { id: 5,  time: '09:03:10', level: 'ERROR', event: 'Token validation failed',         user: 'auth-service'  },
  { id: 6,  time: '09:03:11', level: 'INFO',  event: 'Retry attempt 1/3',               user: 'auth-service'  },
  { id: 7,  time: '09:03:14', level: 'INFO',  event: 'Auth token refreshed',            user: 'auth-service'  },
  { id: 8,  time: '09:04:00', level: 'INFO',  event: 'User query received',             user: 'admin@corp.io' },
  { id: 9,  time: '09:04:01', level: 'INFO',  event: 'Prompt sanitized',               user: 'llm-service'   },
  { id: 10, time: '09:04:02', level: 'INFO',  event: 'Response generated (312 tokens)', user: 'llm-service'   },
  { id: 11, time: '09:05:30', level: 'WARN',  event: 'Memory usage at 74%',            user: 'monitor'       },
  { id: 12, time: '09:06:00', level: 'INFO',  event: 'Cache cleared',                  user: 'system'        },
];

const BOT_REPLIES = [
  "I've analyzed your request. Here's what I found based on the latest data available in the system.",
  "Great question! Let me break that down for you step by step so it's easier to understand.",
  "Based on the audit logs, I can see a few anomalies worth investigating. Want me to drill deeper?",
  "I've cross-referenced your query with the knowledge base. Here's a concise summary of the findings.",
  "That's an interesting pattern. The data suggests a correlation — let me explain what it might mean.",
];

const LEVEL_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  INFO:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.22)' },
  WARN:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.22)'  },
  ERROR: { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.22)' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const nowStr = () => new Date().toTimeString().slice(0, 8);

// ── Sub-components ────────────────────────────────────────────────────────────
function LogRow({ log }: { log: LogEntry }) {
  const s = LEVEL_STYLE[log.level] ?? LEVEL_STYLE.INFO;
  return (
    <div className="log-row">
      <div className="log-meta">
        <span className="log-time">{log.time}</span>
        <span
          className="log-badge"
          style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
        >
          {log.level}
        </span>
      </div>
      <div className="log-event">{log.event}</div>
      <div className="log-user">→ {log.user}</div>
    </div>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`msg-row${isUser ? ' user' : ''}`}>
      <div className={`avatar ${isUser ? 'usr' : 'ai'}`}>
        {isUser ? 'U' : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#fff" />
          </svg>
        )}
      </div>
      <div className={`bubble ${isUser ? 'user' : 'ai'}`}>
        {msg.text}
        <div className="btime">{msg.time}</div>
      </div>
    </div>
  );
}

function TypingRow() {
  return (
    <div className="msg-row">
      <div className="avatar ai">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#a78bfa" />
        </svg>
      </div>
      <div className="bubble ai" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <div className="tdot" />
          <div className="tdot" />
          <div className="tdot" />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Admin() {
  const [logs, setLogs] = useState<LogEntry[]>(AUDIT_LOGS.slice(0, 6));
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'assistant', text: "Hello! I'm your AI assistant. Ask me anything about the system, audit logs, or anything else you need help with.", time: '09:00:05' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [busy, setBusy] = useState(false);

  const logEndRef   = useRef<HTMLDivElement>(null);
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyIdx    = useRef(0);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Stream remaining audit logs
  useEffect(() => {
    let idx = 6;
    const timer = setInterval(() => {
      if (idx < AUDIT_LOGS.length) {
        setLogs(prev => [...prev, AUDIT_LOGS[idx++]]);
      } else {
        clearInterval(timer);
      }
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const send = useCallback((text?: string) => {
    const t = (text ?? input).trim();
    if (!t || busy) return;
    setBusy(true);

    const time = nowStr();
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: t, time }]);
    setLogs(prev => [...prev, {
      id: Date.now() + 10,
      time,
      level: 'INFO',
      event: `User query: "${t.slice(0, 30)}${t.length > 30 ? '…' : ''}"`,
      user: 'admin@corp.io',
    }]);

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);

    setTimeout(() => {
      const reply = BOT_REPLIES[replyIdx.current % BOT_REPLIES.length];
      replyIdx.current++;
      const rt = nowStr();
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: reply, time: rt }]);
      setLogs(prev => [...prev, {
        id: Date.now() + 11,
        time: rt,
        level: 'INFO',
        event: 'Response generated successfully',
        user: 'llm-service',
      }]);
      setBusy(false);
    }, 1800);
  }, [input, busy]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const prefill = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  const sendActive = input.trim().length > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; height: 100%; overflow: hidden; background: #0e0b12; font-family: 'Sora', sans-serif; }

        @keyframes bounce {
          0%,80%,100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%,100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes orb-a {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-30px,40px) scale(1.1); }
        }
        @keyframes orb-b {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(40px,-30px) scale(1.08); }
        }
        @keyframes orb-c {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-20px,-30px) scale(1.06); }
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(124,58,237,0.5); }

        .af-root {
          position: fixed; inset: 0;
          display: flex; flex-direction: column;
          overflow: hidden; background: #0e0b12;
        }

        /* Background */
        .bg-gradient {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 70% 60% at 15% 20%, rgba(109,40,217,0.32) 0%, transparent 70%),
            radial-gradient(ellipse 55% 50% at 85% 75%, rgba(124,58,237,0.22) 0%, transparent 65%),
            radial-gradient(ellipse 45% 45% at 75% 10%, rgba(245,240,230,0.05) 0%, transparent 60%),
            #0e0b12;
        }
        .orb { position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; }
        .orb1 {
          width: 700px; height: 700px; top: -200px; left: -150px;
          background: radial-gradient(circle, rgba(109,40,217,0.28) 0%, rgba(91,33,182,0.1) 45%, transparent 70%);
          filter: blur(2px); animation: orb-a 18s ease-in-out infinite;
        }
        .orb2 {
          width: 520px; height: 520px; bottom: -120px; right: -100px;
          background: radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(109,40,217,0.07) 50%, transparent 70%);
          filter: blur(1px); animation: orb-c 22s ease-in-out infinite;
        }
        .orb3 {
          width: 340px; height: 340px; top: -60px; right: 10%;
          background: radial-gradient(circle, rgba(245,240,225,0.06) 0%, transparent 70%);
          animation: orb-b 14s ease-in-out infinite;
        }
        .bg-noise {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }
        .bg-vignette {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background: radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.5) 100%);
        }

        /* Topbar */
        .topbar {
          position: relative; z-index: 10; flex-shrink: 0;
          height: 54px; display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(14,11,18,0.75);
          backdrop-filter: blur(20px);
        }
        .logo-mark {
          width: 28px; height: 28px; border-radius: 8px;
          background: linear-gradient(135deg,#7c3aed,#5b21b6);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 14px rgba(124,58,237,0.45);
          font-size: 13px; font-weight: 700; color: #fff;
        }
        .logo-text { font-size: 14px; font-weight: 600; color: #fff; letter-spacing: 0.06em; }
        .logo-accent { color: #a78bfa; }
        .nav-link { font-size: 12px; color: #A0A0A0; cursor: pointer; transition: color 0.15s; }
        .nav-link:hover { color: #fff; }
        .user-badge {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600; color: #c4b5fd; cursor: pointer;
        }
        .divider-v { width: 1px; height: 16px; background: #2E2E2E; }

        /* Panels */
        .panels {
          position: relative; z-index: 10;
          flex: 1; display: flex; gap: 14px;
          padding: 14px; overflow: hidden; min-height: 0;
        }
        .panel {
          display: flex; flex-direction: column;
          border-radius: 14px;
          background: rgba(14,11,18,0.78);
          backdrop-filter: blur(24px);
          overflow: hidden;
        }
        .panel-hd {
          flex-shrink: 0; padding: 13px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(0,0,0,0.25);
          display: flex; align-items: center; justify-content: space-between;
        }
        .panel-ft {
          flex-shrink: 0; padding: 9px 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
          background: rgba(0,0,0,0.2);
          display: flex; align-items: center; gap: 8px;
        }

        /* Log panel */
        .log-panel {
          width: 38%; flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(245,240,230,0.04);
        }
        .log-body { flex: 1; overflow-y: auto; padding: 6px 0; }
        .log-row {
          padding: 8px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          animation: fadeIn 0.35s ease forwards;
          transition: background 0.2s; cursor: default;
        }
        .log-row:hover { background: rgba(255,255,255,0.025); }
        .log-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
        .log-time { font-size: 9.5px; color: #505050; }
        .log-badge { font-size: 9px; padding: 1px 6px; border-radius: 3px; font-weight: 600; letter-spacing: 0.05em; }
        .log-event { font-size: 12px; color: #fff; line-height: 1.5; font-weight: 300; margin-bottom: 3px; }
        .log-user { font-size: 10px; color: rgba(167,139,250,0.6); }
        .pdot {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
          background: #a78bfa; box-shadow: 0 0 8px rgba(167,139,250,0.7);
          animation: pulse-dot 2s ease-in-out infinite;
        }
        .pdot-sm {
          width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
          background: #a78bfa; box-shadow: 0 0 6px rgba(167,139,250,0.6);
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
        .lvl-tag { font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 500; }

        /* Chat panel */
        .chat-panel {
          flex: 1;
          border: 1px solid rgba(124,58,237,0.22);
          box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.08), inset 0 1px 0 rgba(245,240,230,0.04);
        }
        .chat-hd {
          flex-shrink: 0; padding: 13px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(0,0,0,0.25);
          display: flex; align-items: center; gap: 12px;
        }
        .ai-ico {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg,#7c3aed,#5b21b6);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 18px rgba(124,58,237,0.45);
        }
        .hd-btn {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px; padding: 5px 12px;
          color: #A0A0A0; font-size: 11px; cursor: pointer;
          font-family: 'Sora', sans-serif; transition: all 0.15s;
        }
        .hd-btn:hover { background: rgba(124,58,237,0.12); border-color: rgba(124,58,237,0.3); color: #c4b5fd; }

        /* Messages */
        .messages { flex: 1; overflow-y: auto; padding: 18px 20px; display: flex; flex-direction: column; }
        .msg-spacer { flex: 1; }
        .msg-row { display: flex; gap: 10px; align-items: flex-end; margin-bottom: 16px; animation: fadeIn 0.3s ease; }
        .msg-row.user { flex-direction: row-reverse; }
        .avatar { width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #fff; }
        .avatar.ai  { background: #121212; border: 1px solid #2E2E2E; }
        .avatar.usr { background: linear-gradient(135deg,#7c3aed,#5b21b6); box-shadow: 0 0 12px rgba(124,58,237,0.4); }
        .bubble { max-width: 72%; padding: 11px 15px; font-size: 13.5px; line-height: 1.7; font-weight: 300; letter-spacing: 0.01em; font-family: 'Sora', sans-serif; color: #fff; }
        .bubble.ai   { border-radius: 3px 16px 16px 16px; background: rgba(255,255,255,0.03); border: 1px solid #2E2E2E; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .bubble.user { border-radius: 16px 3px 16px 16px; background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3); box-shadow: 0 4px 20px rgba(124,58,237,0.12); }
        .btime { font-size: 10px; color: #505050; margin-top: 5px; }
        .bubble.ai   .btime { text-align: left; }
        .bubble.user .btime { text-align: right; }

        /* Typing dots */
        .tdot { width: 6px; height: 6px; border-radius: 50%; background: #a78bfa; }
        .tdot:nth-child(1) { animation: bounce 1.2s ease-in-out 0s   infinite; }
        .tdot:nth-child(2) { animation: bounce 1.2s ease-in-out 0.2s infinite; }
        .tdot:nth-child(3) { animation: bounce 1.2s ease-in-out 0.4s infinite; }

        /* Chips */
        .chips { flex-shrink: 0; padding: 0 20px 10px; display: flex; gap: 8px; flex-wrap: wrap; }
        .chip {
          background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2);
          border-radius: 20px; padding: 5px 13px; color: #c4b5fd;
          font-size: 11.5px; cursor: pointer; font-family: 'Sora', sans-serif;
          font-weight: 300; transition: all 0.2s; white-space: nowrap;
        }
        .chip:hover { background: rgba(124,58,237,0.18); border-color: rgba(124,58,237,0.45); }

        /* Input */
        .input-area { flex-shrink: 0; padding: 12px 20px 16px; border-top: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.2); }
        .input-shell {
          display: flex; gap: 10px; align-items: flex-end;
          background: rgba(18,14,24,0.9);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 13px; padding: 10px 12px 10px 16px;
          transition: border-color 0.2s;
        }
        .input-shell:focus-within { border-color: rgba(124,58,237,0.45); }
        .msg-textarea {
          flex: 1; background: transparent; border: none; outline: none;
          resize: none; color: #fff; font-size: 13.5px;
          font-family: 'Sora', sans-serif; font-weight: 300;
          line-height: 1.65; min-height: 24px; max-height: 120px; overflow-y: auto;
        }
        .msg-textarea::placeholder { color: #505050; }
        .send-btn {
          width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; cursor: default;
        }
        .send-btn.inactive { background: #1E1E1E; border: 1px solid #2E2E2E; }
        .send-btn.active   { background: linear-gradient(135deg,#7c3aed,#5b21b6); border: none; cursor: pointer; box-shadow: 0 0 14px rgba(124,58,237,0.4); }
        .send-btn.active:hover  { transform: scale(1.06); }
        .send-btn.active:active { transform: scale(0.96); }
        .input-hint { font-size: 10.5px; color: #505050; text-align: center; margin-top: 8px; }
      `}</style>

      <div className="af-root">
        {/* Background */}
        <div className="bg-gradient" />
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
        <div className="bg-noise" />
        <div className="bg-vignette" />

        {/* Top Bar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-mark">A</div>
            <span className="logo-text">AUDITFLOW<span className="logo-accent">.ai</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span className="nav-link">Dashboard</span>
            <span className="nav-link">Reports</span>
            <span className="nav-link">Settings</span>
            <div className="divider-v" />
            <div className="user-badge">AD</div>
          </div>
        </div>

        {/* Panels */}
        <div className="panels">

          {/* LEFT: Audit Log */}
          <div className="panel log-panel">
            <div className="panel-hd">
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div className="pdot" />
                <span style={{ fontSize: 11, fontWeight: 500, color: '#A0A0A0', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Audit Log Stream
                </span>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <span className="lvl-tag" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.22)' }}>INFO</span>
                <span className="lvl-tag" style={{ background: 'rgba(251,191,36,0.1)',  color: '#fbbf24', border: '1px solid rgba(251,191,36,0.22)'  }}>WARN</span>
                <span className="lvl-tag" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.22)' }}>ERR</span>
              </div>
            </div>

            <div className="log-body">
              {logs.map(log => <LogRow key={log.id} log={log} />)}
              <div ref={logEndRef} />
            </div>

            <div className="panel-ft">
              <div className="pdot-sm" />
              <span style={{ fontSize: 10, color: '#505050', letterSpacing: '0.04em' }}>
                {logs.length} events · live stream active
              </span>
            </div>
          </div>

          {/* RIGHT: Chat */}
          <div className="panel chat-panel">

            {/* Chat header */}
            <div className="chat-hd">
              <div className="ai-ico">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#fff" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: '#fff' }}>AuditFlow Assistant</div>
                <div style={{ fontSize: 11, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', boxShadow: '0 0 6px rgba(167,139,250,0.7)', animation: 'pulse-dot 2s infinite' }} />
                  Online · GPT-grade reasoning
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className="hd-btn">⊞ Expand</button>
                <button className="hd-btn">⋯ Options</button>
              </div>
            </div>

            {/* Messages */}
            <div className="messages">
              <div className="msg-spacer" />
              {messages.map(msg => <ChatMessage key={msg.id} msg={msg} />)}
              {isTyping && <TypingRow />}
              <div ref={chatEndRef} />
            </div>

            {/* Chips */}
            <div className="chips">
              {['Summarize recent errors', 'Show WARN events', 'What triggered the retry?'].map(p => (
                <button key={p} className="chip" onClick={() => { prefill(p); send(p); }}>
                  {p}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="input-area">
              <div className="input-shell">
                <textarea
                  ref={textareaRef}
                  className="msg-textarea"
                  rows={1}
                  value={input}
                  placeholder="Ask about logs, anomalies, or anything else…"
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className={`send-btn ${sendActive ? 'active' : 'inactive'}`}
                  onClick={() => send()}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3L12 21M12 3L5 10M12 3L19 10"
                      stroke={sendActive ? '#fff' : '#505050'}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="input-hint">Press Enter to send · Shift+Enter for new line</div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}