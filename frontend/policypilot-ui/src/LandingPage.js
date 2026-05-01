import { useState, useEffect, useCallback } from "react";

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

  /* ── HERO SLIDER ── */
  .lp-hero-slider {
    position: relative;
    width: 100%;
    height: 560px;
    overflow: hidden;
    background: #0f2a44;
  }
  @media (max-width: 768px) { .lp-hero-slider { height: 320px; } }

  .lp-slider-track {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .lp-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.8s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    background-size: cover;
    background-position: center;
  }
  .lp-slide.active { opacity: 1; z-index: 1; }

  .lp-slide-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 1;
  }

  .lp-slide-content {
    position: relative;
    z-index: 2;
    max-width: 800px;
    padding: 0 40px;
    text-align: center;
  }

  .lp-slide-badge {
    display: inline-block;
    padding: 6px 16px;
    background: rgba(196,165,116,0.2);
    border: 1px solid #c4a574;
    color: #c4a574;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 20px;
  }

  .lp-slide-title {
    font-family: 'DM Serif Display', serif;
    font-size: 48px;
    color: white;
    margin-bottom: 16px;
    line-height: 1.1;
  }
  @media (max-width: 768px) { .lp-slide-title { font-size: 28px; } }

  .lp-slide-sub {
    font-size: 18px;
    color: rgba(255,255,255,0.85);
    margin-bottom: 30px;
  }
  @media (max-width: 768px) { .lp-slide-sub { font-size: 14px; } }

  .lp-slide-cta {
    padding: 14px 32px;
    background: #c4a574;
    color: #0f2a44;
    border: none;
    border-radius: 4px;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.2s;
  }
  .lp-slide-cta:hover { transform: scale(1.05); }

  .lp-slider-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0,0,0,0.3);
    color: white;
    border: none;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    font-size: 30px;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  .lp-slider-arrow:hover { background: rgba(0,0,0,0.6); }
  .lp-prev { left: 20px; }
  .lp-next { right: 20px; }

  .lp-slider-dots {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
    z-index: 10;
  }
  .lp-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    cursor: pointer;
    transition: all 0.3s;
  }
  .lp-dot.active {
    background: #c4a574;
    transform: scale(1.2);
  }

  .lp-auth-bottom {
    padding: 40px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    background: #0a1628;
  }
  .lp-google-btn-main {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 32px; border-radius: 8px;
    background: white; color: #1a1a1a;
    font-size: 16px; font-weight: 600; cursor: pointer;
    border: 1px solid #ddd; transition: all 0.2s;
  }
  .lp-google-btn-main:hover { background: #f8f8f8; transform: translateY(-1px); }
  .lp-guest-link {
    background: none; border: none; color: #c4a574;
    font-size: 14px; cursor: pointer; text-decoration: underline;
  }

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

const SLIDES = [
  {
    img: "/images/slider/slide1.png",
    badge: "🌾 Agriculture",
    title: "PM Kisan — ₹6,000/year for Farmers",
    sub: "2+ crore farmers already enrolled. Check eligibility in 30 seconds.",
  },
  {
    img: "/images/slider/slide2.png",
    badge: "🏥 Health",
    title: "Ayushman Bharat — ₹5 Lakh Free Health Cover",
    sub: "India's largest health insurance scheme for your family.",
  },
  {
    img: "/images/slider/slide3.png",
    badge: "🎓 Education",
    title: "Scholarships for Every Student",
    sub: "SC/ST/OBC and minority scholarships up to ₹75,000/year.",
  },
  {
    img: "/images/slider/slide4.png",
    badge: "🏠 Housing",
    title: "PM Awas Yojana — Free Pucca House",
    sub: "Subsidised homes for eligible families under PMAY.",
  },
  {
    img: "/images/slider/slide5.png",
    badge: "💼 Business",
    title: "Mudra Loan — ₹10 Lakh Without Collateral",
    sub: "Grow your business with zero collateral government loans.",
  },
];

export default function LandingPage({ onGoogleSignIn, onGuest }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);

  // Preload Images
  useEffect(() => {
    SLIDES.forEach(slide => {
      const img = new Image();
      img.src = slide.img;
    });
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setCurrentSlide((c) => (c + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [paused]);

  const prev = () => setCurrentSlide((c) => (c - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setCurrentSlide((c) => (c + 1) % SLIDES.length);

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
            {loading ? "Signing in…" : "🔐 Login"}
          </button>
        </nav>

        {/* HERO SLIDER */}
        <section 
          className="lp-hero-slider"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="lp-slider-track">
            {SLIDES.map((slide, index) => (
              <div
                key={index}
                className={`lp-slide ${index === currentSlide ? "active" : ""}`}
                style={{ 
                  backgroundImage: `url(${slide.img})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                <div className="lp-slide-overlay" />
                <div className="lp-slide-content">
                  <div className="lp-slide-badge">{slide.badge}</div>
                  <h2 className="lp-slide-title">{slide.title}</h2>
                  <p className="lp-slide-sub">{slide.sub}</p>
                  <button className="lp-slide-cta" onClick={handleGoogle}>
                    Check My Eligibility →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <button className="lp-slider-arrow lp-prev" onClick={prev}>‹</button>
          <button className="lp-slider-arrow lp-next" onClick={next}>›</button>

          {/* Indicators */}
          <div className="lp-slider-dots">
            {SLIDES.map((_, i) => (
              <div 
                key={i} 
                className={`lp-dot ${i === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(i)}
              />
            ))}
          </div>
        </section>

        {/* AUTH CONTROLS BELOW SLIDER */}
        <div className="lp-auth-bottom">
          <button
            className="lp-google-btn-main"
            onClick={handleGoogle}
            disabled={loading}
          >
            <GoogleIcon/>
            {loading ? "Signing in…" : "Sign in with Google"}
          </button>
          <button className="lp-guest-link" onClick={onGuest}>
            Continue as Guest (no login required)
          </button>
        </div>

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
