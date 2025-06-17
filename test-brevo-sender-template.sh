#!/bin/bash

# Test Brevo Sender Configuration - TEMPLATE
echo "🧪 Testing Brevo Sender Email Configuration"
echo "=========================================="
echo ""

# INSTRUCTIONS:
# 1. Copy this file to test-brevo-sender.sh
# 2. Replace YOUR_BREVO_API_KEY_HERE with your actual API key
# 3. Run the script to test your Brevo configuration

# API Key from your Brevo dashboard - Replace with your actual API key
API_KEY="YOUR_BREVO_API_KEY_HERE"

if [ "$API_KEY" = "YOUR_BREVO_API_KEY_HERE" ]; then
    echo "❌ Please edit this script and add your actual Brevo API key"
    echo "   Replace 'YOUR_BREVO_API_KEY_HERE' with your key from Brevo dashboard"
    exit 1
fi

echo "Testing if sender email is configured in Brevo..."
echo ""

# Test API connection and get senders list
response=$(curl -X GET 'https://api.brevo.com/v3/senders' \
  -H 'accept: application/json' \
  -H "api-key: $API_KEY" \
  -s)

echo "Response from Brevo API:"
echo "$response"
echo ""

# Check if our sender email is in the response
if echo "$response" | grep -q "noreply@compassionatecaretransportation.com"; then
    echo "✅ SUCCESS: Sender email is configured in Brevo!"
else
    echo "❌ ISSUE: Sender email NOT found in Brevo."
    echo ""
    echo "To fix this:"
    echo "1. Go to Brevo Dashboard → Settings → Senders & IPs → Senders"
    echo "2. Click 'Add a sender'"
    echo "3. Email: noreply@compassionatecaretransportation.com"
    echo "4. Name: Compassionate Care Transportation"
    echo "5. Click Save"
fi
