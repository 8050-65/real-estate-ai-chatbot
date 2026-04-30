#!/bin/bash

echo "=== Testing End-to-End Login Flow ==="
echo

# Test 1: Login API
echo "1. Testing Login API..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@crm-cbt.com", "password": "Admin@123!"}')

echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'  Status: {\"Success\" if d.get(\"success\") else \"Failed\"}')" 

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['data'].get('accessToken', ''))" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "  ERROR: No token received!"
  exit 1
fi

echo "  Token received: ${ACCESS_TOKEN:0:30}..."
echo

# Test 2: Protected endpoint with token
echo "2. Testing Dashboard API (requires token)..."
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:8080/actuator/health | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'  Response: {d.get(\"status\", \"unknown\")}')"

echo
echo "=== Login Flow Test Complete ==="
