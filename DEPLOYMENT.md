# Deployment Guide for Collaborative Whiteboard

This project consists of two parts that need to be deployed separately:

## 1. Frontend (React Client) - Deploy to Netlify

### Steps:
1. Build the client:
   ```bash
   cd client
   npm run build
   ```

2. Deploy to Netlify:
   - Connect your GitHub repository to Netlify
   - Set build directory to: `client`
   - Set build command to: `npm run build`
   - Set publish directory to: `build`

3. Set environment variables in Netlify:
   - Go to Site settings > Environment variables
   - Add: `REACT_APP_SERVER_URL` = `https://your-server-url.com`

## 2. Backend (Node.js Server) - Deploy to Render/Railway/Heroku

### Option A: Render (Recommended - Free tier)

1. Create account on [Render.com](https://render.com)
2. Connect your GitHub repository
3. Create a new Web Service
4. Configure:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Root Directory: `server`

5. Set environment variables:
   - `CLIENT_URL` = `https://your-netlify-app.netlify.app`

### Option B: Railway

1. Create account on [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy the `server` directory
4. Set environment variables as above

### Option C: Heroku

1. Create account on [Heroku.com](https://heroku.com)
2. Install Heroku CLI
3. Deploy using:
   ```bash
   cd server
   heroku create your-app-name
   git subtree push --prefix server heroku main
   ```

## Important Notes:

1. **Update CORS origins**: In `server/index.js`, replace `'https://your-netlify-app.netlify.app'` with your actual Netlify URL.

2. **Environment Variables**: Make sure to set the correct URLs in both Netlify and your server platform.

3. **Build Process**: The server serves the React build files, so you can either:
   - Build locally and include the build folder in your server deployment
   - Or set up a build process on your server platform

## Quick Test:

After deployment, your app should work at:
- Frontend: `https://your-netlify-app.netlify.app`
- Backend: `https://your-server-app.onrender.com` (or similar)

The frontend will automatically connect to the backend using the `REACT_APP_SERVER_URL` environment variable. 