# Einkaufsliste — Memory

## Architektur-Entscheidungen
- Backend: Express + node:sqlite (Node-Built-in)
- Frontend: React + Vite
- DB-Datei: data/items.db (relativ zum App-Verzeichnis)
- Port: 3107

## Modul-Map
| Modul | Datei | Zweck |
|---|---|---|
| server | src/backend/server.js | Express-Server, API-Endpunkte und SQLite-Zugriff |
| frontend | src/frontend/ | React-App fuer Formular und Einkaufsliste |
| tests | tests/basic.test.js | Akzeptanztests fuer API und UI |

## Tech-Stack
- Node v24
- Express
- node:sqlite
- React + Vite

## Offene Punkte
- Kein

## Iterationen
### v1 — 2026-04-21 (initial)
- Neue App, full pipeline S1-S10
