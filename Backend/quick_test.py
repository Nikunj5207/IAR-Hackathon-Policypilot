import requests, json

resp = requests.post("http://localhost:8000/find-schemes", json={
    "citizen_profile": "I am Nikunj born on 31-03-2026, tell me some schemes",
    "preferred_language": "en",
    "conversation_history": []
}, timeout=60)

data = resp.json()
print("=== STATUS ===")
print(data.get("status"))
print("\n=== MESSAGE (guidance intro) ===")
print(data.get("message", "")[:500])
print("\n=== STEPS ===")
for i, step in enumerate(data.get("schemes", [{}])[0].get("applicationChecklist", [])[:5] if data.get("schemes") else []):
    print(f"  {i+1}. {step}")
print("\n=== GUIDANCE STEPS ===")
# The guidance steps come through the message field in main.py
# But let's check if checklists are populated
checklists = data.get("checklists", [])
if checklists:
    print(f"  Checklists for {len(checklists)} schemes generated")
    for cl in checklists[:1]:
        print(f"  Scheme: {cl.get('scheme')}")
        checklist_text = cl.get("checklist", "")
        if isinstance(checklist_text, str):
            for line in checklist_text.split("\n")[:5]:
                if line.strip():
                    print(f"    {line.strip()}")

print("\n=== SCHEMES ===")
for s in data.get("schemes", [])[:3]:
    print(f"  [{s.get('match')}%] {s.get('title')} - {s.get('reason', '')[:80]}")
