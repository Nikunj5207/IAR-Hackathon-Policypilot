import os
import json
import re
from dotenv import load_dotenv
from groq import Groq
from rag_engine import get_vectorstore
import dataset_engine

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY", "dummy_key_to_prevent_boot_crash"))


# ── Category styles ──────────────────────────────────────────────
CATEGORY_STYLE = {
    "Agriculture": {"tagColor": "#2d6a4f", "tagBg": "rgba(45,106,79,0.10)"},
    "Health":      {"tagColor": "#1d6fa4", "tagBg": "rgba(29,111,164,0.10)"},
    "Education":   {"tagColor": "#6b3fa0", "tagBg": "rgba(107,63,160,0.10)"},
    "Housing":     {"tagColor": "#b5550a", "tagBg": "rgba(181,85,10,0.10)"},
    "Employment":  {"tagColor": "#7a6c00", "tagBg": "rgba(122,108,0,0.10)"},
    "Women":       {"tagColor": "#9b2d5a", "tagBg": "rgba(155,45,90,0.10)"},
    "Finance":     {"tagColor": "#0f5e6e", "tagBg": "rgba(15,94,110,0.10)"},
    "Labour":      {"tagColor": "#4a6e2d", "tagBg": "rgba(74,110,45,0.10)"},
}

# ── Official scheme links ────────────────────────────────────────
SCHEME_LINKS = {
    "pm kisan":           "https://pmkisan.gov.in",
    "pm-kisan":           "https://pmkisan.gov.in",
    "ayushman":           "https://pmjay.gov.in",
    "pm-jay":             "https://pmjay.gov.in",
    "national scholarship": "https://scholarships.gov.in",
    "nsp":                "https://scholarships.gov.in",
    "pm awas":            "https://pmaymis.gov.in",
    "pmay":               "https://pmaymis.gov.in",
    "mgnregs":            "https://nrega.nic.in",
    "mnrega":             "https://nrega.nic.in",
    "ujjwala":            "https://pmuy.gov.in",
    "svanidhi":           "https://pmsvanidhi.mohua.gov.in",
    "sv anidhi":          "https://pmsvanidhi.mohua.gov.in",
    "sukanya":            "https://www.indiapost.gov.in",
    "mudra":              "https://mudra.org.in",
    "e-shram":            "https://eshram.gov.in",
    "eshram":             "https://eshram.gov.in",
    "fasal bima":         "https://pmfby.gov.in",
    "pmfby":              "https://pmfby.gov.in",
    "kisan credit":       "https://www.kisancreditcard.in",
    "kcc":                "https://www.kisancreditcard.in",
    "atal pension":       "https://enps.nsdl.com",
    "jan dhan":           "https://pmjdy.gov.in",
    "pmjdy":              "https://pmjdy.gov.in",
    "pmegp":              "https://www.kviconline.gov.in",
    "sc pre-matric":      "https://scholarships.gov.in",
    "st post-matric":     "https://scholarships.gov.in",
    "dr ambedkar":        "https://socialjustice.gov.in",
    "ikhedut":            "https://ikhedut.gujarat.gov.in",
}

# ── Scheme-specific step/document data ──────────────────────────
SCHEME_DETAILS = {
    "pm kisan": {
        "description": "PM Kisan Samman Nidhi provides Rs 6,000 per year in 3 installments of Rs 2,000 each directly to farmer bank accounts.",
        "eligibility": ["Small and marginal farmers", "Land holding up to 2 hectares", "Valid Aadhaar linked to bank account", "Not a government employee or income taxpayer"],
        "documents": ["Aadhaar Card", "Bank Passbook (account must match Aadhaar)", "Land ownership document (7/12 or Khasra)", "Mobile number linked to Aadhaar"],
        "steps": [
            "Visit pmkisan.gov.in",
            "Click on 'Farmers Corner' and select 'New Farmer Registration'",
            "Enter Aadhaar number and mobile number",
            "Fill in your land and bank details",
            "Submit the form and note the reference number",
            "Check status at pmkisan.gov.in using Aadhaar or account number",
        ],
        "offline": "Visit your nearest Common Service Centre (CSC) or Village Level Entrepreneur (VLE) with documents. They will register you for free.",
        "link": "https://pmkisan.gov.in",
    },
    "ayushman bharat": {
        "description": "Ayushman Bharat PM-JAY provides health insurance cover of Rs 5 lakh per family per year for secondary and tertiary hospitalization.",
        "eligibility": ["Families listed in SECC 2011 database", "Eligible categories include construction workers, ragpickers, beggars, domestic workers, landless labourers", "No limit on family size"],
        "documents": ["Aadhaar Card", "Ration Card", "SECC Family ID (if available)", "Any government ID proof"],
        "steps": [
            "Check eligibility at pmjay.gov.in using your mobile number or ration card",
            "If eligible, visit the nearest empanelled hospital or Ayushman Bharat Kendra",
            "Take Aadhaar and ration card to the hospital help desk",
            "Hospital staff will verify your details and issue the Ayushman card",
            "Use the card at any listed hospital for cashless treatment up to Rs 5 lakh",
        ],
        "offline": "You can also visit your nearest Common Service Centre (CSC), Jan Seva Kendra, or government hospital with Aadhaar and ration card.",
        "link": "https://pmjay.gov.in",
    },
    "ujjwala": {
        "description": "PM Ujjwala Yojana 2.0 provides free LPG connection to BPL women and migrant families who do not have a gas connection.",
        "eligibility": ["Adult women of BPL family", "No existing LPG connection in the household", "Aadhaar and bank account required", "Applicable to SC/ST, PMAY beneficiaries, forest dwellers, most backward classes, tea garden workers"],
        "documents": ["Aadhaar Card", "BPL Ration Card or any relevant welfare scheme certificate", "Bank account details", "Self-declaration of no existing LPG connection"],
        "steps": [
            "Visit your nearest LPG distributor (HP, Bharat Gas, or Indane)",
            "Ask for the Ujjwala Yojana 2.0 application form",
            "Fill in your personal and bank details",
            "Submit Aadhaar copy and BPL proof",
            "After verification, you will receive a free cylinder and connection",
            "First refill is also subsidized",
        ],
        "offline": "Visit any authorized LPG gas agency dealer in your area. You do not need to go online.",
        "link": "https://pmuy.gov.in",
    },
    "mgnregs": {
        "description": "MGNREGS (Mahatma Gandhi National Rural Employment Guarantee Scheme) guarantees 100 days of paid work per year to rural adult households.",
        "eligibility": ["Adult member of rural household", "Willing to do unskilled manual work", "Must apply for job card"],
        "documents": ["Aadhaar Card", "Residence proof (ration card / voter ID)", "Bank passbook", "Passport size photo"],
        "steps": [
            "Visit your Gram Panchayat office",
            "Apply for a Job Card in writing or verbally",
            "Within 15 days, Gram Panchayat will issue your Job Card",
            "When you need work, give a written application to Gram Panchayat",
            "Work will be provided within 15 days of application",
            "Wages are paid directly to your bank account",
        ],
        "offline": "This scheme is entirely offline. Visit your Gram Panchayat office. They are required by law to provide you work.",
        "link": "https://nrega.nic.in",
    },
    "default": {
        "description": "This is a Government of India welfare scheme aimed at improving citizen welfare.",
        "eligibility": ["Check official website for eligibility criteria"],
        "documents": ["Aadhaar Card", "Income Certificate", "Bank Passbook", "Residence Proof", "Passport size photo"],
        "steps": [
            "Visit the official government scheme website",
            "Click on 'Apply Now' or 'Register'",
            "Fill in your personal and family details",
            "Upload required documents",
            "Submit and save the application number for tracking",
        ],
        "offline": "Visit your nearest Common Service Centre (CSC), Jan Seva Kendra, or local government office with all documents.",
        "link": None,
    },
}


