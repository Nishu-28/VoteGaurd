package com.voteguard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BiometricService {

    @Value("${biometric.service.url}")
    private String biometricServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    
    @Autowired
    private VoterRegistrationService voterRegistrationService;

    public boolean verifyFingerprint(String storedFingerprintHash, String currentFingerprintData) {
        try {
            String url = biometricServiceUrl + "/verify";
            
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("stored_hash", storedFingerprintHash);
            requestBody.put("current_data", currentFingerprintData);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                return Boolean.TRUE.equals(responseBody.get("verified"));
            }
            
            return false;
        } catch (Exception e) {
            // Log error and return false for security
            System.err.println("Biometric verification failed: " + e.getMessage());
            return false;
        }
    }

    /**
     * Verify fingerprint using enhanced biometric service with MultipartFile
     */
    public boolean verifyFingerprintFile(MultipartFile fingerprintFile, String voterId) {
        try {
            System.out.println("BiometricService: Starting verification for voter: " + voterId);
            System.out.println("BiometricService: Service URL: " + biometricServiceUrl);
            
            String url = biometricServiceUrl + "/enhanced/verify";
            System.out.println("BiometricService: Full URL: " + url);
            
            // Create multipart form data
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("fingerprint", new ByteArrayResource(fingerprintFile.getBytes()) {
                @Override
                public String getFilename() {
                    return fingerprintFile.getOriginalFilename();
                }
            });
            body.add("voter_id", voterId);
            
            System.out.println("BiometricService: Request body prepared, file size: " + fingerprintFile.getSize());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            
            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            
            System.out.println("BiometricService: Making POST request to biometric service...");
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            System.out.println("BiometricService: Response status: " + response.getStatusCode());
            System.out.println("BiometricService: Response body: " + response.getBody());
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                boolean verified = Boolean.TRUE.equals(responseBody.get("verified"));
                System.out.println("BiometricService: Verification result: " + verified);
                return verified;
            }
            
            System.out.println("BiometricService: Verification failed - non-2xx response or null body");
            return false;
        } catch (Exception e) {
            // Log error and return false for security
            System.err.println("Enhanced biometric verification failed: " + e.getMessage());
            System.err.println("Exception type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Compare current fingerprint with stored fingerprint data
     */
    public boolean compareFingerprintWithStored(MultipartFile currentFingerprint, byte[] storedFingerprintData, String adminId) {
        try {
            System.out.println("BiometricService: Starting fingerprint comparison for admin: " + adminId);
            System.out.println("BiometricService: Service URL: " + biometricServiceUrl);
            
            String url = biometricServiceUrl + "/compare";
            System.out.println("BiometricService: Full URL: " + url);
            
            // Create multipart form data
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            
            // Add current fingerprint
            body.add("current_fingerprint", new ByteArrayResource(currentFingerprint.getBytes()) {
                @Override
                public String getFilename() {
                    return currentFingerprint.getOriginalFilename();
                }
            });
            
            // Add stored fingerprint
            body.add("stored_fingerprint", new ByteArrayResource(storedFingerprintData) {
                @Override
                public String getFilename() {
                    return "stored_" + adminId + ".tif";
                }
            });
            
            System.out.println("BiometricService: Request body prepared");
            System.out.println("BiometricService: Current fingerprint size: " + currentFingerprint.getSize());
            System.out.println("BiometricService: Stored fingerprint size: " + storedFingerprintData.length);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            
            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            
            System.out.println("BiometricService: Making POST request to compare fingerprints...");
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            System.out.println("BiometricService: Response status: " + response.getStatusCode());
            System.out.println("BiometricService: Response body: " + response.getBody());
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                boolean matched = Boolean.TRUE.equals(responseBody.get("match"));
                System.out.println("BiometricService: Fingerprint comparison result: " + matched);
                return matched;
            }
            
            System.out.println("BiometricService: Comparison failed - non-2xx response or null body");
            return false;
        } catch (Exception e) {
            System.err.println("Fingerprint comparison failed: " + e.getMessage());
            System.err.println("Exception type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Enroll fingerprint using enhanced biometric service
     */
    public boolean enrollFingerprintFile(MultipartFile fingerprintFile, String voterId) {
        try {
            String url = biometricServiceUrl + "/enhanced/enroll";
            
            // Create multipart form data
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("fingerprint", new ByteArrayResource(fingerprintFile.getBytes()) {
                @Override
                public String getFilename() {
                    return fingerprintFile.getOriginalFilename();
                }
            });
            body.add("voter_id", voterId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            
            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                return Boolean.TRUE.equals(responseBody.get("success"));
            }
            
            return false;
        } catch (Exception e) {
            System.err.println("Enhanced biometric enrollment failed: " + e.getMessage());
            return false;
        }
    }

    public String processFingerprint(String fingerprintData) {
        try {
            String url = biometricServiceUrl + "/scan";
            
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("fingerprint_data", fingerprintData);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                return (String) responseBody.get("hash");
            }
            
            return null;
        } catch (Exception e) {
            System.err.println("Fingerprint processing failed: " + e.getMessage());
            return null;
        }
    }

    public Map<String, Object> verifyVoterFingerprint(String voterId, MultipartFile fingerprintFile) {
        try {
            // First, get the stored fingerprint data for this voter
            byte[] storedFingerprintData = voterRegistrationService.getStoredFingerprintData(voterId);
            
            if (storedFingerprintData == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("verified", false);
                result.put("message", "No stored fingerprint found for this voter");
                return result;
            }
            
            // Use the compare endpoint to verify the fingerprint against stored data
            String url = biometricServiceUrl + "/compare";
            
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            
            // Add current fingerprint
            body.add("current_fingerprint", new ByteArrayResource(fingerprintFile.getBytes()) {
                @Override
                public String getFilename() {
                    return fingerprintFile.getOriginalFilename();
                }
            });
            
            // Add stored fingerprint
            body.add("stored_fingerprint", new ByteArrayResource(storedFingerprintData) {
                @Override
                public String getFilename() {
                    return "stored_" + voterId + ".tif";
                }
            });
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            
            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            Map<String, Object> result = new HashMap<>();
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                Object matchResult = responseBody != null ? responseBody.get("match") : null;
                boolean verified = matchResult != null && Boolean.TRUE.equals(matchResult);
                
                result.put("verified", verified);
                result.put("confidence", responseBody != null ? responseBody.get("confidence") : null);
                result.put("match_score", responseBody != null ? responseBody.get("match_score") : null);
                result.put("message", verified ? 
                    "Fingerprint successfully verified against stored data" : 
                    "Fingerprint does not match stored data for this voter");
                result.put("metadata", responseBody != null ? responseBody.get("metadata") : null);
            } else {
                result.put("verified", false);
                result.put("message", "Fingerprint verification service unavailable");
            }
            
            return result;
        } catch (Exception e) {
            System.err.println("Voter fingerprint verification failed: " + e.getMessage());
            Map<String, Object> result = new HashMap<>();
            result.put("verified", false);
            result.put("error", e.getMessage());
            result.put("message", "Fingerprint verification failed: " + e.getMessage());
            return result;
        }
    }

    public Map<String, Object> enrollFingerprint(MultipartFile fingerprintFile) {
        try {
            String url = biometricServiceUrl + "/enroll";
            
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("fingerprint", new ByteArrayResource(fingerprintFile.getBytes()) {
                @Override
                public String getFilename() {
                    return fingerprintFile.getOriginalFilename();
                }
            });
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            
            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            Map<String, Object> result = new HashMap<>();
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                result.put("verified", Boolean.TRUE.equals(responseBody.get("success")));
                result.put("hash", responseBody.get("hash"));
                result.put("message", responseBody.get("message"));
            } else {
                result.put("verified", false);
                result.put("message", "Fingerprint enrollment service unavailable");
            }
            
            return result;
        } catch (Exception e) {
            System.err.println("Fingerprint enrollment failed: " + e.getMessage());
            Map<String, Object> result = new HashMap<>();
            result.put("verified", false);
            result.put("error", e.getMessage());
            return result;
        }
    }
}


