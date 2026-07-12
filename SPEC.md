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

---

# SPEC - Einkaufsliste v1.1

**Slug:** einkaufsliste
**Iteration:** v1.1
**Type:** feature
**Port:** 3106
**Eingegangen:** 2026-05-29T19:48:16Z

## Beschreibung

Kevin: "Erweitere die Einkaufsliste um ein Feature, dass man aus mehrere Artikeln eigene Listen bilden kann."

Erweitere die bestehende Einkaufslisten-App so, dass Nutzer mehrere eigene Listen anlegen und verwalten koennen. Jede Liste enthaelt ihre eigenen Artikel. Die App bleibt ein kleines Alltagstool, keine Landingpage.

## Acceptance Criteria

- [ ] Nutzer koennen neue eigene Listen mit Namen anlegen.
- [ ] Leere Listennamen werden nicht angelegt.
- [ ] Nutzer koennen zwischen vorhandenen Listen wechseln.
- [ ] Artikel werden immer der aktuell ausgewaehlten Liste hinzugefuegt.
- [ ] Abhaken und Loeschen von Artikeln wirkt nur auf die aktuell ausgewaehlte Liste.
- [ ] Jede Liste behaelt ihre eigenen Artikel getrennt von anderen Listen.
- [ ] Listen und Artikel bleiben bei Seiten-Reload per LocalStorage erhalten.
- [ ] Mindestens eine Standardliste existiert, wenn noch keine Daten gespeichert sind.
- [ ] Eine Liste kann geloescht werden, ohne die Artikel anderer Listen zu veraendern.
- [ ] Wenn die aktive Liste geloescht wird, waehlt die App eine sinnvolle verbleibende Liste oder erstellt wieder eine Standardliste.
- [ ] `GET /health` liefert weiter JSON `{ "ok": true }`.
- [ ] Tests decken Listen anlegen, Listenwechsel, getrennte Artikel, Artikelfunktionen pro Liste, Listenloeschen und Health ab.

## Stack-Pflicht

- Bestehenden Stack beibehalten: Node.js, Express, Vite + React, Vitest/Testing Library.
- `process.env.PORT` bleibt die Port-Quelle; Fallback aus `PORT.txt` nur wenn `process.env.PORT` nicht gesetzt ist.
- `npm test` muss gruen sein.
- `npm run build` muss gruen sein.
- `npm start` muss den Express-Server starten und `dist/` ausliefern.

## Design- und UX-Hinweise

- Erste Ansicht bleibt direkt die Arbeitsoberflaeche.
- Listen-Auswahl soll schnell scannbar sein, z. B. als Seitenleiste, Tabs oder kompakte Liste.
- Die aktive Liste muss klar erkennbar sein.
- Aktionen fuer Listen und Artikel sollen nicht verwechselt werden.
- Mobile und Desktop muessen sauber funktionieren.

## Nicht-Ziele

- Kein Login.
- Keine Mehrbenutzer-Synchronisierung.
- Keine externe Datenbank.
- Keine Drag-and-drop-Sortierung.
- Kein Teilen von Listen.

## Definition of Done

- Tests gruen
- `npm run build` erfolgreich
- App startet auf Port aus `process.env.PORT`
- `/health` Endpoint OK
- Root-Route liefert HTML
- Git-Commit fuer v1.1 erzeugt

---

# SPEC - Einkaufsliste v2.0

**Slug:** einkaufsliste
**Iteration:** v2.0
**Type:** feature
**Port:** 3106
**Eingegangen:** 2026-07-12T07:38:29Z

## Beschreibung

Kevin moechte die bestehende Einkaufslisten-App zu einem anspruchsvolleren, alltagstauglichen Local-first Shopping Planner mit hochwertigem UX-Design weiterentwickeln. Die Iteration dient zugleich als aussagekraeftiger Test der Programmierfaehigkeiten von GPT-5.6-sol. Bestehende Nutzerdaten muessen migriert und erhalten bleiben.