def _get_scheme_detail_key(title: str) -> str:
    t = (title or "").lower()
    for key in SCHEME_DETAILS:
        if key != "default" and key in t:
            return key
    return "default"


def _get_official_link(title: str) -> str:
    t = (title or "").lower()
    for key, url in SCHEME_LINKS.items():
        if key in t:
            return url
    return None


# ── Category inference ───────────────────────────────────────────
def _infer_category(title: str) -> str:
    t = (title or "").lower()
    if any(k in t for k in ["kisan", "farmer", "agri", "crop", "pmfb", "kcc", "fasal"]):
        return "Agriculture"
    if any(k in t for k in ["health", "ayushman", "pm-jay", "medical"]):
        return "Health"
    if any(k in t for k in ["scholarship", "student", "education", "matric"]):
        return "Education"
    if any(k in t for k in ["awas", "housing", "house", "ambedkar awas"]):
        return "Housing"
    if any(k in t for k in ["employment", "mgnregs", "mnrega", "job", "pmegp"]):
        return "Employment"
    if any(k in t for k in ["women", "sukanya", "ujjwala", "beti"]):
        return "Women"
    if any(k in t for k in ["finance", "credit", "loan", "mudra", "bank", "jan dhan", "svanidhi", "atal pension"]):
        return "Finance"
    if any(k in t for k in ["labour", "e-shram", "worker", "eshram"]):
        return "Labour"
    return "Finance"


def _title_from_source(source_file: str) -> str:
    base = os.path.basename(source_file or "Government Scheme")
    name = os.path.splitext(base)[0]
    name = re.sub(r"[_\-]+", " ", name).strip()
    return " ".join(word.capitalize() for word in name.split()) or "Government Scheme"


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


# ── Invalid input detection ──────────────────────────────────────
def _is_invalid_input(citizen_profile: str) -> tuple[bool, str]:
    text = _normalize_text(citizen_profile)
    if not text:
        return True, "Please tell me your details such as your work, income, and state so I can help you find schemes."
    if len(text) < 5:
        return True, "Your message is too short. Please share details like your occupation, income, and state."

    bad_patterns = [
        r"\bi am dead\b", r"\b(i am|i'm) (a )?(ghost|zombie|dead|dying)\b",
        r"\bfree money\b", r"\bgive me money\b", r"\bkill\b", r"\bfuck\b",
        r"\bshit\b", r"\basshole\b", r"\btest\b$", r"\bhello\b$", r"\bhi\b$",
    ]
    if any(re.search(p, text) for p in bad_patterns):
        return True, "This does not look like a valid request. Please describe your situation — your work, income or state — and I will find government schemes for you."

    # Gibberish detection: very high ratio of consonants with no vowels
    letters = re.sub(r"[^a-z]", "", text)
    if len(letters) > 6:
        vowels = sum(1 for c in letters if c in "aeiou")
        if vowels / len(letters) < 0.10:
            return True, "I could not understand your message. Please describe yourself simply — for example: 'I am a farmer in Gujarat with low income.'"

    return False, ""


