// server.js - starts the server
const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SportsShed server running on http://localhost:${PORT}`);
});
