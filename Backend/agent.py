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

from datetime import datetime, date
import re

def _validate_citizen_profile(citizen_profile: str) -> dict:
    text = citizen_profile.lower().strip()

    # Too short
    if len(text) < 10:
        return {"valid": False, "reason": "Please describe your situation in more detail."}

    # Future or impossible birth date
    today = date.today()
    date_patterns = [
        r"\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b",
        r"\b(\d{4})[\/\-](\d{2})[\/\-](\d{2})\b",
    ]
    for pattern in date_patterns:
        for match in re.findall(pattern, text):
            try:
                d = datetime.strptime(
                    f"{match[0]}-{match[1]}-{match[2]}", "%d-%m-%Y"
                ).date()
                if d >= today:
                    return {"valid": False, "reason": f"Date of birth {d.strftime('%d %b %Y')} is today or in the future. Please enter your actual date of birth."}
                age = (today - d).days // 365
                if age > 120:
                    return {"valid": False, "reason": f"Age of {age} years seems incorrect. Please enter a valid date of birth."}
            except ValueError:
                pass

    # Impossible age mentioned directly
    age_match = re.search(r"\b(\d+)\s*(year|yr|years old|age)\b", text)
    if age_match:
        age = int(age_match.group(1))
        if age <= 0 or age > 120:
            return {"valid": False, "reason": f"Age {age} is not valid. Please enter your correct age between 1 and 120."}

    # Negative or impossibly high income
    income_match = re.search(r"income\s*[\=\:\s]*(rs\.?|₹|inr)?\s*([\d,]+)", text)
    if income_match:
        try:
            income = int(income_match.group(2).replace(",", ""))
            if income < 0:
                return {"valid": False, "reason": "Income cannot be negative. Please enter a valid annual income."}
            if income > 100000000:
                return {"valid": False, "reason": "Income above ₹10 crore is outside scheme eligibility range."}
        except ValueError:
            pass

    # Gibberish detection
    gibberish = ["asdf", "qwerty", "test123", "abc123", "lorem ipsum", "xyzxyz"]
    if any(g in text for g in gibberish):
        return {"valid": False, "reason": "Please describe your actual situation to find matching schemes."}

    # Only special characters or numbers
    if not re.search(r"[a-zA-Z]{3,}", citizen_profile):
        return {"valid": False, "reason": "Please describe your situation in words."}

    return {"valid": True}


def _build_validation_response(reason: str, preferred_language: str) -> dict:
    if preferred_language.startswith("hi"):
        message = f"⚠️ {reason} कृपया सही जानकारी दें।"
    elif preferred_language.startswith("gu"):
        message = f"⚠️ {reason} કૃપા કરીને સાચી માહિતી આપો।"
    else:
        message = f"⚠️ {reason} Please provide accurate details so I can find the right schemes for you."
    return {
        "message": message,
        "schemes": [],
        "conflicts": [],
        "summary": reason,
        "validation_error": True
    }

