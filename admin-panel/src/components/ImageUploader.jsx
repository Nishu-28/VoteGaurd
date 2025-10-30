import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, XCircle, CheckCircle, AlertCircle, Image } from 'lucide-react';

const ImageUploader = ({ 
  onImageSelected, 
  disabled = false, 
  label = "Upload Image",
  description = "Drag and drop image here, or click to browse",
  acceptedFormats = "PNG, JPG, JPEG",
  maxSize = 5, // in MB
  currentImage = null,
  required = false
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(currentImage);
  const [validationStatus, setValidationStatus] = useState(null);
  const fileInputRef = useRef(null);

  const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  const maxFileSize = maxSize * 1024 * 1024;

  const handleFile = (file) => {
    if (disabled) return;

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setValidationStatus({
        type: 'error',
        message: `Please upload a ${acceptedFormats} image file.`
      });
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setValidationStatus({
        type: 'error',
        message: `File size too large. Please upload an image smaller than ${maxSize}MB.`
      });
      return;
    }

    // Validate filename
    const suspiciousPatterns = ['script', 'executable', 'binary', 'exe', 'bat', 'cmd', 'sh', 'php', 'asp', 'jsp'];
    const filenameLower = file.name.toLowerCase();
    for (const pattern of suspiciousPatterns) {
      if (filenameLower.includes(pattern)) {
        setValidationStatus({
          type: 'error',
          message: 'File name contains suspicious pattern. Please use a different file.'
        });
        return;
      }
    }

    setSelectedFile(file);
    setValidationStatus({
      type: 'success',
      message: 'Image selected successfully!'
    });

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Notify parent component
    onImageSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(currentImage);
    setValidationStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageSelected(null);
  };

  const getStatusIcon = () => {
    if (!validationStatus) return null;
    
    switch (validationStatus.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    if (!validationStatus) return '';
    
    switch (validationStatus.type) {
      case 'success':
        return 'border-green-300 bg-green-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          (selectedFile || preview) 
            ? getStatusColor()
            : 'border-gray-300 hover:border-blue-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {!preview ? (
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Image className="h-16 w-16 text-gray-400 mx-auto" />
            </motion.div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {label}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {description}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supported formats: {acceptedFormats} (max {maxSize}MB)
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
                alt="Preview"
                className="max-h-32 w-auto mx-auto rounded-lg shadow-md object-cover"
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
            {selectedFile && (
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Message */}
      {validationStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center space-x-2 p-3 rounded-lg border ${
            validationStatus.type === 'success' 
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          {getStatusIcon()}
          <p className={`text-sm ${
            validationStatus.type === 'success' 
              ? 'text-green-600'
              : 'text-red-600'
          }`}>
            {validationStatus.message}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ImageUploader;