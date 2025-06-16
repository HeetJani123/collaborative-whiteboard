# Collaborative Whiteboard

A real-time collaborative whiteboard app built with React.js, Canvas API, and Socket.io.

## Features

- Canvas-based drawing with pen tool
- Choose pen color and size
- Real-time sync using Socket.io
- Support for multi-tab collaboration
- Live user cursors with color-coded identity
- Clear canvas button
- Mobile and desktop support

## Project Structure

- `/client` - React app for the whiteboard UI
- `/server` - Node.js/Express server for Socket.io

## Setup

### Client

1. Navigate to the client directory:
   ```
   cd client
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

### Server

1. Navigate to the server directory:
   ```
   cd server
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```

## Usage

Open your browser and go to `http://localhost:3000` to start drawing on the whiteboard. Open multiple tabs to see real-time collaboration in action. 