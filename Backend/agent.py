import os
import json
import re
import logging
import time
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("policypilot.agent")

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
        "invalid_title": "अमान્ય ઇનપુટ મળ્યો",
        "invalid_suffix": "કૃપા કરીને ઉંમર, રાજ્ય, વ્યવસાય, શ્રેણી અને આવક જેવી માન્ય માહિતી આપો.",
        "no_match_title": "કોઈ ચોક્કસ મેળ મળ્યો નથી",
        "no_match_line_1": "આપની વર્તમાન માહિતીથી ચોક્કસ યોજના મેળ ખાતી નથી.",
        "no_match_line_2": "સારા સૂચનો માટે રાજ્ય, ઉંમર, આવક, વ્યવસાય અને સામાજિક શ્રેણી જણાવો.",
        "conflict_title": "સંઘર્ષ મળ્યો",
        "conflict_intro": "તમે અનેક યોજનાઓ માટે પાત્ર હોઈ શકો છો, પણ તે એક સાથે લાગુ કરી શકાતી નથી.",
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
    "gu": {
        "name": "Gujarati",
        "invalid_title": "અમાન્ય ઇનપુટ મળ્યો",
        "invalid_suffix": "કૃપા કરીને ઉંમર, રાજ્ય, વ્યવસાય, શ્રેણી અને આવક જેવી માન્ય માહિતી આપો.",
        "no_match_title": "ચોક્કસ મેળ મળ્યો નથી",
        "no_match_line_1": "હાલની માહિતી પરથી ચોક્કસ યોજના મળી નથી.",
        "no_match_line_2": "સારા સૂચનો માટે રાજ્ય, ઉંમર, આવક, વ્યવસાય અને સામાજિક શ્રેણી આપો.",
        "conflict_title": "વિરોધ જોવા મળ્યો",
        "conflict_intro": "તમે અનેક યોજનાઓ માટે પાત્ર હોઈ શકો, પણ બંને સાથે લાગુ ન થઈ શકે.",
        "comparison": "વિગતો",
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

def find_schemes(citizen_profile: str, preferred_language: str = "en") -> dict:
    from langchain_groq import ChatGroq
    from rag_engine import get_vectorstore
    import json

    llm = ChatGroq(
        model="llama3-8b-8192",
        temperature=0.1,
        max_tokens=4000,
        groq_api_key=os.environ.get("GROQ_API_KEY"),
    )

    # Try vectorstore search first, fallback to LLM only
    rag_context = ""
    try:
        vs = get_vectorstore()
        docs = vs.similarity_search(citizen_profile, k=5)
        rag_context = "\n\n".join([d.page_content for d in docs])
    except Exception as e:
        logger.warning(f"RAG skipped: {e}")
        rag_context = "No additional documents available."

    prompt = f"""You are PolicyPilot, an expert on Indian government welfare schemes.

CITIZEN PROFILE:
{citizen_profile}

REFERENCE DOCUMENTS (from RAG):
{rag_context}

Your task is to analyze this citizen's profile and return a JSON response with EXACTLY this structure:

{{
  "message": "Plain language summary of findings in {preferred_language} language",
  "schemes": [
    {{
      "id": 1,
      "title": "Scheme Name",
      "tag": "Category (Agri/Health/Housing/Education/Finance)",
      "tagColor": "#2d6a4f",
      "tagBg": "rgba(45,106,79,0.1)",
      "reason": "Why this citizen qualifies — specific to their profile",
      "match": 92,
      "bullets": [
        "Key benefit 1",
        "Key benefit 2",
        "Key benefit 3"
      ],
      "explainPoints": [
        "Eligibility criterion met: annual income below threshold",
        "Eligibility criterion met: residence type matches",
        "Eligibility criterion met: category qualifies"
      ],
      "applicationChecklist": [
        "Step 1: Gather Aadhaar card",
        "Step 2: Get income certificate from tehsil",
        "Step 3: Visit official portal or CSC center",
        "Step 4: Submit application with reference number"
      ],
      "draftForm": {{
        "status": "ready",
        "applicantName": "As per Aadhaar",
        "scheme": "Scheme Name",
        "portal": "https://official-portal-url.gov.in"
      }},
      "conflicts": []
    }}
  ],
  "conflicts": [
    {{
      "scheme": "Scheme Name",
      "conflict": "Central scheme requires X but Gujarat state version requires Y",
      "recommendation": "Apply for central version if income below 1.5L"
    }}
  ],
  "summary": "Plain language summary in Hindi or regional language if requested"
}}

RULES:
1. Return ONLY valid JSON — no markdown, no explanation outside JSON
2. Match AT LEAST 5 schemes relevant to the citizen profile
3. Each scheme MUST have applicationChecklist with 4-6 specific steps
4. reason field MUST reference specific details from the citizen's profile
5. match score must be realistic (60-98 range)
6. If citizen mentions housing → always include PMAY
7. If farmer → always include PM Kisan, KCC, Fasal Bima
8. If health → always include Ayushman Bharat
9. If woman → always include Ujjwala, Sukanya Samriddhi
10. If income below 2.5L → include all BPL schemes
11. Detect conflicts between central and state versions of same scheme
12. If preferred_language is 'hi' → write message and summary in Hindi
13. If preferred_language is 'gu' → write message and summary in Gujarati
"""

    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        # Remove ALL markdown fences
        content = re.sub(r"```json|```", "", content).strip()
        # Extract JSON object even if there's extra text around it
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            content = match.group()
        result = json.loads(content)
        # Validate minimum required fields
        if not result.get("schemes"):
            logger.warning("LLM returned no schemes — using fallback")
            raise ValueError("No schemes in response")
        logger.info(f"[agent] LLM returned {len(result['schemes'])} schemes successfully")
        return result
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"JSON parse error: {e} — using keyword fallback")
        return {
            "message": "Here are the most relevant schemes based on your profile.",
            "schemes": _get_fallback_schemes(citizen_profile),
            "conflicts": [],
            "summary": "Please visit your nearest CSC center for personalized assistance."
        }
    except Exception as e:
        logger.error(f"LLM error: {e} — using keyword fallback")
        return {
            "message": "Here are the most relevant schemes based on your profile.",
            "schemes": _get_fallback_schemes(citizen_profile),
            "conflicts": [],
            "summary": ""
        }

