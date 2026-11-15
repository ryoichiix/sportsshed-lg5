// app.js - builds the Express app (kept separate from server.js so tests can reuse it)
const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'SportsShed API is running' }));
app.use('/app', express.static('public')); // the website (open http://localhost:3000/app)
app.use('/players', require('./routes/players'));
app.use('/kits', require('./routes/kits'));
app.use('/loans', require('./routes/loans'));

// Bad JSON body -> 400 instead of a crash
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  res.status(500).json({ error: 'Something went wrong' });
});

module.exports = app;
