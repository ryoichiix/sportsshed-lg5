// routes/kits.js - CRUD + search + sorting for kits
const express = require('express');
const db = require('../db');
const router = express.Router();

const SORTABLE_FIELDS = ['id', 'name', 'sport']; // whitelist: only these can be sorted

// ---- validation helper (used by POST and PUT) ----
function validateKit(body) {
  const { name, sport } = body || {};
  if (typeof name !== 'string' || name.trim() === '') {
    return 'Name is required and must be text';
  }
  if (typeof sport !== 'string' || sport.trim() === '') {
    return 'Sport is required and must be text';
  }
  if (name.trim().length > 50) {
    return 'Name must be 50 characters or fewer';
  }
  return null; // no error
}

// ---- GET /kits  (search by ?sport=  and  twist: ?sort=name&order=asc|desc) ----
router.get('/', (req, res) => {
  const { sport, sort, order } = req.query;

  // TWIST: sorting rules
  let orderBy = '';
  if (sort !== undefined) {
    if (!SORTABLE_FIELDS.includes(sort)) {
      return res.status(400).json({ error: 'Cannot sort by that field' });
    }
    const direction = (order === undefined ? 'asc' : String(order).toLowerCase());
    if (direction !== 'asc' && direction !== 'desc') {
      return res.status(400).json({ error: 'Order must be asc or desc' });
    }
    // sort is safe here because it matched the whitelist
    orderBy = ` ORDER BY ${sort} COLLATE NOCASE ${direction.toUpperCase()}`;
  }

  // Search by sport (partial, ignores capital letters)
  let sql = 'SELECT * FROM kits';
  const params = [];
  if (sport) {
    sql += ' WHERE sport LIKE ?';
    params.push(`%${sport}%`);
  }
  sql += orderBy;

  res.status(200).json(db.prepare(sql).all(...params));
});

// ---- GET /kits/:id ----
router.get('/:id', (req, res) => {
  const kit = db.prepare('SELECT * FROM kits WHERE id = ?').get(req.params.id);
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  res.status(200).json(kit);
});

// ---- POST /kits ----
router.post('/', (req, res) => {
  const error = validateKit(req.body);
  if (error) return res.status(400).json({ error });

  const result = db
    .prepare('INSERT INTO kits (name, sport) VALUES (?, ?)')
    .run(req.body.name.trim(), req.body.sport.trim());
  const kit = db.prepare('SELECT * FROM kits WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(kit);
});

// ---- PUT /kits/:id ----
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM kits WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Kit not found' });

  const error = validateKit(req.body);
  if (error) return res.status(400).json({ error });

  db.prepare('UPDATE kits SET name = ?, sport = ? WHERE id = ?')
    .run(req.body.name.trim(), req.body.sport.trim(), req.params.id);
  res.status(200).json(db.prepare('SELECT * FROM kits WHERE id = ?').get(req.params.id));
});

// ---- DELETE /kits/:id ----
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM kits WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Kit not found' });

  const inUse = db.prepare('SELECT COUNT(*) AS n FROM loans WHERE kit_id = ?').get(req.params.id).n;
  if (inUse > 0) {
    return res.status(409).json({ error: 'Kit has loan records and cannot be deleted' });
  }

  db.prepare('DELETE FROM kits WHERE id = ?').run(req.params.id);
  res.status(200).json({ message: 'Kit deleted' });
});

module.exports = router;