def _get_fallback_schemes(profile: str) -> list:
    """Returns hardcoded relevant schemes based on keywords in profile"""
    schemes = []
    p = profile.lower()

    if any(w in p for w in ["farmer", "farm", "kisan", "agriculture", "crop"]):
        schemes.append({
            "id": 1, "title": "PM Kisan Samman Nidhi",
            "tag": "Agriculture", "tagColor": "#2d6a4f", "tagBg": "rgba(45,106,79,0.1)",
            "reason": "Farmer profile matches PM Kisan eligibility criteria",
            "match": 95,
            "bullets": ["₹6,000/year direct benefit", "3 instalments of ₹2,000", "Direct bank transfer"],
            "explainPoints": ["Small/marginal farmer", "Land holding below 2 hectares"],
            "applicationChecklist": ["Register at pmkisan.gov.in", "Submit Aadhaar + land records", "Link bank account", "Verify via local patwari"],
            "draftForm": {"status": "ready", "portal": "https://pmkisan.gov.in"},
            "conflicts": []
        })

    if any(w in p for w in ["house", "housing", "pmay", "awas", "kutcha", "bpl"]):
        schemes.append({
            "id": 2, "title": "PM Awas Yojana Gramin",
            "tag": "Housing", "tagColor": "#b5550a", "tagBg": "rgba(181,85,10,0.1)",
            "reason": "BPL/kutcha house profile matches PMAY-G eligibility",
            "match": 92,
            "bullets": ["₹1.2 lakh rural housing grant", "Free pucca house construction", "MGNREGS labour support included"],
            "explainPoints": ["No pucca house", "Rural BPL family", "State SECC list eligible"],
            "applicationChecklist": ["Apply via Gram Panchayat", "Submit Aadhaar + BPL card", "Get SECC survey done", "Open Jan Dhan account for DBT"],
            "draftForm": {"status": "ready", "portal": "https://pmayg.nic.in"},
            "conflicts": []
        })

    if any(w in p for w in ["health", "medical", "hospital", "ayushman"]):
        schemes.append({
            "id": 3, "title": "Ayushman Bharat PM-JAY",
            "tag": "Health", "tagColor": "#1d6fa4", "tagBg": "rgba(29,111,164,0.1)",
            "reason": "Low income family qualifies for ₹5 lakh health cover",
            "match": 90,
            "bullets": ["₹5 lakh/year health insurance", "Covers 1,500+ treatments", "Cashless at empanelled hospitals"],
            "explainPoints": ["Income below threshold", "SECC database eligible", "No existing health insurance"],
            "applicationChecklist": ["Check eligibility at pmjay.gov.in", "Get Ayushman card from CSC", "Submit Aadhaar + ration card", "Use card at empanelled hospital"],
            "draftForm": {"status": "ready", "portal": "https://pmjay.gov.in"},
            "conflicts": []
        })

    if not schemes:
        schemes.append({
            "id": 1, "title": "PM Jan Dhan Yojana",
            "tag": "Finance", "tagColor": "#0e6655", "tagBg": "rgba(14,102,85,0.1)",
            "reason": "Every Indian citizen qualifies for Jan Dhan benefits",
            "match": 85,
            "bullets": ["Zero balance bank account", "₹2 lakh accident insurance", "₹30,000 life cover"],
            "explainPoints": ["Universal eligibility", "No minimum balance required"],
            "applicationChecklist": ["Visit nearest bank branch", "Submit Aadhaar + photo", "Fill account opening form", "Activate RuPay debit card"],
            "draftForm": {"status": "ready", "portal": "https://pmjdy.gov.in"},
            "conflicts": []
        })

    return schemes

def generate_application_checklist(scheme_name: str, citizen_profile: str):
    from rag_engine import get_vectorstore
    vectorstore = get_vectorstore()
    try:
        results = vectorstore.similarity_search(
            f"{scheme_name} application documents required", k=5
        )
    except Exception as e:
        logger.warning(f"Vectorstore search failed: {e}")
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
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
        temperature=0.1,
    )
    return response.choices[0].message.content