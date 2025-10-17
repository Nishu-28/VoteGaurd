# VoteGuard - Secure Voting System

A professional, secure voting system with fingerprint authentication built using modern technologies.

## 🚀 Features

- **Secure Authentication**: JWT-based authentication with role-based access control
- **Fingerprint Verification**: Advanced biometric authentication using OpenCV (supports PNG, JPG, JPEG, TIF, TIFF)
- **Real-time Voting**: Secure vote casting with audit trails
- **Results Dashboard**: Live voting results and statistics
- **Audit Logging**: Comprehensive security and system event logging
- **Responsive Design**: Modern UI with Tailwind CSS

## 🏗️ Architecture

VoteGuard uses a microservices architecture with three main components:

- **Frontend**: React + Tailwind CSS (Port 5173)
- **Backend**: Spring Boot + JWT + PostgreSQL (Port 8080)
- **Biometric Service**: FastAPI + OpenCV (Port 8001)

## 📁 Project Structure

```
VoteGuard/
├── frontend/                 # React application
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   ├── package.json         # Dependencies
│   └── tailwind.config.js   # Tailwind configuration
├── backend/                 # Spring Boot API
│   ├── src/main/java/       # Java source code
│   ├── src/main/resources/  # Configuration files
│   └── pom.xml             # Maven dependencies
├── biometric-service/       # FastAPI microservice
│   ├── app/                # Python source code
│   └── requirements.txt    # Python dependencies
├── database/               # Database scripts
│   ├── schema.sql          # Database schema
│   └── seed.sql           # Sample data
└── docs/                  # Documentation
    ├── api-docs.md        # API documentation
    ├── setup-guide.md     # Setup instructions
    └── architecture-diagram.md # System architecture
```

## 🛠️ Quick Start

### Prerequisites

- Java 17+
- Maven 3.6+
- Python 3.8+
- Node.js 16+
- PostgreSQL 13+ (or NeonDB)

### 1. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE voteguard;"

# Run schema and seed scripts
psql -U postgres -d voteguard -f database/schema.sql
psql -U postgres -d voteguard -f database/seed.sql
```

### 2. Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend will be available at `http://localhost:8080`

### 3. Biometric Service Setup

```bash
cd biometric-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Biometric service will be available at `http://localhost:8001`

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=jdbc:postgresql://localhost:5432/voteguard
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
JWT_SECRET=your-super-secret-jwt-key-here
BIOMETRIC_SERVICE_URL=http://localhost:8001
```

### Database Configuration

Update `backend/src/main/resources/application.yml` with your database credentials.

## 📚 API Documentation

### Backend Endpoints

- **Authentication**: `/api/auth/*`
- **Voting**: `/api/vote/*`
- **Results**: `/api/results/*`

### Biometric Service Endpoints

- **Health Check**: `/ping`
- **Fingerprint Scan**: `/api/v1/scan`
- **Fingerprint Verify**: `/api/v1/verify`

For detailed API documentation, see [docs/api-docs.md](docs/api-docs.md)

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: BCrypt encryption
- **Fingerprint Verification**: Biometric authentication
- **Audit Logging**: Comprehensive security event tracking
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Comprehensive data validation

## 🧪 Testing

### Backend Tests

```bash
cd backend
mvn test
```

### Biometric Service Tests

```bash
cd biometric-service
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📊 Sample Data

The system comes with sample data including:

- **5 Candidates**: From different political parties
- **10 Voters**: With sample fingerprint hashes
- **5 Sample Votes**: For testing results functionality

## 🚀 Deployment

### Development

All services run locally with hot reload enabled.

### Production

1. **Database**: Use managed PostgreSQL (NeonDB, AWS RDS)
2. **Backend**: Deploy to cloud platform (AWS, Heroku, etc.)
3. **Biometric Service**: Deploy to cloud platform
4. **Frontend**: Build and deploy to CDN or static hosting

## 📖 Documentation

- [Setup Guide](docs/setup-guide.md) - Detailed setup instructions
- [API Documentation](docs/api-docs.md) - Complete API reference
- [Architecture Overview](docs/architecture-diagram.md) - System architecture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:

1. Check the [Setup Guide](docs/setup-guide.md)
2. Review the [API Documentation](docs/api-docs.md)
3. Check the logs for error messages
4. Verify all services are running

## 🔮 Future Enhancements

- Multi-factor authentication
- Advanced biometrics (face recognition, iris scanning)
- Blockchain integration for immutable vote records
- Real-time analytics dashboard
- Mobile application
- Offline voting capability

---

**VoteGuard** - Secure, Transparent, Trustworthy Voting




