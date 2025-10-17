"""
VoteGuard Fingerprint Utilities
Utility functions for fingerprint image preprocessing and validation
"""

import cv2
import numpy as np
from typing import Dict, Any, Tuple, Optional
from loguru import logger
from pathlib import Path
import os


class FingerprintPreprocessor:
    """Utility class for fingerprint image preprocessing"""

    def __init__(self):
        """Initialize the preprocessor"""
        pass

    def load_image(self, image_path: str) -> np.ndarray:
        """
        Load fingerprint image from file path

        Args:
            image_path: Path to the image file

        Returns:
            Image as numpy array

        Raises:
            ValueError: If image cannot be loaded
        """
        if not os.path.exists(image_path):
            raise ValueError(f"Image file not found: {image_path}")

        # Load image in grayscale
        image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

        if image is None:
            raise ValueError(f"Could not load image from: {image_path}")

        return image

    def convert_to_grayscale(self, image: np.ndarray) -> np.ndarray:
        """
        Convert image to grayscale if it's not already

        Args:
            image: Input image (can be RGB or grayscale)

        Returns:
            Grayscale image
        """
        if len(image.shape) == 3:
            # Convert RGB to grayscale
            return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        elif len(image.shape) == 2:
            # Already grayscale
            return image
        else:
            raise ValueError(f"Unsupported image format. Expected 2D or 3D array, got shape: {image.shape}")

    def resize_image(self, image: np.ndarray, target_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
        """
        Resize image to target size

        Args:
            image: Input image
            target_size: Target (width, height)

        Returns:
            Resized image
        """
        return cv2.resize(image, target_size)

    def normalize_image(self, image: np.ndarray, min_val: float = 0.0, max_val: float = 1.0) -> np.ndarray:
        """
        Normalize image pixel values to specified range

        Args:
            image: Input image
            min_val: Minimum value for normalization
            max_val: Maximum value for normalization

        Returns:
            Normalized image
        """
        # Convert to float32 for calculations
        image = image.astype(np.float32)

        # Get current min and max
        current_min = np.min(image)
        current_max = np.max(image)

        # Avoid division by zero
        if current_max == current_min:
            return np.full_like(image, (min_val + max_val) / 2, dtype=np.float32)

        # Normalize to [0, 1] first, then scale to [min_val, max_val]
        normalized = (image - current_min) / (current_max - current_min)
        normalized = normalized * (max_val - min_val) + min_val

        return normalized

    def enhance_image(self, image: np.ndarray) -> np.ndarray:
        """
        Enhance fingerprint image for better feature extraction

        Args:
            image: Input fingerprint image

        Returns:
            Enhanced image
        """
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image

        # Apply histogram equalization for better contrast
        enhanced = cv2.equalizeHist(gray)

        # Apply Gaussian blur to reduce noise
        enhanced = cv2.GaussianBlur(enhanced, (3, 3), 0)

        # Apply morphological operations to enhance ridges
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))

        # Top-hat transform to enhance ridge structures
        enhanced = cv2.morphologyEx(enhanced, cv2.MORPH_TOPHAT, kernel)

        return enhanced

    def preprocess_fingerprint_tf(self, image_path: str) -> np.ndarray:
        """
        Complete preprocessing pipeline for Fingerprint_TF model

        Args:
            image_path: Path to fingerprint image

        Returns:
            Preprocessed image ready for model input (batch_size, 224, 224, 1)
        """
        # Load and convert to grayscale
        image = self.load_image(image_path)
        image = self.convert_to_grayscale(image)

        # Enhance image
        image = self.enhance_image(image)

        # Resize to 224x224
        image = self.resize_image(image, (224, 224))

        # Normalize to [0, 1]
        image = self.normalize_image(image, 0.0, 1.0)

        # Add batch and channel dimensions for model input
        # Model expects (batch_size, 224, 224, 1)
        image = np.expand_dims(image, axis=0)  # Add batch dimension
        image = np.expand_dims(image, axis=-1)  # Add channel dimension

        return image

    def validate_fingerprint_image(self, image_path: str) -> Dict[str, Any]:
        """
        Validate if an image is suitable for fingerprint processing

        Args:
            image_path: Path to the image file

        Returns:
            Validation result dictionary
        """
        try:
            # Check if file exists
            if not os.path.exists(image_path):
                return {
                    "valid": False,
                    "error": "File not found",
                    "details": f"Image file does not exist: {image_path}"
                }

            # Load image
            image = self.load_image(image_path)

            # Check image dimensions
            height, width = image.shape[:2]

            if height < 50 or width < 50:
                return {
                    "valid": False,
                    "error": "Image too small",
                    "details": f"Image dimensions ({width}x{height}) are too small. Minimum 50x50 required."
                }

            if height > 2000 or width > 2000:
                return {
                    "valid": False,
                    "error": "Image too large",
                    "details": f"Image dimensions ({width}x{height}) are too large. Maximum 2000x2000 recommended."
                }

            # Check image quality metrics
            quality_metrics = self._assess_image_quality(image)

            return {
                "valid": True,
                "width": width,
                "height": height,
                "quality_metrics": quality_metrics,
                "message": "Image validation passed"
            }

        except Exception as e:
            return {
                "valid": False,
                "error": "Validation failed",
                "details": f"Error during validation: {str(e)}"
            }

    def _assess_image_quality(self, image: np.ndarray) -> Dict[str, float]:
        """
        Assess image quality metrics

        Args:
            image: Input image

        Returns:
            Quality metrics dictionary
        """
        # Calculate basic quality metrics
        mean_intensity = np.mean(image)
        std_intensity = np.std(image)
        contrast = std_intensity / (mean_intensity + 1e-6)  # Avoid division by zero

        # Calculate sharpness (variance of Laplacian)
        laplacian = cv2.Laplacian(image, cv2.CV_64F)
        sharpness = np.var(laplacian)

        # Calculate SNR (Signal-to-Noise Ratio)
        # Simple approximation using median filter
        median_filtered = cv2.medianBlur(image, 5)
        noise = np.mean((image.astype(np.float32) - median_filtered.astype(np.float32)) ** 2)
        signal = np.var(image.astype(np.float32))
        snr = 10 * np.log10(signal / (noise + 1e-6)) if noise > 0 else 100.0

        return {
            "mean_intensity": float(mean_intensity),
            "std_intensity": float(std_intensity),
            "contrast": float(contrast),
            "sharpness": float(sharpness),
            "snr_db": float(snr)
        }

    def save_processed_image(self, image: np.ndarray, output_path: str, format: str = 'png'):
        """
        Save processed image to file

        Args:
            image: Processed image array
            output_path: Output file path
            format: Image format (png, jpg, etc.)
        """
        try:
            # Remove batch and channel dimensions if present
            if len(image.shape) == 4:  # (batch, height, width, channels)
                image = image[0]  # Remove batch
                if image.shape[-1] == 1:  # Single channel
                    image = image.squeeze(axis=-1)  # Remove channel dimension

            # Convert to uint8 for saving
            if image.dtype != np.uint8:
                # Scale back to 0-255 range
                image = (image * 255).astype(np.uint8)

            # Create output directory if it doesn't exist
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            # Save image
            cv2.imwrite(output_path, image)

            logger.info(f"✅ Processed image saved to: {output_path}")

        except Exception as e:
            logger.error(f"❌ Failed to save processed image: {e}")
            raise


