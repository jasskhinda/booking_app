#!/bin/bash

# Email Rate Limit Troubleshooting Guide
echo "📊 Email Rate Limit Troubleshooting"
echo "==================================="
echo ""

echo "🔍 Things to Check:"
echo ""

echo "1. SUPABASE SMTP Settings:"
echo "   → Go to: Supabase → Settings → Authentication → SMTP Settings"
echo "   → Check: 'Minimum interval between emails being sent'"
echo "   → Recommended: 10 seconds (not 60)"
echo ""

echo "2. BREVO Account Limits:"
echo "   → Go to: Brevo Dashboard → Settings → Account → Plan details"
echo "   → Check: Daily/monthly email limits"
echo "   → Free Plan: 300 emails/day"
echo "   → Paid Plans: Much higher limits"
echo ""

echo "3. RECENT SENDING ACTIVITY:"
echo "   → Go to: Brevo Dashboard → Statistics → Logs"
echo "   → Look for: Rate limit errors or quota exceeded"
echo ""

echo "4. IMMEDIATE SOLUTIONS:"
echo "   ✅ Wait 10-15 minutes before testing again"
echo "   ✅ Reduce Supabase SMTP interval to 10 seconds"
echo "   ✅ Don't test signup multiple times rapidly"
echo "   ✅ Check if you've hit your Brevo daily limit"
echo ""

echo "5. TEST WHEN READY:"
echo "   → Try one signup test"
echo "   → Wait for the email to arrive"
echo "   → Don't retry immediately if it fails"
echo ""

echo "💡 Pro Tip: Email rate limits usually reset within 1 hour."
