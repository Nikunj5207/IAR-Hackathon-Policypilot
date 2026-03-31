import requests
import json
import time
import subprocess
import os

def test_find_schemes():
    url = "http://127.0.0.1:8000/find-schemes"
    payload = {
        "citizen_profile": "I am a small farmer in Gujarat earning 50000 per year. I have 2 hectares of land.",
        "preferred_language": "en"
    }
    
    # Start server
    print("Starting server...")
    server_proc = subprocess.Popen(["uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"], cwd=os.getcwd())
    time.sleep(10)  # Wait for server to start
    
    try:
        print("Sending request...")
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response received successfully.")
            
            # Check for checklists key
            if "checklists" in data:
                print(f"Checklists found: {len(data['checklists'])}")
                for cl in data['checklists']:
                    print(f"Scheme: {cl.get('scheme')}")
                    # print(f"Checklist: {cl.get('checklist')[:100]}...")
            else:
                print("Error: 'checklists' key NOT found in response.")
                
            # Check if checklists matches the top schemes
            schemes = data.get("schemes", [])
            if schemes:
                print(f"Top scheme: {schemes[0].get('title')}")
                if "applicationChecklist" in schemes[0]:
                    print("Top scheme has 'applicationChecklist' field.")
                else:
                    print("Error: Top scheme missing 'applicationChecklist'.")
        else:
            print(f"Error: {response.text}")
            
    finally:
        print("Stopping server...")
        server_proc.terminate()
        server_proc.wait()

if __name__ == "__main__":
    test_find_schemes()
