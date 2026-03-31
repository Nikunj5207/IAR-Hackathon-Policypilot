import os
import re
import shutil
import uuid
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from agent import find_schemes, generate_application_checklist, get_scheme_detail
from conflict_detector import detect_conflicts, check_all_conflicts
from form_filler import process_uploaded_document
from rag_engine import load_and_index_pdfs, get_vectorstore

load_dotenv()

app = FastAPI(title="PolicyPilot API", version="2.0.0")

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── In-memory chat store ──────────────────────────────────────
# Format: { chat_id: { id, title, meta, messages: [], schemes: [] } }
chats_store = {}

# ── Pydantic models ───────────────────────────────────────────
class ChatCreate(BaseModel):
    title: str

class FindSchemesRequest(BaseModel):
    citizen_profile: str
    chat_id: Optional[str] = None
    preferred_language: Optional[str] = "en"
    conversation_history: Optional[list] = []

class ChecklistRequest(BaseModel):
    scheme_name: str
    citizen_profile: str

class ConflictRequest(BaseModel):
    scheme_name: str

class AllConflictsRequest(BaseModel):
    schemes: str  # comma-separated

class SchemeDetailRequest(BaseModel):
    scheme_name: str
    citizen_profile: Optional[str] = ""
    preferred_language: Optional[str] = "en"


# ════════════════════════════════════════════════════════════════
# BASIC ENDPOINTS
# ════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {"message": "PolicyPilot API is running!"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/index-pdfs")
def index_pdfs():
    try:
        load_and_index_pdfs()
        return {"message": "✅ PDFs successfully indexed!"}
    except Exception as e:
        return {"error": str(e)}


# ════════════════════════════════════════════════════════════════
# CHAT ENDPOINTS
# ════════════════════════════════════════════════════════════════

@app.post("/chats")
def create_chat(body: ChatCreate):
    chat_id = str(uuid.uuid4())
    chats_store[chat_id] = {
        "id": chat_id,
        "title": body.title[:60] if body.title else "New Chat",
        "meta": "Today",
        "messages": [],
        "schemes": [],
        "created_at": datetime.now().isoformat(),
    }
    return chats_store[chat_id]


@app.get("/chats")
def get_chats():
    # Return chats sorted newest first
    sorted_chats = sorted(
        chats_store.values(),
        key=lambda c: c.get("created_at", ""),
        reverse=True
    )
    return sorted_chats


@app.delete("/chats/{chat_id}")
def delete_chat(chat_id: str):
    chats_store.pop(chat_id, None)
    return {"deleted": True}


@app.get("/chats/{chat_id}/messages")
def get_chat_messages(chat_id: str):
    chat = chats_store.get(chat_id)
    if not chat:
        return {"messages": [], "schemes": []}
    return {
        "messages": chat.get("messages", []),
        "schemes": chat.get("schemes", []),
    }


# ════════════════════════════════════════════════════════════════

def _normalize_conflict_keys(conflicts):
    out = []
    for c in conflicts:
        out.append({
            "schemeA": c.get("schemeA") or c.get("scheme_a", ""),
            "schemeB": c.get("schemeB") or c.get("scheme_b", ""),
            "reason":  c.get("reason", ""),
            "explanation": c.get("explanation", ""),
        })
    return out


# FIND SCHEMES — JSON body (used by frontend)
# ════════════════════════════════════════════════════════════════

@app.post("/find-schemes")
async def find_schemes_endpoint(body: FindSchemesRequest):
    try:
        result = find_schemes(
            body.citizen_profile,
            preferred_language=body.preferred_language or "en",
            conversation_history=body.conversation_history or []
        )
        schemes = result.get("schemes", [])
        sources = result.get("sources", [])
        model_conflicts = result.get("conflicts", [])
        guidance = result.get("guidance", {}) or {}
        
        enriched_schemes = _enrich_schemes_with_checklist(schemes)
        
        # NEW: generate real RAG-grounded checklists for top schemes
        checklists = []
        for s in enriched_schemes[:3]:
            try:
                cl = generate_application_checklist(s.get("title", ""), body.citizen_profile)
                checklists.append({"scheme": s.get("title"), "checklist": cl})
                # Also inject into the scheme card itself
                s["applicationChecklist"] = [line.strip() for line in cl.split("\n") if line.strip()][:8]
            except Exception:
                checklists.append({"scheme": s.get("title"), "checklist": s.get("applicationChecklist", [])})
        
        conflicts = _normalize_conflict_keys(model_conflicts or _detect_scheme_conflicts(enriched_schemes))
        summary = _build_plain_language_summary(
            enriched_schemes, body.preferred_language or "en"
        )
        message = guidance.get("intro") or summary or "Here are your matched schemes."

        # Persist to chat store if chat_id given
        if body.chat_id and body.chat_id in chats_store:
            chat = chats_store[body.chat_id]
            chat["messages"].append({
                "role": "user",
                "content": body.citizen_profile,
            })
            chat["messages"].append({
                "role": "ai",
                "content": message,
            })
            chat["schemes"] = enriched_schemes
            # Update title from first user message
            if len(chat["messages"]) <= 2:
                chat["title"] = body.citizen_profile[:50]

        return {
            "status": "success",
            "schemes": enriched_schemes,
            "sources": sources,
            "message": message,
            "guidance": guidance,       # Return full guidance object to frontend
            "checklists": checklists,   # now real RAG output
            "conflicts": conflicts,
            "summary": summary,
        }

    except Exception as e:
        return {"error": str(e)}


