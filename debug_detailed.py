import requests
import os

def test_admin_login_with_debug():
    """
    Test admin login with more debug information
    """
    
    # Configuration
    FINGERPRINT_PATH = "DB1_B/101_1.tif"
    LOGIN_URL = "http://localhost:8080/api/admin/login"
    ADMIN_ID = "ADMIN001"
    
    print("🔐 Debug Admin Login Test")
    print("========================")
    
    # Step 1: Check if biometric service is directly accessible from AdminService perspective
    print("\n1. Testing biometric service URL from backend config...")
    biometric_url = "http://localhost:8001/enhanced/verify"
    
    try:
        with open(FINGERPRINT_PATH, 'rb') as fp:
            files = {'fingerprint': ('101_1.tif', fp, 'image/tiff')}
            data = {'voter_id': 'ADMIN_ADMIN001'}
            
            # Test direct call to biometric service (same as AdminService would do)
            response = requests.post(biometric_url, files=files, data=data, timeout=30)
            print(f"   Biometric service response: {response.status_code}")
            print(f"   Response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('verified'):
                    print("   ✅ Direct biometric call successful")
                else:
                    print("   ❌ Direct biometric call failed verification")
            else:
                print("   ❌ Direct biometric call HTTP error")
    except Exception as e:
        print(f"   ❌ Direct biometric call exception: {e}")
    
    # Step 2: Check admin status
    print("\n2. Checking admin status...")
    status_url = "http://localhost:8080/api/admin/internal/ADMIN001/biometric-status"
    try:
        response = requests.get(status_url)
        print(f"   Admin status: {response.status_code}")
        if response.status_code == 200:
            admin_data = response.json()
            print(f"   Has biometric: {admin_data.get('hasBiometric')}")
            print(f"   Template ID: {admin_data.get('fingerprintTemplateId')}")
            print(f"   ✅ Admin is properly set up")
        else:
            print(f"   ❌ Admin status error: {response.text}")
    except Exception as e:
        print(f"   ❌ Admin status exception: {e}")
    
    # Step 3: Try the actual login
    print("\n3. Attempting admin login...")
    try:
        with open(FINGERPRINT_PATH, 'rb') as fp:
            files = {'fingerprint': ('101_1.tif', fp, 'image/tiff')}
            data = {
                'adminId': ADMIN_ID,
                'loginMethod': 'BIOMETRIC'
            }
            
            print(f"   Login URL: {LOGIN_URL}")
            print(f"   Admin ID: {ADMIN_ID}")
            print(f"   Login method: BIOMETRIC")
            
            response = requests.post(LOGIN_URL, files=files, data=data, timeout=30)
            print(f"   Login response: {response.status_code}")
            print(f"   Response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print("   ✅ Admin login successful!")
                    return True
                else:
                    print(f"   ❌ Login failed: {result.get('message')}")
                    return False
            else:
                print(f"   ❌ HTTP Error: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"   ❌ Login exception: {e}")
        return False

def test_simplified_login():
    """
    Test with minimal parameters to isolate issues
    """
    print("\n4. Testing simplified login...")
    
    LOGIN_URL = "http://localhost:8080/api/admin/login"
    FINGERPRINT_PATH = "DB1_B/101_1.tif"
    
    try:
        with open(FINGERPRINT_PATH, 'rb') as fp:
            # Minimal form data
            files = {'fingerprint': fp}
            data = {'adminId': 'ADMIN001'}
            
            response = requests.post(LOGIN_URL, files=files, data=data, timeout=30)
            print(f"   Simplified login response: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Simplified login exception: {e}")

if __name__ == "__main__":
    test_admin_login_with_debug()
    test_simplified_login()