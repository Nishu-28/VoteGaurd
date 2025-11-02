/**
 * Utility functions for encoding/decoding election codes in URLs
 * Uses Base64 encoding with a salt for basic obfuscation
 */

const SALT = 'VoteGuard2024'; // Salt for encoding (in production, make this configurable)

/**
 * Encodes an election code for use in URLs
 * @param {string} electionCode - The election code to encode
 * @returns {string} - Encoded string safe for URLs
 */
export const encodeElectionCode = (electionCode) => {
  if (!electionCode) return '';
  
  try {
    // Combine salt and code
    const combined = `${SALT}${electionCode}`;
    // Encode to Base64
    const encoded = btoa(combined);
    // Replace characters that might cause issues in URLs
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (error) {
    console.error('Error encoding election code:', error);
    return '';
  }
};

/**
 * Decodes an encoded election code from URL
 * @param {string} encoded - The encoded string from URL
 * @returns {string} - The original election code, or empty string if invalid
 */
export const decodeElectionCode = (encoded) => {
  if (!encoded) return '';
  
  try {
    // Restore Base64 characters
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    // Decode from Base64
    const decoded = atob(base64);
    // Remove salt
    if (decoded.startsWith(SALT)) {
      return decoded.substring(SALT.length);
    }
    return '';
  } catch (error) {
    console.error('Error decoding election code:', error);
    return '';
  }
};

/**
 * Validates if a string is a valid election code (6 alphanumeric characters)
 * @param {string} code - The code to validate
 * @returns {boolean} - True if valid
 */
export const isValidElectionCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  // Election code should be 6 alphanumeric characters
  return /^[A-Z0-9]{6}$/i.test(code.trim());
};



