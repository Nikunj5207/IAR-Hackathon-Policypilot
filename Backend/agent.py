import os
import json
import re
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = None


def get_groq_client():
    global client
    if client is not None:
        return client
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")
    client = Groq(api_key=api_key)
    return client


CATEGORY_STYLE = {
    "Agriculture": {"tagColor": "#2d6a4f", "tagBg": "rgba(45,106,79,0.10)"},
    "Health": {"tagColor": "#1d6fa4", "tagBg": "rgba(29,111,164,0.10)"},
    "Education": {"tagColor": "#6b3fa0", "tagBg": "rgba(107,63,160,0.10)"},
    "Housing": {"tagColor": "#b5550a", "tagBg": "rgba(181,85,10,0.10)"},
    "Employment": {"tagColor": "#7a6c00", "tagBg": "rgba(122,108,0,0.10)"},
    "Women": {"tagColor": "#9b2d5a", "tagBg": "rgba(155,45,90,0.10)"},
    "Finance": {"tagColor": "#0f5e6e", "tagBg": "rgba(15,94,110,0.10)"},
    "Labour": {"tagColor": "#4a6e2d", "tagBg": "rgba(74,110,45,0.10)"},
}

LANG_CONFIG = {
    "en": {
        "name": "English",
        "invalid_title": "Invalid Input Detected",
        "invalid_suffix": "Please provide valid details like age, state, occupation, category, and income range.",
        "no_match_title": "No Exact Match Found",
        "no_match_line_1": "We could not find a direct scheme match from current profile details.",
        "no_match_line_2": "Please share state, age, income, occupation, and social category for better recommendations.",
        "conflict_title": "Conflict Detected",
        "conflict_intro": "You may be eligible for multiple schemes, but they may not be applied together.",
        "comparison": "Comparison",
        "recommendation": "Recommendation",
        "next_step": "Next Step",
        "eligible_title": "Eligible Schemes",
        "why_title": "Why You Qualify",
        "apply_title": "How to Apply (Step-by-step)",
        "documents_title": "Documents Required",
        "default_reason": "Matched based on your profile details and policy documents.",
        "followup": "Would you like a detailed checklist for any one scheme?",
        "invalid_followup": "Share valid profile details to continue.",
    },
    "hi": {
        "name": "Hindi",
        "invalid_title": "अमान्य इनपुट पाया गया",
        "invalid_suffix": "कृपया आयु, राज्य, पेशा, श्रेणी और आय जैसी सही जानकारी दें।",
        "no_match_title": "कोई सटीक मिलान नहीं मिला",
        "no_match_line_1": "आपकी वर्तमान जानकारी से सटीक योजना मिलान नहीं हुआ।",
        "no_match_line_2": "बेहतर सुझाव के लिए राज्य, आयु, आय, पेशा और सामाजिक श्रेणी बताएं।",
        "conflict_title": "संघर्ष पाया गया",
        "conflict_intro": "आप कई योजनाओं के लिए पात्र हो सकते हैं, लेकिन उन्हें एक साथ लागू नहीं किया जा सकता।",
        "comparison": "तुलना",
        "recommendation": "सिफारिश",
        "next_step": "अगला कदम",
        "eligible_title": "पात्र योजनाएं",
        "why_title": "आप क्यों पात्र हैं",
        "apply_title": "आवेदन कैसे करें (चरण-दर-चरण)",
        "documents_title": "आवश्यक दस्तावेज़",
        "default_reason": "आपकी प्रोफ़ाइल और नीति दस्तावेज़ों के आधार पर मिलान किया गया है।",
        "followup": "क्या आप किसी एक योजना के लिए विस्तृत आवेदन चेकलिस्ट चाहते हैं?",
        "invalid_followup": "जारी रखने के लिए सही प्रोफ़ाइल विवरण साझा करें।",
    },
    "gu": {
        "name": "Gujarati",
        "invalid_title": "અમાન્ય ઇનપુટ મળ્યો",
        "invalid_suffix": "કૃપા કરીને ઉંમર, રાજ્ય, વ્યવસાય, શ્રેણી અને આવક જેવી માન્ય માહિતી આપો.",
        "no_match_title": "ચોક્કસ મેળ મળ્યો નથી",
        "no_match_line_1": "હાલની માહિતી પરથી ચોક્કસ યોજના મળી નથી.",
        "no_match_line_2": "સારા સૂચનો માટે રાજ્ય, ઉંમર, આવક, વ્યવસાય અને સામાજિક શ્રેણી આપો.",
        "conflict_title": "વિરોધ જોવા મળ્યો",
        "conflict_intro": "તમે અનેક યોજનાઓ માટે પાત્ર હોઈ શકો, પણ બંને સાથે લાગુ ન થઈ શકે.",
        "comparison": "તુલના",
        "recommendation": "ભલામણ",
        "next_step": "આગળનું પગલું",
        "eligible_title": "પાત્ર યોજનાઓ",
        "why_title": "તમે કેમ પાત્ર છો",
        "apply_title": "અરજી કેવી રીતે કરવી (પગલું-દર-પગલું)",
        "documents_title": "જરૂરી દસ્તાવેજો",
        "default_reason": "તમારી પ્રોફાઇલ અને નીતિ દસ્તાવેજોના આધારે મેળવણી કરવામાં આવી છે.",
        "followup": "શું તમે કોઈ એક યોજના માટે વિગતવાર અરજી ચેકલિસ્ટ માંગો છો?",
        "invalid_followup": "આગળ વધવા માટે માન્ય પ્રોફાઇલ વિગતો શેર કરો.",
    },
}


