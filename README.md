# SportsShed – Kit Loan API
Backend Development Fundamentals · Group Assignment MS-AIML2D-G05 · LG Group 5

A small REST API for a sports shed: players borrow kits (bats, balls, rackets) and the coach can always see who had what.
Built with **Node.js, Express and SQLite** (`better-sqlite3`).

## Twist: Sorted lists
`GET /kits?sort=name&order=asc|desc` sorts the kits list. Allowed sort fields: `id`, `name`, `sport`.
An unknown field returns **400** with `Cannot sort by that field`. `order` defaults to `asc`.

## How to run
```bash
npm install
npm run seed     # optional: adds sample players and kits
npm start        # server on http://localhost:3000
npm test         # runs the automatic checks (uses a temporary in-memory database)
```

## Website (demo)
After `npm start`, open **http://localhost:3000/app**. The page lets you add, edit, delete, search and sort kits, add players, issue and return kits, and see the loans join (player name + kit name). Errors from the API (400, 404, 409) appear as pop-up messages.

## Database (3 related tables)
| Table | Columns |
|---|---|
| players | id, name, team |
| kits | id, name, sport |
| loans | id, player_id → players.id, kit_id → kits.id, issued_on, returned_on |

## Endpoints
| Method | URL | Description | Status codes |
|---|---|---|---|
| GET | /kits | All kits. Search `?sport=cricket`, sort `?sort=name&order=desc` | 200, 400 |
| GET | /kits/:id | One kit | 200, 404 |
| POST | /kits | Add a kit `{name, sport}` | 201, 400 |
| PUT | /kits/:id | Update a kit | 200, 400, 404 |
| DELETE | /kits/:id | Delete a kit (blocked if it has loans) | 200, 404, 409 |
| GET / POST | /players | List / add players | 200, 201, 400 |
| GET | /loans | **Join:** loans with `player_name` and `kit_name` (search `?player=`) | 200 |
| POST | /loans | Issue a kit `{player_id, kit_id}` | 201, 400, 404, 409 |
| PUT | /loans/:id/return | Mark a loan as returned | 200, 404, 409 |

## Validation
`name` and `sport` must be non-empty text (name max 50 characters). Errors return `{ "error": "..." }`.

## Postman
Import `SportsShed.postman_collection.json`, keep the `baseUrl` variable as `http://localhost:3000`, start the server, then run the collection (requests are in order and include the 3 twist tests).
