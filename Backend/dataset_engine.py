import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

SCHEMES_DB = {}

def load_datasets():
    global SCHEMES_DB
    SCHEMES_DB = {}
    
    # Load CSV
    csv_path = os.path.join(DATA_DIR, "All schemes dataset.csv")
    if os.path.exists(csv_path):
        try:
            import pandas as pd
            df = pd.read_csv(csv_path)
            for _, row in df.iterrows():
                name = str(row.get('scheme_name', '')).strip()
                if name and str(name).lower() != 'nan':
                    SCHEMES_DB[name.lower()] = {
                        "name": name,
                        "description": str(row.get('details', '')),
                        "benefits": str(row.get('benefits', '')),
                        "eligibility": str(row.get('eligibility', '')),
                        "application_process": str(row.get('application', '')),
                        "documents_required": str(row.get('documents', '')),
                        "category": str(row.get('schemeCategory', '')),
                        "tags": str(row.get('tags', '')).split(',') if pd.notna(row.get('tags')) else [],
                        "level": str(row.get('level', 'Central')),
                        "source": "csv"
                    }
        except Exception as e:
            print(f"Error loading CSV dataset: {e}")

    # Load JSON if exists
    json_path = os.path.join(DATA_DIR, "schemes.json")
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for item in data:
                    name = item.get("name", "").strip()
                    if name:
                        SCHEMES_DB[name.lower()] = {
                            "name": name,
                            "description": item.get("description", ""),
                            "benefits": item.get("benefits", ""),
                            "eligibility": item.get("eligibility", ""),
                            "application_process": item.get("application_process", ""),
                            "documents_required": item.get("documents_required", ""),
                            "category": item.get("category", ""),
                            "tags": item.get("tags", []),
                            "level": item.get("level", "Central"),
                            "source": "json",
                            "link": item.get("link", "")
                        }
        except Exception as e:
            print(f"Error loading JSON dataset: {e}")
            
    print(f"[Dataset Engine] Loaded {len(SCHEMES_DB)} schemes into memory.")
    return SCHEMES_DB

def get_scheme_by_name(name):
    if not SCHEMES_DB:
        load_datasets()
    name_lower = (name or "").lower()
    for k, v in SCHEMES_DB.items():
        if name_lower in k or k in name_lower:
            return v
    return None

def search_schemes(query_text: str, limit=5):
    if not SCHEMES_DB:
        load_datasets()
    
    results = []
    
    # Simple keyword extraction (naive)
    query_words = set([w.lower() for w in query_text.split() if len(w) > 3])
    
    if not query_words:
        return []
        
    for k, v in SCHEMES_DB.items():
        score = 0
        scheme_text = (k + " " + v.get("description", "") + " " + v.get("category", "")).lower()
        scheme_tags = [t.lower() for t in v.get("tags", [])]
        
        for w in query_words:
            if w in scheme_text or any(w in st for st in scheme_tags):
                score += 1
                
        if score > 0:
            results.append((score, v))
            
    # Sort by score DESC
    results.sort(key=lambda x: x[0], reverse=True)
    return [r[1] for r in results[:limit]]

