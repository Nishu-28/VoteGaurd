# UML Class Diagram Prompt for VoteGuard System

## Simple Prompt for Miro AI

Create a UML Class Diagram for a secure voting system called "VoteGuard" with the following structure:

### Domain Models:
1. **Voter** - id, voterId, fullName, email, fingerprintHash, hasVoted, isActive, role
2. **Candidate** - id, name, party, description, electionId, isActive
3. **Election** - id, name, description, startDate, endDate, status (enum: UPCOMING/ACTIVE/COMPLETED)
4. **Vote** - id, voterId, candidateId, electionId, stationCode, timestamp, fingerprintVerified
5. **VotingStation** - id, stationCode, location, isLocked
6. **AdminUser** - id, adminId, username, email, role, hasBiometric
7. **AuditLog** - id, userId, action, resource, timestamp

### Repositories (Data Access):
- VoterRepository
- CandidateRepository
- ElectionRepository
- VoteRepository
- VotingStationRepository
- AdminRepository
- AuditLogRepository

All repositories depend on **JdbcTemplate** and have standard CRUD methods (save, findById, findAll, update, delete).

### Services (Business Logic):
- **VoterRegistrationService** - uses VoterRepository, BiometricService
- **VoteService** - uses VoteRepository, VoterRepository, CandidateRepository
- **ElectionService** - uses ElectionRepository, CandidateRepository
- **BiometricService** - communicates with external Biometric API
- **AdminService** - uses AdminRepository
- **CenterBasedAuthService** - handles authentication with JwtTokenProvider

### Controllers (REST API):
- VoterRegistrationController → VoterRegistrationService
- VoteController → VoteService
- ElectionController → ElectionService
- CandidateController → CandidateRepository
- BiometricController → BiometricService
- AdminController → AdminService
- CenterBasedAuthController → CenterBasedAuthService

### Security:
- **JwtTokenProvider** - generates and validates JWT tokens
- **JwtAuthenticationFilter** - filters requests and validates tokens
- **SecurityConfig** - configures Spring Security

### Key Relationships:
- Voter 1 --- 0..1 Vote
- Candidate 1 --- 0..* Vote
- Election 1 --- 0..* Candidate
- Election 1 --- 0..* Vote
- VotingStation 1 --- 0..* Vote

### Architecture:
- Spring Boot application with PostgreSQL database
- Layered architecture: Controllers → Services → Repositories → Database
- JWT authentication with fingerprint biometric verification
- External microservice for biometric processing (FastAPI)

**Display with clear layer grouping: Models, Repositories, Services, Controllers, Security. Show dependencies with arrows.**
