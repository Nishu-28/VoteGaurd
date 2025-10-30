# VoteGuard Admin Panel

A React-based admin panel for managing elections and voter registrations in the VoteGuard system.

## Features

### 🗳️ Elections Management
- Create new elections with custom dates and descriptions
- Add multiple candidates to each election
- Edit existing elections and their details
- Delete elections (with confirmation)
- View all elections with status indicators
- Support for different election statuses: UPCOMING, ACTIVE, COMPLETED

### 👥 Voter Registration
- Register new voters with biometric authentication
- Upload fingerprint and profile photos
- Validate voter information
- Automatic fingerprint enrollment and verification
- Form validation and error handling

### 📊 Dashboard
- Quick overview of system statistics
- Navigation cards for main features
- Real-time data display

## Installation

1. Navigate to the admin panel directory:
   ```bash
   cd admin-panel
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Or use the batch file:
   ```bash
   start-admin.bat
   ```

## Project Structure

```
admin-panel/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── FingerprintUploader.jsx
│   │   ├── Navbar.jsx
│   │   └── ProfilePhotoUploader.jsx
│   ├── pages/              # Main application pages
│   │   ├── Dashboard.jsx
│   │   ├── Elections.jsx
│   │   └── VoterRegistration.jsx
│   ├── services/           # API service layer
│   │   └── api.js
│   ├── App.jsx            # Main application component
│   └── main.jsx           # Application entry point
├── public/                # Static assets
├── package.json
└── README.md
```

## Technologies Used

- **React 18** - Frontend framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Framer Motion** - Animations
- **Lucide React** - Icon library
- **Axios** - HTTP client

## API Integration

The admin panel connects to the VoteGuard backend API running on `http://localhost:8080`. Make sure the backend service is running before using the admin panel.

### API Endpoints Used:
- `GET /api/elections` - Fetch all elections
- `POST /api/elections` - Create new election
- `PUT /api/elections/{id}` - Update election
- `DELETE /api/elections/{id}` - Delete election
- `POST /api/voter-registration/register` - Register new voter

## Database Schema Changes

The admin panel requires the following database migrations to be applied:

1. **Elections Table**: Stores election information
2. **Modified Candidates Table**: Links candidates to specific elections
3. **Modified Voters Table**: Stores eligible elections as JSONB array
4. **Modified Votes Table**: Tracks votes per election

Run the migration script:
```sql
-- Apply the migration
\i database/migration_add_elections_support.sql
```

## Usage Guide

### Creating an Election

1. Navigate to the "Elections" page
2. Click "Create Election"
3. Fill in election details:
   - Election Name
   - Description (optional)
   - Start and End dates
   - Status (UPCOMING/ACTIVE/COMPLETED)
4. Add candidates (minimum 2 required):
   - Candidate name
   - Party/Affiliation
   - Description
5. Click "Create Election"

### Registering a Voter

1. Navigate to "Voter Registration"
2. Fill in personal information:
   - Voter ID
   - Full Name
   - Email
   - Date of Birth/Department Code
3. Upload biometric data:
   - Fingerprint image (PNG, JPG, TIF formats)
   - Profile photo (PNG, JPG formats)
4. Wait for fingerprint verification
5. Click "Register Voter"

### Managing Elections

- **View**: See all elections with their status and details
- **Edit**: Click the edit button to modify election details
- **Delete**: Click the delete button (requires confirmation)
- **Status**: Elections show color-coded status indicators

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Component Guidelines

- Use Tailwind CSS for styling
- Follow the existing component structure
- Include proper error handling
- Add loading states for async operations
- Use Framer Motion for smooth animations

## Security Considerations

- All file uploads are validated for type and size
- Fingerprint verification is required for voter registration
- API calls include proper error handling
- Form validation prevents invalid data submission

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure all dependencies are installed with `npm install`
2. **API Connection**: Verify backend service is running on port 8080
3. **File Upload Issues**: Check file format and size limits
4. **Styling Issues**: Ensure Tailwind CSS is properly configured

### Debug Mode

Add this to your `.env` file for debug logging:
```
VITE_DEBUG=true
```

## Contributing

1. Follow the existing code style
2. Add proper TypeScript types if converting to TS
3. Include unit tests for new components
4. Update documentation for new features

## License

This project is part of the VoteGuard voting system.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
