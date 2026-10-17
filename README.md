# Strategist OS

Werkplek voor creative strategists (Meta, TikTok, YouTube Shorts): klantonderzoek, angles, hooks, creative briefs, swipe file en testlog.

**Stack:** React + TypeScript + Tailwind CSS (Vite) · Supabase (Postgres, Auth, Storage, Edge Functions) · Claude API (server-side, vanaf fase 2)

## Status

| Fase | Inhoud | Status |
|---|---|---|
| 1 | Auth, projecten, basislayout en navigatie | ✅ |
| 2 | Brief Builder stap 1–4 met AI | – |
| 3 | Swipe File met AI-analyse | – |
| 4 | Testlog met CSV-import, grafieken en AI-analyse | – |
| 5 | Dashboard, instellingen, export en deellinks | – |

## Installatie

1. **Supabase-project aanmaken** op [supabase.com](https://supabase.com) (gratis tier is genoeg).
2. **Database opzetten:** open *SQL Editor* → *New query*, plak de inhoud van `supabase/migrations/0001_init.sql` en klik *Run*.
   Dit maakt alle tabellen, Row Level Security en de privé storage-bucket `media` aan.
3. **Auth instellen:** *Authentication → URL Configuration* → zet *Site URL* op `http://localhost:5173` (later je productie-URL).
   E-mailbevestiging staat standaard aan; zet die uit onder *Authentication → Sign In / Providers → Email* als je snel wilt testen.
4. **Omgevingsvariabelen:** kopieer `.env.example` naar `.env.local` en vul in vanuit *Project Settings → API*:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...   # de "anon public" key
   ```
5. **Starten:**
   ```bash
   npm install
   npm run dev      # http://localhost:5173
   ```

### Lokaal met Supabase CLI (optioneel, vereist Docker)

```bash
npx supabase start      # past de migratie automatisch toe
# zet de getoonde API URL en anon key in .env.local
```

## Sneltoetsen

- `N` – nieuw item (op de projectenpagina: nieuw project)
- `/` – zoeken

## Projectstructuur

```
src/
  auth/         AuthProvider, inlog-/registratiescherm
  components/   Layout (zijbalk), zoekpalet, UI-bouwstenen (Button, Pill, EmptyState…)
  lib/          Supabase-client, types, data-hooks, voorbeelddata, thema, sneltoetsen
  pages/        Dashboard, projecten (lijst/formulier/detail), instellingen
supabase/migrations/   SQL-schema met RLS
```