class FingerprintValidator:
    """Utility class for fingerprint image validation"""

    def __init__(self):
        """Initialize the validator"""
        self.preprocessor = FingerprintPreprocessor()

    def is_valid_fingerprint_format(self, image_path: str) -> bool:
        """
        Check if image is in a valid fingerprint format

        Args:
            image_path: Path to the image file

        Returns:
            True if valid format, False otherwise
        """
        try:
            # Check file extension
            valid_extensions = ['.tif', '.tiff', '.png', '.jpg', '.jpeg', '.bmp']
            file_ext = Path(image_path).suffix.lower()

            if file_ext not in valid_extensions:
                return False

            # Try to load and validate image
            validation_result = self.preprocessor.validate_fingerprint_image(image_path)

            return validation_result["valid"]

        except Exception as e:
            logger.warning(f"❌ Format validation failed for {image_path}: {e}")
            return False

    def get_fingerprint_score(self, image_path: str) -> Dict[str, Any]:
        """
        Get a comprehensive score for fingerprint image quality

        Args:
            image_path: Path to the fingerprint image

        Returns:
            Score dictionary with various metrics
        """
        try:
            # Validate image
            validation = self.preprocessor.validate_fingerprint_image(image_path)

            if not validation["valid"]:
                return {
                    "overall_score": 0.0,
                    "valid": False,
                    "error": validation["error"],
                    "details": validation["details"]
                }

            # Get quality metrics
            quality_metrics = validation["quality_metrics"]

            # Calculate overall score (weighted average of quality metrics)
            # Higher is better for all metrics except potentially contrast
            contrast_score = min(quality_metrics["contrast"] / 0.5, 1.0)  # Normalize contrast
            sharpness_score = min(quality_metrics["sharpness"] / 1000, 1.0)  # Normalize sharpness
            snr_score = min(max(quality_metrics["snr_db"] / 20, 0), 1.0)  # Normalize SNR

            # Weighted average
            overall_score = (contrast_score * 0.3 + sharpness_score * 0.4 + snr_score * 0.3)

            return {
                "overall_score": float(overall_score),
                "valid": True,
                "quality_metrics": quality_metrics,
                "dimensions": {
                    "width": validation["width"],
                    "height": validation["height"]
                }
            }

        except Exception as e:
            logger.error(f"❌ Score calculation failed for {image_path}: {e}")
            return {
                "overall_score": 0.0,
                "valid": False,
                "error": f"Score calculation failed: {str(e)}"
            }


