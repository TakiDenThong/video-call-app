// ================= SERVER SIDE (server.js) =================
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('call-user', (data) => {
    io.to(data.to).emit('incoming-call', {
      offer: data.offer,
      from: socket.id,
    });
  });

  socket.on('answer-call', (data) => {
    io.to(data.to).emit('call-answered', {
      answer: data.answer,
      from: socket.id,
    });
  });

  socket.on('ice-candidate', (data) => {
    io.to(data.to).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id,
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// Use dynamic port for production environments like Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
