const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const upload = require('./upload');
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use('/upload', express.static('upload'));

app.post('/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    return res.json({ path: `/upload/${req.file.filename}` });
  }
  res.status(400).send('Upload failed');
});

io.on('connection', (socket) => {
  console.log('A user connected');

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
  console.log(`Server running on port ${PORT}`);
});