def _lang_pack(preferred_language: str) -> dict:
    code = (preferred_language or "en").lower()
    if code.startswith("hi"):
        return LANG_CONFIG["hi"]
    if code.startswith("gu"):
        return LANG_CONFIG["gu"]
    return LANG_CONFIG["en"]


def _infer_category(title: str) -> str:
    t = (title or "").lower()
    if any(k in t for k in ["kisan", "farmer", "agri", "crop", "pmfb", "kcc"]):
        return "Agriculture"
    if any(k in t for k in ["health", "ayushman", "pm-jay", "medical"]):
        return "Health"
    if any(k in t for k in ["scholarship", "student", "education"]):
        return "Education"
    if any(k in t for k in ["awas", "housing", "house"]):
        return "Housing"
    if any(k in t for k in ["employment", "mgnregs", "mnrega", "job"]):
        return "Employment"
    if any(k in t for k in ["women", "sukanya", "ujjwala"]):
        return "Women"
    if any(k in t for k in ["finance", "credit", "loan", "mudra", "bank"]):
        return "Finance"
    if any(k in t for k in ["labour", "e-shram", "worker"]):
        return "Labour"
    return "Finance"


def _title_from_source(source_file: str) -> str:
    base = os.path.basename(source_file or "Government Scheme")
    name = os.path.splitext(base)[0]
    name = re.sub(r"[_\-]+", " ", name).strip()
    return " ".join(word.capitalize() for word in name.split()) or "Government Scheme"


