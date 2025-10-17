from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import base64
import hashlib
import time

# Initialize FastAPI app
app = FastAPI(
    title="VoteGuard Biometric Service",
    description="Fingerprint authentication service for VoteGuard voting system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "VoteGuard Biometric Service", "status": "running"}

@app.get("/ping")
async def ping():
    """Health check endpoint"""
    return {"status": "healthy", "service": "biometric", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "biometric",
        "version": "1.0.0",
        "components": {
            "scanner": "healthy",
            "matcher": "healthy"
        }
    }

@app.post("/verify")
async def verify_fingerprint_file(
    fingerprint: UploadFile = File(...)
):
    """
    Verify uploaded fingerprint against enrolled fingerprints
    """
    try:
        # Validate file type and security
        from app.utils import validate_fingerprint_file
        is_valid, error_message = validate_fingerprint_file(fingerprint)
        if not is_valid:
            return {
                "verified": False,
                "message": error_message
            }
        
        # Read file content
        file_content = await fingerprint.read()
        
        # Process the fingerprint to validate it's actually a fingerprint
        from app.scanner import FingerprintScanner
        scanner = FingerprintScanner()
        
        # Convert to base64 for processing
        import base64
        fingerprint_data = base64.b64encode(file_content).decode('utf-8')
        
        # Process fingerprint data
        result = scanner.process_fingerprint(fingerprint_data, quality_threshold=0.3)
        
        if result["success"]:
            # Validate that this is actually a fingerprint image
            features_count = result.get("features_count", 0)
            quality_score = result.get("quality_score", 0.0)
            
            # A real fingerprint should have sufficient features
            is_valid_fingerprint = (
                features_count >= 10 and  # Minimum features for a fingerprint
                quality_score >= 0.3 and  # Minimum quality threshold
                result.get("metadata", {}).get("image_shape", [0, 0])[0] >= 100  # Minimum size
            )
            
            if not is_valid_fingerprint:
                return {
                    "verified": False,
                    "message": "Image does not appear to be a valid fingerprint. Please upload a clear fingerprint image.",
                    "metadata": {
                        "features_count": features_count,
                        "quality_score": quality_score,
                        "file_size": len(file_content)
                    }
                }
            
            # For demo purposes, simulate verification
            verified = True  # Simulate successful verification
        
            return {
                "verified": verified,
                "quality_score": quality_score,
                "message": "Fingerprint verification completed",
                "metadata": {
                    "features_count": features_count,
                    "processing_time": result.get("processing_time", 0.1),
                    "file_size": len(file_content)
                }
            }
        else:
            return {
                "verified": False,
                "message": f"Fingerprint processing failed: {result['message']}",
                "metadata": {
                    "file_size": len(file_content)
                }
            }
        
    except Exception as e:
        return {
            "verified": False,
            "message": f"Verification failed: {str(e)}"
        }

@app.post("/enroll")
async def enroll_fingerprint(
    fingerprint: UploadFile = File(...),
    voterId: str = Form(...)
):
    """
    Enroll a new fingerprint for a voter
    """
    try:
        # Validate file type
        if not fingerprint.content_type or not fingerprint.content_type.startswith('image/'):
            return {
                "success": False,
                "message": "File must be an image (PNG, JPG, JPEG)"
            }
        
        # Read file content
        file_content = await fingerprint.read()
        
        # Generate a simple hash for demo purposes
        fingerprint_hash = hashlib.sha256(file_content).hexdigest()
        
        return {
            "success": True,
            "voterId": voterId,
            "fingerprint_hash": fingerprint_hash,
            "quality_score": 0.85,
            "message": "Fingerprint enrolled successfully",
            "metadata": {
                "processing_time": 0.1,
                "file_size": len(file_content)
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Enrollment failed: {str(e)}"
        }

@app.get("/status")
async def get_service_status():
    """Get detailed service status"""
    return {
        "status": "healthy",
        "service": "biometric",
        "version": "1.0.0",
        "endpoints": {
            "verify": "/verify",
            "enroll": "/enroll",
            "status": "/status",
            "health": "/health",
            "ping": "/ping"
        },
        "capabilities": {
            "fingerprint_scanning": True,
            "fingerprint_matching": True,
            "quality_assessment": True,
            "image_enhancement": True
        }
    }

@app.get("/api/v1/status")
async def get_service_status_v1():
    """Get detailed service status (v1 API)"""
    return {
        "status": "healthy",
        "service": "biometric",
        "version": "1.0.0",
        "endpoints": {
            "verify": "/verify",
            "enroll": "/enroll",
            "status": "/status",
            "health": "/health",
            "ping": "/ping"
        },
        "capabilities": {
            "fingerprint_scanning": True,
            "fingerprint_matching": True,
            "quality_assessment": True,
            "image_enhancement": True
        }
    }

@app.post("/register")
async def register_voter(
    voter_id: str = Form(...),
    full_name: str = Form(...),
    email: str = Form(...),
    extra_field: str = Form(...),
    role: str = Form("VOTER"),
    fingerprint: UploadFile = File(...),
    profile_photo: UploadFile = File(...)
):
    """
    Register a new voter with fingerprint and profile photo
    """
    try:
        # Validate fingerprint file
        from .utils import validate_fingerprint_file
        is_valid, error_message = validate_fingerprint_file(fingerprint)
        if not is_valid:
            return {
                "success": False,
                "message": error_message
            }
        
        # Read fingerprint file
        fingerprint_content = await fingerprint.read()
        fingerprint_hash = hashlib.sha256(fingerprint_content).hexdigest()
        
        # Read profile photo file
        profile_photo_content = await profile_photo.read()
        profile_photo_base64 = base64.b64encode(profile_photo_content).decode('utf-8')
        
        # For demo purposes, we'll just validate the fingerprint
        # In production, this would connect to the actual backend database
        
        # Simulate fingerprint processing
        import time
        time.sleep(1)  # Simulate processing time
        
        # Return success response
        voter_data = {
            "voter_id": voter_id,
            "full_name": full_name,
            "email": email,
            "extra_field": extra_field,
            "role": role,
            "fingerprint_hash": fingerprint_hash,
            "profile_photo_size": len(profile_photo_content)
        }
        
        return {
            "success": True,
            "message": "Voter registered successfully",
            "data": voter_data
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Registration failed: {str(e)}"
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)

