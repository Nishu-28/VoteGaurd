import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Fingerprint, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const FingerprintUploader = ({ onVerificationComplete, disabled = false, mode = 'enroll', voterId = 'DEMO_VOTER' }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const fileInputRef = useRef(null);

  const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/tif', 'image/x-tiff', 'image/jpeg; charset=utf-8'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB for TIF files

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (disabled) return;
    
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file) => {
    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setVerificationStatus({
        type: 'error',
        message: `File type '${file.type}' is not allowed. Please upload a PNG, JPG, JPEG, TIF, or TIFF file.`
      });
      return;
    }

    // Validate file extension
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.tif', '.tiff'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      setVerificationStatus({
        type: 'error',
        message: `File extension '${fileExtension}' is not allowed. Only fingerprint image files are accepted.`
      });
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setVerificationStatus({
        type: 'error',
        message: `File size must be less than ${maxFileSize / (1024 * 1024)}MB.`
      });
      return;
    }

    setSelectedFile(file);
    setVerificationStatus(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Auto-enroll fingerprint
    await handleVerify(file);
  };

  const handleVerify = async (fileToVerify = null) => {
    const file = fileToVerify || selectedFile;
    if (!file) return;

    setIsVerifying(true);
    setVerificationStatus(null);

    try {
      const formData = new FormData();
      formData.append('fingerprint', file);
      formData.append('voter_id', voterId || 'TEMP_VALIDATION');
      
      const endpoint = mode === 'enroll' ? 'enhanced/enroll' : 'enhanced/verify';
      const url = `http://localhost:8001/${endpoint}`;
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (mode === 'enroll') {
        if (result.success) {
          setVerificationStatus({
            type: 'success',
            message: 'Fingerprint enrolled successfully!'
          });
          onVerificationComplete(true, file);
        } else {
          const errorMessage = result.message || 'Fingerprint enrollment failed. Please try again.';
          setVerificationStatus({
            type: 'error',
            message: errorMessage
          });
          onVerificationComplete(false, null);
        }
      } else {
        if (result.verified) {
          setVerificationStatus({
            type: 'success',
            message: 'Fingerprint verified successfully!'
          });
          onVerificationComplete(true, file);
        } else {
          const errorMessage = result.message || 'Fingerprint verification failed. Please try again.';
          setVerificationStatus({
            type: 'error',
            message: errorMessage
          });
          onVerificationComplete(false, null);
        }
      }
    } catch (error) {
      console.error('Fingerprint verification error:', error);
      const action = mode === 'enroll' ? 'Enrollment' : 'Verification';
      setVerificationStatus({
        type: 'error',
        message: `${action} service unavailable. Please try again later.`
      });
      onVerificationComplete(false, null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    setVerificationStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = () => {
    if (!verificationStatus) return null;
    
    switch (verificationStatus.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    if (!verificationStatus) return '';
    
    switch (verificationStatus.type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
          dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.tif,.tiff,image/png,image/jpeg,image/jpg,image/tiff,image/tif"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        {!selectedFile ? (
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Fingerprint className="h-16 w-16 text-gray-400 mx-auto" />
            </motion.div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Upload Fingerprint
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop fingerprint image here, or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supported formats: PNG, JPG, JPEG, TIF, TIFF (max 10MB)
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Upload className="h-8 w-8 text-blue-500 mx-auto" />
            </motion.div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={preview}
                alt="Fingerprint preview"
                className="max-h-32 mx-auto rounded-lg shadow-md"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                disabled={disabled}
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Verification Status */}
      {verificationStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center space-x-2 p-3 rounded-lg ${
            verificationStatus.type === 'success' 
              ? 'bg-green-50' 
              : 'bg-red-50'
          }`}
        >
          {getStatusIcon()}
          <p className={`text-sm font-medium ${getStatusColor()}`}>
            {verificationStatus.message}
          </p>
        </motion.div>
      )}

      {/* Processing status */}
      {selectedFile && isVerifying && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <svg
            className="animate-spin h-4 w-4 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm text-blue-600">
            {mode === 'enroll' ? 'Validating fingerprint...' : 'Verifying fingerprint...'}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default FingerprintUploader;