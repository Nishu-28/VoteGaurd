import requests
import os

def enroll_admin_fingerprint():
    """
    Enroll a fingerprint for ADMIN001 using a sample fingerprint image
    """
    
    # Backend endpoint
    BACKEND_URL = "http://localhost:8080/api"
    ENROLLMENT_ENDPOINT = f"{BACKEND_URL}/admin/internal/enroll-fingerprint"
    STATUS_ENDPOINT = f"{BACKEND_URL}/admin/internal/ADMIN001/biometric-status"
    
    # Check if we have a sample fingerprint image
    sample_fingerprint_path = "sample_fingerprint.png"
    
    if not os.path.exists(sample_fingerprint_path):
        print("Creating a sample fingerprint image...")
        # Create a simple sample image (in real scenario, use actual fingerprint)
        create_sample_fingerprint_image(sample_fingerprint_path)
    
    print("Checking current biometric status...")
    try:
        status_response = requests.get(STATUS_ENDPOINT)
        if status_response.status_code == 200:
            status_data = status_response.json()
            print(f"Current status: {status_data}")
            
            if status_data.get('hasBiometric'):
                print("⚠️ ADMIN001 already has a fingerprint enrolled!")
                return
        else:
            print(f"Could not check status: {status_response.status_code}")
    except Exception as e:
        print(f"Error checking status: {e}")
    
    print("Enrolling fingerprint for ADMIN001...")
    
    try:
        # Prepare the multipart form data
        with open(sample_fingerprint_path, 'rb') as fp:
            files = {
                'fingerprint': ('fingerprint.png', fp, 'image/png')
            }
            data = {
                'adminId': 'ADMIN001'
            }
            
            # Send enrollment request
            response = requests.post(ENROLLMENT_ENDPOINT, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print("✅ Fingerprint enrolled successfully!")
                    print(f"Response: {result}")
                    
                    # Check updated status
                    status_response = requests.get(STATUS_ENDPOINT)
                    if status_response.status_code == 200:
                        updated_status = status_response.json()
                        print(f"Updated status: {updated_status}")
                else:
                    print(f"❌ Enrollment failed: {result.get('message')}")
            else:
                print(f"❌ Request failed with status {response.status_code}")
                print(f"Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error during enrollment: {e}")

def create_sample_fingerprint_image(filepath):
    """
    Create a simple sample fingerprint image for testing
    """
    try:
        from PIL import Image, ImageDraw
        import numpy as np
        
        # Create a simple fingerprint-like pattern
        width, height = 200, 200
        image = Image.new('RGB', (width, height), 'white')
        draw = ImageDraw.Draw(image)
        
        # Draw concentric circles to simulate fingerprint ridges
        center_x, center_y = width // 2, height // 2
        for i in range(5, 80, 8):
            draw.ellipse([center_x - i, center_y - i, center_x + i, center_y + i], 
                        outline='black', width=2)
        
        # Add some noise
        for _ in range(100):
            x = np.random.randint(0, width)
            y = np.random.randint(0, height)
            draw.point([x, y], fill='black')
        
        image.save(filepath)
        print(f"✅ Created sample fingerprint image: {filepath}")
        
    except ImportError:
        print("PIL not available, creating a simple text file instead...")
        # Create a simple placeholder file
        with open(filepath.replace('.png', '.txt'), 'w') as f:
            f.write("SAMPLE_FINGERPRINT_DATA_FOR_TESTING")
        print("⚠️ Created text placeholder instead of image")

if __name__ == "__main__":
    print("🔐 ADMIN001 Fingerprint Enrollment Tool")
    print("=====================================")
    enroll_admin_fingerprint()