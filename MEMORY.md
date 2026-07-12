# MEMORY - einkaufsliste

## Iterationen

### v1 (2026-05-28)
- Auftrag: Einkaufslisten-Web-App mit Hinzufuegen, Abhaken waehrend des Einkaufs und Loeschen erledigter Elemente.
- Codex-Commits: `ba49548` (Build), `649d097` (Merge/Deploy)
- Deploy: 2026-05-29, Port 3106, PM2 `einkaufsliste`, GitHub https://github.com/Alf-Infra/einkaufsliste
- Besonderheiten: Browser-LocalStorage als Persistenz fuer v1; Tests/Review gruen.

### v1.1 (2026-05-29)
- Auftrag: Mehrere eigene Listen bilden koennen; jede Liste hat getrennte Artikel.
- Codex-Commits: `b9f65d0` (Build)
- Deploy: 2026-05-30, Port 3106, PM2 `einkaufsliste`, GitHub https://github.com/Alf-Infra/einkaufsliste
- Besonderheiten: Nutzer koennen benannte Listen anlegen, wechseln und loeschen; Artikel bleiben pro Liste getrennt. Persistenz weiterhin per LocalStorage; Tests/Review gruen.

### v2.0 (2026-07-12)
- Auftrag: Ausbau zum hochwertigen Local-first Shopping Planner mit reichhaltigen Artikeln, Einkaufsmodus, Suche/Sortierung/Umordnung, Undo, Datenmigration und umfassendem responsive UX-Redesign.
- Codex-Commits: `efe361f` (v2.0-Build), `5d5bbe1` (Review-Fixes)
- Deploy: 2026-07-12, Port 3106, PM2 `einkaufsliste`, GitHub https://github.com/Alf-Infra/einkaufsliste
- Besonderheiten: Versionierte LocalStorage-Migration, Einkaufsmodus, responsive Tastaturbedienung und barrierearme Dialog-Fokusfuehrung; final 18/18 Tests und Review-Gate gruen. Login, Cloud-Sync und externe Datenbank bleiben bewusst ausserhalb des Scopes.

### v2.0.1 (2026-07-12)
- Auftrag: Mobile Overflow-Probleme bei 320-430 px beheben, native Browserdialoge durch konsistente App-Dialoge ersetzen, UI-Komponenten weiter modularisieren und reale Browser-Layouttests ergaenzen.
- Codex-Commits: `7fb18df`
- Deploy: 2026-07-12, Port 3106, PM2 `einkaufsliste`, GitHub https://github.com/Alf-Infra/einkaufsliste
- Besonderheiten: Chromium-Layouttests bestaetigen 320/390/430 px ohne horizontalen Overflow; native Browserdialoge wurden durch zugaengliche App-Dialoge ersetzt und UI/Fokuslogik modularisiert. Final 21/21 Tests und Review-Gate gruen; Schema-v3-Daten bleiben erhalten.

### v2.0.2 (2026-07-12)
- Auftrag: Fokus-Rueckgabe der App-Dialoge im echten Chromium reparieren und mit einem Browser-Regressionstest absichern.
- Codex-Commits: ausstehend
- Deploy: ausstehend
- Besonderheiten: JSDOM meldete die Fokus-Rueckgabe in v2.0.1 faelschlich gruen; die reale Abnahme zeigte nach Escape `BODY` statt des Dialogausloesers als aktives Element.
