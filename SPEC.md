# SPEC - Einkaufsliste

**Slug:** einkaufsliste
**Iteration:** v1
**Type:** new-app
**Port:** 3106
**Eingegangen:** 2026-05-28T20:37:57Z

## Beschreibung

Kevin: "Bau mir eine Einkaufslisten App, man soll neue Elemente hinzufuegen koennen, abhaken waehrend des Einkaufsvorgangs und loeschen nachdem es besorgt wurde."

Baue eine kleine, nutzbare Web-App fuer eine Einkaufsliste. Die erste Ansicht soll direkt die Arbeitsoberflaeche sein, keine Landingpage.

## Acceptance Criteria

- [ ] Nutzer koennen neue Einkaufselemente ueber ein Eingabefeld hinzufuegen.
- [ ] Leere Eintraege werden nicht hinzugefuegt.
- [ ] Nutzer koennen Eintraege waehrend des Einkaufs als besorgt/erledigt abhaken.
- [ ] Erledigte Eintraege bleiben sichtbar unterscheidbar.
- [ ] Nutzer koennen Eintraege loeschen, nachdem sie besorgt wurden.
- [ ] Die Liste bleibt bei Seiten-Reload erhalten, mindestens per Browser-LocalStorage.
- [ ] Die App hat einen `GET /health` Endpoint mit JSON `{ "ok": true }`.
- [ ] Tests decken Hinzufuegen, Abhaken, Loeschen und Health ab.

## Stack-Pflicht

- Node.js (auf dem Mac mini ist Node v22 LTS verfuegbar)
- Vite + React fuer die UI
- Express fuer den Server und `/health`
- Die App muss `process.env.PORT` als Port-Quelle nutzen. Fallback aus `PORT.txt` nur, wenn `process.env.PORT` nicht gesetzt ist.
- npm test ueber `node --test` ODER vitest

Beispiel-Snippet fuer `process.env.PORT`:

```javascript
const port = parseInt(process.env.PORT || require('fs').readFileSync('PORT.txt', 'utf8').trim(), 10);
app.listen(port, () => console.log(`listening on ${port}`));
```

## Design- und UX-Hinweise

- Die App soll wie ein kleines, dichtes Alltagstool wirken: klare Eingabe oben, Liste darunter, schnelle Aktionen.
- Keine Marketing-Hero-Seite.
- Buttons sollen eindeutig sein; nutze wenn passend Icons aus `lucide-react`.
- Mobile und Desktop muessen sauber funktionieren.

## Nicht-Ziele

- Kein Login.
- Keine Mehrbenutzer-Synchronisierung.
- Keine externe Datenbank.
- Keine Benachrichtigungen.

## Definition of Done

- Tests gruen
- npm run build erfolgreich
- App startet auf Port aus `process.env.PORT`
- `/health` Endpoint OK
- Root-Route liefert HTML

## Retry-Kontext 2026-05-29

Der erste Build-Versuch lief ueber einen alten OpenClaw-Subagent-Pfad und endete ohne App-Artefakte oder Commit. Das war ein Runner-/Timeout-Problem, kein fachlicher Scope-Fehler. Diese Iteration soll die v1-App vollstaendig neu implementieren.

## Retry-Kontext 2026-05-29 Versuch 4

Ein spaeterer nativer Run hat eine unvollstaendige Vite-only-Struktur erzeugt und hing an einem foreground `npm run start`. Bitte korrigiere die vorhandenen Dateien statt blind neu zu initialisieren:
- `scripts.start` muss Express starten, nicht Vite.
- `scripts.dev` darf Vite starten.
- Express muss `/health` liefern und nach `npm run build` die Vite-`dist/` fuer `/` ausliefern.
- Tests duerfen keine Platzhalter sein und muessen ohne dauerhaft laufenden externen Server durchlaufen.
- Starte Server fuer Smoke-Checks nur im Hintergrund und beende ihn danach.
