# Einkaufsliste — SPEC

**Slug:** einkaufsliste
**Version:** v1
**Stack:** Express + node:sqlite (built-in) / React + Vite
**Erstellt:** 2026-04-21

## 1. Ziele
Web-App zum Erfassen und Verwalten einer Einkaufsliste.
Nutzer koennen Artikel mit Name und Menge anlegen, bestehende Artikel als erledigt markieren und Artikel loeschen.
Alle Daten werden persistent in SQLite gespeichert.

## 2. Endpoints

### GET /health
- Response: `{"status":"ok"}`
- HTTP 200

### GET /api/items
- Response ist Array aller gespeicherten Artikel, neueste zuerst
- JSON-Schema:
```json
[{"id":1,"name":"Milch","quantity":"2 Liter","completed":false,"created_at":"ISO-8601","updated_at":"ISO-8601"}]
```
- HTTP 200

### POST /api/items
- Request Body:
```json
{"name":"Milch","quantity":"2 Liter"}
```
- Validierung:
  - `name` muss vorhanden und nicht leer sein
  - `quantity` muss vorhanden und nicht leer sein
- Fehler-Response bei ungueltigen Eingaben:
```json
{"error":"name and quantity are required"}
```
- HTTP 400
- Erfolgs-Response:
```json
{"id":1,"name":"Milch","quantity":"2 Liter","completed":false,"created_at":"ISO-8601","updated_at":"ISO-8601"}
```
- HTTP 201

### PATCH /api/items/:id
- Request Body:
```json
{"completed":true}
```
- Validierung:
  - `completed` muss als Boolean uebergeben werden
- Fehler-Response bei ungueltigem Request oder unbekannter ID:
```json
{"error":"completed must be a boolean"}
```
oder
```json
{"error":"not found"}
```
- Erfolgs-Response:
```json
{"id":1,"name":"Milch","quantity":"2 Liter","completed":true,"created_at":"ISO-8601","updated_at":"ISO-8601"}
```
- HTTP 200

### DELETE /api/items/:id
- Loescht Artikel mit gegebener ID
- Artikel existiert: HTTP 200 `{"deleted":true}`
- Artikel nicht gefunden: HTTP 404 `{"error":"not found"}`

## 3. Datenmodell (SQLite DDL)
```sql
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```
Datenbankdatei: `data/items.db`

## 4. UI-Anforderungen
- Formular zum Erfassen eines Artikels
- Feld `name` als Pflichtfeld
- Feld `quantity` als Pflichtfeld
- Button `Artikel hinzufuegen`
- Liste aller vorhandenen Artikel mit Name, Menge und Erledigt-Status
- Neueste Artikel werden zuerst angezeigt
- Pro Artikel ein klar sichtbares Steuerelement zum Markieren als erledigt und Wiedererkennen des Status
- Pro Artikel ein `Loeschen`-Button
- Nach Hinzufuegen, Statuswechsel und Loeschen aktualisiert sich die Liste ohne kompletten Seiten-Reload
- Vite proxy: `/api` → `http://localhost:3107`

## 5. Akzeptanzkriterien
- [ ] Es gibt eine Web-App mit dem Slug `einkaufsliste`
- [ ] Backend basiert auf Express mit SQLite-Persistenz
- [ ] Frontend basiert auf React + Vite
- [ ] Nutzer koennen einen Artikel mit Name und Menge hinzufuegen
- [ ] Nutzer koennen Artikel als erledigt markieren und diesen Status wiedererkennen
- [ ] Nutzer koennen Artikel loeschen
- [ ] Die Einkaufsliste zeigt vorhandene Artikel samt Name, Menge und Erledigt-Status an
- [ ] GET /health antwortet mit {"status":"ok"} und HTTP 200
- [ ] GET /api/items liefert alle Artikel als JSON-Array, neueste zuerst
- [ ] POST /api/items erstellt Artikel mit gueltigem Namen und gueltiger Menge und antwortet HTTP 201
- [ ] POST /api/items mit ungueltigen Eingaben antwortet HTTP 400
- [ ] PATCH /api/items/:id aktualisiert den Erledigt-Status und antwortet HTTP 200
- [ ] PATCH /api/items/:id mit ungueltigem Request antwortet HTTP 400
- [ ] PATCH /api/items/:id mit unbekannter ID antwortet HTTP 404
- [ ] DELETE /api/items/:id loescht Artikel und antwortet HTTP 200 {"deleted":true}
- [ ] DELETE /api/items/:id mit unbekannter ID antwortet HTTP 404
- [ ] Die UI aktualisiert sich nach Hinzufuegen, Statuswechsel und Loeschen ohne kompletten Seiten-Reload

## 6. Nicht-Ziele
- Keine Benutzerkonten
- Kein Teilen von Listen
- Keine Sortierung oder Filter jenseits neueste zuerst
- Kein Inline-Editieren von Name oder Menge
