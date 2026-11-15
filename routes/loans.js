// routes/loans.js - the JOIN endpoint + issuing / returning kits
const express = require('express');
const db = require('../db');
const router = express.Router();

// JOIN: every loan together with the player name and the kit name
const LOANS_JOIN = `
  SELECT loans.id,
         players.name AS player_name,
         kits.name    AS kit_name,
         loans.issued_on,
         loans.returned_on
  FROM loans
  JOIN players ON players.id = loans.player_id
  JOIN kits    ON kits.id    = loans.kit_id
`;

// GET /loans  (optional search: ?player=Asha)
router.get('/', (req, res) => {
  let sql = LOANS_JOIN;
  const params = [];
  if (req.query.player) {
    sql += ' WHERE players.name LIKE ?';
    params.push(`%${req.query.player}%`);
  }
  sql += ' ORDER BY loans.id';
  res.status(200).json(db.prepare(sql).all(...params));
});

// GET /loans/:id
router.get('/:id', (req, res) => {
  const loan = db.prepare(LOANS_JOIN + ' WHERE loans.id = ?').get(req.params.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  res.status(200).json(loan);
});

// POST /loans  { player_id, kit_id }
router.post('/', (req, res) => {
  const { player_id, kit_id } = req.body || {};
  if (!Number.isInteger(player_id) || !Number.isInteger(kit_id)) {
    return res.status(400).json({ error: 'player_id and kit_id are required and must be numbers' });
  }
  if (!db.prepare('SELECT id FROM players WHERE id = ?').get(player_id)) {
    return res.status(404).json({ error: 'Player not found' });
  }
  if (!db.prepare('SELECT id FROM kits WHERE id = ?').get(kit_id)) {
    return res.status(404).json({ error: 'Kit not found' });
  }
  const taken = db.prepare('SELECT id FROM loans WHERE kit_id = ? AND returned_on IS NULL').get(kit_id);
  if (taken) return res.status(409).json({ error: 'Kit is already issued' });

  const result = db.prepare('INSERT INTO loans (player_id, kit_id) VALUES (?, ?)').run(player_id, kit_id);
  res.status(201).json(db.prepare(LOANS_JOIN + ' WHERE loans.id = ?').get(result.lastInsertRowid));
});

// PUT /loans/:id/return  - mark a kit as returned
router.put('/:id/return', (req, res) => {
  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  if (loan.returned_on) return res.status(409).json({ error: 'Kit already returned' });

  db.prepare("UPDATE loans SET returned_on = date('now') WHERE id = ?").run(req.params.id);
  res.status(200).json(db.prepare(LOANS_JOIN + ' WHERE loans.id = ?').get(req.params.id));
});

module.exports = router;