def find_schemes(citizen_profile: str, preferred_language: str = "en") -> dict:
    validation = _validate_citizen_profile(citizen_profile)
    if not validation["valid"]:
        logger.warning(f"[agent] Invalid input: {validation['reason']}")
        return _build_validation_response(validation["reason"], preferred_language)

    from langchain_groq import ChatGroq
    from rag_engine import get_vectorstore
    import json

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
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

    # Determine strict language instruction
    lang_instructions = {
        "en": "You MUST write ALL text in English only. Do not use any Hindi, Gujarati or any other language anywhere in your response. Every single word must be English.",
        "hi": "आपको अपना पूरा जवाब केवल हिंदी में देना है। एक भी शब्द अंग्रेजी या किसी अन्य भाषा में नहीं होना चाहिए। scheme names, benefits, steps, reasons — सब कुछ हिंदी में।",
        "gu": "તમારે સમગ્ર જવાબ માત્ર ગુજરાતીમાં આપવાનો છે. એક પણ શબ્દ અંગ્રેજી કે અન્ય ભાષામાં ન હોવો જોઈએ. scheme names, benefits, steps — બધું ગુજરાતીમાં.",
        "bn": "আপনাকে সম্পূর্ণ উত্তর শুধুমাত্র বাংলায় দিতে হবে। একটি শব্দও ইংরেজি বা অন্য ভাষায় হওয়া উচিত নয়।",
        "te": "మీరు మీ మొత్తం సమాధానం తెలుగులో మాత్రమే ఇవ్వాలి. ఒక్క మాట కూడా ఇంగ్లీష్లో ఉండకూడదు.",
        "mr": "तुम्हाला संपूर्ण उत्तर फक्त मराठीत द्यायचे आहे. एकही शब्द इंग्रजी किंवा इतर भाषेत नसावा.",
        "ta": "நீங்கள் உங்கள் முழு பதிலையும் தமிழில் மட்டுமே தர வேண்டும். ஒரு வார்த்தை கூட ஆங்கிலத்தில் இருக்கக்கூடாது.",
        "kn": "ನೀವು ನಿಮ್ಮ સંપૂર્ણ ಉತ್ತರವನ್ನು ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ ನೀಡಬೇಕು. ಒಂದೇ ಒಂದು ಪದ ಇಂಗ್ಲಿಷ್ನಲ್ಲಿ ಇರಬಾರದು.",
        "ml": "നിങ്ങൾ നിങ്ങളുടെ മുഴുവൻ ഉത്തരവും മലയാളത്തിൽ മാത്രം നൽകണം. ഒരു വാക്കും ഇംഗ്ലീഷിൽ ഉണ്ടാകരുത്.",
        "or": "ଆପଣ ଆପଣଙ୍କ ସମ୍ପୂର୍ଣ୍ણ ଉତ୍ତର କେବଳ ଓଡ଼ିଆରେ ଦେବେ। ଗୋଟିଏ ଶବ୍ଦ ମଧ୍ୟ ଇଂରାଜୀରେ ହେବ ନାହିଁ।",
        "pa": "ਤੁਹਾਨੂੰ ਆਪਣਾ ਪੂਰਾ ਜਵਾਬ ਸਿਰਫ਼ ਪੰਜਾਬી ਵਿੱਚ ਦੇਣਾ ਹੈ। ਇੱਕ ਵੀ ਸ਼ਬਦ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਨਹੀਂ ਹੋਣਾ ਚਾਹੀਦਾ।",
        "as": "আপুনি আপোনাৰ সম্পূৰ্ণ উত্তৰ কেৱલ অসমীয়াত দিব লাগিব। এটাও শব্দ ইংৰাজীত নাথাকিব লাগে।",
    }

    strict_lang = lang_instructions.get(preferred_language, lang_instructions["en"])

    prompt = f"""You are PolicyPilot, an expert on Indian government welfare schemes.

═══════════════════════════════════════════
LANGUAGE RULE — READ THIS FIRST:
{strict_lang}
This is the most important rule. Breaking this rule is not allowed.
═══════════════════════════════════════════

CITIZEN PROFILE:
{citizen_profile}

REFERENCE DOCUMENTS:
{rag_context}

Return ONLY valid JSON with EXACTLY this structure.
ALL text values inside the JSON must follow the language rule above:

{{
  "message": "Summary in the required language only",
  "schemes": [
    {{
      "id": 1,
      "title": "Scheme Name",
      "tag": "Category",
      "tagColor": "#2d6a4f",
      "tagBg": "rgba(45,106,79,0.1)",
      "reason": "Eligibility reason in the required language only",
      "match": 92,
      "bullets": [
        "Benefit 1 in required language",
        "Benefit 2 in required language",
        "Benefit 3 in required language"
      ],
      "explainPoints": [
        "Eligibility point 1 in required language",
        "Eligibility point 2 in required language"
      ],
      "applicationChecklist": [
        "Step 1 in required language",
        "Step 2 in required language",
        "Step 3 in required language",
        "Step 4 in required language"
      ],
      "draftForm": {{
        "status": "ready",
        "portal": "https://official-portal.gov.in"
      }},
      "conflicts": []
    }}
  ],
  "conflicts": [],
  "summary": "Plain language summary in required language only"
}}

STRICT RULES:
1. Return ONLY valid JSON — no markdown, no text outside JSON
2. Language rule above is ABSOLUTE — follow it for EVERY field value
3. Match AT LEAST 5 schemes relevant to the profile
4. Each scheme MUST have applicationChecklist with 4-6 steps
5. reason MUST reference specific details from citizen profile
6. match score must be realistic between 60 and 98
7. If farmer → include PM Kisan, KCC, Fasal Bima
8. If housing/BPL → include PMAY
9. If health → include Ayushman Bharat
10. If woman → include Ujjwala, Sukanya Samriddhi
11. If income below 2.5L → include BPL schemes
12. scheme title field can stay in English for recognition but ALL other fields must be in required language
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
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
        temperature=0.1,
    )
    return response.choices[0].message.content
