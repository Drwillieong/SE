# Google OAuth Setup Guide

## Step 1: Create Google Cloud Console Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

## Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required information:
   - App name: "Your App Name"
   - User support email: your-email@example.com
   - Developer contact information: your-email@example.com
4. Add scopes: `.../auth/userinfo.email` and `.../auth/userinfo.profile`
5. Add test users (optional for testing)

## Step 3: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Configure authorized JavaScript origins:
   - `http://localhost:5173` (your React app)
5. Configure authorized redirect URIs:
   - `http://localhost:8800/auth/google/callback` (your backend)
6. Copy the Client ID and Client Secret

## Step 4: Update Environment Variables

1. Create a `.env` file in the `backend` directory
2. Add your credentials:

```env
GOOGLE_CLIENT_ID=your-actual-client-id
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8800/auth/google/callback
JWT_SECRET=your-secure-jwt-secret
SESSION_SECRET=your-secure-session-secret
```

## Step 5: Test the Setup

1. Start your backend server: `npm start` in backend directory
2. Start your frontend: `npm run dev` in client directory
3. Open http://localhost:5173
4. Click "Continue with Google" button
5. You should be redirected to Google for authentication
6. After authentication, you'll be redirected back to your app

## Troubleshooting

- **Redirect URI mismatch**: Ensure the redirect URI in Google Cloud Console matches exactly with your backend URL
- **CORS issues**: Check that your frontend URL is added to authorized JavaScript origins
- **Invalid credentials**: Double-check your Client ID and Client Secret
- **Scope issues**: Ensure you've requested the correct scopes (email, profile)

## Security Notes

- Never commit your actual `.env` file to version control
- Use strong, random secrets for JWT and session
- In production, use HTTPS for all URLs
- Regularly rotate your secrets and credentials