def _normalize_scheme_key(title: str) -> str:
    t = (title or "").lower()
    t = re.sub(r"[^a-z0-9\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def _build_checklist_for_scheme(title: str):
    return [
        f"Verify eligibility criteria for {title} on the official portal.",
        "Keep Aadhaar, income proof, and residence/caste certificates ready (if applicable).",
        "Visit nearest CSC/tehsil office or submit through the scheme portal.",
        "Track application reference number and complete pending verifications.",
        "Check timeline/deadline notifications on the official website.",
    ]


def _enrich_schemes_with_checklist(schemes: list):
    enriched = []
    for idx, scheme in enumerate(schemes):
        s = dict(scheme) if isinstance(scheme, dict) else {"id": idx + 1, "title": str(scheme)}
        title = s.get("title") or f"Scheme {idx + 1}"
        s["title"] = title
        # PRESERVE whatever agent.py already set for bullets/reason/explainPoints
        # Only add applicationChecklist if not already present
        if not s.get("applicationChecklist"):
            s["applicationChecklist"] = _build_checklist_for_scheme(title)
        # Add draftForm placeholder
        s["draftForm"] = {
            "status": "pending_document_upload",
            "note": "Upload citizen documents to auto-fill the draft application form.",
        }
        enriched.append(s)
    return enriched


def _detect_scheme_conflicts(schemes: list):
    conflicts = []
    seen = {}
    for scheme in schemes:
        title = scheme.get("title", "")
        key = _normalize_scheme_key(title)
        # central/state variation heuristic
        base = key.replace("central", "").replace("state", "").strip()
        if not base:
            base = key
        if base in seen and seen[base] != title:
            conflicts.append({
                "scheme_base": base,
                "conflict_found": True,
                "central_version": seen[base],
                "state_version": title,
                "explanation": "Possible central/state criteria mismatch detected. Verify age, income and domicile clauses.",
            })
        else:
            seen[base] = title
    return conflicts


# ════════════════════════════════════════════════════════════════
# SCHEME DETAIL ENDPOINT
# ════════════════════════════════════════════════════════════════

@app.post("/scheme-detail")
async def scheme_detail_endpoint(body: SchemeDetailRequest):
    try:
        result = get_scheme_detail(
            body.scheme_name,
            body.citizen_profile or "",
            body.preferred_language or "en",
        )
        return {"status": "success", **result}
    except Exception as e:
        return {"error": str(e)}


# ── AUTHENTICATION ENDPOINTS (DUMMY FOR PILOT) ───────────────────

class AuthRequest(BaseModel):
    email: str = None
    phone: str = None
    password: str = None
    name: str = None

@app.post("/auth/signup")
async def auth_signup(req: AuthRequest):
    return {
        "token": "dummy-jwt-token-12345",
        "user": {"name": req.name or "Citizen", "email": req.email, "phone": req.phone}
    }

@app.post("/auth/login")
async def auth_login(req: AuthRequest):
    return {
        "token": "dummy-jwt-token-67890",
        "user": {"name": "Citizen User", "email": req.email, "phone": req.phone}
    }

@app.post("/auth/google")
async def auth_google():
    return {
        "token": "dummy-jwt-token-google-abcde",
        "user": {"name": "Google User", "email": "user@gmail.com"}
    }


def _build_plain_language_summary(schemes: list, preferred_language: str):
    count = len(schemes)
    top_titles = [s.get("title", "Scheme") for s in schemes[:3]]
    titles_text = ", ".join(top_titles) if top_titles else "No direct scheme match yet"
    lang = (preferred_language or "en").lower()
    if lang.startswith("hi"):
        return f"आपके प्रोफाइल के आधार पर {count} योजनाएं मिलीं: {titles_text}. प्रत्येक योजना के लिए पात्रता कारण और आवेदन चेकलिस्ट शामिल है।"
    return f"Based on your profile, {count} schemes were matched: {titles_text}. Each scheme includes eligibility reasoning and an application checklist."


# ════════════════════════════════════════════════════════════════
# CHECKLIST — JSON body
# ════════════════════════════════════════════════════════════════

@app.post("/get-checklist")
async def get_checklist(body: ChecklistRequest):
    try:
        checklist = generate_application_checklist(
            body.scheme_name, body.citizen_profile
        )
        return {
            "status": "success",
            "scheme": body.scheme_name,
            "checklist": checklist,
        }
    except Exception as e:
        return {"error": str(e)}


# ════════════════════════════════════════════════════════════════
# CONFLICT DETECTION — JSON body
# ════════════════════════════════════════════════════════════════

@app.post("/detect-conflict")
async def detect_conflict_endpoint(body: ConflictRequest):
    try:
        result = detect_conflicts(body.scheme_name)
        return {"status": "success", "conflict_analysis": result}
    except Exception as e:
        return {"error": str(e)}


@app.post("/check-all-conflicts")
async def check_all_conflicts_endpoint(body: AllConflictsRequest):
    try:
        schemes_list = [s.strip() for s in body.schemes.split(",")]
        result = check_all_conflicts(schemes_list)
        return {"status": "success", "conflicts": result}
    except Exception as e:
        return {"error": str(e)}


# ════════════════════════════════════════════════════════════════
# DOCUMENT UPLOAD + FORM FILL — multipart (file upload)
# ════════════════════════════════════════════════════════════════

@app.post("/upload-and-fill")
async def upload_and_fill(
    scheme_name: str = Form(...),
    document: UploadFile = File(...),
):
    try:
        file_path = os.path.join(UPLOAD_DIR, document.filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(document.file, f)

        result = process_uploaded_document(file_path, scheme_name)
        return {
            "status": "success",
            "scheme": scheme_name,
            "citizen_info": result["citizen_info"],
            "filled_form": result["filled_form"],
        }
    except Exception as e:
        return {"error": str(e)}