# ── Incomplete input detection (triggers follow-up question) ─────
_FOLLOWUP_SHORT = {
    "hi": (
        "मैं आपकी मदद करना चाहता हूँ! क्या आप थोड़ी और जानकारी दे सकते हैं?\n\n"
        "कृपया बताएं:\n"
        "- आपका व्यवसाय (किसान, मजदूर, छात्र आदि)\n"
        "- आपकी अनुमानित वार्षिक आय\n"
        "- आपका राज्य\n"
        "- आपकी सामाजिक श्रेणी (General, SC, ST, OBC) यदि लागू हो\n\n"
        "आप जितनी अधिक जानकारी देंगे, मैं उतना बेहतर मार्गदर्शन कर सकता हूँ।"
    ),
    "gu": (
        "હું તમારી મદદ કરવા ઇચ્છું છું! શું તમે થોડી વધુ માહિતી આપી શકો?\n\n"
        "કૃપા કરી જણાવો:\n"
        "- તમારો વ્યવસાય (ખેડૂત, મજૂર, વિદ્યાર્થી વગેરે)\n"
        "- તમારી અંદાજીત વાર્ષિક આવક\n"
        "- તમારું રાજ્ય\n"
        "- તમારી સામાજિક શ્રેણી (General, SC, ST, OBC) જો લાગુ હોય\n\n"
        "તમે જેટલી વધુ માહિતી આપો, એટલું સારું માર્ગदर्शन हु आपी शकुं."
    ),
    "mr": (
        "मी तुम्हाला मदत करू इच्छितो! तुम्ही थोडी अधिक माहिती सांगू शकता का?\n\n"
        "कृपया सांगा:\n"
        "- तुमचा व्यवसाय (शेतकरी, कामगार, विद्यार्थी इ.)\n"
        "- तुमचे अंदाजे वार्षिक उत्पन्न\n"
        "- तुमचे राज्य\n"
        "- तुमची सामाजिक श्रेणी (General, SC, ST, OBC) लागू असल्यास"
    ),
    "bn": (
        "আমি আপনাকে সাহায্য করতে চাই! আরও কিছু তথ্য দিতে পারবেন?\n\n"
        "অনুগ্রহ করে শেয়ার করুন:\n"
        "- আপনার পেশা (কৃষক, শ্রমিক, শিক্ষার্থী ইত্যাদি)\n"
        "- আপনার আনুমানিক বার্ষিক আয়\n"
        "- আপনার রাজ্য\n"
        "- আপনার সামাজিক বিভাগ (General, SC, ST, OBC) প্রযোজ্য হলে"
    ),
    "te": (
        "నేను మీకు సహాయం చేయాలనుకుంటున్నాను! మీరు కొంచెం ఎక్కువ వివరాలు చెప్పగలరా?\n\n"
        "దయచేసి తెలియజేయండి:\n"
        "- మీ వృత్తి (రైతు, కూలీ, విద్యార్థి మొ.)\n"
        "- మీ సుమారు వార్షిక కుటుంబ ఆదాయం\n"
        "- మీ రాష్ట్రం\n"
        "- మీ సామాజిక వర్గం (General, SC, ST, OBC)"
    ),
    "ta": (
        "நான் உங்களுக்கு உதவ விரும்புகிறேன்! கொஞ்சம் அதிக தகவல்கள் தர முடியுமா?\n\n"
        "தயவுசெய்து தெரிவிக்கவும்:\n"
        "- உங்கள் தொழில் (விவசாயி, தொழிலாளி, மாணவர் போன்று)\n"
        "- உங்கள் தோராயமான வருடாந்திர குடும்ப வருமானம்\n"
        "- உங்கள் மாநிலம்\n"
        "- உங்கள் சமூக வகை (General, SC, ST, OBC)"
    ),
    "kn": (
        "ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಬಯಸುತ್ತೇನೆ! ಸ್ವಲ್ಪ ಹೆಚ್ಚಿನ ವಿವರಗಳನ್ನು ನೀಡಬಹುದೇ?\n\n"
        "ದಯವಿಟ್ಟು ತಿಳಿಸಿ:\n"
        "- ನಿಮ್ಮ ವೃತ್ತಿ (ರೈತ, ಕಾರ್ಮಿಕ, ವಿದ್ಯಾರ್ಥಿ ಇತ್ಯಾದಿ)\n"
        "- ನಿಮ್ಮ ಅಂದಾಜು ವಾರ್ಷಿಕ ಕುಟುಂಬ ಆದಾಯ\n"
        "- ನಿಮ್ಮ ರಾಜ್ಯ\n"
        "- ನಿಮ್ಮ ಸಾಮಾಜಿಕ ವರ್ಗ (General, SC, ST, OBC)"
    ),
    "ml": (
        "ഞാൻ നിങ്ങളെ സഹായിക്കാൻ ആഗ്രഹിക്കുന്നു! കൂടുതൽ വിവരങ്ങൾ നൽകാമോ?\n\n"
        "ദയവായി അറിയിക്കൂ:\n"
        "- നിങ്ങളുടെ തൊഴിൽ (കർഷകൻ, തൊഴിലാളി, വിദ്യാർത്ഥി തുടങ്ങിയവ)\n"
        "- ഏകദേശ വാർഷിക കുടുംബ വരുമാനം\n"
        "- നിങ്ങളുടെ സംസ്ഥാനം\n"
        "- സാമൂഹ്യ വർഗ്ഗം (General, SC, ST, OBC)"
    ),
    "pa": (
        "ਮੈਂ ਤੁਹਾਡੀ ਮਦਦ ਕਰਨਾ ਚਾਹੁੰਦਾ ਹਾਂ! ਕੀ ਤੁਸੀਂ ਕੁਝ ਹੋਰ ਜਾਣਕਾਰੀ ਦੇ ਸਕਦੇ ਹੋ?\n\n"
        "ਕਿਰਪਾ ਕਰਕੇ ਦੱਸੋ:\n"
        "- ਤੁਹਾਡਾ ਕਿੱਤਾ (ਕਿਸਾਨ, ਮਜ਼ਦੂਰ, ਵਿਦਿਆਰਥੀ ਆਦਿ)\n"
        "- ਤੁਹਾਡੀ ਅੰਦਾਜ਼ਨ ਸਾਲਾਨਾ ਪਰਿਵਾਰਕ ਆਮਦਨੀ\n"
        "- ਤੁਹਾਡਾ ਰਾਜ\n"
        "- ਤੁਹਾਡੀ ਸਮਾਜਿਕ ਸ਼੍ਰੇਣੀ (General, SC, ST, OBC)"
    ),
}

def _needs_followup(citizen_profile: str, preferred_language: str = "en") -> tuple[bool, str]:
    text = _normalize_text(citizen_profile)
    words = text.split()
    lang = (preferred_language or "en")[:2]

    # Very short but not gibberish — ask for more info
    if len(words) <= 4:
        if lang in _FOLLOWUP_SHORT:
            return True, _FOLLOWUP_SHORT[lang]
        return True, (
            "I want to help you find the right scheme! "
            "Can you tell me a few more details?\n\n"
            "Please share:\n"
            "- Your occupation (farmer, worker, student, etc.)\n"
            "- Your approximate annual income\n"
            "- Your state\n"
            "- Your category (General, SC, ST, OBC) if applicable\n\n"
            "The more you tell me, the better I can guide you."
        )

    # Has occupation but missing income context
    has_occupation = any(k in text for k in ["farmer", "worker", "student", "business", "unemployed", "labourer", "laborer", "teacher", "driver", "vendor"])
    has_income = any(k in text for k in ["income", "lakh", "salary", "earn", "bpl", "apl", "poor", "rich", "₹"])
    has_location = any(k in text for k in ["gujarat", "rajasthan", "maharashtra", "delhi", "uttar pradesh", "bihar", "west bengal", "tamil", "karnataka", "madhya pradesh", "state", "district", "village"])

    if has_occupation and not has_income and not has_location:
        if lang == "hi":
            return True, (
                "अच्छा, आपने अपना व्यवसाय बताया। "
                "बेहतर योजनाएं खोजने के लिए क्या आप यह भी बता सकते हैं:\n\n"
                "- आपकी अनुमानित वार्षिक पारिवारिक आय (जैसे 1 लाख से कम, 1-3 लाख)\n"
                "- आपका राज्य या जिला\n\n"
                "इससे मैं आपके लिए सबसे उपयुक्त सरकारी योजनाएं खोज सकता हूँ।"
            )
        elif lang == "gu":
            return True, (
                "સારું, આपने तमारो व्यवसाय जणाव्यो। "
                "सबसे अच्छी योजनाएं खोजने के लिए क्या आप यह भी बता सकते हैं:\n\n"
                "- तमारी अंदाजीत वार्षिक पारिवारिक आय\n"
                "- तमारू राज्य या जिला"
            )
        return True, (
            "Good, I see you have shared your occupation. "
            "To find the best schemes for you, could you also tell me:\n\n"
            "- Your approximate annual family income (e.g., below 1 lakh, 1-3 lakh)\n"
            "- Your state or district\n\n"
            "This will help me match you to the most relevant government schemes."
        )

    return False, ""