Die App soll weiterhin ohne Login, Cloud und externe Datenbank funktionieren. Im Mittelpunkt stehen ein reichhaltigeres Artikeldatenmodell, ein fokussierter Einkaufsmodus, bessere Organisation, sichere Interaktionen und eine responsive Oberflaeche auf dem Niveau einer sorgfaeltig gestalteten nativen Produktivitaets-App.

## Acceptance Criteria

### Datenmodell und Artikelfunktionen

- [ ] Artikel besitzen Name, optionale Menge, optionale Einheit, Kategorie, optionale Notiz, Wichtig-Markierung, Erledigt-Status und eine stabile ID.
- [ ] Die schnelle Eingabe eines Artikelnamens bleibt direkt und mit Tastatur bedienbar; optionale Details koennen ohne Seitenwechsel erfasst werden.
- [ ] Bestehende Artikel koennen vollstaendig bearbeitet werden.
- [ ] Leere Artikelnamen werden nicht gespeichert.
- [ ] Beim Hinzufuegen eines bereits vorhandenen offenen Artikels derselben Liste wird ein Duplikat verhindert oder eine klare, zugängliche Entscheidung angeboten.
- [ ] Artikel koennen als wichtig markiert und visuell eindeutig erkannt werden.

### Einkaufsmodus

- [ ] Jede Liste kann zwischen Planungsansicht und fokussiertem Einkaufsmodus wechseln.
- [ ] Der Einkaufsmodus verwendet grosse Touch-Ziele und gruppiert Artikel sinnvoll nach Kategorie.
- [ ] Offene und erledigte Artikel sind klar getrennt; erledigte Artikel beziehungsweise Gruppen erscheinen nach den offenen Inhalten.
- [ ] Ein sichtbarer Fortschritt zeigt erledigte und gesamte Artikel an.
- [ ] Ein Filter kann im Einkaufsmodus nur offene Artikel anzeigen.
- [ ] "Einkauf abschliessen" entfernt nach einer Bestaetigung gesammelt die erledigten Artikel, ohne offene Artikel zu veraendern.

### Organisation

- [ ] Listen koennen angelegt, umbenannt, dupliziert, gewechselt und geloescht werden.
- [ ] Das Loeschen einer nicht-leeren Liste verlangt eine Bestaetigung.
- [ ] Artikel koennen per Textsuche gefiltert werden; mindestens Name und Notiz werden durchsucht.
- [ ] Sortierung nach eigener Reihenfolge, Kategorie, Name und Status wird unterstuetzt.
- [ ] In der eigenen Sortierung koennen Artikel per Drag-and-drop umgeordnet werden; eine gleichwertige Tastatur-Alternative muss vorhanden sein.
- [ ] Lokal gespeicherte, haeufig verwendete Artikel werden bei der Eingabe als Vorschlaege angeboten, ohne die Eingabe zu blockieren.
- [ ] Sinnvolle Empty States erklaeren den jeweils naechsten moeglichen Schritt.

### Fehlbedienung und Persistenz

- [ ] Das Loeschen einzelner Artikel bietet eine zeitlich begrenzte Undo-Aktion.
- [ ] Listen und Artikel bleiben nach Reload vollstaendig im LocalStorage erhalten.
- [ ] Das bisherige Format `einkaufsliste-state-v2` wird versioniert in das neue Schema migriert, ohne vorhandene Listen oder Artikel zu verlieren.
- [ ] Beschaedigte oder unvollstaendige LocalStorage-Daten werden defensiv normalisiert; die App bleibt benutzbar.
- [ ] Die lokale Artikelhistorie enthaelt keine unbeschraenkt wachsenden oder duplizierten Eintraege.

### UX, Responsive Design und Accessibility

