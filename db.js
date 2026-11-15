// db.js - opens the SQLite database and creates the 3 related tables
const Database = require('better-sqlite3');

const db = new Database(process.env.DB_FILE || 'sportsshed.db');
db.pragma('foreign_keys = ON'); // make SQLite enforce the relationships

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL,
    team  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS kits (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name   TEXT NOT NULL,
    sport  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS loans (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id    INTEGER NOT NULL,
    kit_id       INTEGER NOT NULL,
    issued_on    TEXT NOT NULL DEFAULT (date('now')),
    returned_on  TEXT,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (kit_id)    REFERENCES kits(id)
  );
`);

module.exports = db;
