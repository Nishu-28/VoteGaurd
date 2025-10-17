# VoteGuard API Documentation

## Overview

VoteGuard is a secure voting system with fingerprint authentication. The system consists of three main components:

1. **Backend API** (Spring Boot) - Port 8080
2. **Biometric Service** (FastAPI) - Port 8001
3. **Frontend** (React) - Port 3000

## Backend API Endpoints

Base URL: `http://localhost:8080/api`

### Authentication Endpoints

#### POST `/auth/register`
Register a new voter.

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "fullName": "string",
  "email": "string",
  "fingerprintHash": "string"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "voter": {
    "id": 1,
    "username": "voter001",
    "fullName": "John Doe",
    "email": "john@example.com",
    "hasVoted": false,
    "role": "VOTER"
  }
}
```

#### POST `/auth/login`
Authenticate a voter.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "voter": {
    "id": 1,
    "username": "voter001",
    "fullName": "John Doe",
    "email": "john@example.com",
    "hasVoted": false,
    "role": "VOTER"
  }
}
```

#### GET `/auth/me`
Get current user information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "id": 1,
  "username": "voter001",
  "fullName": "John Doe",
  "email": "john@example.com",
  "hasVoted": false,
  "role": "VOTER"
}
```

### Voting Endpoints

#### GET `/vote/candidates`
Get list of active candidates.

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Smith",
    "party": "Democratic Party",
    "description": "Experienced politician...",
    "candidateNumber": 1,
    "isActive": true
  }
]
```

#### POST `/vote/cast`
Cast a vote.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "voterId": 1,
  "candidateId": 1,
  "fingerprintData": "base64_encoded_fingerprint_data"
}
```

**Response:**
```json
{
  "message": "Vote cast successfully",
  "voteId": 1,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### GET `/vote/status/{voterId}`
Check if a voter has already voted.

**Response:**
```json
{
  "hasVoted": false
}
```

### Results Endpoints

#### GET `/results/summary`
Get voting results summary.

**Response:**
```json
{
  "totalVotes": 150,
  "totalVoters": 200,
  "votersWhoVoted": 150,
  "votingPercentage": 75.0,
  "candidateResults": [
    [1, 45],
    [2, 38],
    [3, 32],
    [4, 25],
    [5, 10]
  ]
}
```

## Biometric Service Endpoints

Base URL: `http://localhost:8001`

### Health Check

#### GET `/ping`
Check service health.

**Response:**
```json
{
  "status": "healthy",
  "service": "biometric-service",
  "timestamp": "2024-01-15T00:00:00Z"
}
```

### Fingerprint Processing

#### POST `/api/v1/scan`
Process and hash fingerprint data.

**Request Body:**
```json
{
  "fingerprint_data": "base64_encoded_fingerprint_image",
  "quality_threshold": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "hash": "sha256_hash_of_processed_fingerprint",
  "quality_score": 0.85,
  "message": "Fingerprint processed successfully",
  "metadata": {
    "processing_time": 0.123,
    "features_extracted": 15
  }
}
```

#### POST `/api/v1/verify`
Verify fingerprint against stored hash.

**Request Body:**
```json
{
  "stored_hash": "previously_stored_fingerprint_hash",
  "current_data": "base64_encoded_current_fingerprint",
  "threshold": 0.8
}
```

**Response:**
```json
{
  "verified": true,
  "confidence_score": 0.92,
  "message": "Fingerprint verified with confidence 0.920",
  "metadata": {
    "processing_time": 0.156,
    "quality_score": 0.88
  }
}
```

#### GET `/api/v1/status`
Get service status and capabilities.

**Response:**
```json
{
  "service": "biometric-service",
  "status": "operational",
  "capabilities": {
    "scan": true,
    "verify": true,
    "quality_assessment": true
  },
  "version": "1.0.0"
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message description",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/endpoint"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

## Authentication

The backend API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens expire after 24 hours by default.

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing rate limiting to prevent abuse.

## CORS

CORS is configured to allow requests from `http://localhost:3000` (frontend) by default. Adjust the configuration in `SecurityConfig.java` for production deployment.

## Database Schema

The system uses PostgreSQL with the following main tables:

- `voters` - Voter information and authentication
- `candidates` - Election candidates
- `votes` - Cast votes
- `audit_logs` - Security audit trail

See `database/schema.sql` for the complete schema definition.









