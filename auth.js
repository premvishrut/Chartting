const fs = require('fs');
const path = require('path');

function authenticate(username, password) {
  const usersPath = path.join(__dirname, 'users.json');
  if (!fs.existsSync(usersPath)) return false;

  const users = JSON.parse(fs.readFileSync(usersPath));
  const found = users.find(u => u.username === username && u.password === password);
  return !!found;
}

module.exports = authenticate;
