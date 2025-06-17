#!/bin/bash

# Email Configuration Test Script for CCT Booking App
# This script helps verify that email configuration is working correctly

echo "🚀 CCT Email Configuration Test"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This script will guide you through testing your email configuration.${NC}"
echo ""

echo "📝 Manual Test Checklist:"
echo "========================="
echo ""

echo "1. 📧 Test Email Confirmation:"
echo "   → Visit: https://book.compassionatecaretransportation.com/signup"
echo "   → Create a test account with a real email"
echo "   → Check email comes from: noreply@compassionatecaretransportation.com"
echo "   → Verify CCT branding in email"
echo "   → Test confirmation link works"
echo ""

echo "2. 🔑 Test Password Reset:"  
echo "   → Visit: https://book.compassionatecaretransportation.com/login"
echo "   → Click 'Forgot password?'"
echo "   → Enter email on reset page"
echo "   → Check reset email has CCT branding"
echo "   → Test reset link works"
echo ""

echo "3. ⚙️ Verify Supabase Settings:"
echo "   → SMTP Settings configured"
echo "   → Custom email templates uploaded" 
echo "   → Site URLs configured correctly"
echo ""

echo -e "${GREEN}✅ If all tests pass, your email branding is working!${NC}"
echo ""

echo "🛠️ Troubleshooting:"
echo "==================="
echo "• Check spam/junk folders"
echo "• Verify SMTP credentials in Supabase"
echo "• Check Supabase logs for errors"
echo "• Test with different email providers"
echo ""

echo -e "${YELLOW}📚 For detailed setup instructions, see:${NC}"
echo "   • EMAIL_BRANDING_SETUP.md"
echo "   • EMAIL_CONFIGURATION_COMPLETE.md"
