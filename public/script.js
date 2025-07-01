const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const loginDiv = document.getElementById('login');
const chatDiv = document.getElementById('chat');
const userLabel = document.getElementById('userLabel');

let username = '';

function joinChat() {
  username = document.getElementById('username').value;
  if (!username) return alert("Enter a name first");
  loginDiv.style.display = 'none';
  chatDiv.style.display = 'block';
  userLabel.innerText = username;
  socket.emit('join', username);
}

form.addEventListener('submit', function(e) {
  e.preventDefault();
  const text = input.value;
  const file = document.getElementById('imageInput').files[0];

  if (file) {
    const formData = new FormData();
    formData.append('image', file);

    fetch('/upload', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      socket.emit('chat message', {
        user: username,
        text: `<img src="${data.path}" style="max-width: 200px;" />`,
        time: new Date().toLocaleTimeString()
      });
    });
  } else if (text) {
    socket.emit('chat message', {
      user: username,
      text,
      time: new Date().toLocaleTimeString()
    });
  }

  input.value = '';
  document.getElementById('imageInput').value = '';
});

socket.on('chat message', function(data) {
  const item = document.createElement('li');
  item.innerHTML = `<span class="msg-user">${data.user}</span>: ${data.text} <span class="msg-time">${data.time}</span>`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});