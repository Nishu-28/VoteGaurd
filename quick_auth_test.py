import requests
import time

def test_authentication():
    print("🔄 Testing Admin Authentication...")
    
    # Wait for services to be ready
    for i in range(10):
        try:
            # Test backend connectivity
            response = requests.get("http://localhost:8080/api/admin/status", timeout=2)
            print(f"✅ Backend is running (attempt {i+1})")
            break
        except:
            print(f"⏳ Waiting for backend... (attempt {i+1})")
            time.sleep(2)
    else:
        print("❌ Backend not accessible after 20 seconds")
        return
        
    # Test biometric service
    try:
        response = requests.get("http://localhost:8001/health", timeout=2)
        print("✅ Biometric service is running")
    except:
        print("❌ Biometric service not accessible")
        return

    # Test authentication
    print("\n🧪 Testing Authentication...")
    
    with open("fingerprint_admin001.png", "rb") as f:
        files = {'fingerprintFile': f}
        data = {'adminId': 'ADMIN001'}
        
        try:
            response = requests.post(
                "http://localhost:8080/api/admin/login/biometric",
                files=files,
                data=data,
                timeout=30
            )
            
            print(f"📋 Status: {response.status_code}")
            print(f"📋 Response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print("🎉 SUCCESS! Authentication working!")
                    print(f"Session ID: {result.get('sessionId', 'N/A')}")
                    return True
                else:
                    print(f"❌ Auth failed: {result.get('message')}")
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Request failed: {e}")
    
    return False

if __name__ == "__main__":
    test_authentication()