# Strategist OS

Werkplek voor creative strategists (Meta, TikTok, YouTube Shorts): klantonderzoek, angles, hooks, creative briefs, swipe file en testlog.

**Stack:** React + TypeScript + Tailwind CSS (Vite). Ingebouwde opslag in de browser (IndexedDB), dus geen account, database of server nodig.

## Status

| Fase | Inhoud | Status |
|---|---|---|
| 1 | Projecten, basislayout, navigatie, ingebouwde opslag + back-up | ✅ |
| 2 | Brief Builder stap 1–4 met AI | – |
| 3 | Swipe File met AI-analyse | – |
| 4 | Testlog met CSV-import, grafieken en AI-analyse | – |
| 5 | Dashboard, instellingen, export en deellinks | – |

## Starten

```bash
npm install
npm run dev      # http://localhost:5173
```

## Online versie (claude.ai)

```bash
npm run build:artifact   # → artifact/strategist-os.html (één zelfstandig bestand)
```

Dit bestand wordt gepubliceerd als privé claude.ai-pagina. Daar is de routering intern (MemoryRouter)
en vervangt "Back-up kopiëren" het downloaden, omdat downloads daar geblokkeerd zijn.

## Opslag

Alle data (projecten, onderzoek, briefs, media, …) staat lokaal in je browser, per apparaat.
Via **Instellingen → Opslag en back-up** maak je een back-up (downloaden of kopiëren) en zet je die terug,
bijvoorbeeld om naar een ander apparaat over te stappen. Browserdata wissen = data kwijt, dus maak regelmatig een back-up.

## Sneltoetsen

- `N` – nieuw item (op de projectenpagina: nieuw project)
- `/` – zoeken

## Projectstructuur

```
src/
  components/   Layout (zijbalk), zoekpalet, UI-bouwstenen (Button, Pill, EmptyState…)
  lib/          db.ts (IndexedDB-opslag), types, data-hooks, voorbeelddata, thema, sneltoetsen
  pages/        Dashboard, projecten (lijst/formulier/detail), instellingen
```
