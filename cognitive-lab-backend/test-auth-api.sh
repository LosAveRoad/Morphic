#!/bin/bash

# test-auth-api.sh
# Manual testing script for authentication API

BASE_URL="http://localhost:3000"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test_${TIMESTAMP}@example.com"

echo "🧪 Testing Authentication API"
echo "================================"

# Test 1: Register new user
echo -e "\n1. Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"password123\",
    \"username\": \"testuser_${TIMESTAMP}\"
  }")

echo "Response: $REGISTER_RESPONSE"
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed or token not found"
  exit 1
fi

echo "✅ Registration successful"
echo "Token: $TOKEN"

# Test 2: Login
echo -e "\n2. Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"password123\"
  }")

echo "Response: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
  echo "✅ Login successful"
else
  echo "❌ Login failed"
  exit 1
fi

# Test 3: Get current user (protected route)
echo -e "\n3. Testing GET /api/auth/me (protected route)..."
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $ME_RESPONSE"

if echo "$ME_RESPONSE" | grep -q "\"email\":\"$TEST_EMAIL\""; then
  echo "✅ Get current user successful"
else
  echo "❌ Get current user failed"
  exit 1
fi

# Test 4: Logout
echo -e "\n4. Testing POST /api/auth/logout..."
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/logout" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $LOGOUT_RESPONSE"

if echo "$LOGOUT_RESPONSE" | grep -q 'Logged out successfully'; then
  echo "✅ Logout successful"
else
  echo "❌ Logout failed"
  exit 1
fi

# Test 5: Test with invalid token
echo -e "\n5. Testing protected route with invalid token..."
INVALID_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer invalid-token")

echo "Response: $INVALID_RESPONSE"

if echo "$INVALID_RESPONSE" | grep -q 'Unauthorized'; then
  echo "✅ Invalid token properly rejected"
else
  echo "❌ Invalid token should be rejected"
  exit 1
fi

# Test 6: Test duplicate registration
echo -e "\n6. Testing duplicate email registration..."
DUPLICATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"different123\"
  }")

echo "Response: $DUPLICATE_RESPONSE"

if echo "$DUPLICATE_RESPONSE" | grep -q 'Email already exists'; then
  echo "✅ Duplicate email properly rejected"
else
  echo "❌ Duplicate email should be rejected"
  exit 1
fi

# Test 7: Test invalid login
echo -e "\n7. Testing login with wrong password..."
WRONG_PASS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"wrongpassword\"
  }")

echo "Response: $WRONG_PASS_RESPONSE"

if echo "$WRONG_PASS_RESPONSE" | grep -q 'Invalid email or password'; then
  echo "✅ Wrong password properly rejected"
else
  echo "❌ Wrong password should be rejected"
  exit 1
fi

echo -e "\n================================"
echo "✅ All tests passed!"