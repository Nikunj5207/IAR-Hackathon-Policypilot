import { useState } from "react";

const LP_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lp-root {
    min-height: 100vh;
    font-family: 'DM Sans', system-ui, sans-serif;
    background: #0a1628;
    color: rgba(228,222,212,0.92);
    -webkit-font-smoothing: antialiased;
    display: flex;
    flex-direction: column;
  }

  /* ── NAV ── */
  .lp-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40px;
    height: 60px;
    border-bottom: 1px solid rgba(196,165,116,0.12);
    background: rgba(10,22,40,0.9);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .lp-brand { display: flex; align-items: center; gap: 10px; }
  .lp-brand-name {
    font-family: 'DM Serif Display', serif;
    font-size: 18px;
    color: rgba(228,222,212,0.96);
    letter-spacing: -0.01em;
  }
  .lp-badge {
    font-size: 8px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    color: #c4a574; background: rgba(196,165,116,0.14);
    border: 1px solid rgba(196,165,116,0.3);
    padding: 2px 8px; border-radius: 999px;
  }
  .lp-nav-cta {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 18px; border-radius: 999px;
    border: 1px solid rgba(196,165,116,0.35);
    background: rgba(196,165,116,0.1);
    color: rgba(228,222,212,0.9);
    font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: inherit; transition: all 0.18s;
  }
  .lp-nav-cta:hover { background: rgba(196,165,116,0.2); border-color: #c4a574; }

  /* ── HERO ── */
  .lp-hero {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 80px 24px 60px;
    position: relative;
    overflow: hidden;
  }
  .lp-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(196,165,116,0.08) 0%, transparent 70%),
      radial-gradient(ellipse 60% 40% at 20% 80%, rgba(15,42,68,0.6) 0%, transparent 60%);
    pointer-events: none;
  }
  .lp-emblem {
    width: 76px; height: 76px; border-radius: 50%;
    background: radial-gradient(circle at 38% 32%, rgba(196,165,116,0.25), rgba(15,42,68,0.1));
    border: 1.5px solid rgba(196,165,116,0.35);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 24px;
    animation: lpPulse 3s ease-in-out infinite;
    position: relative; z-index: 1;
  }
  @keyframes lpPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(196,165,116,0.15); }
    50%       { box-shadow: 0 0 0 16px rgba(196,165,116,0); }
  }
  .lp-flag-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 14px; border-radius: 999px;
    border: 1px solid rgba(196,165,116,0.2);
    background: rgba(196,165,116,0.07);
    font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
    color: rgba(196,165,116,0.85); text-transform: uppercase;
    margin-bottom: 22px; position: relative; z-index: 1;
  }
  .lp-h1 {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(32px, 5vw, 54px);
    line-height: 1.15;
    color: rgba(240,236,228,0.97);
    max-width: 680px;
    margin-bottom: 20px;
    position: relative; z-index: 1;
  }
  .lp-h1 em { color: #c4a574; font-style: normal; }
  .lp-sub {
    font-size: 16px; color: rgba(196,185,168,0.75);
    max-width: 500px; line-height: 1.65; margin-bottom: 40px;
    position: relative; z-index: 1;
  }
  .lp-cta-group {
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    position: relative; z-index: 1;
  }
  .lp-google-btn {
    display: flex; align-items: center; justify-content: center; gap: 12px;
    padding: 14px 32px; border-radius: 14px;
    border: none; background: #ffffff;
    color: #1a1a2e; font-size: 15px; font-weight: 700;
    font-family: inherit; cursor: pointer; transition: all 0.2s;
    box-shadow: 0 4px 24px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.12);
    min-width: 280px;
  }
  .lp-google-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
  .lp-google-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
  .lp-guest-btn {
    background: none; border: none; cursor: pointer;
    font-family: inherit; font-size: 13px;
    color: rgba(196,165,116,0.6); font-weight: 500;
    text-decoration: underline; text-underline-offset: 3px;
    transition: color 0.15s;
  }
  .lp-guest-btn:hover { color: rgba(196,165,116,0.9); }
  .lp-trust-line {
    display: flex; align-items: center; gap: 14px;
    margin-top: 6px; font-size: 11px;
    color: rgba(196,185,168,0.45); font-weight: 500;
  }
  .lp-trust-dot { width: 3px; height: 3px; border-radius: 50%; background: currentColor; }

  /* ── STATS ── */
  .lp-stats {
    display: flex; justify-content: center; gap: 0;
    border-top: 1px solid rgba(196,165,116,0.1);
    border-bottom: 1px solid rgba(196,165,116,0.1);
    background: rgba(15,42,68,0.25);
  }
  .lp-stat {
    flex: 1; max-width: 220px; padding: 28px 20px;
    text-align: center;
    border-right: 1px solid rgba(196,165,116,0.1);
  }
  .lp-stat:last-child { border-right: none; }
  .lp-stat-n {
    font-family: 'DM Serif Display', serif;
    font-size: 30px; color: #c4a574; line-height: 1;
    margin-bottom: 6px;
  }
  .lp-stat-l { font-size: 12px; color: rgba(196,185,168,0.55); font-weight: 500; }

  /* ── FEATURES ── */
  .lp-features {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px; padding: 60px 40px;
    max-width: 1000px; margin: 0 auto; width: 100%;
  }
  .lp-feat {
    background: rgba(15,42,68,0.35);
    border: 1px solid rgba(196,165,116,0.1);
    border-radius: 16px; padding: 24px;
    transition: transform 0.2s, border-color 0.2s;
  }
  .lp-feat:hover { transform: translateY(-3px); border-color: rgba(196,165,116,0.25); }
  .lp-feat-ico { font-size: 26px; margin-bottom: 14px; }
  .lp-feat-ttl { font-size: 15px; font-weight: 700; color: rgba(228,222,212,0.95); margin-bottom: 8px; }
  .lp-feat-txt { font-size: 13px; color: rgba(196,185,168,0.6); line-height: 1.6; }

  /* ── FOOTER ── */
  .lp-footer {
    text-align: center; padding: 20px;
    border-top: 1px solid rgba(196,165,116,0.08);
    font-size: 11.5px; color: rgba(196,185,168,0.35); font-weight: 500;
  }

  @keyframes fadeUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }
  .lp-animate { animation: fadeUp 0.5s ease both; }
  .lp-animate-d1 { animation-delay: 0.1s; }
  .lp-animate-d2 { animation-delay: 0.2s; }
  .lp-animate-d3 { animation-delay: 0.3s; }
  .lp-animate-d4 { animation-delay: 0.4s; }
