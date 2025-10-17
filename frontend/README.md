# VoteGuard Frontend

A professional React frontend for the VoteGuard secure voting system with biometric authentication.

## Features

- 🔐 **Biometric Authentication** - Fingerprint upload and verification
- 🗳️ **Secure Voting** - Cast votes with confirmation modals
- 📊 **Results Dashboard** - Real-time results with charts and analytics
- 🌙 **Dark/Light Mode** - Toggle between themes
- 📱 **Responsive Design** - Works on all devices
- ⚡ **Fast & Modern** - Built with React 18, Vite, and Tailwind CSS

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Recharts** - Data visualization
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.jsx      # Custom button component
│   ├── Modal.jsx       # Modal dialog component
│   ├── Navbar.jsx      # Navigation bar
│   └── FingerprintUploader.jsx  # Biometric upload component
├── pages/              # Page components
│   ├── Login.jsx       # Login with fingerprint auth
│   ├── Ballot.jsx      # Voting interface
│   ├── Success.jsx     # Vote confirmation
│   └── Results.jsx     # Admin results dashboard
├── services/           # API service layer
│   ├── api.js         # Axios configuration
│   ├── auth.js        # Authentication services
│   ├── biometric.js   # Biometric verification
│   ├── vote.js        # Voting services
│   └── results.js     # Results services
├── context/           # React context
│   └── AuthContext.jsx # Authentication state
├── hooks/             # Custom React hooks
├── assets/            # Static assets
├── App.jsx            # Main app component
└── main.jsx           # App entry point
```

## API Integration

### Backend Services

- **Spring Boot Backend**: `http://localhost:8080`
  - Authentication: `/auth/login`
  - Candidates: `/vote/candidates`
  - Cast Vote: `/vote/cast`
  - Results: `/results`

- **FastAPI Biometric Service**: `http://localhost:8001`
  - Fingerprint Verification: `/verify`

### Authentication Flow

1. User uploads fingerprint image
2. Fingerprint verified via FastAPI service
3. If verified, user enters voter ID and password
4. JWT token received and stored
5. User redirected to appropriate page based on role

## Features Overview

### Login Page
- Voter ID and password fields
- Drag & drop fingerprint upload
- File validation (PNG, JPG, JPEG only)
- Real-time verification status
- Error handling and user feedback

### Ballot Page
- Candidate cards with photos and info
- Vote confirmation modal
- Secure vote casting
- Success animation

### Results Dashboard (Admin Only)
- Real-time vote counts
- Interactive charts (Bar & Pie)
- Export to CSV functionality
- Responsive data table
- Auto-refresh capability

### Responsive Design
- Mobile-first approach
- Touch-friendly interfaces
- Adaptive layouts
- Dark/light mode support

## Security Features

- JWT token authentication
- Protected routes
- Role-based access control
- Secure file upload validation
- HTTPS-ready configuration

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_BIOMETRIC_API_URL=http://localhost:8001
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the VoteGuard secure voting system.