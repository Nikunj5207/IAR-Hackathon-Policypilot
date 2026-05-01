import os
import re
import shutil
import uuid
import logging
import time
import traceback
import hashlib
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import gc

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("policypilot.main")

app = FastAPI(title="PolicyPilot API", version="2.0.0")

# ── CORS ──────────────────────────────────────────────────────
frontend_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "https://frontendpolicypilot.vercel.app",
    "https://frontendpolicypilot-ui.vercel.app",
]
extra_origins = os.getenv("ALLOWED_ORIGINS", "")
if extra_origins:
    frontend_origins.extend([o.strip() for o in extra_origins.split(",") if o.strip()])

# Remove duplicates
frontend_origins = list(set(frontend_origins))
logger.info(f"CORS Allowed Origins: {frontend_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cors_debug_headers(request, call_next):
    origin = request.headers.get("origin")
    if origin:
        logger.info(f"Request Origin: {origin}")
    response = await call_next(request)
    return response

UPLOAD_DIR = "uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── Simple in-memory query cache ──────────────────────────────
_RESPONSE_CACHE: dict = {}
_CACHE_MAX = 100  # keep at most 100 entries


def _cache_key(profile: str, lang: str) -> str:
    return hashlib.md5(f"{profile.strip().lower()}:{lang}".encode()).hexdigest()


def _cache_get(profile: str, lang: str):
    return _RESPONSE_CACHE.get(_cache_key(profile, lang))


def _cache_set(profile: str, lang: str, value: dict):
    key = _cache_key(profile, lang)
    if len(_RESPONSE_CACHE) >= _CACHE_MAX:
        # Evict oldest key
        _RESPONSE_CACHE.pop(next(iter(_RESPONSE_CACHE)), None)
    _RESPONSE_CACHE[key] = value


# ── In-memory chat store ──────────────────────────────────────
# Format: { chat_id: { id, title, meta, messages: [], schemes: [] } }
chats_store = {}


def get_rag_engine():
    from rag_engine import load_and_index_pdfs, get_vectorstore
    return load_and_index_pdfs, get_vectorstore


def get_agent():
    from agent import find_schemes, generate_application_checklist
    return find_schemes, generate_application_checklist


def get_conflict_detector():
    from conflict_detector import detect_conflicts, check_all_conflicts
    return detect_conflicts, check_all_conflicts


def get_form_filler():
    from form_filler import process_uploaded_document
    return process_uploaded_document

# ── Pydantic models ───────────────────────────────────────────
class ChatCreate(BaseModel):
    title: str

class FindSchemesRequest(BaseModel):
    citizen_profile: str
    chat_id: Optional[str] = None
    preferred_language: Optional[str] = "en"

class ChecklistRequest(BaseModel):
    scheme_name: str
    citizen_profile: str

class ConflictRequest(BaseModel):
    scheme_name: str

class AllConflictsRequest(BaseModel):
    schemes: str  # comma-separated


# ════════════════════════════════════════════════════════════════
# BASIC ENDPOINTS
# ════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    logger.info("Root health check called")
    return {"message": "PolicyPilot API is running!"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/index-pdfs")
def index_pdfs():
    try:
        load_and_index_pdfs, _ = get_rag_engine()
        load_and_index_pdfs()
        return {"message": "✅ PDFs successfully indexed!"}
    except Exception as e:
        logger.exception("Failed to index PDFs")
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
# FIND SCHEMES — JSON body (used by frontend)
# ════════════════════════════════════════════════════════════════

@app.post("/find-schemes")
async def find_schemes_endpoint(body: FindSchemesRequest):
    start = time.time()
    lang = body.preferred_language or "en"
    logger.info("[find-schemes] Request received | profile_len=%d | lang=%s", len(body.citizen_profile), lang)
    try:
        # ── Cache check ──────────────────────────────────────────
        cached = _cache_get(body.citizen_profile, lang)
        if cached and not body.chat_id:  # don’t serve cache when linked to a specific chat
            logger.info("[find-schemes] Cache HIT — returning cached result in %.2fs", time.time() - start)
            return cached

        # ── AI + RAG call ──────────────────────────────────────────
        t1 = time.time()
        find_schemes, _ = get_agent()
        logger.info("[find-schemes] Agent imported in %.2fs", time.time() - t1)

        t2 = time.time()
        result = find_schemes(body.citizen_profile, preferred_language=lang)
        if result.get("error"):
            raise Exception(result["error"])
        logger.info("[find-schemes] find_schemes() completed in %.2fs", time.time() - t2)

        schemes = result.get("schemes", [])
        sources = result.get("sources", [])
        model_conflicts = result.get("conflicts", [])

        t3 = time.time()
        enriched_schemes = _enrich_schemes_with_checklist(schemes)
        conflicts = model_conflicts or _detect_scheme_conflicts(enriched_schemes)
        summary = _build_plain_language_summary(enriched_schemes, lang)
        message = result.get("message", "") or summary or "Here are your matched schemes."
        logger.info("[find-schemes] Enrichment + conflict check in %.2fs", time.time() - t3)

        # ── Persist to chat store ───────────────────────────────────
        if body.chat_id and body.chat_id in chats_store:
            chat = chats_store[body.chat_id]
            chat["messages"].append({"role": "user",  "content": body.citizen_profile})
            chat["messages"].append({"role": "ai",    "content": message})
            chat["schemes"] = enriched_schemes
            if len(chat["messages"]) <= 2:
                chat["title"] = body.citizen_profile[:50]

        response_payload = {
            "status": "success",
            "schemes": enriched_schemes,
            "sources": sources,
            "message": message,
            "checklists": [
                {"scheme": s.get("title"), "checklist": s.get("applicationChecklist", [])}
                for s in enriched_schemes
            ],
            "conflicts": conflicts,
            "summary": summary,
        }

        # Cache only non-chat responses
        if not body.chat_id:
            _cache_set(body.citizen_profile, lang, response_payload)

        return response_payload

    except Exception as e:
        logger.error(traceback.format_exc())
        logger.exception("[find-schemes] Endpoint failed")
        return {"error": str(e)}
    finally:
        gc.collect()
        logger.info("[find-schemes] Total time: %.2fs", time.time() - start)


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
        s = dict(scheme) if isinstance(scheme, dict) else {
            "id": idx + 1,
            "title": str(scheme),
        }
        title = s.get("title") or f"Scheme {idx + 1}"
        s["title"] = title
        s["applicationChecklist"] = _build_checklist_for_scheme(title)
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
        _, generate_application_checklist = get_agent()
        checklist = generate_application_checklist(
            body.scheme_name, body.citizen_profile
        )
        return {
            "status": "success",
            "scheme": body.scheme_name,
            "checklist": checklist,
        }
    except Exception as e:
        logger.exception("get-checklist endpoint failed")
        return {"error": str(e)}


# ════════════════════════════════════════════════════════════════
# CONFLICT DETECTION — JSON body
# ════════════════════════════════════════════════════════════════

@app.post("/detect-conflict")
async def detect_conflict_endpoint(body: ConflictRequest):
    try:
        detect_conflicts, _ = get_conflict_detector()
        result = detect_conflicts(body.scheme_name)
        return {"status": "success", "conflict_analysis": result}
    except Exception as e:
        logger.exception("detect-conflict endpoint failed")
        return {"error": str(e)}


@app.post("/check-all-conflicts")
async def check_all_conflicts_endpoint(body: AllConflictsRequest):
    try:
        _, check_all_conflicts = get_conflict_detector()
        schemes_list = [s.strip() for s in body.schemes.split(",")]
        result = check_all_conflicts(schemes_list)
        return {"status": "success", "conflicts": result}
    except Exception as e:
        logger.exception("check-all-conflicts endpoint failed")
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
        process_uploaded_document = get_form_filler()
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
        logger.exception("upload-and-fill endpoint failed")
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
