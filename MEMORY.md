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