- [ ] Desktop verwendet eine kompakte Listen-Sidebar und eine grosszuegige Arbeitsflaeche.
- [ ] Auf Mobilgeraeten ist die Listenverwaltung als Drawer oder vergleichbar platzsparende Navigation umgesetzt und verdeckt die Arbeitsflaeche nicht dauerhaft.
- [ ] Die Oberflaeche hat eine konsistente visuelle Hierarchie, hochwertige Typografie, klare Abstaende und ein zusammenhaengendes Farb- und Komponentensystem.
- [ ] Light und Dark Mode folgen mindestens der Systemeinstellung und bleiben in beiden Modi gut lesbar.
- [ ] Hinzufuegen, Abhaken, Sortieren und Undo erhalten dezente, zweckmaessige Rueckmeldung; `prefers-reduced-motion` wird respektiert.
- [ ] Alle Kernfunktionen sind per Tastatur bedienbar und besitzen sichtbare Fokuszustaende, verstaendliche Labels und sinnvolle Dialog-Fokusfuehrung.
- [ ] Touch-Ziele sind auf mobilen Ansichten ausreichend gross.
- [ ] Layout und Interaktionen funktionieren ab 320 px Breite sowie auf typischen Tablet- und Desktop-Breiten ohne horizontalen Seiten-Overflow.

### Architektur und Qualitaet

- [ ] Die bisher monolithische `App.jsx` wird in fachlich sinnvolle Komponenten, Hooks und reine Hilfsfunktionen aufgeteilt.
- [ ] Zentrale Zustandsaenderungen verwenden einen nachvollziehbaren Reducer mit testbaren Actions.
- [ ] Persistenz, Schema-Normalisierung und Migration sind von UI-Komponenten getrennt.
- [ ] Sortier-, Filter- und Gruppierungslogik liegt in wiederverwendbaren reinen Funktionen.
- [ ] Tests decken mindestens Migration, defensive Normalisierung, Artikelbearbeitung, Duplikatbehandlung, Listenaktionen, Suche, Sortierung, Umordnung, Undo, Einkaufsmodus, Abschlussaktion, Persistenz und `/health` ab.
- [ ] `GET /health` liefert weiterhin exakt `{ "ok": true }`.

## Stack-Pflicht

- Bestehenden Stack beibehalten: Node.js, Express, Vite, React und Vitest/Testing Library.
- `process.env.PORT` bleibt primaere Port-Quelle; Fallback ist `PORT.txt`.
- `npm test`, `npm run build` und `npm start` muessen funktionieren.
- Express liefert nach dem Build `dist/` und den Healthcheck aus.
- Kleine, gut begruendete Dependencies fuer robuste Interaktionen wie Drag-and-drop sind erlaubt; keine UI-Komplettbibliothek, die den wesentlichen Design- oder Architekturteil ersetzt.

## Designrichtung

- Ruhige, moderne Produktivitaets-App statt generischem Dashboard oder Marketing-Landingpage.
- Direkt nutzbare Arbeitsoberflaeche, geringe visuelle Reibung und progressive Offenlegung komplexerer Artikeldetails.
- Icons aus `lucide-react` duerfen weiterverwendet werden.
- Destruktive Aktionen klar von primaeren Aktionen trennen.
- Keine dekorativen Effekte, die Lesbarkeit oder Bediengeschwindigkeit beeintraechtigen.

## Nicht-Ziele

- Kein Login und keine Benutzerkonten.
- Keine Cloud- oder Mehrbenutzer-Synchronisierung.
- Keine externe Datenbank.
- Kein Teilen von Listen.
- Keine Push-Benachrichtigungen.
- Kein Preisvergleich und keine Haendlerintegration.
- Kein eigener Service Worker/PWA-Zwang fuer diese Iteration.

## Definition of Done

- Alle Acceptance Criteria nachvollziehbar umgesetzt.
- Tests gruen und substanziell erweitert.
- Produktions-Build erfolgreich.
- App startet auf einem abweichenden Test-Port aus `process.env.PORT`.
- `/health` und Root-Route funktionieren.
- Bestehende v1.1-LocalStorage-Daten werden migriert.
- Responsive und barrierearme Kernablaeufe sind implementiert.
- Git-Commit fuer v2.0 erzeugt.
