import requests
import os

def test_biometric_verification():
    """
    Test biometric verification directly to see if the biometric service is working correctly
    """
    
    url = "http://localhost:8001/enhanced/verify"
    fingerprint_path = "DB1_B/101_1.tif"
    voter_id = "ADMIN_ADMIN001"
    
    print("🧪 Testing Biometric Verification")
    print("=================================")
    print(f"URL: {url}")
    print(f"Fingerprint: {fingerprint_path}")
    print(f"Voter ID: {voter_id}")
    
    try:
        with open(fingerprint_path, 'rb') as fp:
            files = {'fingerprint': ('101_1.tif', fp, 'image/tiff')}
            data = {'voter_id': voter_id}
            
            response = requests.post(url, files=files, data=data)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('verified'):
                    print("✅ Biometric verification successful!")
                    return True
                else:
                    print(f"❌ Verification failed: {result}")
                    return False
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_admin_in_database():
    """
    Test if we can connect to the database and check admin status
    """
    
    url = "http://localhost:8080/api/admin/internal/ADMIN001/biometric-status"
    
    print("\n📊 Checking Admin in Database")
    print("=============================")
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Admin found in database")
            return True
        else:
            print("❌ Failed to fetch admin status")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Debugging Admin Authentication Issues")
    print("=======================================\n")
    
    # Test 1: Check admin in database
    db_ok = check_admin_in_database()
    
    # Test 2: Test biometric verification
    biometric_ok = test_biometric_verification()
    
    print(f"\n📋 Summary:")
    print(f"Database connection: {'✅ OK' if db_ok else '❌ FAILED'}")
    print(f"Biometric verification: {'✅ OK' if biometric_ok else '❌ FAILED'}")
    
    if db_ok and biometric_ok:
        print("\n🤔 Both components are working individually.")
        print("The issue might be in the integration between AdminService and BiometricService.")
        print("Check backend logs for specific exceptions.")
    elif not db_ok:
        print("\n❌ Database connectivity issue detected.")
    elif not biometric_ok:
        print("\n❌ Biometric service issue detected.")
    else:
        print("\n❌ Both database and biometric service have issues.")