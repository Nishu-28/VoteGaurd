"""
VoteGuard Biometric Service - Utilities
Helper functions for data validation, hashing, and logging
"""

import hashlib
import base64
import re
from typing import Optional
from loguru import logger
import sys
import os

def setup_logging():
    """Setup logging configuration"""
    # Remove default logger
    logger.remove()
    
    # Add console logger
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO"
    )
    
    # Add file logger
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    logger.add(
        f"{log_dir}/biometric_service.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="DEBUG",
        rotation="10 MB",
        retention="7 days"
    )

def validate_fingerprint_data(fingerprint_data: str) -> bool:
    """
    Validate fingerprint data format
    
    Args:
        fingerprint_data: Base64 encoded fingerprint data
        
    Returns:
        True if valid, False otherwise
    """
    try:
        if not fingerprint_data or not isinstance(fingerprint_data, str):
            return False
        
        # Check if it's a data URL
        if fingerprint_data.startswith('data:image'):
            # Extract base64 part
            if ',' not in fingerprint_data:
                return False
            base64_part = fingerprint_data.split(',')[1]
        else:
            base64_part = fingerprint_data
        
        # Check base64 format
        if not re.match(r'^[A-Za-z0-9+/]*={0,2}$', base64_part):
            return False
        
        # Try to decode
        decoded = base64.b64decode(base64_part)
        
        # Check minimum size (at least 1KB for a valid image)
        if len(decoded) < 1024:
            return False
        
        return True
        
    except Exception as e:
        logger.warning(f"Fingerprint data validation failed: {e}")
        return False

def hash_fingerprint_data(processed_data: str) -> str:
    """
    Generate a secure hash for fingerprint data
    
    Args:
        processed_data: Processed fingerprint data
        
    Returns:
        SHA-256 hash of the data
    """
    try:
        # Create hash of the processed data
        hash_object = hashlib.sha256(processed_data.encode('utf-8'))
        return hash_object.hexdigest()
        
    except Exception as e:
        logger.error(f"Error hashing fingerprint data: {e}")
        return ""

def validate_hash_format(hash_value: str) -> bool:
    """
    Validate hash format
    
    Args:
        hash_value: Hash string to validate
        
    Returns:
        True if valid SHA-256 hash, False otherwise
    """
    try:
        if not hash_value or not isinstance(hash_value, str):
            return False
        
        # Check if it's a valid SHA-256 hash (64 hex characters)
        if not re.match(r'^[a-fA-F0-9]{64}$', hash_value):
            return False
        
        return True
        
    except Exception as e:
        logger.warning(f"Hash validation failed: {e}")
        return False

def sanitize_input(input_string: str, max_length: int = 1000) -> str:
    """
    Sanitize input string
    
    Args:
        input_string: String to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized string
    """
    try:
        if not input_string:
            return ""
        
        # Remove null bytes and control characters
        sanitized = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', str(input_string))
        
        # Limit length
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
        
        return sanitized.strip()
        
    except Exception as e:
        logger.warning(f"Input sanitization failed: {e}")
        return ""

def generate_fingerprint_id() -> str:
    """
    Generate a unique fingerprint ID
    
    Returns:
        Unique fingerprint ID
    """
    import uuid
    import time
    
    try:
        # Generate UUID and timestamp-based ID
        unique_id = str(uuid.uuid4())
        timestamp = str(int(time.time() * 1000))
        
        # Combine and hash
        combined = f"{unique_id}_{timestamp}"
        hash_object = hashlib.sha256(combined.encode('utf-8'))
        
        return hash_object.hexdigest()[:16]  # Return first 16 characters
        
    except Exception as e:
        logger.error(f"Error generating fingerprint ID: {e}")
        return ""

def calculate_image_metrics(image_data: bytes) -> dict:
    """
    Calculate basic image metrics
    
    Args:
        image_data: Raw image data
        
    Returns:
        Dictionary with image metrics
    """
    try:
        import cv2
        import numpy as np
        
        # Convert to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        
        if image is None:
            return {}
        
        # Calculate metrics
        height, width = image.shape
        mean_brightness = np.mean(image)
        std_brightness = np.std(image)
        
        # Calculate contrast
        contrast = std_brightness / 255.0
        
        # Calculate sharpness using Laplacian
        laplacian_var = cv2.Laplacian(image, cv2.CV_64F).var()
        
        return {
            "width": int(width),
            "height": int(height),
            "mean_brightness": float(mean_brightness),
            "std_brightness": float(std_brightness),
            "contrast": float(contrast),
            "sharpness": float(laplacian_var),
            "size_bytes": len(image_data)
        }
        
    except Exception as e:
        logger.warning(f"Error calculating image metrics: {e}")
        return {}

