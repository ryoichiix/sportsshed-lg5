// routes/players.js - basic players routes (needed so loans have someone to belong to)
const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json(db.prepare('SELECT * FROM players').all());
});

router.get('/:id', (req, res) => {
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.status(200).json(player);
});

router.post('/', (req, res) => {
  const { name, team } = req.body || {};
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required and must be text' });
  }
  if (typeof team !== 'string' || team.trim() === '') {
    return res.status(400).json({ error: 'Team is required and must be text' });
  }
  const result = db.prepare('INSERT INTO players (name, team) VALUES (?, ?)').run(name.trim(), team.trim());
  res.status(201).json(db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid));
});

module.exports = router;
