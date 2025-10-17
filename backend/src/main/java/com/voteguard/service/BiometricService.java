package com.voteguard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BiometricService {

    @Value("${biometric.service.url}")
    private String biometricServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

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
}


