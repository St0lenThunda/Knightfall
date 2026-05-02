const http = require('http');
const server = http.createServer((req, res) => {
  res.end('test');
});
server.listen(5188, '127.0.0.1', () => {
  console.log('Server running');
  process.exit(0);
});
