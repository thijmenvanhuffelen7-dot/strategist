# Voortgang

Laatst bijgewerkt: 18 oktober 2026

## Fases

| Fase | Inhoud | Status |
|---|---|---|
| 1 | Projecten, basislayout en navigatie (Next.js + SQLite) | ✅ Af |
| 2 | Brief Builder stap 1–4 met AI (Groq) | ✅ Af – echte Groq-aanroepen nog door gebruiker te testen |
| 2b | Online: Postgres-database, login met wachtwoord, Vercel | ✅ Af – koppeling met Vercel/Neon nog door gebruiker te testen |
| 3 | Swipe File met AI-analyse | Nog te doen |
| 4 | Testlog met CSV-import, grafieken en AI-analyse | Nog te doen |
| 5 | Dashboard, instellingen, export en deellinks | Nog te doen |
| 6+ | Uitbreiding: modules 7–10 (docs/spec-uitbreiding.md) | Nog te doen, spec ontbreekt |

## Fase 1: wat er af is
- Next.js 16 (App Router) + TypeScript + Tailwind; database SQLite via Prisma 7 (`prisma/strategist.db`), automatisch aangemaakt bij `npm run dev`.
- Volledig datamodel voor modules 1–6 in `prisma/schema.prisma`.
- Layout met zijbalk, mobiel menu, licht/donker thema, sneltoetsen `N` en `/`.
- Projecten: lijst, aanmaken/bewerken (alle velden + upload .txt/.csv), verwijderen, projectpagina met tabbladen.
- Voorbeeldproject Slaapwel (20 reviews).

## Fase 2: wat er af is
- **AI-laag** (`/lib/ai`): provider-interface met Groq (OpenAI-compatibele API) als enige implementatie in `lib/ai/groq.ts`.
  - JSON-modus + Zod-validatie (`lib/ai/schemas.ts`); bij ongeldige JSON één automatische herkansing met de foutmelding erbij.
  - Streaming van de tekst; weigert Groq streaming in JSON-modus, dan automatisch zonder streaming.
  - Tokenschatting vóór elk verzoek + limietplanner (tokens per minuut); bij 429 wachten op retry-after met aftellen in de interface.
  - Grote klantdata wordt in stukken geanalyseerd en daarna samengevoegd.
  - Per AI-actie: tokenverbruik + totaal vandaag. Alle AI-uitvoer bewaard in `ai_outputs` (versies terug te zetten).
  - Model kiezen in Instellingen (veld `profiel.ai_model`).
- **Prompts** in `/lib/prompts` (één bestand per functie). Database-versie gaat voor zodra die bestaat; bewerken via Instellingen komt in fase 5.
- **Brief Builder** (`/briefs`): projectkeuze met voortgang, wizard per project (`/briefs/project/[id]`):
  - Stap 1 onderzoek: kaarten per categorie, quotes klikken = kopiëren, sterren, toevoegen/bewerken/verwijderen, automatisch opslaan, goedkeuren. Ook handmatig in te vullen zonder AI.
  - Stap 2 angles: genereren (vervangt alleen niet-geselecteerde AI-angles), sorteren op score, max 5 selecteren, eigen angles, bewerken.
  - Stap 3 hooks: 5 per angle, "Meer hooks", woordenteller (max 12), ster = hook-bibliotheek, zelf hooks toevoegen.
  - Stap 4 brief: angle + hook kiezen → AI-brief of lege brief.
  - Kritische review (creative director) bij elke stap en bij de brief.
- **Brief-editor** (`/briefs/[id]`): alle 7 onderdelen bewerkbaar, scripttabel (rijen toevoegen/verplaatsen/verwijderen), status, dupliceren als variant, opnieuw genereren, versies terugzetten.
- Projecttabbladen Onderzoek, Angles, Hooks (bibliotheek), Briefs tonen de echte data. Dashboard toont briefs per status.

## Fase 2b: online zetten
- Database van SQLite naar **Postgres** (Neon via Vercel → Storage), met `@prisma/adapter-pg`. Lokaal gebruik je dezelfde online database.
- Migraties worden automatisch toegepast bij `npm run dev`, `npm run build` (dus ook op Vercel) en `npm start`; zonder database wordt dit netjes overgeslagen.
- **Login** met één wachtwoord (`APP_WACHTWOORD`): `proxy.ts` stuurt door naar `/login`, en elke datafunctie, server action en de AI-route controleren zelf de sessie. Sessiekoekje 30 dagen geldig, ondertekend; wachtwoord wijzigen = iedereen uitgelogd. Uitlogknop in de zijbalk.
- Zonder `APP_WACHTWOORD` staat de app alleen lokaal (development) open; online blijft hij dan dicht.
- Datums in vaste tijdzone (Europe/Amsterdam), omdat Vercel in UTC draait.
- AI-route mag op Vercel maximaal 5 minuten duren.

## Getest
- Fase 2b: alle tests opnieuw op een Postgres-database; login in productiemodus (doorsturen, fout wachtwoord, ondertekend koekje, vals koekje geweigerd, API zonder login = 401, uitloggen); build met én zonder database.
- Alle niet-AI-stappen in de browser (handmatig onderzoek, angles, hooks, lege brief, bewerken, dupliceren, tabbladen, modelkeuze).
- De volledige AI-keten tegen een **nagebootste** Groq-server: streaming, 429 met wachttijd, ongeldig antwoord → herkansing, ```json-blokken, weigering van streaming → terugval, opsplitsen van ~10.000 tokens klantdata in 3 delen + samenvoegen, versies, reviews.
- **Niet getest:** echte Groq-aanroepen en de kwaliteit van de antwoorden (geen key in de bouwomgeving; Groq-documentatie was daar ook niet bereikbaar), en de echte koppeling met Vercel/Neon (geen toegang tot het Vercel-account).

## Nog te doen (buiten de fases om)
- `docs/spec-uitbreiding.md` (modules 7–10) ontbreekt nog in de repository.
- Fase 4: veld `parent_test_id` toevoegen aan tests (iteratieboom module 10); "Maak testlog-item aan" vanuit de brief.
- Fase 3: uploads via Vercel Blob (`@vercel/blob`); de Blob-opslag kan nu al in Vercel worden aangemaakt.
- Fase 5: PDF/Markdown-export en deellink van briefs (deellink moet buiten de login om bereikbaar zijn); prompts bewerken via Instellingen.

## Bekende problemen / aandachtspunten
- Modellijst in Instellingen is niet gecontroleerd tegen de actuele Groq-documentatie; een ander model-ID kan altijd handmatig.
- Het gratis limiet (±8.000 tokens/minuut) betekent dat snel achter elkaar genereren soms 20–60 seconden wachten geeft; de app toont dan een aftelling.
- De limietplanner houdt alleen verzoeken bij binnen één serverproces. Op Vercel kunnen meerdere processen tegelijk draaien; dan vangt de 429-afhandeling (wachten en opnieuw proberen) het op.
- Versies terugzetten bestaat voor onderzoek, angles en briefs; hooks worden altijd toegevoegd (niet vervangen), dus daar is geen terugzetten nodig.
- Back-up: Neon maakt zelf automatische back-ups (beperkt op het gratis plan). JSON/CSV-export komt in fase 5.
- Data uit de eerdere lokale SQLite-versie is niet overgezet.
