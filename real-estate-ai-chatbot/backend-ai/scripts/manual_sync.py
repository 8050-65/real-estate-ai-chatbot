import requests
import argparse
import sys
import json

def main():
    parser = argparse.ArgumentParser(description="Trigger Leadrat CRM to RAG sync")
    parser.add_argument("--tenant", default="dubait11", help="Tenant ID")
    parser.add_argument("--type", default="all", choices=["all", "projects", "properties"], help="Sync type")
    parser.add_argument("--host", default="http://localhost:8000", help="API Host")
    
    args = parser.parse_args()
    
    url = f"{args.host}/api/v1/sync/trigger"
    payload = {
        "tenant_id": args.tenant,
        "entity_type": args.type
    }
    
    print(f"Triggering sync for tenant: {args.tenant}, type: {args.type}...")
    try:
        response = requests.post(url, json=payload, timeout=120)
        if response.status_code == 200:
            print("SUCCESS: Sync successful!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"FAILED: Sync failed with status code: {response.status_code}")
            print(response.text)
            sys.exit(1)
    except Exception as e:
        print(f"ERROR triggering sync: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
