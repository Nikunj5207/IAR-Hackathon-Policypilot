import os
import json
from dotenv import load_dotenv
from groq import Groq
import fitz

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY", "dummy_key_to_prevent_boot_crash"))

def extract_text_from_document(file_path: str) -> str:
    print(f"Extracting text from: {file_path}")
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"❌ Error: {e}")
        return ""

def extract_citizen_info(document_text: str) -> dict:
    prompt = f"""
Extract the following information from this Indian government document text.
Return ONLY a valid JSON object, nothing else.

Document Text:
{document_text[:3000]}

Extract these fields (use null if not found):
{{
    "name": "full name of person",
    "age": "age or date of birth",
    "gender": "male/female/other",
    "aadhaar_number": "aadhaar number if present",
    "address": "full address",
    "state": "state name",
    "district": "district name",
    "pincode": "pincode",
    "income": "annual income if mentioned",
    "caste": "caste category if mentioned",
    "occupation": "occupation/profession",
    "land_holding": "land holding in acres if mentioned",
    "bank_account": "bank account number if present",
    "ifsc_code": "IFSC code if present"
}}

Return ONLY the JSON object, no explanation.
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000
    )
    try:
        text = response.choices[0].message.content.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except:
        return {"error": "Could not parse document"}

def generate_filled_form(scheme_name: str, citizen_info: dict) -> str:
    prompt = f"""
Generate a complete draft application form for the following scheme.
Fill in all details from the citizen information provided.

Scheme: {scheme_name}
Citizen Information: {json.dumps(citizen_info, indent=2)}

Generate a properly formatted application form with:
1. Application Form Header
2. Personal Details Section
3. Address Details Section
4. Income & Category Details
5. Bank Details Section
6. Declaration Section
7. Required Documents Checklist
8. Submission Instructions

For missing info write: [TO BE FILLED BY APPLICANT]
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000
    )
    return response.choices[0].message.content

def process_uploaded_document(file_path: str, scheme_name: str) -> dict:
    document_text = extract_text_from_document(file_path)
    if not document_text:
        return {"error": "Document se text extract nahi hua"}
    citizen_info = extract_citizen_info(document_text)
    filled_form = generate_filled_form(scheme_name, citizen_info)
    return {
        "citizen_info": citizen_info,
        "filled_form": filled_form,
        "status": "success"
    }