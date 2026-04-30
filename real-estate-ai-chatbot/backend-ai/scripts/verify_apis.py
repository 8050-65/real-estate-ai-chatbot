import requests
import json
import time
from datetime import datetime

# Configuration
FASTAPI_URL = "http://localhost:8000"
SPRING_BOOT_URL = "http://localhost:8080"
TENANT_ID = "dubait11"

def test_endpoint(name, method, url, payload=None, params=None):
    print(f"Testing {name}...")
    try:
        start_time = time.time()
        if method == "GET":
            response = requests.get(url, params=params, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=payload, timeout=10)
        
        duration = time.time() - start_time
        status_code = response.status_code
        
        try:
            data = response.json()
            success = True
            if isinstance(data, dict):
                # Flexible success check
                if "status" in data and data["status"] in ["healthy", "UP", "success"]: success = True
                elif "success" in data: success = data["success"]
                elif "succeeded" in data: success = data["succeeded"]
        except:
            data = response.text
            success = status_code == 200

        return {
            "name": name,
            "status": "WORKING" if (status_code < 400 and success) else "FAILING",
            "code": status_code,
            "duration": f"{duration:.2f}s",
            "error": None if (status_code < 400 and success) else f"Status: {status_code}, Body: {str(data)[:100]}"
        }
    except Exception as e:
        return {
            "name": name,
            "status": "ERROR",
            "code": "N/A",
            "duration": "N/A",
            "error": str(e)
        }

def run_verification():
    results = []
    
    # 1. Infrastructure
    results.append(test_endpoint("FastAPI Health", "GET", f"{FASTAPI_URL}/health"))
    results.append(test_endpoint("Java Actuator", "GET", f"{SPRING_BOOT_URL}/actuator/health"))
    
    # 2. LeadRat Core (FastAPI Proxy)
    results.append(test_endpoint("Lead Search", "GET", f"{FASTAPI_URL}/api/v1/leads", params={"tenant_id": TENANT_ID, "search": "test"}))
    results.append(test_endpoint("Project Search", "GET", f"{FASTAPI_URL}/api/v1/projects", params={"tenant_id": TENANT_ID}))
    results.append(test_endpoint("Property Search", "GET", f"{FASTAPI_URL}/api/v1/properties", params={"tenant_id": TENANT_ID}))
    
    # 3. Java Backend Specifics
    # Note: Using correct endpoint /api/v1/site-visits
    results.append(test_endpoint("Visit API", "GET", f"{SPRING_BOOT_URL}/api/v1/site-visits"))
    
    # 4. AI & RAG
    results.append(test_endpoint("RAG Stats", "GET", f"{FASTAPI_URL}/api/v1/rag/stats", params={"tenant_id": TENANT_ID}))
    results.append(test_endpoint("Chat Router", "POST", f"{FASTAPI_URL}/chat", payload={"message": "hello", "tenant_id": TENANT_ID}))

    # Print Report
    print("\n" + "="*80)
    print(f"LEADRAT AI CHATBOT - API HEALTH AUDIT - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    print(f"{'Service/API':<20} | {'Status':<10} | {'Code':<5} | {'Time':<8} | {'Details/Error'}")
    print("-" * 80)
    for r in results:
        notes = r["error"] if r["error"] else "OK"
        print(f"{r['name']:<20} | {r['status']:<10} | {r['code']:<5} | {r['duration']:<8} | {notes}")
    print("="*80)

if __name__ == "__main__":
    run_verification()
