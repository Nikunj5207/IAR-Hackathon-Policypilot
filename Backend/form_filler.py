import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY", "dummy_key"))

def extract_text_from_document(file_path: str) -> str:
    try:
        import fitz
        doc = fitz.open(file_path)
        text = "".join(page.get_text() for page in doc)
        doc.close()
        return text
    except Exception as e:
        return ""

def extract_citizen_info(document_text: str) -> dict:
    prompt = f"""Extract citizen info from this Indian government document.
Return ONLY valid JSON, no explanation.
Document: {document_text[:3000]}
Fields: name, age, gender, aadhaar_number, address, state, district,
pincode, income, caste, occupation, land_holding, bank_account, ifsc_code
Use null for missing fields."""
    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000
        )
        text = response.choices[0].message.content.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except:
        return {"error": "Could not parse document"}

def generate_filled_form(scheme_name: str, citizen_info: dict) -> str:
    prompt = f"""Generate a complete draft application form for {scheme_name}.
Citizen info: {json.dumps(citizen_info, indent=2)}
Include: header, personal details, address, income/category,
bank details, declaration, documents checklist, submission instructions.
Write [TO BE FILLED BY APPLICANT] for missing info."""
    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Form generation failed: {e}"

def process_uploaded_document(file_path: str, scheme_name: str) -> dict:
    document_text = extract_text_from_document(file_path)
    if not document_text:
        return {"error": "Could not extract text from document"}
    citizen_info = extract_citizen_info(document_text)
    filled_form = generate_filled_form(scheme_name, citizen_info)
    return {"citizen_info": citizen_info, "filled_form": filled_form, "status": "success"}