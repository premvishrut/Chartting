const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files (HTML, CSS, JS) from /public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dummy login using users.json
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        res.redirect('/');
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Default route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket chat
io.on('connection', socket => {
    console.log('A user connected');
    socket.on('chat message', msg => {
        io.emit('chat message', msg);
    });
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