# ── Profile token extraction ─────────────────────────────────────
def _extract_profile_tokens(citizen_profile: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z]{3,}", (citizen_profile or "").lower()))


def _scheme_relevance_score(scheme: dict, profile_tokens: set[str]) -> int:
    score = 0
    match_val = scheme.get("match")
    
    # Rely primarily on the LLM's match percentage instead of English keyword matching
    # since the text may be in a local language.
    if isinstance(match_val, (int, float)):
        score += match_val
    elif isinstance(match_val, str):
        import re
        nums = re.findall(r'\d+', match_val)
        if nums:
            score += int(nums[0])
            
    # Give a base fallback score if match is completely missing
    if score == 0:
        score = 60
        
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
                    "reason": "Both schemes give similar benefits (subsidy or credit). You may not be able to take both at the same time.",
                })
            elif ("central" in a_title and "state" in b_title) or ("state" in a_title and "central" in b_title):
                conflicts.append({
                    "scheme_a": a.get("title", "Scheme A"),
                    "scheme_b": b.get("title", "Scheme B"),
                    "reason": "One is a central scheme and the other is a state scheme with similar criteria. Check with your local office if you can apply for both.",
                })
    return conflicts


# ── Plain-text response builder ──────────────────────────────────
def _build_structured_response(
    citizen_profile: str,
    schemes: list,
    conflicts: list,
    preferred_language: str = "en",
    invalid_msg: str = "",
    no_match: bool = False,
    followup_msg: str = "",
) -> str:
    lang = (preferred_language or "en").lower()

    if followup_msg:
        return followup_msg

    if invalid_msg:
        if lang.startswith("hi"):
            return (
                "अमान्य इनपुट\n\n"
                f"- {invalid_msg}\n\n"
                "कृपया अपनी जानकारी दें जैसे: आपका काम, आय और राज्य।"
            )
        if lang.startswith("gu"):
            return (
                "અમાન્ય ઇનપુટ\n\n"
                f"- {invalid_msg}\n\n"
                "કૃપા કરી તમારી માહિતી જેવી કે તમારું કામ, આવક અને રાજ્ય જણાવો."
            )
        return (
            "Invalid Input\n\n"
            f"- {invalid_msg}\n\n"
            "Please provide details like your occupation, income, and state. Do not include any personal Aadhaar or bank numbers here."
        )

    if no_match:
        if lang.startswith("hi"):
            return (
                "कोई सटीक योजना नहीं मिली\n\n"
                "सुझाव:\n"
                "- हम आपके लिए सटीक योजना नहीं खोज पाए।\n"
                "- कृपया अपनी आय, राज्य, और व्यवसाय बताएं।\n\n"
                "आप इन योजनाओं को भी देख सकते हैं:\n"
                "- PM Kisan Samman Nidhi\n"
                "- Ayushman Bharat PM-JAY\n"
                "- PM Awas Yojana\n"
                "- MGNREGS\n"
                "- Ujjwala Yojana 2.0"
            )
        if lang.startswith("gu"):
            return (
                "ચોક્કસ મેળ મળ્યો નથી\n\n"
                "સૂચન:\n"
                "- તમારા માટે ચોક્કસ યોજના મળી નથી.\n"
                "- કૃપા કરી તમારી આવક, રાજ્ય અને વ્યવસાય જણાવો.\n\n"
                "તમે આ યોજનાઓ પણ ચકાસી શકો:\n"
                "- PM Kisan Samman Nidhi\n"
                "- Ayushman Bharat PM-JAY\n"
                "- PM Awas Yojana\n"
                "- MGNREGS\n"
                "- Ujjwala Yojana 2.0"
            )
        return (
            "No Exact Match Found\n\n"
            "Suggestion:\n"
            "We could not find a strong scheme match from your current details.\n"
            "Please share your state, age, income, occupation, and social category for better results.\n\n"
            "Common schemes you can check:\n"
            "- PM Kisan Samman Nidhi\n"
            "- Ayushman Bharat PM-JAY\n"
            "- PM Awas Yojana\n"
            "- MGNREGS\n"
            "- Ujjwala Yojana 2.0"
        )

    if conflicts:
        top = conflicts[0]
        if lang.startswith("hi"):
            return (
                "टकराव पाया गया\n\n"
                "आप एक से अधिक योजनाओं के लिए पात्र हैं, लेकिन इन्हें एक साथ नहीं लिया जा सकता।\n\n"
                f"कारण:\n- {top['reason']}\n\n"
                "तुलना:\n"
                f"- {top['scheme_a']} — एक लाभ\n"
                f"- {top['scheme_b']} — एक लाभ\n\n"
                "सिफारिश:\n"
                "- पहले उस योजना में आवेदन करें जिसके लिए आपके दस्तावेज़ पूरे हैं।\n\n"
                "अगला कदम:\n"
                "- आवेदन करने से पहले नजदीकी सरकारी कार्यालय से पुष्टि करें।"
            )
        if lang.startswith("gu"):
            return (
                "વિરોધ જોવા મળ્યો\n\n"
                "તમે બે અથવા વધુ યોજનાઓ માટે પાત્ર છો, પરંતુ બંનેનો સાથે ઉપયોગ ન થઈ શકે.\n\n"
                f"કારણ:\n- {top['reason']}\n\n"
                "સરખામણી:\n"
                f"- {top['scheme_a']} — એક ફાયદો\n"
                f"- {top['scheme_b']} — એક ફાયદો\n\n"
                "ભલામણ:\n"
                "- પ્રથમ તે યોજनामां અરજી કરો જેના માટે તમારા દસ્તાવેજ તૈયાર છે.\n\n"
                "આગળનો પગલો:\n"
                "- અરજી કરતા પહેલાં નજીકની સરકારી કચેરીમાં ચકાસો."
            )
        return (
            "Conflict Detected\n\n"
            "You are eligible for multiple schemes, but they may not be used together.\n\n"
            f"Reason:\n- {top['reason']}\n\n"
            "Comparison:\n"
            f"- {top['scheme_a']} — overlapping benefit\n"
            f"- {top['scheme_b']} — overlapping benefit\n\n"
            "Recommendation:\n"
            "- Apply first to the scheme for which all your documents are ready.\n\n"
            "Next Step:\n"
            "- Confirm with your nearest government office before applying for both."
        )

    top = schemes[0] if schemes else {}
    docs = top.get("bullets") or ["Aadhaar Card", "Income Certificate", "Residence Proof"]
    reason = top.get("reason") or "Matched based on your profile."
    link = _get_official_link(top.get("title", ""))

    if lang.startswith("hi"):
        scheme_list = "\n".join([f"- {s.get('title', 'Government Scheme')}" for s in schemes[:5]])
        doc_list = "\n".join([f"- {d}" for d in docs[:5]])
        steps = [
            "आधिकारिक वेबसाइट पर जाएं।",
            "पंजीकरण करें या लॉगिन करें।",
            "अपनी जानकारी और दस्तावेज़ भरें।",
            "फॉर्म जमा करें और रसीद नंबर नोट करें।",
            "आधिकारिक पोर्टल पर अपने आवेदन की स्थिति जांचें।",
        ]
        step_list = "\n".join([f"{i+1}. {s}" for i, s in enumerate(steps)])
        link_line = f"\nआवेदन लिंक:\n- {link}" if link else "\nआवेदन लिंक:\n- आधिकारिक सरकारी वेबसाइट पर योजना का नाम खोजें।"
        return (
            f"पात्र योजनाएं:\n{scheme_list}\n\n"
            f"आप क्यों पात्र हैं:\n- {reason}\n\n"
            f"आवेदन कैसे करें:\n{step_list}\n\n"
            f"ऑफलाइन विकल्प:\n- निकटतम CSC केंद्र पर जाएं और दस्तावेज़ लेकर आवेदन करें।\n\n"
            f"आवश्यक दस्तावेज़:\n{doc_list}"
            f"{link_line}\n\n"
            f"अगला कदम:\n- ऊपर दी गई योजनाओं में से एक चुनें और आवेदन शुरू करें।"
        )

    if lang.startswith("gu"):
        scheme_list = "\n".join([f"- {s.get('title', 'Government Scheme')}" for s in schemes[:5]])
        doc_list = "\n".join([f"- {d}" for d in docs[:5]])
        steps = [
            "સત્તાવાર વેબસાઇટ ખોલો.",
            "નોંધણી કરાવો અથવા લૉગ ઇન કરો.",
            "તમારી માહિતી અને દસ્તાવેજ ભરો.",
            "ફોર્મ સબમિટ કરો અને રસીદ નંબર નોંધો.",
            "સત્તાવાર પોર્ટલ પર અરજીની સ્થિતિ ચકાસો.",
        ]
        step_list = "\n".join([f"{i+1}. {s}" for i, s in enumerate(steps)])
        link_line = f"\nઅરજી લિંક:\n- {link}" if link else "\nઅરજી લિંક:\n- સત્તાવાર સરકારી વેબસાઇટ પર યોજनानું નામ શોધો."
        return (
            f"પાત્ર યોજनाઓ:\n{scheme_list}\n\n"
            f"તમે શા માટે પાત્ર છો:\n- {reason}\n\n"
            f"કેવી રીતે અરજી કરવી:\n{step_list}\n\n"
            f"ઑફલાઇન વિકલ્પ:\n- નજીકના CSC કેન્દ્ર પર જઈ દસ્તાવેજ સાથે અરજી કરો.\n\n"
            f"જરૂરી દસ્તાવેજો:\n{doc_list}"
            f"{link_line}\n\n"
            f"આગળનો પગલો:\n- ઉપર ઉલ્લેખિત યોજnamas માંથી એક પસંદ કરો અને અરજી શરૂ કરો."
        )

    scheme_list = "\n".join([f"- {s.get('title', 'Government Scheme')}" for s in schemes[:5]])
    doc_list = "\n".join([f"- {d}" for d in docs[:5]])
    steps = [
        "Visit the official scheme website (link below).",
        "Click on 'Register' or 'Apply Now'.",
        "Fill in your personal and family details.",
        "Upload required documents.",
        "Submit the form and save your application reference number.",
        "Check your application status on the official portal.",
    ]
    step_list = "\n".join([f"{i+1}. {s}" for i, s in enumerate(steps)])
    link_line = f"\nApply Link:\n- {link}" if link else "\nApply Link:\n- Search the scheme name on the official government website."
    offline_step = "Visit your nearest Common Service Centre (CSC) or Jan Seva Kendra with all documents. The operator will help you apply for free."

    return (
        f"Eligible Schemes:\n{scheme_list}\n\n"
        f"Why You Qualify:\n- {reason}\n\n"
        f"How to Apply:\n{step_list}\n\n"
        f"Offline Option:\n- {offline_step}\n\n"
        f"Documents Required:\n{doc_list}"
        f"{link_line}\n\n"
        f"Next Step:\n- Pick one scheme from the list above and start your application."
    )


