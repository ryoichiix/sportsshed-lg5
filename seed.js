// seed.js - optional sample data:  node seed.js
const db = require('./db');
if (db.prepare('SELECT COUNT(*) n FROM kits').get().n === 0) {
  const addKit = db.prepare('INSERT INTO kits (name, sport) VALUES (?, ?)');
  [['Cricket Bat', 'Cricket'], ['Football', 'Football'], ['Badminton Racket', 'Badminton'],
   ['Tennis Ball', 'Tennis'], ['Cricket Ball', 'Cricket']].forEach(k => addKit.run(...k));
  const addPlayer = db.prepare('INSERT INTO players (name, team) VALUES (?, ?)');
  [['Asha', 'Red House'], ['Ravi', 'Blue House']].forEach(p => addPlayer.run(...p));
  console.log('Sample data added');
} else console.log('Data already present');
