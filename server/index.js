const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, '../client/build')));

// Store connected users
const connectedUsers = new Set();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  connectedUsers.add(socket.id);

  // Notify all clients about new connection
  io.emit('userCount', connectedUsers.size);

  socket.on('draw', (data) => {
    console.log('Received draw event from', socket.id);
    // Broadcast to all other clients
    socket.broadcast.emit('draw', data);
  });

  socket.on('cursor', (data) => {
    socket.broadcast.emit('cursor', { ...data, id: socket.id });
  });

  socket.on('clear', () => {
    console.log('Received clear event from', socket.id);
    socket.broadcast.emit('clear');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connectedUsers.delete(socket.id);
    io.emit('userCount', connectedUsers.size);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 