def _build_plain_language_summary(schemes: list, preferred_language: str):
    count = len(schemes)
    top_titles = [s.get("title", "Scheme") for s in schemes[:3]]
    titles_text = ", ".join(top_titles) if top_titles else "No direct scheme match yet"
    lang = (preferred_language or "en")[:2].lower()
    summaries = {
        "hi": f"आपके प्रोफाइल के आधार पर {count} योजनाएं मिलीं: {titles_text}।",
        "gu": f"તમારી પ્રોફાઇલ પ્રમાણે {count} યોજnaઓ મળ્યા: {titles_text}.",
        "mr": f"तुमच्या प्रोफाइलनुसार {count} योजना सापडल्या: {titles_text}.",
        "bn": f"আপনার প্রোফাইলের ভিত্তিতে {count}টি প্রকল্প পাওয়া গেছে: {titles_text}.",
        "te": f"మీ ప్రొఫైల్ ఆధారంగా {count} పథకాలు కిది: {titles_text}.",
        "ta": f"உங்கள் விவரங்களின் அடிப்படையில் {count} திட்டங்கள் கண்டறியப்பட்டன: {titles_text}.",
        "kn": f"ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಆಧಾರದ ಮೇಲೆ {count} ಯೋಜನೆಗಳು ಹೊಂದಿಕೆಯಾಗಿವೆ: {titles_text}.",
        "ml": f"നിങ്ങളുടെ പ്രൊഫൈലിന്റെ അടിസ്ഥാനത്തിൽ {count} പദ്ധതികൾ കണ്ടെത്തി: {titles_text}.",
        "pa": f"ਤੁਹਾਡੇ ਪ੍ਰੋਫਾਈਲ ਦੇ ਆਧਾਰ 'ਤੇ {count} ਯੋਜਨਾਵਾਂ ਮਿਲੀਆਂ: {titles_text}.",
        "or": f"ଆପଣଙ୍କ ପ୍ରୋଫାଇଲ ଆଧାରରେ {count}ଟି ଯୋଜନା ମିଳିଲା: {titles_text}.",
        "as": f"আপোনাৰ প্ৰফাইলৰ ভিত্তিত {count}টা আঁচনি পোৱা গ'ল: {titles_text}.",
    }
    return summaries.get(lang, f"Based on your profile, {count} schemes were matched: {titles_text}.")


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
        link = _get_official_link(title)
        schemes.append({
            "id": idx + 1,
            "title": title,
            "tag": category,
            "tagColor": style["tagColor"],
            "tagBg": style["tagBg"],
            "match": match,
            "reason": f"Matched from government policy documents for your profile. Verify eligibility on the official portal.",
            "bullets": [
                "Keep Aadhaar, income and domicile documents ready.",
                "Apply online or at the nearest facilitation office.",
                "Check official portal for exact eligibility criteria.",
            ],
            "explainPoints": [
                "Profile keywords overlap with this scheme category.",
                "Final eligibility must be confirmed from official guidelines.",
            ],
            "conflict": None,
            "applyLink": link,
        })

    if not schemes:
        schemes.append({
            "id": 1,
            "title": "No direct scheme match found",
            "tag": "Finance",
            "tagColor": "#0f5e6e",
            "tagBg": "rgba(15,94,110,0.10)",
            "match": 50,
            "reason": "Could not derive a strong match from available documents. Please add more profile details.",
            "bullets": ["Try adding age, occupation, state, and social category."],
            "explainPoints": ["More profile details improve matching quality."],
            "conflict": None,
            "applyLink": None,
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
            "followUp": "Would you like step-by-step guidance for any specific scheme?",
        },
    }


