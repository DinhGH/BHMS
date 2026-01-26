#!/bin/bash
# BHMS Authentication System - Verification Script
# This script checks if everything is set up correctly

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  BHMS Authentication System - Setup Verification           ║"
echo "║  Created: January 17, 2026                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for checks
PASSED=0
FAILED=0

# Function to check
check() {
    local description=$1
    local command=$2
    
    echo -n "Checking: $description ... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
}

# Function to check file exists
check_file() {
    local description=$1
    local filepath=$2
    
    echo -n "Checking: $description ... "
    
    if [ -f "$filepath" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Missing: $filepath)"
        ((FAILED++))
    fi
}

echo "═══════════════════════════════════════════════════════════"
echo "1. System Requirements"
echo "═══════════════════════════════════════════════════════════"

check "Node.js installed" "node --version"
check "npm installed" "npm --version"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "2. Backend Files"
echo "═══════════════════════════════════════════════════════════"

check_file "authController.js exists" "server/controllers/authController.js"
check_file "authRoutes.js exists" "server/routes/authRoutes.js"
check_file "server/index.js exists" "server/index.js"
check_file "server/.env exists" "server/.env"
check_file "prisma/schema.prisma exists" "server/prisma/schema.prisma"
check_file "package.json exists" "server/package.json"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "3. Frontend Files"
echo "═══════════════════════════════════════════════════════════"

check_file "Login.jsx exists" "client/src/pages/Login.jsx"
check_file "Register.jsx exists" "client/src/pages/Register.jsx"
check_file "AuthContext.jsx exists" "client/src/contexts/AuthContext.jsx"
check_file "ProtectedRoute.jsx exists" "client/src/components/ProtectedRoute.jsx"
check_file "api.js exists" "client/src/services/api.js"
check_file "authService.js exists" "client/src/shared/utils/authService.js"
check_file "App.jsx exists" "client/src/App.jsx"
check_file "client/.env exists" "client/.env"
check_file "package.json exists" "client/package.json"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "4. Documentation Files"
echo "═══════════════════════════════════════════════════════════"

check_file "README.md exists" "README.md"
check_file "SETUP.md exists" "SETUP.md"
check_file "QUICK_REFERENCE.md exists" "QUICK_REFERENCE.md"
check_file "TEST_GUIDE.md exists" "TEST_GUIDE.md"
check_file "TECHNICAL_DOCS.md exists" "TECHNICAL_DOCS.md"
check_file "INDEX.md exists" "INDEX.md"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "5. Backend Dependencies"
echo "═══════════════════════════════════════════════════════════"

check "bcryptjs package" "grep -q 'bcryptjs' server/package.json"
check "jsonwebtoken package" "grep -q 'jsonwebtoken' server/package.json"
check "@prisma/client package" "grep -q '@prisma/client' server/package.json"
check "express package" "grep -q 'express' server/package.json"
check "cors package" "grep -q 'cors' server/package.json"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "6. Frontend Dependencies"
echo "═══════════════════════════════════════════════════════════"

check "axios package" "grep -q 'axios' client/package.json"
check "react-router-dom package" "grep -q 'react-router-dom' client/package.json"
check "react package" "grep -q 'react' client/package.json"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "7. Environment Configuration"
echo "═══════════════════════════════════════════════════════════"

check "SERVER: DATABASE_URL configured" "grep -q 'DATABASE_URL' server/.env"
check "SERVER: JWT_SECRET configured" "grep -q 'JWT_SECRET' server/.env"
check "SERVER: PORT configured" "grep -q 'PORT' server/.env"
check "CLIENT: VITE_API_BASE_URL configured" "grep -q 'VITE_API_BASE_URL' client/.env"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "8. Port Availability"
echo "═══════════════════════════════════════════════════════════"

check "Port 3000 available" "! netstat -tuln 2>/dev/null | grep -q ':3000 ' || echo true"
check "Port 5173 available" "! netstat -tuln 2>/dev/null | grep -q ':5173 ' || echo true"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "VERIFICATION SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "Checks Passed:  ${GREEN}$PASSED${NC}"
echo -e "Checks Failed:  ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! System is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Terminal 1: cd server && npm run dev"
    echo "2. Terminal 2: cd client && npm run dev"
    echo "3. Open: http://localhost:5173"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review above.${NC}"
    exit 1
fi
