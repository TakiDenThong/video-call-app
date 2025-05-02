const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

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
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