def _fallback_from_sources(citizen_profile: str, sources: list[str]) -> dict:
    profile_tokens = set(re.findall(r"[a-zA-Z]{3,}", (citizen_profile or "").lower()))
    unique_sources = []
    for src in sources:
        if src and src not in unique_sources:
            unique_sources.append(src)

    schemes = []
    for idx, src in enumerate(unique_sources[:8]):
        title = _title_from_source(src)
        category = _infer_category(title)
        style = CATEGORY_STYLE[category]
        title_tokens = set(re.findall(r"[a-zA-Z]{3,}", title.lower()))
        overlap = len(profile_tokens.intersection(title_tokens))
        match = min(95, 65 + (overlap * 7))
        schemes.append({
            "id": idx + 1,
            "title": title,
            "tag": category,
            "tagColor": style["tagColor"],
            "tagBg": style["tagBg"],
            "match": match,
            "reason": "Matched from indexed government policy documents for your profile.",
            "bullets": [
                "Verify scheme eligibility on the official portal.",
                "Keep Aadhaar, income and domicile documents ready.",
                "Apply online or at the nearest facilitation office.",
            ],
            "explainPoints": [
                "Profile keywords overlap with this scheme category.",
                "Recommendation is generated from available policy PDFs.",
                "Final eligibility must be confirmed from official guidelines.",
            ],
            "conflict": None,
        })

    if not schemes:
        schemes.append({
            "id": 1,
            "title": "No direct scheme match found",
            "tag": "Finance",
            "tagColor": "#0f5e6e",
            "tagBg": "rgba(15,94,110,0.10)",
            "match": 50,
            "reason": "Could not derive a strong match from available documents.",
            "bullets": ["Try adding age, occupation, state, and social category."],
            "explainPoints": ["More profile details improve matching quality."],
            "conflict": None,
        })

    return {
        "schemes": schemes,
        "guidance": {
            "intro": "Based on your profile, here are the schemes that most likely match.",
            "steps": [
                "Open each scheme card and review the eligibility reason.",
                "Collect required documents (Aadhaar, income, caste/domicile if applicable).",
                "Proceed to checklist generation for exact application steps.",
            ],
            "followUp": "Would you like checklist steps for any specific scheme?",
        },
    }


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def _is_invalid_input(citizen_profile: str) -> tuple[bool, str]:
    text = _normalize_text(citizen_profile)
    if not text:
        return True, "Please share your profile details such as age, income, state, occupation, and category."
    if len(text) < 8:
        return True, "Your input is too short. Please add meaningful profile details."
    bad_patterns = [
        r"\bi am dead\b",
        r"\bdead\b",
        r"\bkill\b",
        r"\bfree money\b",
        r"\ball free money\b",
        r"\bborn today\b",
        r"\bage\s*0\b",
        r"\bnewborn\b",
    ]
    if any(re.search(p, text) for p in bad_patterns):
        return True, "The input looks invalid or unsafe. Please provide real citizen details for eligibility matching."
    return False, ""


SCHEME_KEYWORDS = [
    "ujjwala", "pm kisan", "ayushman", "pmay", "mnrega", "mudra",
    "sukanya", "jan dhan", "fasal bima", "svandhi", "e-shram",
    "scholarship", "nsp", "kisan credit", "atal pension", "awas", "insurance", "pension"
]

def _needs_more_info(citizen_profile: str) -> tuple[bool, str]:
    text = _normalize_text(citizen_profile)
    
    # If user mentions a specific scheme, don't block for more info
    is_scheme_query = any(kw in text for kw in SCHEME_KEYWORDS)
    if is_scheme_query:
        return False, ""

    has_income = bool(re.search(r"\b(income|lakh|rupee|salary|rs\.?)\b", text))
    has_state = bool(re.search(r"\b(gujarat|rajasthan|maharashtra|delhi|bihar|state|district|up|mp|punjab|haryana|tamil|kerala|karnataka|andhra|telangana|bengal|assam|odisha)\b", text))
    has_occupation = bool(re.search(r"\b(farmer|student|worker|labour|business|vendor|self employed|unemployed|government|private|service|retired|widow)\b", text))
    
    if sum([has_income, has_state, has_occupation]) < 2:
        return True, "Please share your income range, state, and occupation so I can match schemes accurately."
    return False, ""


def _extract_profile_tokens(citizen_profile: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z]{3,}", (citizen_profile or "").lower()))


def _scheme_relevance_score(scheme: dict, profile_tokens: set[str]) -> int:
    title = (scheme.get("title") or "").lower()
    reason = (scheme.get("reason") or "").lower()
    tag = (scheme.get("tag") or "").lower()
    combined = f"{title} {reason} {tag}"
    score = 0
    for token in profile_tokens:
        if token in combined:
            score += 3
    # Always keep if model already gave high match
    if isinstance(scheme.get("match"), (int, float)) and scheme["match"] >= 80:
        score += 10
    return score


