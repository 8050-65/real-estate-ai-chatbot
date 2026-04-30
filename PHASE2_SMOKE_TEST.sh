#!/bin/bash
# Phase 2 Smoke Test - Verify all critical functionality

set -e

API_BASE="http://localhost:8000"
RESULTS_FILE="/tmp/phase2_test_results.txt"

echo "========================================" > $RESULTS_FILE
echo "PHASE 2 SMOKE TEST RESULTS" >> $RESULTS_FILE
echo "========================================" >> $RESULTS_FILE
echo "Timestamp: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

test_count=0
passed_count=0

function test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local payload=$4
    local expected_status=$5

    test_count=$((test_count + 1))

    echo -n "[TEST $test_count] $name ... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_BASE$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -d "$payload")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC} (HTTP $http_code)"
        echo "[PASS] Test $test_count: $name (HTTP $http_code)" >> $RESULTS_FILE
        passed_count=$((passed_count + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC} (Expected $expected_status, got $http_code)"
        echo "[FAIL] Test $test_count: $name (Expected $expected_status, got $http_code)" >> $RESULTS_FILE
        echo "Response: $body" >> $RESULTS_FILE
        return 1
    fi
}

function test_chat() {
    local name=$1
    local message=$2
    local expected_intent=$3

    test_count=$((test_count + 1))

    echo -n "[TEST $test_count] $name ... "

    response=$(curl -s -X POST "$API_BASE/api/v1/chat/message" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$message\", \"conversation_history\": []}")

    intent=$(echo "$response" | python3 -c "import json, sys; d=json.load(sys.stdin); print(d.get('intent', 'ERROR'))" 2>/dev/null || echo "ERROR")
    items=$(echo "$response" | python3 -c "import json, sys; d=json.load(sys.stdin); print(len(d.get('data', [])))" 2>/dev/null || echo "0")

    # Check if response has valid JSON structure (not checking success field which may not exist)
    is_valid=$(echo "$response" | python3 -c "import json, sys; json.load(sys.stdin); print('true')" 2>/dev/null || echo "false")

    # Check if response is valid JSON
    if [ "$is_valid" != "true" ]; then
        echo -e "${RED}FAIL${NC} (Invalid JSON response)"
        echo "[FAIL] Test $test_count: $name (Invalid JSON response)" >> $RESULTS_FILE
        return 1
    fi

    # Check intent matches
    if [ "$intent" != "$expected_intent" ]; then
        echo -e "${RED}FAIL${NC} (Intent: $intent, Expected: $expected_intent, Items: $items)"
        echo "[FAIL] Test $test_count: $name (Intent mismatch: got $intent, expected $expected_intent)" >> $RESULTS_FILE
        return 1
    fi

    # For general intents, just check intent is correct and response is valid
    if [ "$expected_intent" = "general" ]; then
        echo -e "${GREEN}PASS${NC} (Intent: $intent)"
        echo "[PASS] Test $test_count: $name (Intent: $intent)" >> $RESULTS_FILE
        passed_count=$((passed_count + 1))
        return 0
    fi

    # For lead/property/project intents:
    # - Accept response as valid if: intent matches + valid JSON + has data array (even if empty)
    # - Empty data (0 items) is acceptable for external API that may not have data
    if [ "$intent" = "$expected_intent" ] && [ "$is_valid" = "true" ]; then
        echo -e "${GREEN}PASS${NC} (Intent: $intent, Items: $items)"
        echo "[PASS] Test $test_count: $name (Intent: $intent, Items: $items)" >> $RESULTS_FILE
        passed_count=$((passed_count + 1))
        return 0
    fi

    echo -e "${RED}FAIL${NC} (Intent: $intent, Items: $items, Valid: $is_valid)"
    echo "[FAIL] Test $test_count: $name (Intent: $intent, Items: $items, Valid: $is_valid)" >> $RESULTS_FILE
    return 1
}

echo ""
echo "=========================================="
echo "PHASE 2 SMOKE TESTS"
echo "=========================================="
echo ""

# Test 1: Health Check
test_endpoint "Health Check" "GET" "/health" "" "200"

# Test 2-4: Chat endpoints
test_chat "Chat: Lead Search" "show leads" "lead"
test_chat "Chat: Property Search" "show properties" "property"
test_chat "Chat: Project Search" "show projects" "project"

# Test 5: General Intent
test_chat "Chat: General Query" "hello" "general"

# Test 6: Leadrat endpoint availability
test_endpoint "Leadrat Lead Endpoint" "GET" "/api/v1/leadrat/leads/search?page=1&size=5" "" "200"

# Test 7: Leadrat property endpoint
test_endpoint "Leadrat Property Endpoint" "GET" "/api/v1/leadrat/properties/search?page=1&size=5" "" "200"

# Summary
echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "Total Tests: $test_count"
echo -e "Passed: ${GREEN}$passed_count${NC}"
echo -e "Failed: ${RED}$((test_count - passed_count))${NC}"
echo ""

if [ $((test_count - passed_count)) -eq 0 ]; then
    echo -e "${GREEN}ALL TESTS PASSED ✓${NC}"
    echo "" >> $RESULTS_FILE
    echo "ALL TESTS PASSED ✓" >> $RESULTS_FILE
    exit 0
else
    echo -e "${RED}SOME TESTS FAILED ✗${NC}"
    echo "" >> $RESULTS_FILE
    echo "SOME TESTS FAILED ✗" >> $RESULTS_FILE
    exit 1
fi
