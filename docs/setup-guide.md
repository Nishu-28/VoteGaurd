# VoteGuard Setup Guide

This guide will help you set up and run the VoteGuard secure voting system locally.

## Prerequisites

Before starting, ensure you have the following installed:

- **Java 17+** - For Spring Boot backend
- **Maven 3.6+** - For dependency management
- **Python 3.8+** - For biometric service
- **Node.js 16+** - For frontend development
- **PostgreSQL 13+** - Database (or use NeonDB cloud)
- **Git** - Version control

## Project Structure

```
VoteGuard/
├── backend/                 # Spring Boot API
├── biometric-service/       # FastAPI microservice
├── frontend/               # React application
├── database/               # SQL scripts
└── docs/                   # Documentation
```

## 1. Database Setup

### Option A: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database:
   ```sql
   CREATE DATABASE voteguard;
   CREATE USER voteguard_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE voteguard TO voteguard_user;
   ```

3. Run the schema and seed scripts:
   ```bash
   psql -U voteguard_user -d voteguard -f database/schema.sql
   psql -U voteguard_user -d voteguard -f database/seed.sql
   ```

### Option B: NeonDB (Cloud)

1. Sign up at [NeonDB](https://neon.tech/)
2. Create a new project
3. Copy the connection string
4. Update `backend/src/main/resources/application.yml` with your NeonDB URL

## 2. Backend Setup (Spring Boot)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Update database configuration in `src/main/resources/application.yml`:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://your-db-host:5432/voteguard
       username: your_username
       password: your_password
   ```

3. Set environment variables (optional):
   ```bash
   export JWT_SECRET="your-super-secret-jwt-key-here"
   export DATABASE_URL="your-database-url"
   export BIOMETRIC_SERVICE_URL="http://localhost:8001"
   ```

4. Build and run the application:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

The backend will be available at `http://localhost:8080`

## 3. Biometric Service Setup (FastAPI)

1. Navigate to the biometric service directory:
   ```bash
   cd biometric-service
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the service:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
   ```

The biometric service will be available at `http://localhost:8001`

## 4. Frontend Setup (React)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## 5. Verification

### Test Backend API

1. Check health endpoint:
   ```bash
   curl http://localhost:8080/api/auth/ping
   ```

2. Test authentication:
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"password123"}'
   ```

### Test Biometric Service

1. Check health endpoint:
   ```bash
   curl http://localhost:8001/ping
   ```

2. Test fingerprint processing:
   ```bash
   curl -X POST http://localhost:8001/api/v1/scan \
     -H "Content-Type: application/json" \
     -d '{"fingerprint_data":"base64_encoded_data","quality_threshold":0.7}'
   ```

### Test Frontend

1. Open `http://localhost:3000` in your browser
2. You should see the VoteGuard welcome page

## Environment Variables

Create a `.env` file in the backend directory for local development:

```env
# Database Configuration
DATABASE_URL=jdbc:postgresql://localhost:5432/voteguard
DATABASE_USERNAME=voteguard_user
DATABASE_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Biometric Service
BIOMETRIC_SERVICE_URL=http://localhost:8001

# Admin Configuration
ADMIN_PASSWORD=admin123
```

## Development Workflow

1. **Start Database** (if using local PostgreSQL)
2. **Start Biometric Service**: `cd biometric-service && uvicorn app.main:app --reload`
3. **Start Backend**: `cd backend && mvn spring-boot:run`
4. **Start Frontend**: `cd frontend && npm start`

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Backend (8080): Change port in `application.yml`
   - Biometric Service (8001): Use `--port 8001` flag
   - Frontend (3000): Use `PORT=3001 npm start`

2. **Database Connection Issues**
   - Check database credentials
   - Ensure PostgreSQL is running
   - Verify network connectivity

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set
   - Check token expiration
   - Verify token format

4. **CORS Issues**
   - Check CORS configuration in `SecurityConfig.java`
   - Ensure frontend URL is whitelisted

### Logs

- **Backend**: Check console output or `logs/` directory
- **Biometric Service**: Check console output or `logs/biometric_service.log`
- **Frontend**: Check browser console and terminal output

## Production Deployment

For production deployment:

1. **Database**: Use managed PostgreSQL service (NeonDB, AWS RDS, etc.)
2. **Backend**: Deploy to cloud platform (AWS, Heroku, etc.)
3. **Biometric Service**: Deploy to cloud platform
4. **Frontend**: Build and deploy to CDN or static hosting
5. **Security**: Update CORS settings, use HTTPS, set strong JWT secrets

## Security Considerations

1. **Change Default Passwords**: Update all default passwords
2. **Use HTTPS**: Enable SSL/TLS in production
3. **Environment Variables**: Never commit secrets to version control
4. **Database Security**: Use strong passwords and network restrictions
5. **JWT Secrets**: Use cryptographically secure random strings
6. **CORS**: Restrict to specific domains in production

## Support

For issues and questions:

1. Check the logs for error messages
2. Verify all services are running
3. Test individual components
4. Review the API documentation
5. Check the database schema and data