def _dedupe_and_filter_schemes(schemes: list, citizen_profile: str) -> list:
    profile_tokens = _extract_profile_tokens(citizen_profile)
    dedup = {}
    for item in schemes:
        if not isinstance(item, dict):
            continue
        title = (item.get("title") or "").strip()
        if not title:
            continue
        key = re.sub(r"[^a-z0-9]+", " ", title.lower()).strip()
        score = _scheme_relevance_score(item, profile_tokens)
        existing = dedup.get(key)
        if existing is None or score > existing["_score"]:
            normalized = dict(item)
            normalized["_score"] = score
            dedup[key] = normalized

    filtered = [v for v in dedup.values() if v["_score"] > 0]
    if not filtered:
        filtered = list(dedup.values())
    filtered.sort(key=lambda s: (s.get("_score", 0), s.get("match", 0)), reverse=True)
    final = []
    for idx, scheme in enumerate(filtered[:8]):
        scheme.pop("_score", None)
        scheme["id"] = scheme.get("id", idx + 1)
        final.append(scheme)
    return final


def _detect_conflicts_local(schemes: list) -> list:
    conflicts = []
    for i in range(len(schemes)):
        for j in range(i + 1, len(schemes)):
            a = schemes[i]
            b = schemes[j]
            a_tag = (a.get("tag") or "").lower()
            b_tag = (b.get("tag") or "").lower()
            a_title = (a.get("title") or "").lower()
            b_title = (b.get("title") or "").lower()
            if a_tag == b_tag and a_tag in {"finance", "housing", "employment"}:
                conflicts.append({
                    "scheme_a": a.get("title", "Scheme A"),
                    "scheme_b": b.get("title", "Scheme B"),
                    "reason": "Potential overlap in benefits/subsidy category. Verify if both can be availed together.",
                })
            elif ("central" in a_title and "state" in b_title) or ("state" in a_title and "central" in b_title):
                conflicts.append({
                    "scheme_a": a.get("title", "Scheme A"),
                    "scheme_b": b.get("title", "Scheme B"),
                    "reason": "Central and state variants may have conflicting eligibility criteria.",
                })
    return conflicts


def _build_structured_response(
    citizen_profile: str,
    schemes: list,
    conflicts: list,
    preferred_language: str,
    invalid_msg: str = "",
    no_match: bool = False,
) -> str:
    lang = _lang_pack(preferred_language)
    if invalid_msg:
        return (
            f"{lang['invalid_title']}:\n"
            f"- {invalid_msg}\n\n"
            f"{lang['next_step']}:\n"
            f"- {lang['invalid_suffix']}"
        )

    if no_match:
        return (
            f"{lang['no_match_title']}:\n"
            "- "
            + lang["no_match_line_1"]
            + "\n- "
            + lang["no_match_line_2"]
        )

    if conflicts:
        top = conflicts[0]
        return (
            f"{lang['conflict_title']}:\n"
            f"{lang['conflict_intro']}\n\n"
            "Reason:\n"
            f"- {top['reason']}\n\n"
            f"{lang['comparison']}:\n"
            f"- {top['scheme_a']} -> potential overlapping benefit\n"
            f"- {top['scheme_b']} -> potential overlapping benefit\n\n"
            f"{lang['recommendation']}:\n"
            "- Apply first to the scheme with higher eligibility match and stronger document fit.\n\n"
            f"{lang['next_step']}:\n"
            "- Verify exclusion rules on the official portal/office before submission."
        )

    top = schemes[0] if schemes else {}
    docs = top.get("bullets") or ["Aadhaar", "Income Certificate", "Residence Proof"]
    steps = [
        "Confirm eligibility criteria on the official scheme portal.",
        "Collect required documents and ensure details match your profile.",
        "Submit application online or at your nearest facilitation office.",
    ]
    reason = top.get("reason") or lang["default_reason"]
    return (
        f"{lang['eligible_title']}:\n"
        + "\n".join([f"- {s.get('title', 'Government Scheme')}" for s in schemes[:5]])
        + f"\n\n{lang['why_title']}:\n"
        + f"- {reason}\n\n"
        + f"{lang['apply_title']}:\n"
        + "\n".join([f"{idx+1}. {step}" for idx, step in enumerate(steps)])
        + f"\n\n{lang['documents_title']}:\n"
        + "\n".join([f"- {d}" for d in docs[:5]])
        + f"\n\n{lang['next_step']}:\n"
        + "- Pick one scheme and proceed with checklist verification before applying."
    )


