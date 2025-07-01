const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const upload = require('./upload');
const authenticate = require('./auth');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use('/upload', express.static('upload'));
app.use(express.json());

// 🔐 LOGIN route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (authenticate(username, password)) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// 🆕 SIGNUP route
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  const usersPath = path.join(__dirname, 'users.json');

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Missing credentials" });
  }

  let users = [];
  if (fs.existsSync(usersPath)) {
    users = JSON.parse(fs.readFileSync(usersPath));
  }

  const exists = users.find(u => u.username === username);
  if (exists) {
    return res.status(409).json({ success: false, message: "Username already taken" });
  }

  users.push({ username, password });
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  res.status(201).json({ success: true });
});

// 📸 Image upload route
app.post('/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    return res.json({ path: `/upload/${req.file.filename}` });
  }
  res.status(400).send('Upload failed');
});

// 🔌 Socket.io Chat
io.on('connection', (socket) => {
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

// 🚀 Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
