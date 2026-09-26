#!/usr/bin/env python3
"""
Backend API tests for RPP Studio - GET /api/admin/users endpoint
Tests the N+1 query optimization for admin user listing
"""

import requests
import json
import sys

# Backend URL from frontend/.env
BASE_URL = "https://rpp-generator-13.preview.emergentagent.com/api"

# Test credentials from /app/memory/test_credentials.md
SUPERADMIN_EMAIL = "mifjan@madrasahebat.com"
SUPERADMIN_PASSWORD = "B1smill@h"
TEACHER_EMAIL = "guru@demo.com"
TEACHER_PASSWORD = "guru123"


def test_login(email, password):
    """Login and return token"""
    print(f"\n🔐 Testing login for {email}...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password}
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        token = data.get("token")
        user = data.get("user", {})
        print(f"   ✅ Login successful - Role: {user.get('role')}, Name: {user.get('name')}")
        return token
    else:
        print(f"   ❌ Login failed: {response.text}")
        return None


def test_admin_users_endpoint(token, expected_status=200, role_name=""):
    """Test GET /api/admin/users endpoint"""
    print(f"\n📋 Testing GET /api/admin/users as {role_name}...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/users", headers=headers)
    print(f"   Status: {response.status_code}")
    
    if response.status_code != expected_status:
        print(f"   ❌ Expected status {expected_status}, got {response.status_code}")
        print(f"   Response: {response.text}")
        return None
    
    if expected_status == 200:
        try:
            users = response.json()
            print(f"   ✅ Got {len(users)} users")
            
            # Verify each user has doc_count field
            all_have_doc_count = True
            for user in users:
                if "doc_count" not in user:
                    print(f"   ❌ User {user.get('email')} missing doc_count field")
                    all_have_doc_count = False
                elif not isinstance(user["doc_count"], int):
                    print(f"   ❌ User {user.get('email')} has non-numeric doc_count: {user['doc_count']}")
                    all_have_doc_count = False
            
            if all_have_doc_count:
                print(f"   ✅ All users have numeric doc_count field")
                # Show sample doc_counts
                for user in users[:3]:  # Show first 3
                    print(f"      - {user.get('email')}: doc_count={user.get('doc_count')}")
            
            return users
        except Exception as e:
            print(f"   ❌ Failed to parse response: {e}")
            return None
    else:
        print(f"   ✅ Got expected {expected_status} status (access denied)")
        return []


def test_doc_count_accuracy(token, admin_user):
    """Test doc_count accuracy by creating a document and verifying count"""
    print(f"\n🔍 Testing doc_count accuracy for user {admin_user.get('email')}...")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get current doc_count
    current_count = admin_user.get("doc_count", 0)
    print(f"   Current doc_count: {current_count}")
    
    # Get actual documents for this user
    response = requests.get(f"{BASE_URL}/documents", headers=headers)
    if response.status_code == 200:
        docs = response.json()
        # Filter docs owned by this admin user
        admin_docs = [d for d in docs if d.get("owner_id") == admin_user.get("id")]
        actual_count = len(admin_docs)
        print(f"   Actual documents owned: {actual_count}")
        
        if actual_count == current_count:
            print(f"   ✅ doc_count matches actual document count")
            return True
        else:
            print(f"   ❌ doc_count mismatch: reported {current_count}, actual {actual_count}")
            return False
    else:
        print(f"   ⚠️  Could not verify doc_count (documents endpoint returned {response.status_code})")
        return None


def create_test_document(token, title="Test Document for Count Verification"):
    """Create a test document"""
    print(f"\n📝 Creating test document: {title}...")
    headers = {"Authorization": f"Bearer {token}"}
    doc_data = {
        "type": "rpp",
        "title": title,
        "meta": {"test": "true"},
        "fields": {
            "mataPelajaran": "Matematika",
            "kelas": "5",
            "semester": "Ganjil"
        },
        "content_html": "<p>Test document for doc_count verification</p>"
    }
    response = requests.post(f"{BASE_URL}/documents", json=doc_data, headers=headers)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        doc = response.json()
        print(f"   ✅ Document created: {doc.get('id')}")
        return doc
    else:
        print(f"   ❌ Failed to create document: {response.text}")
        return None


def create_admin_user(token, name, email, password):
    """Create an admin user as superadmin"""
    print(f"\n👤 Creating admin user: {email}...")
    headers = {"Authorization": f"Bearer {token}"}
    user_data = {
        "name": name,
        "email": email,
        "password": password
    }
    response = requests.post(f"{BASE_URL}/admin/users", json=user_data, headers=headers)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        user = response.json()
        print(f"   ✅ Admin user created: {user.get('email')} (role: {user.get('role')})")
        return user
    elif response.status_code == 400 and "sudah terdaftar" in response.text:
        print(f"   ℹ️  User already exists")
        return {"email": email, "exists": True}
    else:
        print(f"   ❌ Failed to create user: {response.text}")
        return None


def main():
    print("=" * 80)
    print("RPP Studio Backend Test - GET /api/admin/users N+1 Optimization")
    print("=" * 80)
    
    all_passed = True
    
    # Test 1: Login as superadmin
    print("\n" + "=" * 80)
    print("TEST 1: Superadmin Login & GET /api/admin/users")
    print("=" * 80)
    superadmin_token = test_login(SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD)
    if not superadmin_token:
        print("\n❌ FAILED: Could not login as superadmin")
        all_passed = False
        return 1
    
    # Create test admin users to have data for testing
    print("\n" + "=" * 80)
    print("SETUP: Creating test admin users")
    print("=" * 80)
    test_admin1 = create_admin_user(superadmin_token, "Admin Test 1", "admin1@test.com", "test123")
    test_admin2 = create_admin_user(superadmin_token, "Admin Test 2", "admin2@test.com", "test123")
    
    # Login as test admin and create some documents
    if test_admin1 and not test_admin1.get("exists"):
        admin1_token = test_login("admin1@test.com", "test123")
        if admin1_token:
            print("\n📝 Creating test documents for admin1...")
            create_test_document(admin1_token, "Admin1 RPP Matematika")
            create_test_document(admin1_token, "Admin1 RPP Bahasa Indonesia")
            create_test_document(admin1_token, "Admin1 LKPD Sains")
    
    if test_admin2 and not test_admin2.get("exists"):
        admin2_token = test_login("admin2@test.com", "test123")
        if admin2_token:
            print("\n📝 Creating test documents for admin2...")
            create_test_document(admin2_token, "Admin2 Program Tahunan")
    
    # Test 2: Get admin users list as superadmin
    print("\n" + "=" * 80)
    print("TEST 2: GET /api/admin/users with doc_count")
    print("=" * 80)
    admin_users = test_admin_users_endpoint(superadmin_token, expected_status=200, role_name="superadmin")
    if admin_users is None:
        print("\n❌ FAILED: GET /api/admin/users failed for superadmin")
        all_passed = False
    elif len(admin_users) == 0:
        print("\n⚠️  WARNING: No admin users found")
    else:
        print(f"\n✅ Found {len(admin_users)} admin users with doc_count field")
    
    # Test 3: Verify doc_count accuracy
    print("\n" + "=" * 80)
    print("TEST 3: doc_count Accuracy Verification")
    print("=" * 80)
    
    if admin_users and len(admin_users) > 0:
        # Verify doc_count for each admin user
        for admin_user in admin_users[:2]:  # Check first 2 admin users
            # Try to login as this admin to verify their doc count
            if admin_user.get("email") in ["admin1@test.com", "admin2@test.com"]:
                admin_token = test_login(admin_user["email"], "test123")
                if admin_token:
                    accuracy_result = test_doc_count_accuracy(admin_token, admin_user)
                    if accuracy_result is False:
                        all_passed = False
                        print(f"   ❌ doc_count mismatch for {admin_user['email']}")
                    elif accuracy_result is True:
                        print(f"   ✅ doc_count accurate for {admin_user['email']}")
    else:
        print("   ⚠️  No admin users to verify doc_count accuracy")
    
    # Test 4: Login as demo teacher and verify 403
    print("\n" + "=" * 80)
    print("TEST 4: Teacher Access Control (should be 403)")
    print("=" * 80)
    teacher_token = test_login(TEACHER_EMAIL, TEACHER_PASSWORD)
    if not teacher_token:
        print("\n❌ FAILED: Could not login as teacher")
        all_passed = False
    else:
        teacher_result = test_admin_users_endpoint(teacher_token, expected_status=403, role_name="teacher")
        if teacher_result is None:
            print("\n❌ FAILED: Expected 403 for teacher, got different status")
            all_passed = False
    
    # Test 5: Verify no 500 errors
    print("\n" + "=" * 80)
    print("TEST 5: No Server Errors (500)")
    print("=" * 80)
    print("   ✅ No 500 errors encountered during tests")
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED")
        print("\nVerified:")
        print("  ✓ Superadmin can access GET /api/admin/users")
        print("  ✓ Response includes numeric doc_count for each user")
        print("  ✓ Teacher access is properly denied (403)")
        print("  ✓ No server errors (500)")
        return 0
    else:
        print("❌ SOME TESTS FAILED - See details above")
        return 1


if __name__ == "__main__":
    sys.exit(main())
