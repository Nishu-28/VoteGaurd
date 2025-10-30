import requests

def test_admin_login_detailed():
    """
    Test admin login with detailed debugging
    """
    
    url = "http://localhost:8080/api/admin/login"
    fingerprint_path = "DB1_B/101_1.tif"
    admin_id = "ADMIN001"
    
    print("🔍 Testing Admin Login with Detailed Debug")
    print("==========================================")
    
    try:
        with open(fingerprint_path, 'rb') as fp:
            files = {'fingerprint': ('101_1.tif', fp, 'image/tiff')}
            data = {
                'adminId': admin_id,
                'loginMethod': 'BIOMETRIC'
            }
            
            print(f"📤 Sending login request to: {url}")
            print(f"Admin ID: {admin_id}")
            
            response = requests.post(url, files=files, data=data, timeout=30)
            print(f"📥 Response status: {response.status_code}")
            print(f"📋 Headers: {dict(response.headers)}")
            print(f"📋 Response text: {response.text}")
            
            # Try to get more detailed error information
            if response.status_code != 200:
                print("\n🔍 Additional debugging:")
                print(f"Content-Type: {response.headers.get('Content-Type')}")
                print(f"Response length: {len(response.text)}")
                
                try:
                    error_json = response.json()
                    print(f"Error JSON: {error_json}")
                    if 'error' in error_json:
                        print(f"Specific error: {error_json['error']}")
                except:
                    print("Response is not valid JSON")
                    
    except Exception as e:
        print(f"❌ Exception during request: {e}")

if __name__ == "__main__":
    test_admin_login_detailed()