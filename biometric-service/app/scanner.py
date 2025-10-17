"""
VoteGuard Biometric Service - Fingerprint Scanner
Handles fingerprint data processing and feature extraction
"""

import cv2
import numpy as np
from typing import Dict, Any, Optional
from loguru import logger
import time
import base64
import hashlib

class FingerprintScanner:
    """Handles fingerprint scanning and processing"""
    
    def __init__(self):
        self.min_quality_score = 0.3
        self.max_quality_score = 1.0
    
    def extract_features(self, image):
        """
        Extract features from fingerprint image
        
        Args:
            image: PIL Image object
            
        Returns:
            Feature data as string
        """
        try:
            # For now, return a placeholder feature string
            # In a real implementation, you would extract actual fingerprint features
            return "placeholder_features_12345"
        except Exception as e:
            logger.error(f"Feature extraction failed: {e}")
            return None
    
    def assess_quality(self, image):
        """
        Assess fingerprint image quality
        
        Args:
            image: PIL Image object
            
        Returns:
            Quality score between 0 and 1
        """
        try:
            # For now, return a high quality score
            # In a real implementation, you would assess actual image quality
            return 0.85
        except Exception as e:
            logger.error(f"Quality assessment failed: {e}")
            return 0.0
        
    def process_fingerprint(self, fingerprint_data: str, quality_threshold: float = 0.7) -> Dict[str, Any]:
        """
        Process fingerprint data and extract features
        
        Args:
            fingerprint_data: Base64 encoded fingerprint image or feature data
            quality_threshold: Minimum quality score required
            
        Returns:
            Dictionary with processing results
        """
        start_time = time.time()
        
        try:
            # Decode base64 data
            image_data = self._decode_fingerprint_data(fingerprint_data)
            
            # Convert to OpenCV format
            image = self._convert_to_opencv_image(image_data)
            
            # Assess image quality
            quality_score = self._assess_image_quality(image)
            
            if quality_score < quality_threshold:
                return {
                    "success": False,
                    "message": f"Fingerprint quality too low: {quality_score:.2f} < {quality_threshold}",
                    "quality_score": quality_score,
                    "metadata": {
                        "quality_threshold": quality_threshold,
                        "processing_time": time.time() - start_time
                    }
                }
            
            # Extract features
            features = self._extract_features(image)
            
            # Generate processed data for storage
            processed_data = self._generate_processed_data(image, features)
            
            processing_time = time.time() - start_time
            
            logger.info(f"Fingerprint processed successfully - Quality: {quality_score:.2f}, Features: {len(features)}")
            
            return {
                "success": True,
                "processed_data": processed_data,
                "quality_score": quality_score,
                "features": features,
                "features_count": len(features),
                "processing_time": processing_time,
                "metadata": {
                    "image_shape": image.shape,
                    "quality_threshold": quality_threshold
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing fingerprint: {e}")
            return {
                "success": False,
                "message": f"Processing error: {str(e)}",
                "metadata": {
                    "processing_time": time.time() - start_time,
                    "error_type": type(e).__name__
                }
            }
    
    def _decode_fingerprint_data(self, fingerprint_data: str) -> bytes:
        """Decode base64 fingerprint data"""
        try:
            # Remove data URL prefix if present
            if fingerprint_data.startswith('data:image'):
                fingerprint_data = fingerprint_data.split(',')[1]
            
            return base64.b64decode(fingerprint_data)
        except Exception as e:
            raise ValueError(f"Invalid base64 data: {e}")
    
    def _convert_to_opencv_image(self, image_data: bytes) -> np.ndarray:
        """Convert image data to OpenCV format"""
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            
            # Decode image (try grayscale first, fallback to color)
            image = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

            if image is None:
                # Try color decoding for formats like TIF
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if image is None:
                    raise ValueError("Could not decode image data")
                # Convert to grayscale
                image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            return image
        except Exception as e:
            raise ValueError(f"Image conversion error: {e}")
    
    def _assess_image_quality(self, image: np.ndarray) -> float:
        """
        Assess fingerprint image quality
        
        Args:
            image: Grayscale fingerprint image
            
        Returns:
            Quality score between 0.0 and 1.0
        """
        try:
            # Basic quality metrics
            height, width = image.shape
            
            # Check image dimensions
            if height < 100 or width < 100:
                return 0.1
            
            # Calculate contrast
            contrast = np.std(image) / 255.0
            
            # Calculate sharpness using Laplacian variance
            laplacian_var = cv2.Laplacian(image, cv2.CV_64F).var()
            sharpness = min(laplacian_var / 1000.0, 1.0)  # Normalize
            
            # Calculate brightness (should be around 0.5 for good contrast)
            brightness = np.mean(image) / 255.0
            brightness_score = 1.0 - abs(brightness - 0.5) * 2
            
            # Calculate noise level (simplified)
            noise_level = self._estimate_noise(image)
            noise_score = max(0, 1.0 - noise_level)
            
            # Combine metrics
            quality_score = (
                contrast * 0.3 +
                sharpness * 0.3 +
                brightness_score * 0.2 +
                noise_score * 0.2
            )
            
            return max(0.0, min(1.0, quality_score))
            
        except Exception as e:
            logger.warning(f"Quality assessment error: {e}")
            return 0.5  # Default moderate quality
    
    def _estimate_noise(self, image: np.ndarray) -> float:
        """Estimate noise level in the image"""
        try:
            # Use median filter to estimate noise
            median = cv2.medianBlur(image, 5)
            noise = cv2.absdiff(image, median)
            noise_level = np.mean(noise) / 255.0
            return noise_level
        except:
            return 0.1  # Default low noise
    
    def _extract_features(self, image: np.ndarray) -> list:
        """
        Extract fingerprint features (simplified implementation)
        
        In a real implementation, this would extract minutiae points,
        ridge patterns, and other biometric features.
        """
        try:
            features = []
            
            # Enhance image
            enhanced = self._enhance_fingerprint(image)
            
            # Extract keypoints using SIFT (simplified)
            sift = cv2.SIFT_create()
            keypoints, descriptors = sift.detectAndCompute(enhanced, None)
            
            # Convert keypoints to feature list
            for i, (kp, desc) in enumerate(zip(keypoints, descriptors)):
                if desc is not None:
                    features.append({
                        "type": "keypoint",
                        "x": float(kp.pt[0]),
                        "y": float(kp.pt[1]),
                        "angle": float(kp.angle),
                        "response": float(kp.response),
                        "descriptor": desc.tolist()[:10]  # First 10 elements for storage
                    })
            
            return features
            
        except Exception as e:
            logger.warning(f"Feature extraction error: {e}")
            return []
    
    def _enhance_fingerprint(self, image: np.ndarray) -> np.ndarray:
        """Enhance fingerprint image for better feature extraction"""
        try:
            # Apply histogram equalization
            enhanced = cv2.equalizeHist(image)
            
            # Apply Gaussian blur to reduce noise
            enhanced = cv2.GaussianBlur(enhanced, (3, 3), 0)
            
            # Apply morphological operations
            kernel = np.ones((2, 2), np.uint8)
            enhanced = cv2.morphologyEx(enhanced, cv2.MORPH_CLOSE, kernel)
            
            return enhanced
            
        except Exception as e:
            logger.warning(f"Image enhancement error: {e}")
            return image
    
    def _generate_processed_data(self, image: np.ndarray, features: list) -> str:
        """Generate processed data for storage"""
        try:
            # Create a summary of the processed data
            processed_info = {
                "image_hash": hashlib.sha256(image.tobytes()).hexdigest(),
                "features_count": len(features),
                "image_shape": image.shape,
                "timestamp": time.time()
            }
            
            # Convert to JSON string and encode
            import json
            processed_json = json.dumps(processed_info)
            return base64.b64encode(processed_json.encode()).decode()
            
        except Exception as e:
            logger.error(f"Error generating processed data: {e}")
            return ""


