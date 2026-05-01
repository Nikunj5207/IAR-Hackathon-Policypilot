import re

def _normalize(text: str) -> str:
    t = (text or "").lower()
    t = re.sub(r"[^a-z0-9\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t

def detect_conflicts(scheme_name: str):
    name = _normalize(scheme_name)
    keywords = set(name.split())
    central_hint = "central" in keywords or "pm" in keywords or "pradhan" in keywords
    state_hint = "state" in keywords or "gujarat" in keywords or "rajasthan" in keywords
    if central_hint and state_hint:
        return {
            "scheme": scheme_name,
            "conflict_found": True,
            "conflict_analysis": "CONFLICT FOUND: Central and state variants detected. Verify age, income, domicile criteria from official notifications."
        }
    return {
        "scheme": scheme_name,
        "conflict_found": False,
        "conflict_analysis": "NO CONFLICT DETECTED from scheme title keywords."
    }

def check_all_conflicts(schemes_list: list):
    return [detect_conflicts(scheme) for scheme in schemes_list]