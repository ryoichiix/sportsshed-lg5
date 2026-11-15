// test.js - runs the 3 twist tests + the main features against a fresh temp database
// Run with:  npm test
process.env.DB_FILE = ':memory:';
const app = require('./app');
const server = app.listen(0, async () => {
  const base = `http://localhost:${server.address().port}`;
  let passed = 0, failed = 0;

  async function call(method, path, body) {
    const res = await fetch(base + path, {
      method, headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, data: await res.json() };
  }
  function check(label, r, expectedStatus, extra = () => true) {
    const ok = r.status === expectedStatus && extra(r.data);
    ok ? passed++ : failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  -> ${r.status}  ${JSON.stringify(r.data)}`);
  }
  const names = d => d.map(k => k.name);

  console.log('--- Setup: add kits (out of order on purpose) ---');
  for (const [name, sport] of [['Cricket Bat','Cricket'],['Football','Football'],['Badminton Racket','Badminton'],['Hockey Stick','Hockey']])
    check(`POST /kits ${name}`, await call('POST', '/kits', { name, sport }), 201);

  console.log('\n--- TWIST TESTS (Sorted lists) ---');
  check('Test 1: GET /kits?sort=name&order=asc (A to Z)', await call('GET', '/kits?sort=name&order=asc'), 200,
    d => JSON.stringify(names(d)) === JSON.stringify([...names(d)].sort()));
  check('Test 2: GET /kits?sort=name&order=desc (Z to A)', await call('GET', '/kits?sort=name&order=desc'), 200,
    d => JSON.stringify(names(d)) === JSON.stringify([...names(d)].sort().reverse()));
  check('Test 3: GET /kits?sort=colour (unknown field)', await call('GET', '/kits?sort=colour'), 400,
    d => d.error === 'Cannot sort by that field');

  console.log('\n--- Kits CRUD ---');
  check('GET /kits (all)', await call('GET', '/kits'), 200, d => d.length === 4);
  check('GET /kits/1 (one)', await call('GET', '/kits/1'), 200, d => d.name === 'Cricket Bat');
  check('GET /kits/99 (missing)', await call('GET', '/kits/99'), 404);
  check('PUT /kits/1 (update)', await call('PUT', '/kits/1', { name: 'Cricket Bat Pro', sport: 'Cricket' }), 200, d => d.name === 'Cricket Bat Pro');
  check('PUT /kits/99 (missing)', await call('PUT', '/kits/99', { name: 'X', sport: 'Y' }), 404);

  console.log('\n--- Validation ---');
  check('POST /kits without name', await call('POST', '/kits', { sport: 'Cricket' }), 400, d => d.error.includes('Name'));
  check('POST /kits with empty sport', await call('POST', '/kits', { name: 'Ball', sport: '  ' }), 400, d => d.error.includes('Sport'));
  check('PUT /kits/1 with number as name', await call('PUT', '/kits/1', { name: 123, sport: 'Cricket' }), 400);

  console.log('\n--- Search ---');
  check('GET /kits?sport=cricket', await call('GET', '/kits?sport=cricket'), 200, d => d.length === 1);
  check('GET /kits?sport=cricket&sort=name&order=desc (search + sort)', await call('GET', '/kits?sport=o&sort=name&order=desc'), 200);

  console.log('\n--- Join endpoint (loans with player name and kit name) ---');
  check('POST /players Asha', await call('POST', '/players', { name: 'Asha', team: 'Red House' }), 201);
  check('POST /loans (player 1, kit 2)', await call('POST', '/loans', { player_id: 1, kit_id: 2 }), 201);
  check('GET /loans (join)', await call('GET', '/loans'), 200, d => d[0].player_name === 'Asha' && d[0].kit_name === 'Football');
  check('POST /loans same kit again', await call('POST', '/loans', { player_id: 1, kit_id: 2 }), 409);
  check('DELETE /kits/2 (has loans)', await call('DELETE', '/kits/2'), 409);
  check('PUT /loans/1/return', await call('PUT', '/loans/1/return'), 200, d => d.returned_on !== null);

  console.log('\n--- Delete ---');
  check('DELETE /kits/3', await call('DELETE', '/kits/3'), 200);
  check('GET /kits/3 after delete', await call('GET', '/kits/3'), 404);

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  server.close();
  process.exit(failed ? 1 : 0);
});
