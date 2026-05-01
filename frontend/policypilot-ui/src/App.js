import { useState, useRef, useEffect, useCallback } from "react";
import { auth } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import LandingPage from "./LandingPage";
import { useAuth } from "./contexts/AuthContext";

/* ═══════════════════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════════════════ */
const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
console.log("🔍 API_BASE value:", API_BASE || "❌ EMPTY - env var missing!");
const API_TIMEOUT_MS = 90000; // 90s — AI + RAG can take 30-60s on Render free tier

/* ═══════════════════════════════════════════════════════════════
   TRANSLATIONS
═══════════════════════════════════════════════════════════════ */
const TRANSLATIONS = {
  en: {
    appTitle: "Eligibility Assistant",
    newChat: "New Chat",
    searchPlaceholder: "Search chats…",
    recentChats: "Recent Chats",
    browseSchemes: "Browse Schemes",
    citizenProfile: "Citizen Profile Form",
    inputPlaceholder: "Describe your situation in simple language…",
    sendLabel: "Send",
    voiceLabel: "Voice",
    uploadLabel: "Upload",
    stopListening: "Stop",
    listening: "● Listening…",
    micDenied: "Microphone access required",
    micUnsupported: "Voice not supported in this browser",
    matchedSchemes: "Matched Schemes",
    found: "found",
    schemeResultsHint: "Scheme results will appear here once you describe your situation in the chat.",
    disclaimer: "PolicyPilot uses AI to suggest schemes. Always verify eligibility at official government portals.",
    emptyTitle: "Namaste! I'm PolicyPilot",
    emptySub: "Tell me about your situation and I'll guide you through the government schemes you qualify for — in any language.",
    saveProfile: "Save & Find Schemes",
    uploadMoreDocs: "Upload more docs",
    language: "Language",
    uploadedPrefix: "Uploaded:",
    profileTitle: "Citizen Profile",
    profileDesc: "Fill in your details to receive personalised scheme recommendations. All data stays on your device.",
    personalInfo: "Personal Information",
    economicProfile: "Economic Profile",
    location: "Location",
    documents: "Documents",
    schemeInterest: "Scheme Interest",
    noChatsYet: "No chats yet",
    loadingChats: "Loading…",
    deletingChat: "Deleting…",
  },
  hi: {
    appTitle: "पात्रता सहायक", newChat: "नई चैट", searchPlaceholder: "चैट खोजें…", recentChats: "हाल की चैट",
    browseSchemes: "योजनाएं देखें", citizenProfile: "नागरिक प्रोफाइल फॉर्म", inputPlaceholder: "अपनी स्थिति सरल भाषा में बताएं…",
    sendLabel: "भेजें", voiceLabel: "आवाज़", uploadLabel: "अपलोड", stopListening: "रोकें", listening: "● सुन रहा है…",
    micDenied: "माइक्रोफ़ोन एक्सेस आवश्यक है", micUnsupported: "इस ब्राउज़र में वॉइस समर्थित नहीं",
    matchedSchemes: "मिली योजनाएं", found: "मिली", schemeResultsHint: "चैट में अपनी स्थिति बताने के बाद यहाँ योजना परिणाम दिखेंगे।",
    disclaimer: "PolicyPilot योजनाएं सुझाने के लिए AI का उपयोग करता है।", emptyTitle: "नमस्ते! मैं PolicyPilot हूँ",
    emptySub: "अपनी स्थिति बताएं और मैं आपको उन सरकारी योजनाओं के बारे में बताऊंगा जिनके आप पात्र हैं।",
    saveProfile: "सहेजें और योजनाएं खोजें", uploadMoreDocs: "और दस्तावेज़ अपलोड करें", language: "भाषा",
    uploadedPrefix: "अपलोड किया:", profileTitle: "नागरिक प्रोफाइल",
    profileDesc: "व्यक्तिगत योजना सुझाव पाने के लिए अपनी जानकारी भरें।",
    personalInfo: "व्यक्तिगत जानकारी", economicProfile: "आर्थिक प्रोफाइल", location: "स्थान", documents: "दस्तावेज़", schemeInterest: "योजना रुचि",
    noChatsYet: "अभी कोई चैट नहीं", loadingChats: "लोड हो रहा है…", deletingChat: "हटाया जा रहा है…",
  },
  gu: {
    appTitle: "પાત્રતા સહાયક", newChat: "નવી ચેટ", searchPlaceholder: "ચેટ શોધો…", recentChats: "તાજેતરની ચેટ",
    browseSchemes: "યોજનાઓ જુઓ", citizenProfile: "નાગરિક પ્રોફાઇલ ફોર્મ", inputPlaceholder: "તમારી પરિસ્થિતિ સરળ ભાષામાં જણાવો…",
    sendLabel: "મોકલો", voiceLabel: "અવાજ", uploadLabel: "અપલોડ", stopListening: "અટકો", listening: "● સાંભળી રહ્યો છું…",
    micDenied: "માઇક્રોફોન ઍક્સેસ જરૂરી છે", micUnsupported: "આ બ્રાઉઝરમાં વૉઇસ સપોર્ટ નથી",
    matchedSchemes: "મળેલી યોજનાઓ", found: "મળ્યા", schemeResultsHint: "ચેટમાં પરિસ્થિતિ જણાવ્યા બાદ અહીં યોજના પરિણામો દેખાશે.",
    disclaimer: "PolicyPilot યોજનાઓ સૂચવવા AI નો ઉપયોગ કરે છે.", emptyTitle: "નમસ્તે! હું PolicyPilot છું",
    emptySub: "તમારી પરિસ્થિતિ જણાવો અને હું તમને પાત્ર સરકારી યોજનાઓ વિશે માર્ગદર્શન આપીશ.",
    saveProfile: "સાચવો અને યોજનાઓ શોધો", uploadMoreDocs: "વધુ દસ્તાવેજ અપલોડ કરો", language: "ભાષા",
    uploadedPrefix: "અપલોડ થયું:", profileTitle: "નાગરિક પ્રોફાઇલ", profileDesc: "વ્યક્તિગત યોજના ભલામણો માટે તમારી વિગતો ભરો.",
    personalInfo: "વ્યક્તિગત માહિતી", economicProfile: "આર્થિક પ્રોફાઇલ", location: "સ્થાન", documents: "દસ્તાવેજો", schemeInterest: "યોજના રુચિ",
    noChatsYet: "હજી કોઈ ચેટ નથી", loadingChats: "લોડ થઈ રહ્યું છે…", deletingChat: "કાઢી રહ્યો છે…",
  },
};
["bn","te","mr","ta","kn","ml","or","pa","as"].forEach(code => {
  TRANSLATIONS[code] = { ...TRANSLATIONS.en };
});

function useT(lang) {
  return useCallback((key) => {
    const map = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return map[key] ?? (TRANSLATIONS.en[key] ?? key);
  }, [lang]);
}