def format_response_time(start_time: float) -> str:
    """
    Format response time for logging
    
    Args:
        start_time: Start time from time.time()
        
    Returns:
        Formatted response time string
    """
    try:
        import time
        response_time = time.time() - start_time
        
        if response_time < 1.0:
            return f"{response_time * 1000:.1f}ms"
        else:
            return f"{response_time:.2f}s"
            
    except Exception as e:
        logger.warning(f"Error formatting response time: {e}")
        return "unknown"

def create_error_response(error_message: str, error_code: str = "UNKNOWN_ERROR") -> dict:
    """
    Create standardized error response
    
    Args:
        error_message: Error message
        error_code: Error code
        
    Returns:
        Standardized error response dictionary
    """
    return {
        "success": False,
        "error": {
            "code": error_code,
            "message": error_message,
            "timestamp": str(int(time.time() * 1000))
        }
    }

def create_success_response(data: dict = None, message: str = "Success") -> dict:
    """
    Create standardized success response
    
    Args:
        data: Response data
        message: Success message
        
    Returns:
        Standardized success response dictionary
    """
    response = {
        "success": True,
        "message": message,
        "timestamp": str(int(time.time() * 1000))
    }
    
    if data:
        response.update(data)
    
    return response

def validate_fingerprint_file(file, max_size_mb: int = 10) -> tuple[bool, str]:
    """
    Validate uploaded file to ensure it's a valid fingerprint image
    
    Args:
        file: UploadFile object
        max_size_mb: Maximum file size in MB
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        # Check if file exists
        if not file or not file.filename:
            return False, "No file provided"
        
        # Check file size
        if hasattr(file, 'size') and file.size:
            max_size_bytes = max_size_mb * 1024 * 1024
            if file.size > max_size_bytes:
                return False, f"File size exceeds maximum allowed size of {max_size_mb}MB"
        
        # Validate file extension
        import os
        allowed_extensions = ['.png', '.jpg', '.jpeg', '.tif', '.tiff']
        file_extension = os.path.splitext(file.filename.lower())[1]
        if file_extension not in allowed_extensions:
            return False, f"File extension '{file_extension}' is not allowed. Only fingerprint image files are accepted (PNG, JPG, JPEG, TIF, TIFF)."
        
        # Validate MIME type (if available)
        accepted_types = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/tif']
        if file.content_type and file.content_type not in accepted_types:
            return False, f"File type '{file.content_type}' is not allowed. Only fingerprint image files are accepted."
        
        # If content_type is not available, rely on file extension validation
        # This is a fallback for cases where MIME type detection fails
        
        # Check for suspicious file names
        suspicious_patterns = ['script', 'executable', 'binary', 'exe', 'bat', 'cmd', 'sh', 'php', 'asp', 'jsp']
        filename_lower = file.filename.lower()
        for pattern in suspicious_patterns:
            if pattern in filename_lower:
                return False, f"File name contains suspicious pattern '{pattern}'. Only fingerprint image files are allowed."
        
        return True, ""
        
    except Exception as e:
        logger.error(f"File validation error: {e}")
        return False, f"File validation failed: {str(e)}"

def validate_fingerprint_content(image_data: bytes) -> tuple[bool, str]:
    """
    Validate that the uploaded image actually contains a fingerprint using computer vision techniques
    
    Args:
        image_data: Raw image data bytes
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        import cv2
        import numpy as np
        from PIL import Image
        import io
        
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to grayscale if needed
        if image.mode != 'L':
            image = image.convert('L')
        
        # Convert PIL to OpenCV (already grayscale, so no color conversion needed)
        opencv_image = np.array(image)
        
        # Basic fingerprint characteristics validation
        height, width = opencv_image.shape
        
        # 1. Check image dimensions (fingerprints are typically elongated)
        aspect_ratio = width / height
        if aspect_ratio < 0.3 or aspect_ratio > 3.0:
            return False, "Image dimensions don't match fingerprint characteristics. Fingerprints are typically elongated."
        
        # 2. Check image size (too small or too large)
        if width < 200 or height < 200:
            return False, "Image is too small. Please upload a higher resolution fingerprint image."
        
        if width > 2000 or height > 2000:
            return False, "Image is too large. Please upload a smaller fingerprint image."
        
        # 3. Check brightness and contrast (fingerprints have specific ranges)
        mean_brightness = np.mean(opencv_image)
        std_brightness = np.std(opencv_image)
        
        if mean_brightness < 30 or mean_brightness > 220:
            return False, "Image brightness doesn't match fingerprint characteristics. Please ensure proper lighting."
        
        if std_brightness < 20:
            return False, "Image lacks sufficient contrast. Please ensure the fingerprint ridges are clearly visible."
        
        # 4. Check for ridge patterns using Gabor filters (fingerprint-specific)
        # This is a simplified version - in production, you'd use more sophisticated algorithms
        
        # Apply Gabor filter to detect ridge patterns
        kernel = cv2.getGaborKernel((21, 21), 5, 0, 10, 0.5, 0, ktype=cv2.CV_32F)
        filtered = cv2.filter2D(opencv_image, cv2.CV_8UC3, kernel)
        
        # Calculate ridge pattern strength
        ridge_strength = np.std(filtered)
        
        if ridge_strength < 15:
            return False, "No clear ridge patterns detected. Please upload a clear fingerprint image with visible ridges."
        
        # 5. Check for common non-fingerprint patterns
        # Detect if image is too smooth (like a photo)
        laplacian_var = cv2.Laplacian(opencv_image, cv2.CV_64F).var()
        
        if laplacian_var < 50:
            return False, "Image appears to be too smooth. Please upload a clear fingerprint image with visible texture."
        
        # 6. Check for color images converted to grayscale (common with photos)
        # Real fingerprint scanners produce specific grayscale distributions
        hist = cv2.calcHist([opencv_image], [0], None, [256], [0, 256])
        hist_normalized = hist.ravel() / hist.sum()
        
        # Check if histogram has typical fingerprint distribution
        # Fingerprints typically have bimodal distribution (ridges and valleys)
        peaks = []
        for i in range(1, len(hist_normalized) - 1):
            if hist_normalized[i] > hist_normalized[i-1] and hist_normalized[i] > hist_normalized[i+1]:
                if hist_normalized[i] > 0.01:  # Significant peak
                    peaks.append(i)
        
        if len(peaks) < 2:
            return False, "Image doesn't show typical fingerprint ridge/valley patterns. Please upload a clear fingerprint image."
        
        # 7. Additional validation using edge detection
        edges = cv2.Canny(opencv_image, 50, 150)
        edge_density = np.sum(edges > 0) / (width * height)
        
        if edge_density < 0.05 or edge_density > 0.4:
            return False, "Edge patterns don't match fingerprint characteristics. Please upload a clear fingerprint image."
        
        logger.info(f"Fingerprint validation passed: {width}x{height}, brightness={mean_brightness:.1f}, contrast={std_brightness:.1f}, ridges={ridge_strength:.1f}")
        return True, "Valid fingerprint image detected"
        
    except Exception as e:
        logger.error(f"Fingerprint content validation failed: {e}")
        return False, f"Fingerprint validation failed: {str(e)}"

def validate_fingerprint_image(image) -> bool:
    """
    Validate fingerprint image

    Args:
        image: PIL Image object

    Returns:
        True if valid, False otherwise
    """
    try:
        if image is None:
            return False

        # Check image size
        width, height = image.size
        if width < 100 or height < 100:
            return False

        # Check if image is too large
        if width > 5000 or height > 5000:
            return False

        # Check image mode (support grayscale and RGB for TIF)
        if image.mode not in ['L', 'P', 'RGB', 'RGBA', 'CMYK', 'YCbCr', 'I', 'F']:
            logger.warning(f"Unsupported image mode: {image.mode}")
            # Don't reject - let OpenCV handle conversion
            pass

        return True

    except Exception as e:
        logger.warning(f"Fingerprint image validation failed: {e}")
        return False

def enhance_fingerprint_image(image):
    """
    Enhance fingerprint image
    
    Args:
        image: PIL Image object
        
    Returns:
        Enhanced PIL Image object
    """
    try:
        # For now, just return the original image
        # In a real implementation, you would apply image enhancement techniques
        return image
        
    except Exception as e:
        logger.warning(f"Fingerprint image enhancement failed: {e}")
        return image


