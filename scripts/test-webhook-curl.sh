#!/bin/bash
# Test Paystack webhook script using cURL
# Usage: ./test-webhook-curl.sh [user_id] [event] [amount]

# Default values
USER_ID=${1:-1}
EVENT=${2:-"charge.success"}
AMOUNT=${3:-1000}
BASE_URL="http://localhost:5000"
REF="test_$(date +%s)_${EVENT//./_}"

echo "=== Testing Paystack webhook ==="
echo "User ID: $USER_ID"
echo "Event: $EVENT"
echo "Amount: ₦$AMOUNT"
echo "Reference: $REF"
echo "============================"

# Send the request
curl -X POST "$BASE_URL/api/payment/webhook-test/$EVENT" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": $USER_ID, \"amount\": $AMOUNT, \"reference\": \"$REF\"}" \
  -v

echo
echo "============================"
echo "Request sent!"