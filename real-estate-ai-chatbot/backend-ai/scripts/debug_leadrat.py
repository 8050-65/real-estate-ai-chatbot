import asyncio
import httpx
import json

async def check_data():
    tenant_id = "dubait11"
    # From .env
    base_url = "https://connect.leadrat.com/api/v1"
    auth_url = "https://connect.leadrat.com/api/v1/authentication/token"
    api_key = "Zjg2N2JiNjItODBmOC00YzBjLTlkMmMtMjk5OGRiZjBmMDU3OmR1YmFpdDEx"
    secret_key = "a3Ay5UKLYjm6sZ_TXCXGzqmIdB3zgM8Y"

    async with httpx.AsyncClient() as client:
        # Auth
        auth_resp = await client.post(
            auth_url,
            json={"apiKey": api_key, "secretKey": secret_key},
            headers={"tenant": tenant_id}
        )
        token = auth_resp.json().get("data", {}).get("accessToken")
        print(f"Token: {token[:10]}...")

        # Projects
        proj_resp = await client.get(
            f"{base_url}/project/all?PageNumber=1&PageSize=10",
            headers={"Authorization": f"Bearer {token}"}
        )
        print("\nPROJECTS RESPONSE:")
        print(json.dumps(proj_resp.json(), indent=2))

        # Properties
        prop_resp = await client.get(
            f"{base_url}/property?PageNumber=1&PageSize=10",
            headers={"Authorization": f"Bearer {token}"}
        )
        print("\nPROPERTIES RESPONSE:")
        print(json.dumps(prop_resp.json(), indent=2))

if __name__ == "__main__":
    asyncio.run(check_data())