# ═══════════════════════════════════════════════════════════════════
# MAIN FIND SCHEMES FUNCTION
# ═══════════════════════════════════════════════════════════════════
def find_schemes(citizen_profile: str, preferred_language: str = "en", conversation_history: list = None):
    print(f"Searching schemes for: {citizen_profile}")
    has_history = bool(conversation_history)

    # 1. Invalid input check
    is_invalid, invalid_msg = _is_invalid_input(citizen_profile)
    if is_invalid:
        return {
            "schemes": [],
            "guidance": {
                "intro": _build_structured_response(
                    citizen_profile, [], [], preferred_language, invalid_msg=invalid_msg
                ),
                "steps": [],
                "followUp": "Please share valid profile details to continue.",
            },
            "sources": [],
            "conflicts": [],
            "followup": True,
        }

    # 2. Incomplete input — ask follow-up ONLY if there is no prior conversation
    if not has_history:
        needs_fu, fu_msg = _needs_followup(citizen_profile, preferred_language)
        if needs_fu:
            return {
                "schemes": [],
                "guidance": {
                    "intro": _build_structured_response(
                        citizen_profile, [], [], preferred_language, followup_msg=fu_msg
                    ),
                    "steps": [],
                    "followUp": fu_msg,
                },
                "sources": [],
                "conflicts": [],
                "followup": True,
            }

    # 3. RAG retrieval
    vectorstore = get_vectorstore()
    rag_results = vectorstore.similarity_search(citizen_profile, k=10)

    # 4. Local Database retrieval
    db_results = dataset_engine.search_schemes(citizen_profile, limit=5)

    context = ""
    sources = []

    for s in db_results:
        context += (
            f"\n\n---\nSource: Program Database\n"
            f"Scheme Name: {s.get('name')}\n"
            f"Category: {s.get('category')}\n"
            f"Description: {s.get('description')}\n"
            f"Eligibility: {s.get('eligibility')}\n"
            f"Benefits: {s.get('benefits')}\n"
        )
        sources.append("Scheme Database")

    for doc in rag_results:
        context += (
            f"\n\n---\nSource: {doc.metadata.get('source_file', 'Unknown')}, "
            f"Page: {doc.metadata.get('page', 'N/A')}\n{doc.page_content}"
        )
        sources.append(doc.metadata.get("source_file", "Unknown"))

    lang_map = {
        "en": "English",
        "hi": "Hindi",
        "mr": "Marathi",
        "bn": "Bengali",
        "gu": "Gujarati",
        "te": "Telugu",
        "ta": "Tamil",
        "kn": "Kannada",
        "ml": "Malayalam",
        "pa": "Punjabi",
        "or": "Odia",
        "as": "Assamese",
    }
    target_lang = lang_map.get((preferred_language or "en")[:2], "English")
    lang_instruction = (
        f"Respond ENTIRELY in {target_lang}. All scheme names, reasons, bullets, and descriptions must be in {target_lang}. "
        f"However, DO NOT translate the 'tag' field. The 'tag' MUST remain exactly one of the English categories: "
        f"Agriculture, Health, Education, Housing, Employment, Women, Finance, or Labour. "
        f"If you cannot translate a proper noun or government scheme acronym, keep it in English but all surrounding text must be in {target_lang}."
    )

    system_prompt = f"""You are PolicyPilot — a concise, helpful AI assistant for Indian government welfare schemes.
{lang_instruction}

Government Scheme Documents (use ONLY these to recommend schemes):
{context}

Return a JSON object with TWO keys:
1. "schemes" — array of matched scheme objects
2. "guidance" — object with:
   - "intro": A brief 2-3 sentence PERSONALIZED summary addressing the citizen directly. Mention their name/situation if provided. Say what you found and why they qualify. NEVER say generic things like "we found a scheme matching your criteria". Be specific, e.g. "Nikunj, since you are a newborn child (born 31-03-2026), you are eligible for child welfare schemes like Atal Sneh Yojana which provides free health checkups."
   - "steps": An array of 4-6 concrete application steps for the TOP matched scheme. These MUST be real, actionable steps like: "Visit pmkisan.gov.in and click New Farmer Registration", "Carry Aadhaar card and bank passbook to your nearest CSC centre", etc. NEVER leave this empty.
   - "followUp": A specific follow-up question like "Would you like me to explain the documents needed for [top scheme name]?"

Each scheme object must have EXACTLY these fields:
{{
  "id": <unique integer>,
  "title": "<scheme name>",
  "tag": "<category: Agriculture|Health|Education|Housing|Employment|Women|Finance|Labour>",
  "tagColor": "<hex color matching category>",
  "tagBg": "<rgba background color>",
  "match": <integer 0-100 representing eligibility match percentage>,
  "reason": "<one clear sentence explaining WHY this specific citizen qualifies based on their profile>",
  "bullets": ["<benefit 1>", "<benefit 2>", "<benefit 3>"],
  "explainPoints": ["<specific eligibility criterion met by this citizen>", "<another criterion>", "<another>"],
  "conflict": null,
  "applyLink": "<official government URL or null>"
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
- If the user sends a follow-up question (e.g., about documents or steps for a scheme already mentioned), answer that question directly in the guidance intro — do NOT repeat the scheme JSON again; return the same scheme list with an updated "guidance" intro that directly answers their question with specific steps
- The "reason" field MUST explain why THIS citizen qualifies — not a generic statement
- The "explainPoints" array MUST contain specific criteria this citizen meets
- Set "match" based on how well the citizen profile fits the criteria
- Never hallucinate eligibility criteria
- IMPORTANT: The guidance "steps" MUST always contain real application steps. Include the official website, required documents, and offline option (CSC/Jan Seva Kendra)
- Handle edge cases: newborns, elderly, disabled, students, farmers, daily wage workers — always find relevant schemes
- Return ONLY the raw JSON object — no markdown, no backticks, no explanation"""

    # Build multi-turn message list for the LLM
    llm_messages = [{"role": "system", "content": system_prompt}]

    # Append prior conversation turns
    if conversation_history:
        for turn in conversation_history:
            role = turn.get("role", "user")
            content = turn.get("content") or turn.get("text", "")
            if role in ("user", "assistant") and content:
                llm_messages.append({"role": role, "content": content})

    # Append current user message
    llm_messages.append({"role": "user", "content": f"Citizen Profile / Question: {citizen_profile}"})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=llm_messages,
            max_tokens=4000,
            temperature=0.7,
        )

        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()

        try:
            parsed = json.loads(raw)
            schemes = parsed.get("schemes", [])
            guidance = parsed.get("guidance", {
                "intro": "Here are the schemes you may qualify for:",
                "steps": [],
                "followUp": "Would you like help with any specific scheme?",
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

    lang_code = (preferred_language or "en")[:2].lower()

    # Only force static template when there's genuinely no match or a conflict to surface.
    # Let the LLM's RAG output through for normal en/hi/gu queries.
    need_static = (no_match or bool(conflicts)) and not has_history

    if need_static:
        guidance["intro"] = _build_structured_response(
            citizen_profile,
            schemes,
            conflicts,
            preferred_language,
            no_match=no_match,
        )
    else:
        # Keep the LLM-generated introduction (already in the correct language).
        # If the LLM left it empty or too generic, fall back to a short summary.
        intro = guidance.get("intro", "")
        generic_phrases = [
            "based on your profile",
            "we have found",
            "here are the schemes",
            "matches your eligibility",
            "matching your criteria",
            "you may qualify",
        ]
        is_generic = not intro or len(intro) < 30 or any(p in intro.lower() for p in generic_phrases)
        if is_generic and schemes:
            # Build a better intro from scheme data
            top = schemes[0]
            title = top.get("title", "a government scheme")
            reason = top.get("reason", "")
            count = len(schemes)
            guidance["intro"] = (
                f"I found {count} scheme{'s' if count > 1 else ''} for you. "
                f"The top match is **{title}** — {reason} "
                f"See the scheme cards on the right for full details and eligibility breakdown."
            )
        elif is_generic:
            guidance["intro"] = _build_plain_language_summary(schemes, preferred_language)

    # ── Ensure guidance.steps is NEVER empty ──
    if not guidance.get("steps") or len(guidance["steps"]) == 0:
        if schemes:
            top_title = schemes[0].get("title", "")
            detail_key = _get_scheme_detail_key(top_title)
            detail = SCHEME_DETAILS.get(detail_key, SCHEME_DETAILS["default"])
            link = _get_official_link(top_title) or detail.get("link") or "the official government portal"
            guidance["steps"] = [
                f"Visit {link} and look for '{top_title}' registration.",
                "Keep your Aadhaar card, income certificate, and bank passbook ready.",
                "Fill the online application form with your personal and bank details.",
                "If you prefer offline: visit your nearest Common Service Centre (CSC) or Jan Seva Kendra with all documents.",
                "After submitting, note your application reference number and check status on the portal.",
            ]
            # Use scheme-specific steps if available
            if detail_key != "default" and detail.get("steps"):
                guidance["steps"] = detail["steps"]
        else:
            guidance["steps"] = [
                "Share more details about yourself (occupation, income, state) for better matches.",
                "Visit india.gov.in/my-government/schemes for the full scheme directory.",
                "Visit your nearest Common Service Centre (CSC) for in-person help.",
            ]

    # ── followUp message (all 12 languages) ──
    _FOLLOWUP = {
        "hi": "क्या आप किसी एक योजना के बारे में विस्तृत मार्गदर्शन चाहते हैं?",
        "gu": "શું તમે કોઈ એક યોજના વિશે વિગતવાર માર્ગદર્શન ઇચ્છો છો?",
        "mr": "तुम्हाला एखाद्या योजनेबद्दल तपशीलवार मार्गदर्शन हवे का?",
        "bn": "আপনি কি কোনো একটি প্রকল্প সম্পর্কে বিস্তারিত গাইডেন্স চান?",
        "te": "మీరు ఏదైనా ఒక పథకం గురించి వివరమైన మార్గదర్శనం కోరుకుంటున్నారా?",
        "ta": "ஏதாவது ஒரு திட்டத்தைப் பற்றி விரிவான வழிகாட்டுதல் வேண்டுமா?",
        "kn": "ಯಾವುದಾದರೂ ಒಂದು ಯೋಜನೆಯ ಬಗ್ಗೆ ವಿವರವಾದ ಮಾರ್ಗದರ್ಶನ ಬೇಕೇ?",
        "ml": "ഏതെങ്കിലും ഒരു പദ്ധതിയെക്കുറിച്ച് വിശദമായ മാർഗ്ഗനിർദ്ദേശം ആവശ്യമുണ്ടോ?",
        "pa": "ਕੀ ਤੁਸੀਂ ਕਿਸੇ ਇੱਕ ਯੋਜਨਾ ਬਾਰੇ ਵਿਸਤਰਿਤ ਮਾਰਗਦਰਸ਼ਨ ਚਾਹੁੰਦੇ ਹੋ?",
        "or": "ଆପଣ କୌଣସି ଏକ ଯୋଜନା ବିଷୟରେ ବିସ୍ତୃତ ମାର୍ଗଦର୍ଶନ ଚାହୁଁଛନ୍ତି କି?",
        "as": "আপুনি কোনো এটা আঁচনিৰ বিষয়ে বিস্তাৰিত নিৰ্দেশনা বিচাৰে নেকি?",
    }
    guidance["followUp"] = _FOLLOWUP.get(
        lang_code,
        "Would you like step-by-step guidance for any one of these schemes?"
    )

    return {
        "schemes": schemes,
        "guidance": guidance,
        "sources": list(set(sources)),
        "conflicts": conflicts,
        "followup": False,
    }


# ═══════════════════════════════════════════════════════════════════
# SCHEME DETAIL — called when user clicks scheme in sidebar
# ═══════════════════════════════════════════════════════════════════
def get_scheme_detail(scheme_name: str, citizen_profile: str, preferred_language: str = "en") -> dict:
    """Return rich detail about a specific scheme, personalised to the citizen's profile."""
    key = _get_scheme_detail_key(scheme_name)
    detail = SCHEME_DETAILS.get(key, SCHEME_DETAILS["default"])
    link = _get_official_link(scheme_name) or detail.get("link")

    lang = (preferred_language or "en").lower()

    # Build human-friendly message
    if lang.startswith("hi"):
        steps_text = "\n".join([f"{i+1}. {s}" for i, s in enumerate(detail["steps"])])
        docs_text = "\n".join([f"- {d}" for d in detail["documents"]])
        elig_text = "\n".join([f"- {e}" for e in detail["eligibility"]])
        link_line = f"\nआवेदन लिंक:\n- {link}" if link else "\nआवेदन लिंक:\n- आधिकारिक सरकारी वेबसाइट पर खोजें।"
        message = (
            f"योजना: {scheme_name}\n\n"
            f"विवरण:\n{detail['description']}\n\n"
            f"पात्रता:\n{elig_text}\n\n"
            f"आवेदन कैसे करें:\n{steps_text}\n\n"
            f"ऑफलाइन विकल्प:\n- {detail['offline']}\n\n"
            f"आवश्यक दस्तावेज़:\n{docs_text}"
            f"{link_line}\n\n"
            f"अगला कदम:\n- ऊपर दी गई जानकारी के आधार पर अपने दस्तावेज़ तैयार करें और आवेदन करें।"
        )
    elif lang.startswith("gu"):
        steps_text = "\n".join([f"{i+1}. {s}" for i, s in enumerate(detail["steps"])])
        docs_text = "\n".join([f"- {d}" for d in detail["documents"]])
        elig_text = "\n".join([f"- {e}" for e in detail["eligibility"]])
        link_line = f"\nઅરજી લિंક:\n- {link}" if link else "\nઅरजी Link:\n- સrkar i વેबসাइट पर शोधो."
        message = (
            f"যोजना: {scheme_name}\n\n"
            f"વિગત:\n{detail['description']}\n\n"
            f"পات্рতা:\n{elig_text}\n\n"
            f"кेवी रिते અर्जी करवী:\n{steps_text}\n\n"
            f"ऑफلाइन विकल्प:\n- {detail['offline']}\n\n"
            f"जरूरी दसाвежोज:\n{docs_text}"
            f"{link_line}\n\n"
            f"आगळनो पगलो:\n- उपर дата माहिती प्रमाणे दसаवेजो तैयार करो अने अर्जी करو."
        )
    else:
        steps_text = "\n".join([f"{i+1}. {s}" for i, s in enumerate(detail["steps"])])
        docs_text = "\n".join([f"- {d}" for d in detail["documents"]])
        elig_text = "\n".join([f"- {e}" for e in detail["eligibility"]])
        link_line = f"\nApply Link:\n- {link}" if link else "\nApply Link:\n- Search the scheme name on the official government website."
        message = (
            f"Scheme: {scheme_name}\n\n"
            f"Description:\n{detail['description']}\n\n"
            f"Eligibility:\n{elig_text}\n\n"
            f"How to Apply:\n{steps_text}\n\n"
            f"Offline Option:\n- {detail['offline']}\n\n"
            f"Documents Required:\n{docs_text}"
            f"{link_line}\n\n"
            f"Next Step:\n- Collect the documents listed above and start your application today."
        )

    return {
        "scheme_name": scheme_name,
        "message": message,
        "link": link,
        "detail": detail,
    }


# ═══════════════════════════════════════════════════════════════════
# CHECKLIST GENERATOR
# ═══════════════════════════════════════════════════════════════════
def generate_application_checklist(scheme_name: str, citizen_profile: str):
    vectorstore = get_vectorstore()
    results = vectorstore.similarity_search(
        f"{scheme_name} application documents required", k=5
    )

    context = ""
    for doc in results:
        context += (
            f"\n\nSource: {doc.metadata.get('source_file')}, "
            f"Page: {doc.metadata.get('page')}\n{doc.page_content}"
        )

    prompt = f"""
Based on these official documents:
{context}

Generate a step-by-step application checklist for:
Scheme: {scheme_name}
Citizen: {citizen_profile}

Use plain text only. No markdown headings or symbols.
Include:
1. Required documents list
2. Step by step application process (online)
3. Step by step application process (offline / CSC)
4. Office or portal to use
5. Common mistakes to avoid

Keep language simple so low-literacy users can understand.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000,
    )
    return response.choices[0].message.content