/* ═══════════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --left-w:   260px;
    --right-w:  310px;
    --header-h: 52px;
    --announce-h: 32px;
    --bg-app:           #F7F3EB;
    --surface-card:     #ffffff;
    --surface-elevated: #faf8f5;
    --sidebar-bg:       #0F2A44;
    --sidebar-border:   rgba(255,255,255,0.07);
    --right-bg:         #f7f5f0;
    --right-border:     rgba(58,52,46,0.09);
    --gold:             #c4a574;
    --gold-dim:         #a8874e;
    --gold-light:       rgba(196,165,116,0.14);
    --gold-border:      rgba(196,165,116,0.32);
    --navy:             #0F2A44;
    --navy-mid:         #1a3d5c;
    --navy-light:       rgba(15,42,68,0.08);
    --text:             #26211c;
    --text-muted:       #7a7068;
    --text-sidebar:     rgba(228,222,212,0.82);
    --text-xs:          rgba(122,112,104,0.7);
    --border:           rgba(58,52,46,0.09);
    --border-strong:    rgba(58,52,46,0.15);
    --shadow-sm:  0 1px 3px rgba(58,52,46,0.07);
    --shadow-md:  0 3px 12px rgba(58,52,46,0.09), 0 1px 3px rgba(58,52,46,0.05);
    --shadow-lg:  0 8px 32px rgba(58,52,46,0.12), 0 2px 8px rgba(58,52,46,0.06);
    --ring-gold:  0 0 0 3px rgba(196,165,116,0.16);
    --r-sm:  8px; --r-md:  12px; --r-lg:  16px; --r-pill:999px;
  }

  html, body, #root {
    height: 100%; font-family: 'DM Sans', system-ui, sans-serif;
    background: var(--bg-app); color: var(--text); -webkit-font-smoothing: antialiased;
  }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(58,52,46,0.18); border-radius: 4px; }

  .app { display:flex; flex-direction:column; height:100vh; overflow:hidden; }

  .announce-bar {
    height: var(--announce-h);
    background: linear-gradient(90deg, #0a1f33 0%, #0F2A44 40%, #1a3d5c 70%, #0a1f33 100%);
    display: flex; align-items: center; overflow: hidden; flex-shrink: 0;
    border-bottom: 1px solid rgba(196,165,116,0.2); position: relative;
  }
  .announce-emblem {
    display: flex; align-items: center; padding: 0 10px;
    border-right: 1px solid rgba(196,165,116,0.2);
    flex-shrink: 0; z-index: 2; background: #0a1f33; height: 100%;
  }
  .announce-emblem img { width: 18px; height: 18px; object-fit: contain; filter: brightness(1.2); }
  .announce-track-wrap {
    flex: 1; overflow: hidden; position: relative;
    mask-image: linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%);
  }
  .announce-track { display: flex; align-items: center; white-space: nowrap; animation: marquee 28s linear infinite; }
  .announce-text { font-size: 11px; font-weight: 600; letter-spacing: 0.05em; color: rgba(228,222,212,0.9); padding: 0 60px; }
  .announce-flag { font-size: 13px; margin-right: 6px; }
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

  .hdr {
    height: var(--header-h); background: var(--navy);
    border-bottom: 1px solid rgba(196,165,116,0.18); flex-shrink:0; z-index:100;
    box-shadow: 0 2px 16px rgba(15,42,68,0.35);
  }
  .hdr-in { height:100%; display:flex; align-items:center; justify-content:space-between; padding:0 18px; }
  .hdr-l, .hdr-r { display:flex; align-items:center; gap:10px; }
  .hdr-title-wrap { display: flex; flex-direction: column; gap: 1px; }
  .hdr-title { font-size:13.5px; font-weight:600; color: rgba(228,222,212,0.96); letter-spacing:-0.01em; }
  .hdr-motto { font-size: 9px; color: rgba(196,165,116,0.65); letter-spacing: 0.04em; font-weight: 400; }
  .ai-badge {
    font-size:8.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase;
    color:var(--gold); background:rgba(196,165,116,0.15); border:1px solid var(--gold-border);
    padding:2px 7px; border-radius:var(--r-pill);
  }
  .lang-wrap { display:flex; align-items:center; gap:6px; }
  .lang-lbl  { font-size:11px; color:rgba(196,165,116,0.7); font-weight:500; }
  .lang-sel  {
    font-size:12px; font-weight:500; color:rgba(228,222,212,0.9);
    background:rgba(255,255,255,0.08); border:1px solid rgba(196,165,116,0.28);
    border-radius:var(--r-sm); padding:4px 8px; font-family:inherit; cursor:pointer; outline:none;
  }
  .lang-sel option { background: #0F2A44; color: rgba(228,222,212,0.9); }

  .theme-toggle {
    width: 32px; height: 32px; border-radius: var(--r-sm); border: 1px solid rgba(196,165,116,0.28);
    background: rgba(255,255,255,0.07); color: rgba(196,165,116,0.8); cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all 0.18s; font-size: 14px;
  }
  .theme-toggle:hover { background: rgba(196,165,116,0.15); color: var(--gold); }

  /* ── AUTH ── */
  .auth-btn-hdr {
    display: flex; align-items: center; gap: 6px; padding: 5px 12px;
    border-radius: var(--r-pill); border: 1px solid rgba(196,165,116,0.35);
    background: rgba(196,165,116,0.1); color: rgba(228,222,212,0.9);
    font-size: 11.5px; font-weight: 600; cursor: pointer; font-family: inherit;
    transition: all 0.18s;
  }
  .auth-btn-hdr:hover { background: rgba(196,165,116,0.2); border-color: var(--gold); }

  .auth-avatar {
    width: 28px; height: 28px; border-radius: 50%; background: var(--gold);
    color: var(--navy); font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    cursor: pointer; border: 1.5px solid rgba(196,165,116,0.5);
    background-size: cover; background-position: center; overflow: hidden;
    position: relative;
  }
  .auth-dropdown {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: var(--surface-card); border: 1px solid var(--border-strong);
    border-radius: var(--r-md); min-width: 180px; box-shadow: var(--shadow-lg);
    z-index: 200; overflow: hidden; animation: fadeUp 0.15s ease both;
  }
  .auth-dropdown-name {
    padding: 10px 13px 6px; font-size: 12px; font-weight: 600; color: var(--text);
    border-bottom: 1px solid var(--border);
  }
  .auth-dropdown-email { font-size: 10px; color: var(--text-muted); font-weight: 400; margin-top: 2px; }
  .auth-dropdown-item {
    display: flex; align-items: center; gap: 8px; padding: 9px 13px;
    font-size: 12.5px; color: var(--text); cursor: pointer; transition: background 0.13s;
    border: none; background: transparent; width: 100%; font-family: inherit; text-align: left;
  }
  .auth-dropdown-item:hover { background: var(--bg-app); }
  .auth-dropdown-item.danger { color: #c0392b; }

  .app-body { display:flex; flex:1; overflow:hidden; }

  .sidebar {
    width:var(--left-w); flex-shrink:0; background:var(--sidebar-bg);
    display:flex; flex-direction:column; height:100%; overflow:hidden;
    border-right:1px solid var(--sidebar-border); position:relative; z-index:10;
    transition: width 0.25s cubic-bezier(0.22,1,0.36,1);
  }
  .sidebar.collapsed { width: 0; overflow: hidden; }
  .sb-brand { display:flex; align-items:center; justify-content:space-between; gap:9px; padding:14px 14px 10px; border-bottom:1px solid rgba(255,255,255,0.06); }
  .sb-brand-l { display:flex; align-items:center; gap:9px; }
  .sb-name { font-family:'DM Serif Display',serif; font-size:15px; color:rgba(228,222,212,0.96); letter-spacing:-0.01em; }
  .sb-tag  { font-size:9px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; color:rgba(196,165,116,0.55); line-height:1; }
  .new-chat-btn {
    margin:10px 10px 6px; padding:9px 13px; border-radius:var(--r-md);
    border:1px solid rgba(196,165,116,0.3); background:rgba(196,165,116,0.09);
    color:var(--gold); font-size:12px; font-weight:600; font-family:inherit;
    cursor:pointer; transition:all 0.18s; letter-spacing:0.02em;
    display:flex; align-items:center; justify-content:center; gap:6px;
  }
  .new-chat-btn:hover { background:rgba(196,165,116,0.17); border-color:rgba(196,165,116,0.52); }
  .sb-search { padding:0 10px 6px; }
  .sb-search-wrap { position:relative; display:flex; align-items:center; }
  .sb-search-icon { position:absolute; left:9px; pointer-events:none; opacity:0.38; }
  .sb-search-inp {
    width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.07);
    border-radius:var(--r-sm); padding:7px 10px 7px 29px;
    color:var(--text-sidebar); font-size:12px; font-family:inherit; outline:none;
  }
  .sb-search-inp::placeholder { color:rgba(225,233,246,0.22); }
  .sb-div { height:1px; background:rgba(255,255,255,0.055); margin:3px 10px; }
  .sb-scroll { flex:1; overflow-y:auto; padding:0 6px 6px; }
  .sb-lbl { font-size:9px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:rgba(255,255,255,0.22); padding:8px 8px 4px; }
  .hist-list { list-style:none; }
  .hist-btn {
    display:flex; align-items:center; justify-content:space-between; gap:6px; width:100%; padding:7px 10px; border-radius:var(--r-sm);
    border:none; background:transparent; cursor:pointer; transition:background 0.14s; color:var(--text-sidebar); font-family:inherit;
  }
  .hist-btn:hover  { background:rgba(255,255,255,0.065); }
  .hist-btn.active { background:rgba(196,165,116,0.15); color:var(--gold); }
  .hist-ttl { font-size:12px; font-weight:500; text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:150px; }
  .hist-meta { font-size:10px; color:rgba(255,255,255,0.24); flex-shrink:0; }
  .hist-del {
    width:18px; height:18px; border-radius:4px; border:none; background:transparent;
    color:rgba(255,255,255,0.25); cursor:pointer; display:flex; align-items:center;
    justify-content:center; font-size:13px; flex-shrink:0; opacity:0; transition:opacity 0.15s, color 0.15s; line-height:1;
  }
  .hist-btn:hover .hist-del { opacity:1; }
  .hist-del:hover { color:#e57373 !important; background:rgba(255,80,80,0.12) !important; }
  .scheme-nav-btn {
    display:flex; align-items:center; gap:8px; width:100%; padding:7px 10px;
    border-radius:var(--r-sm); border:none; background:transparent; cursor:pointer;
    transition:background 0.14s; color:rgba(228,222,212,0.65); font-family:inherit; text-align:left;
  }
  .scheme-nav-btn:hover  { background:rgba(255,255,255,0.06); color:rgba(228,222,212,0.9); }
  .scheme-nav-btn.active { background:rgba(196,165,116,0.13); color:var(--gold); }
  .sn-dot  { width:7px; height:7px; border-radius:50%; flex-shrink:0; opacity:0.8; }
  .sn-name { font-size:12px; font-weight:500; }
  .sn-cat  { font-size:10px; color:rgba(255,255,255,0.24); margin-left:auto; flex-shrink:0; }
  .sb-footer { padding:10px; border-top:1px solid rgba(255,255,255,0.06); flex-shrink:0; }
  .profile-btn {
    width:100%; padding:9px 12px; border-radius:var(--r-md);
    border:1px solid rgba(255,255,255,0.10); background:rgba(255,255,255,0.04);
    color:rgba(228,222,212,0.62); font-size:12px; font-weight:500; font-family:inherit;
    cursor:pointer; transition:all 0.18s; display:flex; align-items:center; justify-content:center; gap:6px;
  }
  .profile-btn:hover { background:rgba(255,255,255,0.09); color:rgba(228,222,212,0.92); }
  .sidebar-toggle {
    display:flex; align-items:center; justify-content:center;
    width:28px; height:28px; border-radius:50%; background:transparent;
    border:1.5px solid rgba(196,165,116,0.28); cursor:pointer;
    color:rgba(196,165,116,0.75); font-size:13px; transition:all 0.18s; flex-shrink:0;
  }
  .sidebar-toggle:hover { background:rgba(196,165,116,0.15); color:var(--gold); }
  .sidebar-open-btn {
    position:absolute; left:10px; top:10px; z-index:30;
    width:32px; height:32px; border-radius:50%; background:var(--navy);
    border:1.5px solid rgba(196,165,116,0.4); cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    color:var(--gold); font-size:13px; transition:all 0.18s; box-shadow:var(--shadow-md);
  }

  .step-tracker { display:flex; align-items:center; gap:0; padding:10px 22px 0; flex-shrink:0; }
  .step-item { display:flex; align-items:center; gap:6px; flex:1; }
  .step-item:last-child { flex:0; }
  .step-circle { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; transition:all 0.3s; border:2px solid transparent; }
  .step-circle.done   { background:#2d6a4f; color:white; border-color:#2d6a4f; }
  .step-circle.active { background:var(--navy); color:rgba(228,222,212,0.95); border-color:var(--navy); box-shadow:0 0 0 3px rgba(15,42,68,0.15); }
  .step-circle.pending { background:#E8DFC9; color:var(--text-muted); border-color:rgba(58,52,46,0.15); }
  .step-label { font-size:10px; font-weight:600; letter-spacing:0.03em; white-space:nowrap; }
  .step-label.done   { color:#2d6a4f; }
  .step-label.active { color:var(--navy); }
  .step-label.pending { color:var(--text-muted); }
  .step-connector { flex:1; height:2px; margin:0 6px; border-radius:1px; transition:background 0.3s; }
  .step-connector.done    { background:#2d6a4f; }
  .step-connector.pending { background:rgba(58,52,46,0.12); }

  .chat-canvas {
    flex:1; overflow-y:auto;
    background:linear-gradient(168deg,#F7F3EB 0%,#ece7db 100%); position:relative;
    display:flex; flex-direction:column;
  }
  .canvas-in { position:relative; z-index:1; max-width:680px; margin:0 auto; padding:28px 22px 0; display:flex; flex-direction:column; min-height:100%; width:100%; }
  .msgs-col { display:flex; flex-direction:column; gap:24px; flex:1; }
  .turn { display:flex; gap:10px; }
  .ai-turn   { align-items:flex-start; }
  .user-turn { justify-content:flex-end; }
  .turn-av { width:28px; height:28px; border-radius:50%; background:rgba(15,42,68,0.1); border:1px solid rgba(15,42,68,0.2); display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:4px; }
  .turn-av-dot { width:8px; height:8px; border-radius:50%; background:var(--navy); }
  .turn-body { display:flex; flex-direction:column; gap:5px; max-width:600px; }
  .turn-meta { display:flex; align-items:center; gap:6px; }
  .user-meta { justify-content:flex-end; }
  .turn-name { font-size:12px; font-weight:650; color:var(--text); }
  .turn-time { font-size:10.5px; color:var(--text-muted); }
  .ai-card { background:var(--surface-card); border:1px solid var(--border); border-left:3px solid rgba(15,42,68,0.35); border-radius:var(--r-lg); padding:17px 19px; box-shadow:var(--shadow-md); animation:fadeUp 0.3s ease both; }
  .ai-txt { font-size:13.5px; color:var(--text); line-height:1.68; }
  .ai-steps { margin:10px 0 0; display:flex; flex-direction:column; gap:7px; }
  .ai-step  { display:flex; align-items:flex-start; gap:9px; font-size:13px; color:var(--text); line-height:1.55; }
  .ai-step-n { width:20px; height:20px; border-radius:50%; background:rgba(15,42,68,0.08); border:1px solid rgba(15,42,68,0.2); color:var(--navy); font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
  .user-bubble { background:linear-gradient(135deg,#0F2A44 0%,#1a3d5c 100%); color:rgba(240,236,228,0.95); padding:12px 17px; border-radius:14px 14px 3px 14px; font-size:13.5px; line-height:1.6; box-shadow:0 2px 10px rgba(15,42,68,0.28); max-width:480px; animation:fadeUp 0.25s ease both; }
  .quick-chips { display:flex; flex-wrap:wrap; gap:7px; margin-top:13px; }
  .chip { padding:6px 13px; border-radius:var(--r-pill); border:1px solid var(--border-strong); background:var(--bg-app); color:var(--text-muted); font-size:12px; font-weight:500; font-family:inherit; cursor:pointer; transition:all 0.18s; }
  .chip:hover { background:rgba(15,42,68,0.07); border-color:rgba(15,42,68,0.2); color:var(--navy); }
  .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; gap:14px; padding:40px 20px; text-align:center; animation:fadeUp 0.4s ease both; }
  .empty-orb { width:64px; height:64px; border-radius:50%; background:radial-gradient(circle at 38% 32%,rgba(15,42,68,0.15),rgba(15,42,68,0.04)); border:1.5px solid rgba(15,42,68,0.2); display:flex; align-items:center; justify-content:center; }
  .empty-ttl { font-family:'DM Serif Display',serif; font-size:22px; color:var(--text); line-height:1.2; }
  .empty-sub { font-size:13px; color:var(--text-muted); max-width:310px; line-height:1.6; }
  .find-schemes-cta { display:flex; align-items:center; justify-content:center; gap:8px; padding:12px 32px; border-radius:12px; border:none; background:var(--navy); color:rgba(228,222,212,0.95); font-size:14px; font-weight:700; font-family:inherit; cursor:pointer; box-shadow:0 4px 16px rgba(15,42,68,0.3); transition:all 0.2s; margin-top:6px; }
  .find-schemes-cta:hover { background:#1a3d5c; transform:translateY(-2px); }

  .ai-thinking { background:var(--surface-card); border:1px solid var(--border); border-left:3px solid rgba(15,42,68,0.35); border-radius:var(--r-lg); padding:17px 19px; box-shadow:var(--shadow-md); display:flex; flex-direction:column; gap:10px; }
  .thinking-msg { font-size:12.5px; color:var(--navy); font-weight:500; display:flex; align-items:center; gap:8px; animation:fadeIn 0.35s ease both; }
  .thinking-emoji { font-size:15px; }
  .shimmer-lines { display:flex; flex-direction:column; gap:7px; margin-top:4px; }
  .shimmer-line { height:11px; border-radius:6px; background:linear-gradient(90deg,rgba(15,42,68,0.06) 0%,rgba(15,42,68,0.12) 50%,rgba(15,42,68,0.06) 100%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
  @keyframes shimmer { 0%{background-position:200% 0}100%{background-position:-200% 0} }

  .error-panel { background:#fdf6f0; border:1px solid rgba(181,85,10,0.25); border-radius:var(--r-lg); padding:14px 16px; display:flex; align-items:flex-start; gap:10px; animation:fadeUp 0.3s ease both; }
  .error-icon { font-size:18px; flex-shrink:0; margin-top:1px; }
  .error-msg { font-size:13px; color:#7a3d10; font-weight:500; line-height:1.5; }
  .error-retry { margin-top:8px; padding:5px 14px; border-radius:8px; border:1px solid rgba(181,85,10,0.3); background:transparent; color:#7a3d10; font-size:11.5px; font-weight:600; font-family:inherit; cursor:pointer; transition:all 0.18s; }
  .error-retry:hover { background:rgba(181,85,10,0.08); }

  .input-shell { position:sticky; bottom:0; padding:14px 0 10px; background:linear-gradient(to top,rgba(235,229,218,1) 55%,transparent); z-index:20; }
  .input-box { display:flex; align-items:center; gap:4px; background:var(--surface-card); border:1px solid var(--border-strong); border-radius:14px; padding:5px 7px; box-shadow:var(--shadow-lg); transition:box-shadow 0.2s,border-color 0.2s; }
  .input-box:focus-within { border-color:rgba(15,42,68,0.3); box-shadow:var(--shadow-lg),0 0 0 3px rgba(15,42,68,0.1); }
  .input-tools { display:flex; align-items:center; gap:2px; }
  .itool { width:33px; height:33px; border-radius:var(--r-sm); border:none; background:transparent; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.14s,color 0.14s; }
  .itool:hover { background:var(--bg-app); color:var(--text); }
  .itool.listening { background:rgba(220,50,50,0.08); color:#c0392b; animation:micPulse 1.2s ease-in-out infinite; }
  @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,0.35)}50%{box-shadow:0 0 0 6px rgba(192,57,43,0)} }
  .ifield { flex:1; border:none; outline:none; background:transparent; font-family:inherit; font-size:13.5px; color:var(--text); padding:6px 8px; }
  .ifield::placeholder { color:var(--text-muted); }
  .isend { width:35px; height:35px; border-radius:var(--r-sm); border:none; background:var(--navy); color:var(--gold); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s,transform 0.15s; }
  .isend:hover { background:#1a3d5c; transform:scale(1.04); }
  .listen-pill { text-align:center; font-size:11.5px; color:#c0392b; font-weight:500; margin-top:5px; }
  .mic-error   { text-align:center; font-size:11.5px; color:#c0392b; font-weight:500; margin-top:5px; }
  .chat-note   { text-align:center; font-size:10.5px; color:var(--text-xs); padding:8px 0 14px; }
  .chat-upload-preview { display:flex; align-items:center; gap:6px; padding:5px 10px; background:rgba(15,42,68,0.06); border:1px solid rgba(15,42,68,0.15); border-radius:var(--r-sm); margin:3px 0; font-size:11.5px; color:var(--navy); font-weight:500; animation:fadeIn 0.2s ease; }
  .chat-upload-preview span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px; }

  .right-panel { width:var(--right-w); flex-shrink:0; background:var(--right-bg); border-left:1px solid var(--right-border); display:flex; flex-direction:column; height:100%; overflow:hidden; }
  .rp-hdr { padding:13px 15px 11px; border-bottom:1px solid var(--right-border); display:flex; align-items:center; justify-content:space-between; flex-shrink:0; background:var(--surface-elevated); }
  .rp-hdr-l { display:flex; align-items:center; gap:7px; }
  .rp-ttl { font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--text-muted); }
  .rp-count { font-size:10px; font-weight:700; background:rgba(15,42,68,0.08); color:var(--navy); border:1px solid rgba(15,42,68,0.18); padding:2px 8px; border-radius:var(--r-pill); }
  .rp-scroll { flex:1; overflow-y:auto; padding:13px 11px; display:flex; flex-direction:column; gap:11px; }
  .rp-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:10px; text-align:center; padding:24px; color:var(--text-muted); }
  .rp-empty-ico { width:48px; height:48px; border-radius:50%; background:rgba(58,52,46,0.05); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:20px; }
  .rp-empty-txt { font-size:12.5px; line-height:1.55; max-width:195px; }
  .rp-loading { display:flex; align-items:center; justify-content:center; padding:32px; color:var(--text-muted); font-size:12.5px; gap:8px; }

  .rc { background:var(--surface-card); border:1px solid var(--border); border-radius:13px; padding:13px 14px; box-shadow:var(--shadow-sm); transition:box-shadow 0.2s,transform 0.2s,opacity 0.4s; opacity:0; transform:translateY(10px); }
  .rc.visible { opacity:1; transform:translateY(0); animation:cardReveal 0.35s cubic-bezier(0.22,1,0.36,1) both; }
  @keyframes cardReveal { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  .rc:hover { box-shadow:var(--shadow-md); transform:translateY(-2px); }
  .rc-top { display:flex; align-items:flex-start; justify-content:space-between; gap:6px; margin-bottom:7px; }
  .rc-tag { font-size:9.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:2px 8px; border-radius:var(--r-pill); flex-shrink:0; }
  .rc-draft { font-size:9px; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#1d6fa4; background:rgba(29,111,164,0.09); border:1px solid rgba(29,111,164,0.2); padding:2px 7px; border-radius:var(--r-pill); white-space:nowrap; flex-shrink:0; }
  .rc-ttl { font-size:13px; font-weight:650; color:var(--text); line-height:1.3; margin-bottom:5px; }
  .rc-rsn { font-size:11.5px; color:var(--text-muted); line-height:1.5; margin-bottom:7px; }
  .rc-match { display:flex; align-items:center; gap:5px; margin-bottom:7px; }
  .rc-match-bar { flex:1; height:5px; border-radius:3px; background:rgba(58,52,46,0.08); overflow:hidden; }
  .rc-match-fill { height:100%; border-radius:3px; transition:width 0.6s ease; }
  .rc-match-pct { font-size:10px; font-weight:700; flex-shrink:0; }
  .rc-buls { display:flex; flex-direction:column; gap:4px; margin-bottom:10px; }
  .rc-bul  { display:flex; align-items:flex-start; gap:7px; font-size:11.5px; color:var(--text); line-height:1.45; }
  .rc-dot  { width:5px; height:5px; border-radius:50%; flex-shrink:0; margin-top:5px; opacity:0.7; }
  .rc-cta { width:100%; padding:7px 10px; border-radius:8px; border:1px solid rgba(15,42,68,0.18); background:rgba(15,42,68,0.05); color:var(--navy); font-size:11.5px; font-weight:600; font-family:inherit; cursor:pointer; transition:all 0.18s; text-align:center; }
  .rc-cta:hover { background:rgba(15,42,68,0.1); border-color:rgba(15,42,68,0.3); }
  .explain-toggle { display:flex; align-items:center; gap:6px; width:100%; padding:6px 0; background:none; border:none; cursor:pointer; color:var(--navy); font-size:11px; font-weight:600; font-family:inherit; letter-spacing:0.02em; margin-bottom:6px; }
  .explain-chevron { transition:transform 0.22s; font-size:10px; }
  .explain-chevron.open { transform:rotate(90deg); }
  .explain-panel { overflow:hidden; transition:max-height 0.3s ease,opacity 0.3s ease; max-height:0; opacity:0; }
  .explain-panel.open { max-height:200px; opacity:1; }
  .explain-inner { background:#E8DFC9; border-radius:9px; padding:10px 12px; display:flex; flex-direction:column; gap:6px; margin-bottom:8px; }
  .explain-row { display:flex; align-items:center; gap:7px; font-size:11px; color:var(--text); }
  .explain-tick { color:#2d6a4f; font-size:11px; flex-shrink:0; }
  .explain-ai-badge { display:flex; align-items:center; gap:4px; padding:2px 7px; background:rgba(15,42,68,0.08); border-radius:var(--r-pill); font-size:9px; font-weight:700; color:var(--navy); letter-spacing:0.05em; margin-bottom:6px; width:fit-content; }

  .overlay { position:fixed; inset:0; background:rgba(26,23,20,0.42); backdrop-filter:blur(3px); z-index:300; cursor:pointer; animation:fadeIn 0.2s ease; }
  .sheet { position:fixed; right:0; top:0; bottom:0; width:480px; max-width:95vw; background:var(--surface-elevated); z-index:400; transform:translateX(100%); transition:transform 0.3s cubic-bezier(0.22,1,0.36,1); display:flex; flex-direction:column; box-shadow:-8px 0 48px rgba(26,23,20,0.16); }
  .sheet.open { transform:translateX(0); }
  .sheet-inner { flex:1; overflow-y:auto; padding:0 0 20px; display:flex; flex-direction:column; }
  .sheet-head { display:flex; align-items:center; justify-content:space-between; padding:18px 22px 14px; background:var(--navy); border-bottom:1px solid rgba(255,255,255,0.06); flex-shrink:0; }
  .sheet-head-l { display:flex; align-items:center; gap:10px; }
  .sheet-head h2 { font-family:'DM Serif Display',serif; font-size:17px; color:rgba(228,222,212,0.96); margin:0; }
  .sheet-cls { width:30px; height:30px; border-radius:var(--r-sm); border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.06); color:rgba(228,222,212,0.65); font-size:17px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background 0.15s; }
  .sheet-cls:hover { background:rgba(255,255,255,0.13); color:white; }
  .sheet-desc { font-size:12.5px; color:var(--text-muted); line-height:1.55; padding:14px 22px 6px; }
  .form-stack { display:flex; flex-direction:column; gap:12px; padding:12px 22px 4px; }
  .fsec { border-radius:13px; border:1.5px solid var(--border); overflow:hidden; }
  .fsec-hd { display:flex; align-items:center; gap:8px; padding:10px 14px 9px; border-bottom:1px solid var(--border); background:rgba(255,255,255,0.5); }
  .fsec-ico { width:24px; height:24px; border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0; }
  .fsec-lbl { font-size:10px; font-weight:700; letter-spacing:0.09em; text-transform:uppercase; }
  .fsec-body { padding:12px 14px 14px; display:flex; flex-direction:column; gap:11px; }
  .fld { display:flex; flex-direction:column; gap:4px; }
  .fld-lbl { font-size:11px; font-weight:600; color:var(--text-muted); letter-spacing:0.03em; }
  .fld-req { color:#c0392b; font-size:9px; margin-left:3px; }
  .fld-hint { font-size:10px; color:var(--text-xs); margin-top:2px; display:flex; align-items:center; gap:4px; }
  .pill-toggle-group { display:flex; gap:6px; flex-wrap:wrap; }
  .pill-toggle { padding:6px 14px; border-radius:var(--r-pill); border:1.5px solid rgba(58,52,46,0.18); background:transparent; color:var(--text-muted); font-size:12px; font-weight:600; font-family:inherit; cursor:pointer; transition:all 0.18s; }
  .pill-toggle.selected { background:var(--navy); color:rgba(228,222,212,0.95); border-color:var(--navy); }
  .seg-toggle { display:flex; border-radius:9px; border:1.5px solid rgba(58,52,46,0.15); overflow:hidden; background:rgba(255,255,255,0.5); }
  .seg-btn { flex:1; padding:7px 10px; border:none; background:transparent; color:var(--text-muted); font-size:12px; font-weight:600; font-family:inherit; cursor:pointer; transition:all 0.18s; border-right:1px solid rgba(58,52,46,0.1); }
  .seg-btn:last-child { border-right:none; }
  .seg-btn.selected { background:var(--navy); color:rgba(228,222,212,0.95); }
  .scope-toggle { display:flex; border-radius:10px; border:1.5px solid rgba(15,42,68,0.18); overflow:hidden; background:#E8DFC9; }
  .scope-btn { flex:1; padding:8px 12px; border:none; background:transparent; color:var(--text-muted); font-size:11.5px; font-weight:600; font-family:inherit; cursor:pointer; transition:all 0.2s; }
  .scope-btn.active { background:var(--navy); color:rgba(228,222,212,0.95); }
  .income-range { -webkit-appearance:none; appearance:none; width:100%; height:4px; border-radius:2px; background:rgba(15,42,68,0.15); outline:none; cursor:pointer; }
  .income-range::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:16px; height:16px; border-radius:50%; background:var(--navy); cursor:pointer; }
  .income-selected { font-size:12px; font-weight:700; color:var(--navy); margin-bottom:4px; }
  .drag-zone { border:2px dashed rgba(15,42,68,0.2); border-radius:var(--r-md); padding:18px; text-align:center; cursor:pointer; transition:all 0.2s; background:rgba(15,42,68,0.02); display:flex; flex-direction:column; align-items:center; gap:8px; }
  .drag-zone:hover { border-color:rgba(15,42,68,0.35); background:rgba(15,42,68,0.04); }
  .drag-icon { font-size:24px; }
  .drag-label { font-size:12.5px; font-weight:600; color:var(--navy); }
  .drag-hint  { font-size:11px; color:var(--text-muted); }
  .upload-success { display:flex; align-items:center; gap:6px; padding:6px 10px; background:rgba(45,106,79,0.09); border:1px solid rgba(45,106,79,0.22); border-radius:7px; font-size:11.5px; color:#2d6a4f; font-weight:600; animation:fadeIn 0.25s ease; }
  .secure-badge { display:flex; align-items:center; gap:6px; padding:6px 10px; background:rgba(45,106,79,0.08); border:1px solid rgba(45,106,79,0.2); border-radius:8px; font-size:11px; color:#2d6a4f; font-weight:600; }
  .digilocker-btn { display:flex; align-items:center; gap:8px; width:100%; padding:10px 14px; border-radius:var(--r-md); border:1.5px solid rgba(15,42,68,0.25); background:#F7F3EB; color:var(--navy); font-size:12.5px; font-weight:600; font-family:inherit; cursor:pointer; transition:all 0.2s; }
  .digilocker-btn:hover { border-color:var(--navy); background:rgba(15,42,68,0.04); }
  .digilocker-trusted { margin-left:auto; font-size:9px; font-weight:700; text-transform:uppercase; color:#2d6a4f; background:rgba(45,106,79,0.1); border:1px solid rgba(45,106,79,0.25); padding:2px 7px; border-radius:var(--r-pill); flex-shrink:0; }
  .digilocker-hint { font-size:10.5px; color:var(--text-muted); margin-top:4px; }
  .digilocker-divider { display:flex; align-items:center; gap:8px; margin:8px 0; }
  .digilocker-divider-line { flex:1; height:1px; background:var(--border); }
  .digilocker-divider-text { font-size:10px; color:var(--text-muted); font-weight:600; letter-spacing:0.06em; white-space:nowrap; }
  .auth-section { margin:12px 22px 4px; border-radius:var(--r-lg); border:1.5px solid var(--border); padding:14px 16px; background:rgba(255,255,255,0.5); display:flex; flex-direction:column; gap:10px; }
  .auth-section-title { font-size:10px; font-weight:700; letter-spacing:0.09em; text-transform:uppercase; color:var(--text-muted); }
  .auth-sign-in-btn { width:100%; padding:11px 16px; border-radius:11px; border:none; background:var(--navy); color:rgba(228,222,212,0.95); font-size:13px; font-weight:600; font-family:inherit; cursor:pointer; transition:background 0.18s; }
  .auth-sign-in-btn:hover { background:#1a3d5c; }
  .auth-guest-link { text-align:center; font-size:12px; color:var(--text-muted); font-weight:500; cursor:pointer; padding:4px; text-decoration:underline; background:none; border:none; font-family:inherit; width:100%; }
  .sheet-acts { display:flex; gap:9px; padding:14px 22px 2px; border-top:1px solid var(--border); margin-top:6px; flex-shrink:0; }
  .btn-pri { flex:1; padding:11px 16px; border-radius:11px; border:none; background:var(--navy); color:var(--gold); font-size:13px; font-weight:600; font-family:inherit; cursor:pointer; transition:background 0.18s; }
  .btn-pri:hover { background:#1a3d5c; }
  .btn-sec { padding:11px 14px; border-radius:11px; border:1px solid var(--border-strong); background:transparent; color:var(--text-muted); font-size:13px; font-weight:500; font-family:inherit; cursor:pointer; transition:all 0.18s; }
  .btn-sec:hover { background:var(--bg-app); color:var(--text); }

  /* ── MODAL ── */
  .modal-overlay { position:fixed; inset:0; background:rgba(15,42,68,0.5); backdrop-filter:blur(4px); z-index:500; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s ease; }
  .modal-box { width:420px; max-width:95vw; background:var(--surface-elevated); border-radius:18px; overflow:hidden; box-shadow:0 24px 80px rgba(15,42,68,0.35); animation:modalIn 0.28s cubic-bezier(0.22,1,0.36,1) both; }
  @keyframes modalIn { from{opacity:0;transform:scale(0.93) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)} }
  .modal-head { padding:18px 22px 16px; background:var(--navy); display:flex; align-items:center; justify-content:space-between; }
  .modal-head h3 { font-family:'DM Serif Display',serif; font-size:16px; color:rgba(228,222,212,0.95); margin:0; }
  .modal-close { width:28px; height:28px; border-radius:var(--r-sm); border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.06); color:rgba(228,222,212,0.65); font-size:16px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.15s; }
  .modal-close:hover { background:rgba(255,255,255,0.14); color:white; }
  .modal-tabs { display:flex; border-bottom:1px solid var(--border); }
  .modal-tab { flex:1; padding:11px 16px; border:none; background:transparent; font-size:13px; font-weight:600; font-family:inherit; cursor:pointer; color:var(--text-muted); border-bottom:2px solid transparent; transition:all 0.18s; margin-bottom:-1px; }
  .modal-tab.active { color:var(--navy); border-bottom-color:var(--navy); }
  .modal-body { padding:18px 22px 22px; display:flex; flex-direction:column; gap:11px; }
  .modal-divider { display:flex; align-items:center; gap:8px; margin:4px 0; }
  .modal-divider-line { flex:1; height:1px; background:var(--border); }
  .modal-divider-text { font-size:10.5px; color:var(--text-muted); font-weight:600; letter-spacing:0.06em; }
  .modal-submit { width:100%; padding:11px 16px; border-radius:11px; border:none; background:var(--navy); color:rgba(228,222,212,0.95); font-size:13px; font-weight:600; font-family:inherit; cursor:pointer; transition:background 0.18s; margin-top:4px; }
  .modal-submit:hover { background:#1a3d5c; }
  .modal-submit:disabled { opacity:0.6; cursor:not-allowed; }

  /* Google button */
  .google-btn {
    display:flex; align-items:center; justify-content:center; gap:10px;
    width:100%; padding:11px 16px; border-radius:11px;
    border:1.5px solid rgba(58,52,46,0.18); background:#ffffff;
    color:#3c4043; font-size:13px; font-weight:600; font-family:inherit;
    cursor:pointer; transition:all 0.18s;
    box-shadow:0 1px 4px rgba(0,0,0,0.08);
  }
  .google-btn:hover { border-color:rgba(58,52,46,0.30); box-shadow:0 2px 10px rgba(0,0,0,0.12); }
  .google-btn:disabled { opacity:0.6; cursor:not-allowed; }

  .trust-bar { background:var(--navy); border-top:1px solid rgba(196,165,116,0.15); padding:5px 18px; display:flex; align-items:center; justify-content:center; gap:18px; flex-shrink:0; }
  .trust-item { display:flex; align-items:center; gap:5px; font-size:9.5px; font-weight:600; letter-spacing:0.05em; color:rgba(196,165,116,0.65); text-transform:uppercase; }
  .trust-dot { width:4px; height:4px; border-radius:50%; background:rgba(196,165,116,0.35); }

  .toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#2d6a4f; color:white; padding:10px 20px; border-radius:var(--r-pill); font-size:13px; font-weight:600; z-index:9999; box-shadow:var(--shadow-lg); animation:toastIn 0.3s cubic-bezier(0.22,1,0.36,1) both; }
  .toast.error { background:#c0392b; }
  @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)} }

  .app.dark { --bg-app:#0d1824; --surface-card:#162232; --surface-elevated:#111e2d; --right-bg:#0f1c2b; --right-border:rgba(196,165,116,0.1); --text:rgba(228,222,212,0.92); --text-muted:rgba(196,165,116,0.6); --text-xs:rgba(196,165,116,0.4); --border:rgba(196,165,116,0.12); --border-strong:rgba(196,165,116,0.2); }
  .app.dark .chat-canvas { background:linear-gradient(168deg,#0d1824 0%,#0a1520 100%); }
  .app.dark .input-shell { background:linear-gradient(to top,rgba(10,21,32,1) 55%,transparent); }
  .app.dark .hdr { background:#080f18; }
  .app.dark .trust-bar { background:#080f18; }
  .app.dark .explain-inner { background:rgba(232,223,201,0.12); }
  .app.dark .google-btn { background:#1a2632; color:rgba(228,222,212,0.9); border-color:rgba(196,165,116,0.22); }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0}to{opacity:1} }
`;

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */
const LANGUAGES = [
  { code:"en", label:"English" }, { code:"hi", label:"हिंदी" }, { code:"bn", label:"বাংলা" },
  { code:"te", label:"తెలుగు" }, { code:"mr", label:"मराठी" }, { code:"ta", label:"தமிழ்" },
  { code:"gu", label:"ગુજરાતી" }, { code:"kn", label:"ಕನ್ನಡ" }, { code:"ml", label:"മലയാളം" },
  { code:"or", label:"ଓଡ଼ିଆ" }, { code:"pa", label:"ਪੰਜਾਬੀ" }, { code:"as", label:"অসমীয়া" },
];
const STATES = ["Gujarat","Rajasthan","Maharashtra","Madhya Pradesh","Delhi","Uttar Pradesh","Bihar","West Bengal","Tamil Nadu","Karnataka"];
const INCOME_BRACKETS = ["Below ₹1 Lakh","₹1–3 Lakh","₹3–6 Lakh","₹6–10 Lakh","Above ₹10 Lakh"];
const JOURNEY_STEPS = [
  { id:"profile", label:"Profile" },
  { id:"schemes", label:"Schemes" },
  { id:"checklist", label:"Checklist" },
  { id:"apply", label:"Apply" },
];
const THINKING_MESSAGES = [
  { emoji:"🔎", text:"Searching government scheme documents…" },
  { emoji:"📄", text:"Reading policy documents…" },
  { emoji:"🤖", text:"Generating personalised recommendations…" },
  { emoji:"⏳", text:"AI is processing — this may take 30–60 seconds…" },
  { emoji:"🌐", text:"Almost there! Finalising your scheme matches…" },
];
const STARTERS = [
  "I'm a small farmer in Gujarat with 2 acres",
  "I need healthcare support for my family",
  "Looking for education scholarship for my daughter",
  "I run a small street food stall",
];
const SCHEME_NAV = [
  { id:"s1",  name:"PM Kisan Samman Nidhi",    cat:"Agri",    color:"#2d6a4f", profile:"small farmer agricultural land 2 hectares Gujarat PM Kisan" },
  { id:"s2",  name:"Ayushman Bharat PM-JAY",   cat:"Health",  color:"#1d6fa4", profile:"low income family health coverage SECC Ayushman Bharat PMJAY" },
  { id:"s3",  name:"National Scholarship NSP",  cat:"Edu",     color:"#6b3fa0", profile:"SC ST student scholarship income below 2.5 lakh class 9 10" },
  { id:"s4",  name:"PM Awas Yojana Gramin",    cat:"Housing", color:"#b5550a", profile:"houseless BPL family rural kutcha house PMAY Gramin" },
  { id:"s5",  name:"MGNREGS / MNREGA",          cat:"Work",    color:"#7a6c00", profile:"rural adult unskilled manual work 100 days employment guarantee" },
  { id:"s6",  name:"Ujjwala Yojana 2.0",        cat:"Women",   color:"#9b2d5a", profile:"BPL woman no LPG connection free gas cylinder Ujjwala" },
  { id:"s7",  name:"PM SVANidhi Credit",        cat:"Finance", color:"#0f5e6e", profile:"street vendor working capital loan 50000 SVANidhi" },
  { id:"s8",  name:"Sukanya Samriddhi",          cat:"Women",   color:"#8a2d6e", profile:"girl child below 10 years savings scheme Sukanya Samriddhi" },
  { id:"s9",  name:"Pradhan Mantri Mudra",      cat:"Finance", color:"#1d5e8a", profile:"small business owner micro loan Shishu Kishore Tarun Mudra" },
  { id:"s10", name:"E-Shram Portal",            cat:"Labour",  color:"#4a6e2d", profile:"unorganized construction domestic worker e-shram UAN card" },
  { id:"s11", name:"PM Fasal Bima Yojana",      cat:"Agri",    color:"#1a6b3c", profile:"farmer crop insurance loss natural calamity PMFBY" },
  { id:"s12", name:"Kisan Credit Card",         cat:"Agri",    color:"#145a32", profile:"farmer short term credit agricultural loan KCC" },
  { id:"s13", name:"PM Mudra Yojana",           cat:"Finance", color:"#1a5276", profile:"micro small enterprise collateral free loan MUDRA" },
  { id:"s14", name:"Atal Pension Yojana",       cat:"Pension", color:"#6e2fa0", profile:"unorganised worker pension 1000 5000 monthly after 60 APY" },
  { id:"s15", name:"PM Jan Dhan Yojana",        cat:"Finance", color:"#0e6655", profile:"unbanked citizen zero balance savings account PMJDY" },
  { id:"s16", name:"PMEGP Guidelines",          cat:"Employ",  color:"#784212", profile:"entrepreneur self employment micro enterprise PMEGP loan subsidy" },
  { id:"s17", name:"SC Pre-Matric Scholarship", cat:"SC/ST",   color:"#922b21", profile:"SC student class 9 10 scholarship income 2.5 lakh" },
  { id:"s18", name:"ST Post-Matric Scholarship",cat:"SC/ST",   color:"#7b241c", profile:"ST student class 11 above post matric scholarship tribal" },
  { id:"s19", name:"Dr Ambedkar Awas Yojana",   cat:"Housing", color:"#873600", profile:"SC family BPL housing Gujarat domicile pucca house" },
  { id:"s20", name:"iKhedut Gujarat Agri",      cat:"Agri",    color:"#1e8449", profile:"Gujarat farmer drip irrigation subsidy 7/12 land equipment" },
];

/* ═══════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════ */
const S = (n) => ({ width:n, height:n, flexShrink:0 });
function IMic()    { return <svg style={S(17)} viewBox="0 0 24 24"><path fill="currentColor" d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zm-5 8v4h-2v-4h2z"/></svg>; }
function IStop()   { return <svg style={S(17)} viewBox="0 0 24 24"><rect fill="currentColor" x="5" y="5" width="14" height="14" rx="2"/></svg>; }
function IUp()     { return <svg style={S(17)} viewBox="0 0 24 24"><path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>; }
function ISend()   { return <svg style={S(17)} viewBox="0 0 24 24"><path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>; }
function ISearch() { return <svg style={S(13)} viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" stroke="rgba(200,195,185,0.4)" strokeWidth="2" fill="none"/><path stroke="rgba(200,195,185,0.4)" strokeWidth="2" strokeLinecap="round" d="M16.5 16.5L21 21" fill="none"/></svg>; }
function IPlus()   { return <svg style={S(14)} viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M12 5v14M5 12h14"/></svg>; }
function ITarget() { return <svg style={S(17)} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>; }
function IDoc()    { return <svg style={S(14)} viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="1.5" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path stroke="currentColor" strokeWidth="1.5" d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>; }
function IUser()   { return <svg style={S(14)} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path stroke="currentColor" strokeWidth="1.5" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>; }
function IMoon()   { return <svg style={S(15)} viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>; }
function ISun()    { return <svg style={S(15)} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>; }

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.08-6.08C34.46 3.39 29.5 1.5 24 1.5 14.82 1.5 7.03 7.1 3.69 15.02l7.09 5.5C12.5 14.47 17.76 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.73H24v8.95h12.42c-.54 2.9-2.18 5.36-4.64 7.04l7.19 5.59C43.18 37.44 46.1 31.44 46.1 24.55z"/>
      <path fill="#FBBC05" d="M10.78 28.52A14.6 14.6 0 019.5 24c0-1.57.27-3.09.76-4.52l-7.09-5.5A22.47 22.47 0 001.5 24c0 3.57.86 6.95 2.37 9.94l6.91-5.42z"/>
      <path fill="#34A853" d="M24 46.5c5.5 0 10.12-1.82 13.48-4.95l-7.19-5.59c-1.82 1.22-4.15 1.94-6.29 1.94-6.24 0-11.5-4.97-13.22-11.38l-6.91 5.42C7.03 40.9 14.82 46.5 24 46.5z"/>
    </svg>
  );
}

function AiLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink:0 }}>
      <defs>
        <radialGradient id="g1" cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#e8d5a3"/>
          <stop offset="55%" stopColor="#c4a574"/>
          <stop offset="100%" stopColor="#8a6d3e"/>
        </radialGradient>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(196,165,116,0.28)" strokeWidth="1"/>
      <polygon points="16,5 24,10 24,22 16,27 8,22 8,10" fill="none" stroke="rgba(196,165,116,0.42)" strokeWidth="0.8"/>
      <circle cx="16" cy="16" r="7" fill="url(#g1)" filter="url(#glow)"/>
      <circle cx="16" cy="16" r="2.2" fill="rgba(255,252,248,0.9)"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STATE DROPDOWN
═══════════════════════════════════════════════════════════════ */
function StateDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={{
        display:"flex", alignItems:"center", gap:5, padding:"4px 9px", borderRadius:999,
        border: open ? "1px solid rgba(196,165,116,0.6)" : "1px solid rgba(196,165,116,0.28)",
        background: open ? "rgba(196,165,116,0.15)" : "rgba(255,255,255,0.08)",
        color:"rgba(228,222,212,0.8)", fontSize:11.5, fontWeight:500, letterSpacing:"0.04em",
        textTransform:"uppercase", cursor:"pointer", fontFamily:"inherit", transition:"all 0.18s",
      }}>
        {value}
        <svg viewBox="0 0 24 24" style={{ width:11, height:11, transition:"transform 0.2s", transform:open?"rotate(180deg)":"rotate(0deg)" }}>
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 5px)", right:0,
          background:"var(--surface-elevated)", border:"1px solid var(--border-strong)",
          borderRadius:11, zIndex:200, minWidth:200, maxHeight:200, overflowY:"auto",
          boxShadow:"0 16px 48px rgba(15,42,68,0.22)", padding:"5px",
        }}>
          {STATES.map(s => (
            <button key={s} type="button" onClick={() => { onChange(s); setOpen(false); }} style={{
              display:"block", width:"100%", textAlign:"left", padding:"8px 11px", borderRadius:7, border:"none",
              background:s===value?"rgba(15,42,68,0.08)":"transparent",
              color:s===value?"var(--navy)":"var(--text-muted)",
              fontSize:12.5, fontFamily:"inherit", cursor:"pointer", fontWeight:s===value?600:400,
            }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FORM HELPERS
═══════════════════════════════════════════════════════════════ */
const BF = {
  width:"100%", padding:"8px 11px", borderRadius:9,
  border:"1.5px solid rgba(58,52,46,0.13)",
  background:"#fff", color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none",
};
function FInput(props) {
  const [f,setF]=useState(false);
  return <input {...props} style={{...BF, borderColor:f?"var(--navy)":"rgba(58,52,46,0.13)", boxShadow:f?"0 0 0 3px rgba(15,42,68,0.1)":"none"}} onFocus={()=>setF(true)} onBlur={()=>setF(false)}/>;
}
function FSelect({children,...props}) {
  const [f,setF]=useState(false);
  return (
    <select {...props} style={{
      ...BF, appearance:"none", cursor:"pointer", paddingRight:34,
      backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b6560' d='M3 4.5L6 7.5L9 4.5'/%3E%3C/svg%3E\")",
      backgroundRepeat:"no-repeat", backgroundPosition:"right 11px center",
      borderColor:f?"var(--navy)":"rgba(58,52,46,0.13)", boxShadow:f?"0 0 0 3px rgba(15,42,68,0.1)":"none",
    }} onFocus={()=>setF(true)} onBlur={()=>setF(false)}>{children}</select>
  );
}
function FField({label,required,hint,children}) {
  return (
    <div className="fld">
      <span className="fld-lbl">{label}{required&&<span className="fld-req">*</span>}</span>
      {children}
      {hint&&<span className="fld-hint">ℹ️ {hint}</span>}
    </div>
  );
}
function PillToggle({options,value,onChange}) {
  return (
    <div className="pill-toggle-group">
      {options.map(opt=>(
        <button key={opt} type="button" className={`pill-toggle${value===opt?" selected":""}`} onClick={()=>onChange(opt===value?null:opt)}>{opt}</button>
      ))}
    </div>
  );
}
function SegToggle({options,value,onChange}) {
  return (
    <div className="seg-toggle">
      {options.map(opt=>(
        <button key={opt} type="button" className={`seg-btn${value===opt?" selected":""}`} onClick={()=>onChange(opt)}>{opt}</button>
      ))}
    </div>
  );
}
function UploadPh({name,hint,uploadedPrefix}) {
  const [fileName,setFileName]=useState(null);
  const inputRef=useRef(null);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>{const f=e.target.files&&e.target.files[0];if(f)setFileName(f.name);e.target.value="";}}/>
      <div className="drag-zone" onClick={()=>inputRef.current&&inputRef.current.click()}>
        <div className="drag-icon">📎</div>
        <div className="drag-label">{name}</div>
        <div className="drag-hint">{hint}</div>
      </div>
      {fileName&&<div className="upload-success">✓ {uploadedPrefix} {fileName}</div>}
    </div>
  );
}

const FSECS_BASE = [
  { label_key:"personalInfo",   icon:"👤", accent:"rgba(196,165,116,0.06)", iconBg:"rgba(196,165,116,0.14)", color:"#8a6d3e" },
  { label_key:"economicProfile",icon:"💼", accent:"rgba(45,106,79,0.05)",   iconBg:"rgba(45,106,79,0.12)",   color:"#2d6a4f" },
  { label_key:"location",       icon:"📍", accent:"rgba(15,42,68,0.04)",    iconBg:"rgba(15,42,68,0.12)",    color:"#0F2A44" },
  { label_key:"documents",      icon:"📄", accent:"rgba(107,63,160,0.05)",  iconBg:"rgba(107,63,160,0.11)",  color:"#5a30a0" },
  { label_key:"schemeInterest", icon:"🎯", accent:"rgba(181,85,10,0.04)",   iconBg:"rgba(181,85,10,0.10)",   color:"#a04520" },
];
function FSec({label,icon,accent,iconBg,color,children}) {
  return (
    <div className="fsec" style={{background:accent}}>
      <div className="fsec-hd">
        <div className="fsec-ico" style={{background:iconBg}}>{icon}</div>
        <span className="fsec-lbl" style={{color}}>{label}</span>
      </div>
      <div className="fsec-body">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP TRACKER
═══════════════════════════════════════════════════════════════ */
function StepTracker({currentStep,isLoggedIn}) {
  const stepIndex = JOURNEY_STEPS.findIndex(s=>s.id===currentStep);
  return (
    <div className="step-tracker">
      {JOURNEY_STEPS.map((step,i)=>{
        const isDone=i<stepIndex; const isActive=i===stepIndex;
        const sc=isDone?"done":isActive?"active":"pending";
        return (
          <div key={step.id} className="step-item">
            <div className={`step-circle ${sc}`}>{isDone?"✓":i+1}</div>
            <span className={`step-label ${sc}`}>
              {step.label}{step.id==="apply"&&!isLoggedIn&&<span style={{fontSize:10,marginLeft:2}}>🔒</span>}
            </span>
            {i<JOURNEY_STEPS.length-1&&<div className={`step-connector ${isDone?"done":"pending"}`}/>}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESULT CARD
═══════════════════════════════════════════════════════════════ */
function ResultCard({scheme,idx,visible}) {
  const [explainOpen,setExplainOpen]=useState(false);
  return (
    <div className={`rc${visible?" visible":""}`} style={{animationDelay:visible?`${idx*120}ms`:"0ms"}}>
      <div className="rc-top">
        <span className="rc-tag" style={{color:scheme.tagColor,background:scheme.tagBg,border:`1px solid ${scheme.tagColor}30`}}>{scheme.tag}</span>
        <span className="rc-draft">Draft Ready ✓</span>
      </div>
      <div className="rc-ttl">{scheme.title}</div>
      <div className="rc-rsn">{scheme.reason}</div>
      <div className="rc-match">
        <div className="rc-match-bar">
          <div className="rc-match-fill" style={{width:`${scheme.match}%`,background:scheme.match>=85?"#2d6a4f":scheme.match>=70?"#b5550a":"#7a6c00"}}/>
        </div>
        <span className="rc-match-pct" style={{color:scheme.match>=85?"#2d6a4f":scheme.match>=70?"#b5550a":"#7a6c00"}}>{scheme.match}% match</span>
      </div>
      <div className="rc-buls">
        {(scheme.bullets||[]).map((b,i)=>(
          <div key={i} className="rc-bul"><span className="rc-dot" style={{background:scheme.tagColor}}/>{b}</div>
        ))}
      </div>
      {(scheme.explainPoints||[]).length>0&&(
        <>
          <button type="button" className="explain-toggle" onClick={()=>setExplainOpen(v=>!v)}>
            <span className="explain-ai-badge">🤖 AI Insight</span>
            <span style={{flex:1,textAlign:"left"}}>Why am I eligible?</span>
            <span className={`explain-chevron${explainOpen?" open":""}`}>▶</span>
          </button>
          <div className={`explain-panel${explainOpen?" open":""}`}>
            <div className="explain-inner">
              {scheme.explainPoints.map((p,i)=>(
                <div key={i} className="explain-row"><span className="explain-tick">✓</span><span>{p}</span></div>
              ))}
            </div>
          </div>
        </>
      )}
      <button type="button" className="rc-cta">View Checklist →</button>
    </div>
  );
}

/* AI Thinking */
function SmartTyping() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(iv);
  }, []);

  let msg = "Connecting to PolicyPilot...";
  if (elapsed >= 5 && elapsed < 15) msg = "AI is processing your profile...";
  else if (elapsed >= 15 && elapsed < 35) msg = "Finding matching schemes — this may take up to 60s...";
  else if (elapsed >= 35 && elapsed < 60) msg = "Almost there! Finalising your matches...";
  else if (elapsed >= 60) msg = "Taking longer than usual, please wait...";

  return (
    <div className="ai-thinking">
      <div className="thinking-msg">
        <span className="thinking-emoji">⏳</span>
        <span>{msg} ({elapsed}s)</span>
      </div>
      <div className="shimmer-lines">
        {[100, 80, 60].map((w, i) => <div key={i} className="shimmer-line" style={{ width:`${w}%`, animationDelay:`${i*0.15}s` }}/>)}
      </div>
    </div>
  );
}

function fmtTime() {
  return new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true}).toLowerCase();
}

/* ═══════════════════════════════════════════════════════════════
   LOGIN MODAL  — real Google auth + optional DigiLocker
═══════════════════════════════════════════════════════════════ */
function LoginModal({ onClose, onSuccess, onGoogle }) {
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    await onGoogle();           // parent handles the popup + state
    setLoading(false);
  };

  const handleEmailSubmit = () => {
    // Email/password auth is UI-only here; wire up Firebase if needed
    onSuccess && onSuccess("Email");
  };

  const handleDigiLocker = () => {
    onSuccess && onSuccess("DigiLocker");
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h3>🔐 Citizen Portal Access</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-tabs">
          <button type="button" className={`modal-tab${tab==="login"?" active":""}`} onClick={()=>setTab("login")}>Login</button>
          <button type="button" className={`modal-tab${tab==="signup"?" active":""}`} onClick={()=>setTab("signup")}>Create Account</button>
        </div>
        <div className="modal-body">
          {tab==="login"?(
            <>
              <FField label="Email / Mobile Number"><FInput type="text" placeholder="email@example.com or 9XXXXXXXXX"/></FField>
              <FField label="Password"><FInput type="password" placeholder="Enter your password"/></FField>
              <button type="button" className="modal-submit" onClick={handleEmailSubmit}>Sign In →</button>
            </>
          ):(
            <>
              <FField label="Full Name"><FInput type="text" placeholder="As on Aadhaar"/></FField>
              <FField label="Mobile Number"><FInput type="text" placeholder="10-digit mobile"/></FField>
              <FField label="State">
                <FSelect defaultValue="">
                  <option value="">Select</option>
                  {STATES.map(s=><option key={s}>{s}</option>)}
                </FSelect>
              </FField>
              <FField label="Password"><FInput type="password" placeholder="Create a password"/></FField>
              <button type="button" className="modal-submit" onClick={handleEmailSubmit}>Create Account →</button>
            </>
          )}

          {/* ── OR divider ── */}
          <div className="modal-divider">
            <div className="modal-divider-line"/>
            <span className="modal-divider-text">OR CONTINUE WITH</span>
            <div className="modal-divider-line"/>
          </div>

          {/* ── Real Google Sign-In ── */}
          <button type="button" className="google-btn" onClick={handleGoogle} disabled={loading}>
            <GoogleIcon/>
            {loading ? "Signing in…" : "Continue with Google"}
          </button>

          {/* ── DigiLocker ── */}
          <button type="button" className="digilocker-btn" onClick={handleDigiLocker}>
            <span>🗂️</span> Continue with DigiLocker <span className="digilocker-trusted">Govt Trusted</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SPEECH HOOK
═══════════════════════════════════════════════════════════════ */
function useSpeech({onResult,lang}) {
  const recRef=useRef(null);
  const [listening,setListening]=useState(false);
  const [error,setError]=useState(null);
  const supported=typeof window!=="undefined"&&!!(window.SpeechRecognition||window.webkitSpeechRecognition);
  const stop=useCallback(()=>{
    if(recRef.current){recRef.current.stop();recRef.current=null;}
    setListening(false);
  },[]);
  const start=useCallback(()=>{
    if(!supported){setError("unsupported");return;}
    if(listening){stop();return;}
    setError(null);
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const rec=new SR();
    const langMap={en:"en-IN",hi:"hi-IN",bn:"bn-IN",te:"te-IN",mr:"mr-IN",ta:"ta-IN",gu:"gu-IN",kn:"kn-IN",ml:"ml-IN",pa:"pa-IN"};
    rec.lang=langMap[lang]||"en-IN";
    rec.continuous=false; rec.interimResults=false;
    rec.onresult=(e)=>{const text=Array.from(e.results).map(r=>r[0].transcript).join(" ");onResult(text);setListening(false);recRef.current=null;};
    rec.onerror=(e)=>{setListening(false);recRef.current=null;setError(e.error==="not-allowed"?"denied":"error");};
    rec.onend=()=>{setListening(false);recRef.current=null;};
    recRef.current=rec;
    try{rec.start();setListening(true);}catch{setError("error");}
  },[supported,listening,stop,onResult,lang]);
  useEffect(()=>()=>{if(recRef.current)recRef.current.stop();},[]);
  return{listening,supported,error,start,stop};
}

/* ═══════════════════════════════════════════════════════════════
   API HELPERS
═══════════════════════════════════════════════════════════════ */
async function apiCreateChat(title) {
  if(!API_BASE) throw new Error("REACT_APP_API_URL is not configured");
  const res = await apiFetchWithTimeout(`${API_BASE}/chats`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({title})});
  return res.json();
}
async function apiFetchChats() {
  if(!API_BASE) throw new Error("REACT_APP_API_URL is not configured");
  const res = await apiFetchWithTimeout(`${API_BASE}/chats`,{credentials:"include"});
  return res.json();
}
async function apiDeleteChat(chatId) {
  if(!API_BASE) throw new Error("REACT_APP_API_URL is not configured");
  await apiFetchWithTimeout(`${API_BASE}/chats/${chatId}`,{method:"DELETE",credentials:"include"});
}
async function apiFindSchemes(citizenProfile,chatId,preferredLanguage) {
  if(!API_BASE) throw new Error("REACT_APP_API_URL is not configured");
  const res = await apiFetchWithTimeout(`${API_BASE}/find-schemes`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({citizen_profile:citizenProfile,chat_id:chatId,preferred_language:preferredLanguage})});
  return res.json();
}
async function apiLoadChatMessages(chatId) {
  if(!API_BASE) throw new Error("REACT_APP_API_URL is not configured");
  const res = await apiFetchWithTimeout(`${API_BASE}/chats/${chatId}/messages`,{credentials:"include"});
  return res.json();
}
async function apiFetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`API failed (${res.status})`);
    return res;
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Request timed out. Please try again.");
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

function mapFallbackSchemes() {
  return SCHEME_NAV.slice(0, 3).map((s, i) => ({
    id: `fallback-${s.id || i}`,
    tag: s.cat || "Scheme",
    tagColor: s.color || "#1d6fa4",
    tagBg: `${(s.color || "#1d6fa4")}1a`,
    title: s.name || "Government Scheme",
    reason: "Showing a safe fallback while backend response is unavailable.",
    match: 70,
    bullets: ["Please retry to refresh tailored recommendations."],
    explainPoints: [],
  }));
}

function extractSchemes(data) {
  const schemes = data?.schemes || [];
  return Array.isArray(schemes) ? schemes : [];
}

function mapSchemesToResultCards(schemes) {
  return schemes.map((s, i) => {
    const base = typeof s === "object" && s !== null ? s : {};
    return {
      ...base,
      id: base?.id ?? i,
      title: typeof s === "string" ? s : (base?.title || base?.name || `Scheme ${i + 1}`),
      reason: base?.reason || "Eligible based on profile",
      tag: base?.tag || "Eligible",
      tagColor: base?.tagColor || "#2d6a4f",
      tagBg: base?.tagBg || "rgba(45,106,79,0.1)",
      bullets: Array.isArray(base?.bullets) && base.bullets.length > 0 ? base.bullets : ["AI matched", "Gov scheme"],
      match: typeof base?.match === "number" ? base.match : 75,
      explainPoints: Array.isArray(base?.explainPoints) ? base.explainPoints : [],
    };
  });
}

/* ═══════════════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [lang,setLang]=useState("en");
  const [stateSel,setStateSel]=useState("Gujarat");
  const [profileOpen,setProfile]=useState(false);
  const [inputVal,setInputVal]=useState("");
  const [activeChatId,setActiveChatId]=useState(null);
  const [activeScheme,setActiveSch]=useState(null);
  const [messages,setMessages]=useState(null);
  const [results,setResults]=useState([]);
  const [visibleCards,setVisibleCards]=useState([]);
  const [isTyping,setTyping]=useState(false);
  const [chatFile,setChatFile]=useState(null);
  const [darkMode,setDarkMode]=useState(false);
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const [currentStep,setCurrentStep]=useState("profile");
  const [apiError,setApiError]=useState(null);
  const [chatHistory,setChatHistory]=useState([]);
  const [chatsLoading,setChatsLoading]=useState(false);
  const [searchQuery,setSearchQuery]=useState("");

  const { currentUser, loading: authLoading, googleSignIn, logout } = useAuth();
  const [isGuest, setIsGuest] = useState(false);
  
  const isLoggedIn = !!currentUser || isGuest;

  const authUser = currentUser ? {
    name: currentUser.displayName || currentUser.email,
    email: currentUser.email,
    photo: currentUser.photoURL,
    initials: currentUser.displayName 
      ? currentUser.displayName.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()
      : (currentUser.email ? currentUser.email[0].toUpperCase() : "U")
  } : null;

  const [loginModal,setLoginModal]=useState(false);
  const [authDropdown,setAuthDropdown]=useState(false);
  const [toast,setToast]=useState(null);

  const authRef = useRef(null);

  /* Form */
  const [socialCategory,setSocialCategory]=useState(null);
  const [gender,setGender]=useState(null);
  const [education,setEducation]=useState("");
  const [incomeIdx,setIncomeIdx]=useState(1);
  const [residenceType,setResidenceType]=useState(null);
  const [schemeScope,setSchemeScope]=useState("Central Schemes (All India)");
  const [formState,setFormState]=useState("Gujarat");

  const t=useT(lang);
  const canvasRef=useRef(null);
  const chatFileRef=useRef(null);
  const isCentralScope=schemeScope==="Central Schemes (All India)";

  // Auth listener removed because AuthContext handles it now

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const h=(e)=>{if(authRef.current&&!authRef.current.contains(e.target))setAuthDropdown(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);

  // Connection Test Function
  useEffect(() => {
    if (!API_BASE) {
      console.error("❌ REACT_APP_API_URL is not set!");
      return;
    }
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`, {
          signal: AbortSignal.timeout(15000)
        });
        const data = await res.json();
        console.log("✅ Backend health:", data);
      } catch (err) {
        console.error("❌ Backend check failed:", err.message);
      }
    };
    checkBackend();
  }, []);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};

  /* ── REAL Google Sign-In ── */
  const handleGoogleSignIn = useCallback(async () => {
    try {
      const result = await googleSignIn();
      console.log("User:", result?.user);
      setLoginModal(false);
      showToast("✅ Signed in successfully! Your journey is saved.");
    } catch (err) {
      console.error("Auth Error:", err?.code, err?.message);
      if (err?.code !== "auth/popup-closed-by-user") {
        showToast("⚠️ Sign-in failed. Please try again.", "error");
      }
    }
  }, [googleSignIn]);

  /* ── DigiLocker / email fallback (UI mock) ── */
  const handleAuthSuccess = useCallback((method) => {
    setLoginModal(false);
    showToast(`✅ Signed in via ${method}. Your welfare journey is now saved.`);
  }, []);

  /* ── Logout ── */
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setIsGuest(false); // clear guest state too
      setAuthDropdown(false);
      showToast("You've been signed out.");
    } catch {
      showToast("⚠️ Sign-out failed.", "error");
    }
  }, [logout]);

  /* ── Load chats ── */
  const loadChats = useCallback(async () => {
    setChatsLoading(true);
    try {
      const data = await apiFetchChats();
      if (Array.isArray(data)) setChatHistory(data);
    } catch { setChatHistory([]); }
    finally { setChatsLoading(false); }
  }, []);

  useEffect(() => { loadChats(); }, [loadChats]);

  const handleChatFileChange=(e)=>{
    const file=e.target.files&&e.target.files[0];
    if(file)setChatFile(file.name);
    e.target.value="";
  };

  const handleNewChat = useCallback(async () => {
    setMessages(null);setResults([]);setVisibleCards([]);setInputVal("");setChatFile(null);
    setCurrentStep("profile");setApiError(null);setActiveSch(null);
    if(canvasRef.current) canvasRef.current.scrollTop=0;
    try { const nc=await apiCreateChat("New Chat"); setActiveChatId(nc.id); await loadChats(); }
    catch { setActiveChatId(null); }
  }, [loadChats]);

  const handleSelectChat = useCallback(async (chatId) => {
    setActiveChatId(chatId); setApiError(null);
    try {
      const data=await apiLoadChatMessages(chatId);
      const msgs=(data.messages||[]).map(m=>{
        if(m.role==="ai"){
          try{
            const parsed=JSON.parse(m.content);
            const text=typeof parsed==="string"
              ? parsed
              : (parsed?.intro || parsed?.text || "Here are your matched schemes.");
            return{role:"ai",time:fmtTime(),text};
          }
          catch{
            return{role:"ai",time:fmtTime(),text:m.content||"Here are your matched schemes."};
          }
        }
        return{role:"user",text:m.content,time:fmtTime()};
      });
      setMessages(msgs.length>0?msgs:null);
      const schemes=extractSchemes(data);
      const mappedSchemes=mapSchemesToResultCards(schemes);
      setResults(mappedSchemes);
      if(mappedSchemes.length>0){setVisibleCards(mappedSchemes.map((item,i)=>i));setCurrentStep("checklist");}
      else{setVisibleCards([]);setCurrentStep(msgs.length>0?"schemes":"profile");}
    } catch { setMessages(null);setResults([]);setVisibleCards([]);setCurrentStep("profile"); }
  }, []);

  const handleDeleteChat = useCallback(async (e,chatId) => {
    e.stopPropagation();
    try {
      await apiDeleteChat(chatId);
      if(activeChatId===chatId){setActiveChatId(null);setMessages(null);setResults([]);setVisibleCards([]);setCurrentStep("profile");}
      await loadChats();
    } catch { showToast("⚠️ Could not delete chat.","error"); }
  }, [activeChatId,loadChats]);

  const handleSchemeNav = useCallback(async (scheme) => {
    const isActive=activeScheme===scheme.id;
    setActiveSch(isActive?null:scheme.id);
    if(isActive) return;
    let chatId=activeChatId;
    try { if(!chatId){const nc=await apiCreateChat(scheme.name);chatId=nc.id;setActiveChatId(chatId);} } catch {}
    const profileText=`Tell me about ${scheme.name} — ${scheme.profile}`;
    setInputVal("");
    setMessages([{role:"user",text:profileText,time:fmtTime()}]);
    setCurrentStep("schemes"); setTyping(true); setResults([]); setVisibleCards([]); setApiError(null);
    try {
      const data=await apiFindSchemes(profileText,chatId,lang);
      console.log(data);
      setTyping(false);
      if(data?.error){
        setTyping(false);
        if (data.error.toLowerCase().includes("timed out")) {
          setApiError("Request timed out. The server is under load — please try again.");
          return;
        }
        const fallbackSchemes=mapFallbackSchemes();
        setApiError(null);
        setMessages(prev=>[...(Array.isArray(prev)?prev:[]),{role:"ai",time:fmtTime(),text:"I could not fetch live matches right now. Showing fallback schemes."}]);
        setResults(fallbackSchemes);
        setVisibleCards(fallbackSchemes.map((item,i)=>i));
        setCurrentStep("checklist");
        return;
      }
      setMessages(prev=>[...(Array.isArray(prev)?prev:[]),{role:"ai",time:fmtTime(),text:data?.message || "Here are your matched schemes."}]);
      const schemes=extractSchemes(data);
      const mappedSchemes=mapSchemesToResultCards(schemes);
      setResults(mappedSchemes);
      setVisibleCards(mappedSchemes.map((item,i)=>i));
      setCurrentStep(schemes.length>0?"checklist":"schemes");
      await loadChats();
      setTimeout(()=>{if(canvasRef.current)canvasRef.current.scrollTop=canvasRef.current.scrollHeight;},80);
    } catch (err) {
      setTyping(false);
      const errMsg = (err?.message || "").toLowerCase().includes("timeout") || (err?.message || "").toLowerCase().includes("abort")
        ? "Request timed out. The server is under load — please try again."
        : "Failed to connect to the backend.";
      setApiError(errMsg);
      setCurrentStep("profile");
    }
  }, [activeScheme,activeChatId,loadChats,lang]);

  const handleSend = useCallback(async (text) => {
    const msg=(text||inputVal).trim();
    if(!msg&&!chatFile) return;
    setInputVal(""); setApiError(null);
    let chatId=activeChatId;
    try { if(!chatId){const nc=await apiCreateChat(msg.slice(0,60)||"New Chat");chatId=nc.id;setActiveChatId(chatId);} } catch {}
    const userMsg={role:"user",text:msg||(chatFile?`[File: ${chatFile}]`:""),time:fmtTime()};
    setChatFile(null);
    setMessages(prev=>[...(Array.isArray(prev)?prev:[]),userMsg]);
    setCurrentStep("schemes"); setTyping(true); setResults([]); setVisibleCards([]);
    try {
      const data=await apiFindSchemes(msg,chatId,lang);
      console.log(data);
      setTyping(false);
      if(data?.error){
        setTyping(false);
        if (data.error.toLowerCase().includes("timed out")) {
          setApiError("Request timed out. The server is under load — please try again.");
          return;
        }
        const fallbackSchemes=mapFallbackSchemes();
        setApiError(null);
        setMessages(prev=>[...(Array.isArray(prev)?prev:[]),{role:"ai",time:fmtTime(),text:"I could not fetch live matches right now. Showing fallback schemes."}]);
        setResults(fallbackSchemes);
        setVisibleCards(fallbackSchemes.map((item,i)=>i));
        setCurrentStep("checklist");
        return;
      }
      const schemes = extractSchemes(data);
      const mappedSchemes=mapSchemesToResultCards(schemes);
      setMessages(prev=>[...(Array.isArray(prev)?prev:[]),{role:"ai",time:fmtTime(),text:data?.message || "Based on your situation, here are the matched schemes:"}]);
      setResults(mappedSchemes);
      setVisibleCards(mappedSchemes.map((item,i)=>i));
      setCurrentStep(schemes.length>0?"checklist":"schemes");
      await loadChats();
      setTimeout(()=>{if(canvasRef.current)canvasRef.current.scrollTop=canvasRef.current.scrollHeight;},80);
    } catch (err) {
      setTyping(false);
      const errMsg = (err?.message || "").toLowerCase().includes("timeout") || (err?.message || "").toLowerCase().includes("abort")
        ? "Request timed out. The server is under load — please try again."
        : "Failed to connect to the backend.";
      setApiError(errMsg);
      setCurrentStep("profile");
    }
  }, [inputVal,chatFile,activeChatId,loadChats,lang]);

  const handleKey=(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}};
  const onSpeechResult=useCallback((text)=>setInputVal(prev=>prev?prev+" "+text:text),[]);
  const speech=useSpeech({onResult:onSpeechResult,lang});
  const micErrorMsg=speech.error==="denied"?t("micDenied"):speech.error==="unsupported"?t("micUnsupported"):null;
  const isApiConfigured = Boolean(API_BASE);
  const isFirebaseConfigured = Boolean(auth);

  const filteredChats=searchQuery.trim()
    ?chatHistory.filter(c=>c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    :chatHistory;

  /* ── Avatar renderer (photo or initials) ── */
  const AvatarEl = () => (
    <div
      className="auth-avatar"
      onClick={()=>setAuthDropdown(d=>!d)}
      style={authUser?.photo ? {backgroundImage:`url(${authUser.photo})`,backgroundSize:"cover",backgroundPosition:"center"} : {}}
    >
      {!authUser?.photo && (authUser?.initials || "U")}
    </div>
  );

  /* ── Auth gate: splash → landing → main app ── */
  if (authLoading) {
    return (
      <>
        <style>{CSS}</style>
        <div style={{
          minHeight:"100vh",background:"#0a1628",display:"flex",
          alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,
        }}>
          <div style={{width:52,height:52,border:"3px solid rgba(196,165,116,0.2)",borderTopColor:"#c4a574",borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/>
          <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
          <span style={{fontSize:13,color:"rgba(196,165,116,0.6)",fontFamily:"DM Sans,sans-serif"}}>Loading PolicyPilot…</span>
        </div>
      </>
    );
  }

  if (!isLoggedIn) {
    return (
      <LandingPage
        onGoogleSignIn={handleGoogleSignIn}
        onGuest={() => setIsGuest(true)}
      />
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className={`app ${darkMode?"dark":""}`}>

        {/* ANNOUNCE */}
        <div className="announce-bar">
          <div className="announce-emblem">
            <svg width="18" height="18" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(196,165,116,0.8)" strokeWidth="5"/>
              <circle cx="50" cy="50" r="8" fill="rgba(196,165,116,0.8)"/>
              {Array.from({length:24},(item,i)=>{
                const a=(i*15)*Math.PI/180;
                return <line key={i} x1={50+10*Math.cos(a)} y1={50+10*Math.sin(a)} x2={50+42*Math.cos(a)} y2={50+42*Math.sin(a)} stroke="rgba(196,165,116,0.6)" strokeWidth="2"/>;
              })}
            </svg>
          </div>
          <div className="announce-track-wrap">
            <div className="announce-track">
              {[1,2].map(k=>(
                <span key={k} className="announce-text">
                  <span className="announce-flag">🇮🇳</span>
                  Government Scheme Intelligence Portal — Empowering Citizens with Artificial Intelligence &nbsp;·&nbsp;
                  Bridging Citizens and Welfare through AI &nbsp;·&nbsp; जन कल्याण के लिए AI &nbsp;·&nbsp;
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* HEADER */}
        <header className="hdr">
          <div className="hdr-in">
            <div className="hdr-l">
              <AiLogo size={26}/>
              <div className="hdr-title-wrap">
                <span className="hdr-title">{t("appTitle")}</span>
                <span className="hdr-motto">Bridging Citizens and Welfare through Artificial Intelligence</span>
              </div>
              <span className="ai-badge">AI Powered</span>
            </div>
            <div className="hdr-r">
              <div className="lang-wrap">
                <label className="lang-lbl" htmlFor="lang-s">{t("language")}</label>
                <select id="lang-s" className="lang-sel" value={lang} onChange={e=>setLang(e.target.value)}>
                  {LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
              <StateDropdown value={stateSel} onChange={setStateSel}/>
              <button type="button" className="theme-toggle" onClick={()=>setDarkMode(d=>!d)}>
                {darkMode?<ISun/>:<IMoon/>}
              </button>

              {/* ── AUTH AREA ── */}
              {isLoggedIn ? (
                <div ref={authRef} style={{position:"relative"}}>
                  <AvatarEl/>
                  {authDropdown && (
                    <div className="auth-dropdown">
                      <div className="auth-dropdown-name">
                        {authUser?.name}
                        <div className="auth-dropdown-email">{authUser?.email}</div>
                      </div>
                      <button type="button" className="auth-dropdown-item"><IUser/> Profile</button>
                      <button type="button" className="auth-dropdown-item">📋 Saved Schemes</button>
                      <button type="button" className="auth-dropdown-item danger" onClick={handleLogout}>⬅ Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" className="auth-btn-hdr" onClick={()=>setLoginModal(true)}>🔐 Sign In</button>
              )}
            </div>
          </div>
        </header>

        {(!isApiConfigured || !isFirebaseConfigured) && (
          <div style={{padding:"10px 16px",background:"#fff4e5",borderBottom:"1px solid #f0d39a",color:"#7a5400",fontSize:12,fontWeight:600}}>
            {!isApiConfigured && "API config missing: set REACT_APP_API_URL. "}
            {!isFirebaseConfigured && "Firebase config missing: set REACT_APP_FIREBASE_* variables."}
          </div>
        )}

        <div className="app-body">

          {/* SIDEBAR */}
          <aside className={`sidebar${sidebarCollapsed?" collapsed":""}`}>
            <div className="sb-brand">
              <div className="sb-brand-l">
                <AiLogo size={24}/>
                <div><div className="sb-name">PolicyPilot</div><div className="sb-tag">Welfare Scheme Guide</div></div>
              </div>
              <button type="button" className="sidebar-toggle" onClick={()=>setSidebarCollapsed(c=>!c)}>✕</button>
            </div>

            <button type="button" className="new-chat-btn" onClick={handleNewChat}>
              <IPlus/> {t("newChat")}
            </button>

            <div className="sb-search">
              <div className="sb-search-wrap">
                <span className="sb-search-icon"><ISearch/></span>
                <input className="sb-search-inp" placeholder={t("searchPlaceholder")} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
              </div>
            </div>

            <div className="sb-scroll">
              <p className="sb-lbl">{t("recentChats")}</p>
              {chatsLoading ? (
                <p style={{fontSize:11,color:"rgba(255,255,255,0.25)",padding:"6px 10px"}}>{t("loadingChats")}</p>
              ) : filteredChats.length===0 ? (
                <p style={{fontSize:11,color:"rgba(255,255,255,0.25)",padding:"6px 10px"}}>{searchQuery?"No results":t("noChatsYet")}</p>
              ) : (
                <ul className="hist-list">
                  {filteredChats.map(item=>(
                    <li key={item.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        className={`hist-btn${activeChatId===item.id?" active":""}`}
                        onClick={()=>handleSelectChat(item.id)}
                        onKeyDown={(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();handleSelectChat(item.id);}}}
                      >
                        <span className="hist-ttl">{item.title}</span>
                        <span className="hist-meta">{item.meta}</span>
                        <button type="button" className="hist-del" onClick={e=>handleDeleteChat(e,item.id)} title="Delete">×</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="sb-div" style={{margin:"10px 4px 6px"}}/>
              <p className="sb-lbl">{t("browseSchemes")}</p>
              {SCHEME_NAV.map(s=>(
                <button key={s.id} type="button" className={`scheme-nav-btn${activeScheme===s.id?" active":""}`} onClick={()=>handleSchemeNav(s)}>
                  <span className="sn-dot" style={{background:s.color}}/>
                  <span className="sn-name">{s.name}</span>
                  <span className="sn-cat">{s.cat}</span>
                </button>
              ))}
            </div>

            <div className="sb-footer">
              <button type="button" className="profile-btn" onClick={()=>setProfile(true)}>
                <IDoc/> {t("citizenProfile")}
              </button>
            </div>
          </aside>

          {/* CHAT CANVAS */}
          <main className="chat-canvas" ref={canvasRef} style={{position:"relative"}}>
            {sidebarCollapsed&&(
              <button type="button" className="sidebar-open-btn" onClick={()=>setSidebarCollapsed(false)}>☰</button>
            )}
            <StepTracker currentStep={currentStep} isLoggedIn={isLoggedIn}/>

            <div className="canvas-in">
              {!messages&&(
                <div className="empty-state">
                  <div className="empty-orb"><AiLogo size={30}/></div>
                  <div className="empty-ttl">{t("emptyTitle")}</div>
                  <p className="empty-sub">{t("emptySub")}</p>
                  <div className="quick-chips" style={{justifyContent:"center"}}>
                    {STARTERS.map((q,i)=>(
                      <button key={i} type="button" className="chip" onClick={()=>handleSend(q)}>{q}</button>
                    ))}
                  </div>
                  <button type="button" className="find-schemes-cta" onClick={()=>setProfile(true)}>
                    🔍 Find My Schemes
                  </button>
                </div>
              )}

              {messages&&(
                <div className="msgs-col">
                  <div className="turn ai-turn">
                    <div className="turn-av"><span className="turn-av-dot"/></div>
                    <div className="turn-body">
                      <div className="turn-meta"><AiLogo size={18}/><span className="turn-name" style={{marginLeft:5}}>PolicyPilot AI</span></div>
                      <div className="ai-card">
                        <p className="ai-txt">Namaste! I'm PolicyPilot — your AI guide to government welfare schemes. Tell me about your situation and I'll find the schemes you qualify for.</p>
                      </div>
                    </div>
                  </div>

                  {messages.map((msg,i)=>msg.role==="user"?(
                    <div key={i} className="turn user-turn">
                      <div className="turn-body">
                        <div className="turn-meta user-meta">
                          <span className="turn-name">You</span>
                          <span className="turn-time">{msg.time}</span>
                        </div>
                        <div className="user-bubble">{msg.text}</div>
                      </div>
                    </div>
                  ):(
                    <div key={i} className="turn ai-turn">
                      <div className="turn-av"><span className="turn-av-dot"/></div>
                      <div className="turn-body">
                        <div className="turn-meta"><AiLogo size={18}/><span className="turn-name" style={{marginLeft:5}}>PolicyPilot AI</span><span className="turn-time">{msg.time}</span></div>
                        <div className="ai-card">
                          <p className="ai-txt">{msg?.text || "Here are your matched schemes."}</p>
                          <div className="quick-chips">
                            {["Tell me about PM Kisan documents","How to apply for Ayushman Bharat","What's the scholarship deadline?"].map((q,qi)=>(
                              <button key={qi} type="button" className="chip" onClick={()=>handleSend(q)}>{q}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isTyping&&(
                    <div className="turn ai-turn">
                      <div className="turn-av"><span className="turn-av-dot"/></div>
                      <div className="turn-body">
                        <div className="turn-meta"><AiLogo size={18}/><span className="turn-name" style={{marginLeft:5}}>PolicyPilot AI</span></div>
                        <SmartTyping/>
                      </div>
                    </div>
                  )}

                  {apiError&&(
                    <div className="turn ai-turn">
                      <div className="turn-av"><span className="turn-av-dot"/></div>
                      <div className="turn-body">
                        <div className="error-panel">
                          <span className="error-icon">⚠️</span>
                          <div>
                            <div className="error-msg">{apiError}</div>
                            <button type="button" className="error-retry" onClick={()=>handleSend(messages?.[messages.length-1]?.text||"")}>Retry →</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* INPUT */}
              <div className="input-shell">
                {chatFile&&(
                  <div className="chat-upload-preview">
                    ✓ <span>{t("uploadedPrefix")} {chatFile}</span>
                    <button type="button" onClick={()=>setChatFile(null)} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:"var(--navy)",fontSize:14}}>×</button>
                  </div>
                )}
                <div className="input-box">
                  <div className="input-tools">
                    <input ref={chatFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{display:"none"}} onChange={handleChatFileChange}/>
                    <button type="button" className={`itool${speech.listening?" listening":""}`} onClick={speech.listening?speech.stop:speech.start}>
                      {speech.listening?<IStop/>:<IMic/>}
                    </button>
                    <button type="button" className="itool" onClick={()=>chatFileRef.current&&chatFileRef.current.click()}><IUp/></button>
                  </div>
                  <input type="text" className="ifield" placeholder={t("inputPlaceholder")} value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={handleKey}/>
                  <button type="button" className="isend" onClick={()=>handleSend()}><ISend/></button>
                </div>
                {speech.listening&&<div className="listen-pill">{t("listening")}</div>}
                {micErrorMsg&&<div className="mic-error">{micErrorMsg}</div>}
              </div>
              <div className="chat-note">{t("disclaimer")}</div>
            </div>
          </main>

          {/* RIGHT PANEL */}
          <aside className="right-panel">
            <div className="rp-hdr">
              <div className="rp-hdr-l"><ITarget/><span className="rp-ttl">{t("matchedSchemes")}</span></div>
              {results.length>0&&<span className="rp-count">{results.length} {t("found")}</span>}
            </div>
            <div className="rp-scroll">
              {isTyping?(
                <div className="rp-loading"><span>🔎</span> Searching schemes…</div>
              ):results.length===0?(
                <div className="rp-empty">
                  <div className="rp-empty-ico">🔍</div>
                  <p className="rp-empty-txt">{t("schemeResultsHint")}</p>
                </div>
              ):(
                results.map((s,i)=><ResultCard key={s.id||i} scheme={s} idx={i} visible={visibleCards.includes(i)}/>)
              )}
            </div>
          </aside>
        </div>

        {/* TRUST BAR */}
        <div className="trust-bar">
          <div className="trust-item">🤖 Powered by AI Policy Engine</div>
          <div className="trust-dot"/>
          <div className="trust-item">✅ Verified Government Sources</div>
          <div className="trust-dot"/>
          <div className="trust-item">🔒 Data Stays on Your Device</div>
        </div>

        {/* PROFILE SHEET */}
        {profileOpen&&<div className="overlay" onClick={()=>setProfile(false)}/>}
        <div className={`sheet${profileOpen?" open":""}`} role="dialog" aria-modal="true">
          <div className="sheet-inner">
            <div className="sheet-head">
              <div className="sheet-head-l"><AiLogo size={28}/><h2>{t("profileTitle")}</h2></div>
              <button type="button" className="sheet-cls" onClick={()=>setProfile(false)}>×</button>
            </div>
            <p className="sheet-desc">{t("profileDesc")}</p>

            <div className="form-stack">
              {/* Eligibility */}
              <div style={{borderRadius:13,border:"1.5px solid rgba(196,165,116,0.35)",overflow:"hidden",background:"rgba(232,223,201,0.18)"}}>
                <div style={{padding:"10px 14px 9px",borderBottom:"1px solid rgba(196,165,116,0.2)",background:"rgba(232,223,201,0.35)",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:12}}>🧬</span>
                  <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#8a6d3e"}}>Eligibility Details</span>
                </div>
                <div style={{padding:"12px 14px 14px",display:"flex",flexDirection:"column",gap:13}}>
                  <FField label="Scheme Coverage Preference">
                    <div className="scope-toggle" style={{marginTop:4}}>
                      <button type="button" className={`scope-btn${schemeScope==="Central Schemes (All India)"?" active":""}`} onClick={()=>setSchemeScope("Central Schemes (All India)")}>🏛 Central</button>
                      <button type="button" className={`scope-btn${schemeScope==="State Schemes (Regional)"?" active":""}`} onClick={()=>setSchemeScope("State Schemes (Regional)")}>🗺 State</button>
                    </div>
                  </FField>
                  <FField label="Social Category"><PillToggle options={["SC","ST"]} value={socialCategory} onChange={setSocialCategory}/></FField>
                  <FField label="Gender"><SegToggle options={["Male","Female","Other"]} value={gender} onChange={setGender}/></FField>
                  <FField label="Education">
                    <FSelect value={education} onChange={e=>setEducation(e.target.value)}>
                      <option value="">Select</option>
                      <option>School Student</option><option>Undergraduate</option><option>Postgraduate</option>
                      <option>ITI / Diploma</option><option>Farmer</option><option>Self-Employed</option><option>Unemployed</option>
                    </FSelect>
                  </FField>
                  <FField label="Annual Family Income">
                    <div className="income-selected">{INCOME_BRACKETS[incomeIdx]}</div>
                    <input type="range" className="income-range" min="0" max="4" step="1" value={incomeIdx} onChange={e=>setIncomeIdx(Number(e.target.value))}/>
                  </FField>
                  <FField label="Residence Type"><PillToggle options={["Rural","Urban","Semi-Urban"]} value={residenceType} onChange={setResidenceType}/></FField>
                </div>
              </div>

              <FSec {...FSECS_BASE[0]} label={t("personalInfo")}>
                <FField label="Full Name" required><FInput type="text" placeholder="As on Aadhaar"/></FField>
                <FField label="Age" required><FInput type="text" inputMode="numeric" placeholder="Years"/></FField>
              </FSec>

              <FSec {...FSECS_BASE[1]} label={t("economicProfile")}>
                <FField label="Occupation" required><FInput type="text" placeholder="e.g. Agriculture, Daily wage"/></FField>
                <FField label="BPL / APL Status">
                  <FSelect defaultValue=""><option value="">Select</option><option>Below Poverty Line (BPL)</option><option>Above Poverty Line (APL)</option><option>Not Sure</option></FSelect>
                </FField>
              </FSec>

              <FSec {...FSECS_BASE[2]} label={t("location")}>
                <FField label="State / Union Territory" required>
                  <FSelect value={formState} onChange={e=>setFormState(e.target.value)} disabled={isCentralScope}>
                    {STATES.map(s=><option key={s} value={s}>{s}</option>)}
                  </FSelect>
                  {isCentralScope&&<span className="fld-hint">🌐 Central schemes — state not required.</span>}
                </FField>
                <FField label="District / Taluka"><FInput type="text" placeholder="e.g. Anand, Surat"/></FField>
              </FSec>

              <FSec {...FSECS_BASE[3]} label={t("documents")}>
                <FField label="Aadhaar Number" required>
                  <FInput type="text" inputMode="numeric" placeholder="12-digit Aadhaar" maxLength={14}/>
                </FField>
                <div className="secure-badge"><span>🔒</span><span>Secure Document Processing Enabled</span></div>
                <FField label="Income Certificate"><UploadPh name="Upload Income Certificate" hint="PDF or image" uploadedPrefix={t("uploadedPrefix")}/></FField>
                <FField label="Caste Certificate"><UploadPh name="Upload Caste Certificate" hint="PDF or image — if applicable" uploadedPrefix={t("uploadedPrefix")}/></FField>
                <div>
                  <div className="digilocker-divider">
                    <div className="digilocker-divider-line"/><span className="digilocker-divider-text">OR FETCH FROM DIGILOCKER</span><div className="digilocker-divider-line"/>
                  </div>
                  <button type="button" className="digilocker-btn" onClick={()=>setLoginModal(true)}>
                    <span>🗂️</span>Fetch Documents from DigiLocker<span className="digilocker-trusted">Govt Trusted</span>
                  </button>
                </div>
              </FSec>

              <FSec {...FSECS_BASE[4]} label={t("schemeInterest")}>
                <FField label="Primary Need Category">
                  <FSelect defaultValue=""><option value="">Select</option><option>Agriculture</option><option>Education</option><option>Health</option><option>Housing</option><option>Employment</option><option>Women &amp; Child</option><option>Finance &amp; Credit</option></FSelect>
                </FField>
                <FField label="Family Size"><FInput type="text" inputMode="numeric" placeholder="Number of family members"/></FField>
              </FSec>
            </div>

            {!isLoggedIn&&(
              <div className="auth-section">
                <div className="auth-section-title">🔐 Save Your Progress</div>
                <p style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.5}}>Sign in to securely save your profile and scheme matches.</p>
                <button type="button" className="auth-sign-in-btn" onClick={()=>{setProfile(false);setLoginModal(true);}}>🔐 Sign in to Save &amp; Continue</button>
                <button type="button" className="auth-guest-link" onClick={()=>setProfile(false)}>Continue as Guest</button>
              </div>
            )}

            <div className="sheet-acts">
              <button type="button" className="btn-sec">{t("uploadMoreDocs")}</button>
              <button type="button" className="btn-pri" onClick={()=>{
                const parts=[];
                if(gender) parts.push(gender.toLowerCase());
                if(education) parts.push(education.toLowerCase());
                if(residenceType) parts.push(`${residenceType.toLowerCase()} area`);
                if(socialCategory) parts.push(`${socialCategory} category`);
                parts.push(`income ${INCOME_BRACKETS[incomeIdx]}`);
                parts.push(`in ${isCentralScope?"India":formState}`);
                setProfile(false);
                handleSend(parts.join(", ")+" — find all government schemes I qualify for");
              }}>{t("saveProfile")}</button>
            </div>
          </div>
        </div>

        {/* LOGIN MODAL */}
        {loginModal&&(
          <LoginModal
            onClose={()=>setLoginModal(false)}
            onSuccess={handleAuthSuccess}
            onGoogle={handleGoogleSignIn}
          />
        )}

        {/* TOAST */}
        {toast&&<div className={`toast${toast.type==="error"?" error":""}`}>{toast.msg}</div>}

      </div>
    </>
  );
}
