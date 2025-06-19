#!/bin/bash

echo "Building Collaborative Whiteboard for deployment..."

# Build the React client
echo "Building React client..."
cd client
npm install
npm run build
cd ..

# Copy build files to server directory for deployment
echo "Copying build files to server directory..."
cp -r client/build server/

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
cd ..

echo "Build complete! Server directory is ready for deployment."
echo "You can now deploy the 'server' directory to Render, Railway, or Heroku." 