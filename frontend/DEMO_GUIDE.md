# VoteGuard Frontend Demo Guide

## 🚀 Quick Start

### 1. Start All Services
Run the main startup script from the project root:
```bash
start-all-services.bat
```

This will start:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080  
- **Biometric Service**: http://localhost:8001

### 2. Access the Application
Open your browser and navigate to: **http://localhost:5173**

## 🎯 Demo Flow

### Step 1: Login with Biometric Authentication
1. **Upload Fingerprint**: 
   - Drag & drop a fingerprint image (PNG/JPG/JPEG)
   - Or click to browse and select a file
   - Wait for verification (simulated)

2. **Enter Credentials**:
   - Voter ID: `admin` or `voter001`
   - Password: `password123`

3. **Sign In**: Click "Sign In" button

### Step 2: Cast Your Vote (Regular Users)
1. **View Candidates**: Browse available candidates
2. **Select Candidate**: Click on your preferred candidate
3. **Confirm Vote**: Review and confirm your selection
4. **Success**: See confirmation animation

### Step 3: View Results (Admin Users)
1. **Access Dashboard**: Admin users see "Results Dashboard" in navbar
2. **View Analytics**: 
   - Real-time vote counts
   - Interactive charts (Bar & Pie)
   - Detailed results table
3. **Export Data**: Download results as CSV
4. **Refresh**: Get latest results

## 🎨 Features to Explore

### Dark/Light Mode
- Toggle in the top-right corner of navbar
- Persists across sessions
- Smooth transitions

### Responsive Design
- Test on different screen sizes
- Mobile-friendly touch interfaces
- Adaptive layouts

### Animations
- Smooth page transitions
- Loading states
- Success animations
- Hover effects

### Security Features
- JWT token authentication
- Protected routes
- Role-based access control
- Secure file upload validation

## 🧪 Test Scenarios

### 1. Authentication Flow
- Try invalid credentials
- Test fingerprint upload with different file types
- Verify error handling

### 2. Voting Process
- Cast votes for different candidates
- Test confirmation modal
- Verify success flow

### 3. Admin Dashboard
- Login as admin user
- View real-time results
- Test export functionality
- Refresh data

### 4. Responsive Testing
- Test on mobile devices
- Check tablet layouts
- Verify desktop experience

## 🔧 Troubleshooting

### Common Issues

1. **Services Not Starting**:
   - Check if ports 5173, 8080, 8001 are available
   - Ensure all dependencies are installed

2. **Fingerprint Upload Fails**:
   - Use PNG, JPG, or JPEG files only
   - Keep file size under 5MB
   - Check biometric service is running

3. **Login Issues**:
   - Verify backend service is running
   - Check network connectivity
   - Try different credentials

4. **Results Not Loading**:
   - Ensure you're logged in as admin
   - Check backend API connectivity
   - Verify database has data

### Debug Mode
Open browser developer tools (F12) to see:
- Network requests
- Console errors
- Authentication state
- API responses

## 📱 Mobile Testing

### iOS Safari
- Test touch interactions
- Verify fingerprint upload
- Check responsive layouts

### Android Chrome
- Test biometric features
- Verify modal interactions
- Check performance

## 🎯 Demo Tips

### For Presentations
1. **Start with Login**: Show biometric authentication
2. **Demo Voting**: Cast a vote with confirmation
3. **Show Results**: Switch to admin view
4. **Highlight Features**: Dark mode, responsive design
5. **Test Edge Cases**: Error handling, validation

### For Development
1. **Check Console**: Monitor for errors
2. **Network Tab**: Verify API calls
3. **Performance**: Test loading times
4. **Accessibility**: Test keyboard navigation

## 🔐 Security Notes

- JWT tokens are stored in localStorage
- All API calls include authentication headers
- File uploads are validated client-side
- Routes are protected based on user roles

## 📊 Performance

- Fast initial load with Vite
- Optimized bundle size
- Lazy loading for routes
- Efficient re-renders with React 18

---

**Happy Voting! 🗳️**






