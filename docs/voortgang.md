# Voortgang

Laatst bijgewerkt: 18 oktober 2026

## Fases

| Fase | Inhoud | Status |
|---|---|---|
| 1 | Projecten, basislayout en navigatie (Next.js + SQLite) | ✅ Af |
| 2 | Brief Builder stap 1–4 met AI | Nog te doen |
| 3 | Swipe File met AI-analyse | Nog te doen |
| 4 | Testlog met CSV-import, grafieken en AI-analyse | Nog te doen |
| 5 | Dashboard, instellingen, export en deellinks | Nog te doen |
| 6+ | Uitbreiding: modules 7–10 (docs/spec-uitbreiding.md) | Nog te doen, spec ontbreekt |

## Fase 1: wat er af is
- Next.js 16 (App Router) + TypeScript + Tailwind; database SQLite via Prisma 7 (`prisma/strategist.db`).
- Volledig datamodel voor alle fases staat al in `prisma/schema.prisma` (profiel, projects, research, angles, hooks, briefs, swipe_items, brief_swipe_links, tests, prompt_templates, ai_outputs).
- Database wordt automatisch aangemaakt/bijgewerkt bij `npm run dev`.
- Layout: zijbalk met 6 modules, mobiel menu, licht/donker/systeem-thema.
- Sneltoetsen: `N` = nieuw project, `/` = zoeken (in projecten en klantdata).
- Projecten: lijst met filter, aanmaken/bewerken met alle velden uit de spec (platforms, doel, taal, concurrenten, klantdata + upload .txt/.csv, drempelwaarden per project), verwijderen met bevestiging (verwijdert ook alles wat aan het project hangt).
- Projectpagina met tabbladen Overzicht | Onderzoek | Angles | Hooks | Briefs | Tests (alleen Overzicht is gevuld).
- Voorbeeldproject "Slaapwel" (gewogen deken, €129, 20 verzonnen reviews), gemarkeerd als voorbeeld.
- Dashboard (eerste versie) en Instellingen (profiel, standaardtaal/-platform, thema).

## Nog te doen (buiten de fases om)
- `docs/spec-uitbreiding.md` (modules 7–10) ontbreekt nog in de repository.
- `/lib/prompts` en `/lib/ai` (Groq via OpenAI-compatibele API) worden aangemaakt in fase 2.
- Fase 4: veld `parent_test_id` toevoegen aan tests (voor de iteratieboom van module 10).
- Datamodel voor modules 7–10 toevoegen zodra `docs/spec-uitbreiding.md` er is.

## Bekende problemen / aandachtspunten
- Back-up = het bestand `prisma/strategist.db` en de map `uploads/` kopiëren. JSON/CSV-export komt in fase 5.
- De eerdere online versie (claude.ai-link, data in de browser) wordt niet meer bijgewerkt. Data daaruit is niet automatisch overgezet.
