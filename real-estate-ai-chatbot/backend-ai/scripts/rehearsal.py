import asyncio
import httpx
import time

API_URL = "http://localhost:8000/api/v1/chat/message"
TENANT_ID = "dubait11"
SESSION_ID = "executive-demo-session"

QUERIES = [
    "hello",
    "show hot leads",
    "show luxury villas in Dubai",
    "what about apartments?",
    "what active projects are there?",
    "projects with swimming pool",
    "2bhk under 1 crore",
    "book site visit"
]

async def run_rehearsal():
    print("🚀 Starting Executive Demo Rehearsal & Cache Warming...\n")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        history = []
        
        for q in QUERIES:
            print(f"User: {q}")
            start = time.time()
            
            payload = {
                "message": q,
                "tenant_id": TENANT_ID,
                "session_id": SESSION_ID,
                "conversation_history": history[-6:]
            }
            
            try:
                r = await client.post(API_URL, json=payload)
                data = r.json()
                latency = round((time.time() - start) * 1000)
                
                print(f"Assistant ({latency}ms) [Source: {data.get('source')}]: {data.get('response')}")
                if data.get('template'):
                    print(f"   + Attached Card Template: {data.get('template')}")
                    print(f"   + Data Items: {len(data.get('data', []))}")
                
                # Append to history
                history.append({"role": "user", "content": q})
                if data.get("response"):
                    history.append({"role": "assistant", "content": data.get("response")})
                    
            except Exception as e:
                print(f"ERROR: {e}")
                
            print("-" * 50)
            
if __name__ == "__main__":
    asyncio.run(run_rehearsal())