def find_schemes(citizen_profile: str, preferred_language: str = "en"):
    print(f"Searching schemes for: {citizen_profile}")

    is_invalid, invalid_msg = _is_invalid_input(citizen_profile)
    if is_invalid:
        lang = _lang_pack(preferred_language)
        return {
            "status": "invalid_input",
            "needs_more_info": False,
            "ask_followup": False,
            "schemes": [],
            "guidance": {
                "intro": _build_structured_response(
                    citizen_profile,
                    [],
                    [],
                    preferred_language=preferred_language,
                    invalid_msg=invalid_msg,
                ),
                "steps": [],
                "followUp": lang["invalid_followup"],
            },
            "sources": [],
            "conflicts": [],
        }

    needs_more_info, ask_msg = _needs_more_info(citizen_profile)
    if needs_more_info:
        return {
            "status": "need_more_info",
            "needs_more_info": True,
            "ask_followup": True,
            "schemes": [],
            "guidance": {
                "intro": ask_msg,
                "steps": [],
                "followUp": ask_msg,
            },
            "sources": [],
            "conflicts": [],
        }

    import time as _t
    _t0 = _t.time()
    from rag_engine import get_vectorstore
    vectorstore = get_vectorstore()
    print(f"[agent] vectorstore ready in {_t.time()-_t0:.2f}s")
    try:
        results = vectorstore.similarity_search(citizen_profile, k=10)
    except Exception as e:
        print(f"[agent] Vectorstore search failed: {e} — using LLM directly")
        results = []

    context = ""
    sources = []
    for doc in results:
        context += (
            f"\n\n---\nSource: {doc.metadata.get('source_file', 'Unknown')}, "
            f"Page: {doc.metadata.get('page', 'N/A')}\n{doc.page_content}"
        )
        sources.append(doc.metadata.get("source_file", "Unknown"))

    prompt = f"""
You are PolicyPilot — an expert AI assistant for Indian government welfare schemes.

STRICT RULES:
1. If the user asks about a SPECIFIC scheme by name (e.g. Ujjwala Yojana, PM Kisan, Ayushman Bharat) → explain that scheme in detail IMMEDIATELY based on the documents. Never ask for profile info in this case.
2. If the user describes their situation (farmer, student, woman, BPL etc.) → match and recommend relevant schemes.
3. NEVER ask for income/state/occupation more than ONCE per conversation.
4. NEVER give the same "please share your profile" response repeatedly.
5. If you already asked for profile info and user hasn't provided it → just recommend the top 5 most popular schemes anyway.

Citizen Profile:
{citizen_profile}

Government Scheme Documents:
{context}

Respond in this language only: { _lang_pack(preferred_language)['name'] }.
If language is Hindi or Gujarati, do not mix English except official scheme names.

Based on the documents above, return a JSON object with TWO keys:
1. "schemes" — an array of matched scheme objects
2. "guidance" — an object with "intro", "steps" (array of strings), and "followUp"

Each scheme object must have EXACTLY these fields:
{{
  "id": <unique integer>,
  "title": "<scheme name>",
  "tag": "<category: Agriculture|Health|Education|Housing|Employment|Women|Finance|Labour>",
  "tagColor": "<hex color matching category>",
  "tagBg": "<rgba background color>",
  "match": <integer 0-100 representing eligibility match percentage>,
  "reason": "<one sentence: why this citizen qualifies>",
  "bullets": ["<benefit 1>", "<benefit 2>", "<benefit 3>"],
  "explainPoints": ["<eligibility criterion 1>", "<eligibility criterion 2>", "<eligibility criterion 3>"],
  "conflict": null
}}

Category color mapping (use these EXACTLY):
- Agriculture: tagColor "#2d6a4f", tagBg "rgba(45,106,79,0.10)"
- Health:       tagColor "#1d6fa4", tagBg "rgba(29,111,164,0.10)"
- Education:    tagColor "#6b3fa0", tagBg "rgba(107,63,160,0.10)"
- Housing:      tagColor "#b5550a", tagBg "rgba(181,85,10,0.10)"
- Employment:   tagColor "#7a6c00", tagBg "rgba(122,108,0,0.10)"
- Women:        tagColor "#9b2d5a", tagBg "rgba(155,45,90,0.10)"
- Finance:      tagColor "#0f5e6e", tagBg "rgba(15,94,110,0.10)"
- Labour:       tagColor "#4a6e2d", tagBg "rgba(74,110,45,0.10)"

RULES:
- Only recommend schemes based on the documents provided
- Set "match" based on how well the citizen profile fits the criteria
- Never hallucinate eligibility criteria
- Return ONLY the raw JSON object — no markdown, no backticks, no explanation
"""

    try:
        groq_client = get_groq_client()
        response = groq_client.chat.completions.create(
            model="gemma2-9b-it",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.1,
        )

        raw = response.choices[0].message.content.strip()
        # Strip markdown fences if model adds them
        raw = raw.replace("```json", "").replace("```", "").strip()

        try:
            parsed = json.loads(raw)
            schemes = parsed.get("schemes", [])
            guidance = parsed.get("guidance", {
                "intro": "Here are the schemes you may qualify for:",
                "steps": [],
                "followUp": "Would you like help with any specific scheme?"
            })
        except json.JSONDecodeError:
            fallback = _fallback_from_sources(citizen_profile, sources)
            schemes = fallback["schemes"]
            guidance = {
                "intro": raw[:500] if raw else fallback["guidance"]["intro"],
                "steps": fallback["guidance"]["steps"],
                "followUp": fallback["guidance"]["followUp"],
            }
    except Exception as e:
        print(f"LLM fallback triggered: {e}")
        fallback = _fallback_from_sources(citizen_profile, sources)
        schemes = fallback["schemes"]
        guidance = fallback["guidance"]

    schemes = _dedupe_and_filter_schemes(schemes, citizen_profile)
    conflicts = _detect_conflicts_local(schemes)
    no_match = len(schemes) == 0
    guidance["intro"] = _build_structured_response(
        citizen_profile,
        schemes,
        conflicts,
        preferred_language=preferred_language,
        no_match=no_match,
    )
    guidance["followUp"] = _lang_pack(preferred_language)["followup"]

    return {
        "status": "success",
        "needs_more_info": False,
        "ask_followup": False,
        "schemes": schemes,
        "guidance": guidance,
        "sources": list(set(sources)),
        "conflicts": conflicts,
    }


def generate_application_checklist(scheme_name: str, citizen_profile: str):
    from rag_engine import get_vectorstore
    vectorstore = get_vectorstore()
    try:
        results = vectorstore.similarity_search(
            f"{scheme_name} application documents required", k=5
        )
    except Exception as e:
        print(f"[agent] Vectorstore search failed: {e}")
        results = []

    context = ""
    for doc in results:
        context += (
            f"\n\nSource: {doc.metadata.get('source_file')}, "
            f"Page: {doc.metadata.get('page')}\n{doc.page_content}"
        )

    prompt = f"""
Based on these official documents:
{context}

Generate a detailed step-by-step application checklist for:
Scheme: {scheme_name}
Citizen: {citizen_profile}

Include:
1. Required documents list
2. Step by step application process
3. Office/portal to apply
4. Timeline and deadlines
5. Common mistakes to avoid

Always cite the source document and page number for each point.
"""

    groq_client = get_groq_client()
    response = groq_client.chat.completions.create(
        model="gemma2-9b-it",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400,
        temperature=0.1,
    )
    return response.choices[0].message.content