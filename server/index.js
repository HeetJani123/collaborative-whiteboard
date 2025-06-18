const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: 'http://localhost:3003',
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3003',
    credentials: true
  },
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('setUsername', (username) => {
    connectedUsers.set(socket.id, username);
    console.log(`User ${username} connected with ID: ${socket.id}`);
    console.log('Current connected users:', Array.from(connectedUsers.entries()));
    
    io.emit('userList', Array.from(connectedUsers.entries()));
  });

  socket.on('draw', (data) => {
    console.log('Received draw event from', socket.id, 'with data:', data);
    io.emit('draw', {
      ...data,
      id: socket.id,
      timestamp: Date.now()
    });
    console.log('Broadcasted draw event to all clients');
  });

  socket.on('cursor', (data) => {
    const username = connectedUsers.get(socket.id);
    console.log('Received cursor event from', socket.id, 'username:', username);
    io.emit('cursor', { 
      ...data, 
      id: socket.id, 
      username,
      timestamp: Date.now()
    });
  });

  socket.on('clear', () => {
    console.log('Received clear event from', socket.id);
    io.emit('clear', {
      id: socket.id,
      timestamp: Date.now()
    });
    console.log('Broadcasted clear event to all clients');
  });

  socket.on('disconnect', () => {
    const username = connectedUsers.get(socket.id);
    console.log('Client disconnected:', socket.id, 'username:', username);
    connectedUsers.delete(socket.id);
    console.log('Current connected users:', Array.from(connectedUsers.entries()));
    
    io.emit('userList', Array.from(connectedUsers.entries()));
  });
});

const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 