`;

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.08-6.08C34.46 3.39 29.5 1.5 24 1.5 14.82 1.5 7.03 7.1 3.69 15.02l7.09 5.5C12.5 14.47 17.76 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.73H24v8.95h12.42c-.54 2.9-2.18 5.36-4.64 7.04l7.19 5.59C43.18 37.44 46.1 31.44 46.1 24.55z"/>
      <path fill="#FBBC05" d="M10.78 28.52A14.6 14.6 0 019.5 24c0-1.57.27-3.09.76-4.52l-7.09-5.5A22.47 22.47 0 001.5 24c0 3.57.86 6.95 2.37 9.94l6.91-5.42z"/>
      <path fill="#34A853" d="M24 46.5c5.5 0 10.12-1.82 13.48-4.95l-7.19-5.59c-1.82 1.22-4.15 1.94-6.29 1.94-6.24 0-11.5-4.97-13.22-11.38l-6.91 5.42C7.03 40.9 14.82 46.5 24 46.5z"/>
    </svg>
  );
}

function AiOrb({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <defs>
        <radialGradient id="lp-g1" cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#e8d5a3"/>
          <stop offset="55%" stopColor="#c4a574"/>
          <stop offset="100%" stopColor="#8a6d3e"/>
        </radialGradient>
        <filter id="lp-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(196,165,116,0.3)" strokeWidth="1"/>
      <polygon points="20,6 30,13 30,27 20,34 10,27 10,13" fill="none" stroke="rgba(196,165,116,0.45)" strokeWidth="0.8"/>
      <circle cx="20" cy="20" r="9" fill="url(#lp-g1)" filter="url(#lp-glow)"/>
      <circle cx="20" cy="20" r="2.8" fill="rgba(255,252,248,0.9)"/>
    </svg>
  );
}

const FEATURES = [
  { icon: "🔎", title: "AI-Powered Scheme Matching", text: "Describe your situation in plain language — our AI scans 1000+ government schemes and matches you instantly." },
  { icon: "📋", title: "Step-by-Step Checklists", text: "Get a personalised application checklist with exact documents, offices, and deadlines for each scheme you qualify for." },
  { icon: "⚡", title: "Conflict Detection", text: "Automatically detects if two schemes you're applying for have overlapping benefits or conflicting eligibility rules." },
  { icon: "🌐", title: "11 Indian Languages", text: "Ask questions and receive scheme guidance in Hindi, Gujarati, Bengali, Tamil, and 8 more regional languages." },
];

export default function LandingPage({ onGoogleSignIn, onGuest }) {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try { await onGoogleSignIn(); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{LP_CSS}</style>
      <div className="lp-root">

        {/* NAV */}
        <nav className="lp-nav">
          <div className="lp-brand">
            <AiOrb size={28}/>
            <span className="lp-brand-name">PolicyPilot</span>
            <span className="lp-badge">AI Powered</span>
          </div>
          <button className="lp-nav-cta" onClick={handleGoogle} disabled={loading}>
            {loading ? "Signing in…" : "🔐 Sign In"}
          </button>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-emblem"><AiOrb size={40}/></div>

          <div className="lp-flag-pill lp-animate">
            🇮🇳 Government Welfare Scheme Intelligence
          </div>

          <h1 className="lp-h1 lp-animate lp-animate-d1">
            Find Every Government Scheme<br/>
            <em>You Qualify For — Instantly</em>
          </h1>

          <p className="lp-sub lp-animate lp-animate-d2">
            PolicyPilot uses AI to match your profile with 1000+ central and state welfare schemes.
            Get step-by-step guidance in your language — no paperwork confusion.
          </p>

          <div className="lp-cta-group lp-animate lp-animate-d3">
            <button
              id="lp-google-signin"
              className="lp-google-btn"
              onClick={handleGoogle}
              disabled={loading}
            >
              <GoogleIcon/>
              {loading ? "Signing in with Google…" : "Continue with Google"}
            </button>

            <button className="lp-guest-btn" onClick={onGuest}>
              Continue as Guest (no login required)
            </button>

            <div className="lp-trust-line">
              <span>🔒 Data stays on your device</span>
              <span className="lp-trust-dot"/>
              <span>✅ Official government sources</span>
              <span className="lp-trust-dot"/>
              <span>Free to use</span>
            </div>
          </div>
        </section>

        {/* STATS */}
        <div className="lp-stats lp-animate lp-animate-d4">
          {[
            { n: "1000+", l: "Government Schemes Indexed" },
            { n: "11",    l: "Indian Languages Supported" },
            { n: "< 60s", l: "Average Match Time" },
            { n: "100%",  l: "Free, No Hidden Fees" },
          ].map(s => (
            <div key={s.l} className="lp-stat">
              <div className="lp-stat-n">{s.n}</div>
              <div className="lp-stat-l">{s.l}</div>
            </div>
          ))}
        </div>

        {/* FEATURES */}
        <div className="lp-features">
          {FEATURES.map(f => (
            <div key={f.title} className="lp-feat">
              <div className="lp-feat-ico">{f.icon}</div>
              <div className="lp-feat-ttl">{f.title}</div>
              <p className="lp-feat-txt">{f.text}</p>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <footer className="lp-footer">
          © 2025 PolicyPilot · AI-powered welfare guidance for every Indian citizen · Not an official government portal
        </footer>
      </div>
    </>
  );
}
