const authenticate = require('./auth');
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const upload = require('./upload');
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use('/upload', express.static('upload'));
app.use(express.json());

// Dummy user auth from users.json
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json')));
  const match = users.find(u => u.username === username && u.password === password);

  if (match) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Image upload route
app.post('/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    return res.json({ path: `/upload/${req.file.filename}` });
  }
  res.status(400).send('Upload failed');
});

// Socket.IO chat logic
io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('join', (username) => {
    socket.username = username;
    socket.broadcast.emit('chat message', {
      user: 'Server',
      text: `${username} joined the chat`,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', {
      user: socket.username || 'Anonymous',
      text: msg.text || msg,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      socket.broadcast.emit('chat message', {
        user: 'Server',
        text: `${socket.username} left the chat`,
        time: new Date().toLocaleTimeString()
      });
    }
  });
});

http.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
