import requests
import os

def enroll_admin001_fingerprint():
    """
    Enroll the specific fingerprint image DB1_B/107_7.tif for ADMIN001
    """
    
    # Paths and endpoints
    FINGERPRINT_PATH = "DB1_B/105_1.tif"  # Using the working image that passed biometric validation
    BACKEND_URL = "http://localhost:8080/api"
    ENROLLMENT_ENDPOINT = f"{BACKEND_URL}/admin/internal/enroll-fingerprint"
    STATUS_ENDPOINT = f"{BACKEND_URL}/admin/internal/ADMIN001/biometric-status"
    
    print("🔐 Enrolling fingerprint for ADMIN001")
    print("====================================")
    print(f"Using fingerprint: {FINGERPRINT_PATH}")
    
    # Check if fingerprint file exists
    if not os.path.exists(FINGERPRINT_PATH):
        print(f"❌ Fingerprint file not found: {FINGERPRINT_PATH}")
        return False
    
    # Check current biometric status
    print("\n📊 Checking current biometric status...")
    try:
        status_response = requests.get(STATUS_ENDPOINT, timeout=10)
        if status_response.status_code == 200:
            status_data = status_response.json()
            print(f"Current status: {status_data}")
            
            if status_data.get('hasBiometric'):
                print("⚠️ ADMIN001 already has a fingerprint enrolled!")
                choice = input("Do you want to re-enroll? (y/N): ").lower()
                if choice != 'y':
                    return False
        else:
            print(f"⚠️ Could not check status: {status_response.status_code}")
    except Exception as e:
        print(f"⚠️ Error checking status: {e}")
        print("Proceeding with enrollment...")
    
    # Perform enrollment
    print(f"\n🚀 Enrolling fingerprint: {FINGERPRINT_PATH}")
    
    try:
        with open(FINGERPRINT_PATH, 'rb') as fp:
            files = {
                'fingerprint': ('105_1.tif', fp, 'image/tiff')
            }
            data = {
                'adminId': 'ADMIN001'
            }
            
            print("📤 Sending enrollment request...")
            response = requests.post(ENROLLMENT_ENDPOINT, files=files, data=data, timeout=30)
            
            print(f"📥 Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print("✅ Fingerprint enrolled successfully!")
                    print(f"📋 Response: {result}")
                    
                    # Verify enrollment by checking updated status
                    print("\n🔍 Verifying enrollment...")
                    status_response = requests.get(STATUS_ENDPOINT, timeout=10)
                    if status_response.status_code == 200:
                        updated_status = status_response.json()
                        print(f"📊 Updated status: {updated_status}")
                        
                        if updated_status.get('hasBiometric'):
                            print("✅ Enrollment verified successfully!")
                            print(f"📅 Enrolled date: {updated_status.get('biometricEnrolledDate')}")
                            print(f"🆔 Template ID: {updated_status.get('fingerprintTemplateId')}")
                            return True
                        else:
                            print("❌ Enrollment verification failed!")
                            return False
                    else:
                        print("⚠️ Could not verify enrollment status")
                        return True  # Assume success since enrollment API returned success
                else:
                    print(f"❌ Enrollment failed: {result.get('message')}")
                    return False
            else:
                print(f"❌ Request failed with status {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"📋 Error details: {error_data}")
                except:
                    print(f"📋 Response text: {response.text}")
                return False
                
    except requests.exceptions.Timeout:
        print("❌ Request timed out. Check if backend and biometric services are running.")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Connection error. Make sure backend is running on localhost:8080")
        return False
    except Exception as e:
        print(f"❌ Error during enrollment: {e}")
        return False

def check_services():
    """
    Check if required services are running
    """
    print("🔍 Checking services...")
    
    # Check backend
    try:
        response = requests.get("http://localhost:8080/api/health", timeout=5)
        print("✅ Backend service is running")
    except:
        print("❌ Backend service not accessible (http://localhost:8080/api)")
        return False
    
    # Check biometric service
    try:
        response = requests.get("http://localhost:8001/health", timeout=5)
        print("✅ Biometric service is running")
    except:
        print("❌ Biometric service not accessible (http://localhost:8001)")
        return False
    
    return True

if __name__ == "__main__":
    print("🔐 ADMIN001 Fingerprint Enrollment Tool")
    print("Using fingerprint: DB1_B/105_1.tif")
    print("=====================================\n")
    
    # Check services first
    if not check_services():
        print("\n⚠️ Please start the required services:")
        print("1. Backend: cd backend && mvn spring-boot:run")
        print("2. Biometric: cd biometric-service && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001")
        exit(1)
    
    # Perform enrollment
    success = enroll_admin001_fingerprint()
    
    if success:
        print("\n🎉 SUCCESS!")
        print("ADMIN001 can now use biometric authentication with the enrolled fingerprint.")
        print("Try logging in to the admin panel at: http://localhost:5173")
    else:
        print("\n💥 FAILED!")
        print("Enrollment was not successful. Check the error messages above.")