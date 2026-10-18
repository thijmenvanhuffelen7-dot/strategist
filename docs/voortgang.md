# Voortgang

Laatst bijgewerkt: 18 oktober 2026

## Fases

| Fase | Inhoud | Status |
|---|---|---|
| 1 | Projecten, basislayout en navigatie (Next.js + SQLite) | ✅ Af |
| 2 | Brief Builder stap 1–4 met AI (Groq) | ✅ Af – echte Groq-aanroepen nog door gebruiker te testen |
| 2b | Online: Postgres-database, login met wachtwoord, Vercel | ✅ Af – koppeling met Vercel/Neon nog door gebruiker te testen |
| 2c | Extra module: CRO-check (docs/spec-cro.md) | ✅ Af – echte Groq-aanroepen nog door gebruiker te testen |
| 3 | Swipe File met AI-analyse | ✅ Af – echte Groq-aanroepen en Vercel Blob nog door gebruiker te testen |
| 3b | CRO-check: screenshots (ontwerp beoordelen) | ✅ Af – beeldmodel nog door gebruiker te testen |
| 4 | Testlog met CSV-import, grafieken en AI-analyse | Nog te doen (volgende) |
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

## Fase 2c: CRO-check
- Nieuwe module in de zijbalk (`/cro`), tabel `cro_checks`, prompt `lib/prompts/cro.ts`, AI-actie `lib/ai/cro.ts`.
- Pagina ophalen via webadres (`lib/cro/ophalen.ts`, met `node-html-parser`) of tekst plakken; optioneel project koppelen (klantonderzoek wordt meegenomen).
- Score, samenvatting, quick wins, verbeterpunten (categorie, bewijs, aanbeveling, voorbeeldtekst, impact/moeite), A/B-testideeën.
- Punten afvinken, bewerken, filteren, verwijderen; opnieuw beoordelen; versies; kritische review.
- Veilig ophalen: alleen http(s), interne adressen geweigerd (ook via doorverwijzing), tijdslimiet en maximale grootte.

## Fase 3: Swipe File
- `/swipe`: grid- en tabelweergave, zoeken in alle tekst (ook transcript, notities en analyse), filters op platform, alle tags en beoordeling, sorteren op datum of beoordeling, sneltoets `N`.
- Ad toevoegen/bewerken met alle velden uit de spec; tags uit vaste lijsten of eigen invoer; beoordeling 1–5; automatisch opslaan.
- Uploads van screenshots en video's: online rechtstreeks vanuit de browser naar **Vercel Blob (privé)**, getoond via tijdelijke ondertekende links (met terugval via de eigen server); lokaal zonder Blob in `/uploads`. Alleen voor ingelogde gebruikers. Video's kunnen doorspoelen.
- "Analyseer deze ad": hook (gesproken + visueel + type), angle, structuur per tijdsblok, emotie/pijnpunt, bewustzijnsniveau, 3 redenen, 3 toepassingsideeën voor een gekozen project (met klantonderzoek), tag-suggesties met één klik overnemen. Optioneel screenshot meesturen (visiemodel); lukt dat niet, dan automatisch zonder screenshot. Versies en kritische review.
- Koppelen aan briefs, in beide richtingen (bij de ad én blok "Referentie-ads" in de brief-editor).
- Zoekvenster (`/`) vindt ook swipe-items. Dashboard toont het aantal swipe-items.

## Fase 3b: screenshots in de CRO-check
- Tot 3 screenshots per CRO-check (desktop/mobiel/overig): slepen, kiezen of plakken met Ctrl/Cmd+V; privé opgeslagen.
- Twee stappen: beeldmodel beschrijft per screenshot wat het ziet (`lib/prompts/cro-visueel.ts`), daarna schrijft het gewone model het advies met tekst + observaties.
- Elk verbeterpunt heeft een bron ("tekst" of "screenshot mobiel" …); klik op de bron om het screenshot te zien. Sectie "Wat de AI op de screenshots zag".
- Mislukt het beeldmodel: advies op basis van tekst, met een blijvende melding bij het advies.
- Verbeterd voor alle AI-functies: ontbrekende tekstvelden in AI-antwoorden worden leeg in plaats van de tekst "undefined"; lege lijstitems worden weggefilterd.
- Uploads: een bestand dat werd gekozen vóórdat de pagina klaar was met laden, wordt nu alsnog overgenomen.

## Getest
- Fase 3b: screenshots via bestand, plakken (Ctrl+V) en slepen; maximaal 3; automatische labels; beoordelen met 3 screenshots (beeldmodel) + advies; bron-knop toont screenshot; label wijzigen; verwijderen ruimt bestanden op; plakken in een tekstvak voegt niets toe; terugval als het beeldmodel weigert; schema-test voor ontbrekende velden; alle AI-tests van fase 2, CRO en Swipe File opnieuw.
- Fase 3: volledige stroom met nagebootste Groq en lokale opslag: nieuwe ad met screenshot (verkeerd bestandstype geweigerd), analyse met project + screenshot naar visiemodel, tag-suggesties overnemen, review, koppelen aan brief (beide kanten), video-upload met doorspoelen (Range), filters/zoeken/sorteren/tabel, globaal zoeken, verwijderen ruimt bestand op; terugval als het visiemodel de screenshot weigert; productiemodus: media en uploads zonder login geweigerd (401), met login zichtbaar.
- Fase 2c: ophalen + omzetten naar tekst op een testpagina; weigeren van interne adressen (localhost, 127.0.0.1, 10.x, 169.254.x, ::1, file://, ftp://); volledige CRO-stroom met nagebootste Groq (ophalen, mislukt ophalen → plakken, beoordelen, sorteren, filteren, afvinken/bewerken opgeslagen, review, opnieuw + versie terugzetten, geplakte tekst zonder project, verwijderen).
- Fase 2b: alle tests opnieuw op een Postgres-database; login in productiemodus (doorsturen, fout wachtwoord, ondertekend koekje, vals koekje geweigerd, API zonder login = 401, uitloggen); build met én zonder database.
- Alle niet-AI-stappen in de browser (handmatig onderzoek, angles, hooks, lege brief, bewerken, dupliceren, tabbladen, modelkeuze).
- De volledige AI-keten tegen een **nagebootste** Groq-server: streaming, 429 met wachttijd, ongeldig antwoord → herkansing, ```json-blokken, weigering van streaming → terugval, opsplitsen van ~10.000 tokens klantdata in 3 delen + samenvoegen, versies, reviews.
- **Niet getest:** uploaden naar en tonen vanuit de echte Vercel Blob-opslag (geen toegang tot het Vercel-account); echte Groq-aanroepen en de kwaliteit van de antwoorden (geen key in de bouwomgeving; Groq-documentatie was daar ook niet bereikbaar), en de echte koppeling met Vercel/Neon (geen toegang tot het Vercel-account).

## Nog te doen (buiten de fases om)
- `docs/spec-uitbreiding.md` (modules 7–10) ontbreekt nog in de repository.
- Fase 4: veld `parent_test_id` toevoegen aan tests (iteratieboom module 10); "Maak testlog-item aan" vanuit de brief.
- CRO-check: A/B-testideeën naar de Testlog (fase 4); beoordeling op basis van een screenshot (later).
- Fase 5: PDF/Markdown-export en deellink van briefs (deellink moet buiten de login om bereikbaar zijn); prompts bewerken via Instellingen.

## Bekende problemen / aandachtspunten
- Swipe File: het visiemodel (standaard `meta-llama/llama-4-scout-17b-16e-instruct`) is niet gecontroleerd tegen de Groq-documentatie; aan te passen met `GROQ_VISIE_MODEL`. Werkt het niet, dan analyseert de app zonder screenshot.
- Swipe File: video's worden niet aan de AI gestuurd (alleen screenshots); zet de gesproken tekst in het transcript.
- Swipe File: tag-lijsten beheren in Instellingen komt in fase 5; laatste 5 swipe-items op het dashboard ook.
- CRO-check: sites die hun tekst pas met JavaScript laden of bots blokkeren, kunnen niet worden opgehaald; dan tekst plakken. Op Vercel komen verzoeken van een datacenter-IP, wat sommige sites eerder blokkeren.
- Modellijst in Instellingen is niet gecontroleerd tegen de actuele Groq-documentatie; een ander model-ID kan altijd handmatig.
- Het gratis limiet (±8.000 tokens/minuut) betekent dat snel achter elkaar genereren soms 20–60 seconden wachten geeft; de app toont dan een aftelling.
- De limietplanner houdt alleen verzoeken bij binnen één serverproces. Op Vercel kunnen meerdere processen tegelijk draaien; dan vangt de 429-afhandeling (wachten en opnieuw proberen) het op.
- Versies terugzetten bestaat voor onderzoek, angles en briefs; hooks worden altijd toegevoegd (niet vervangen), dus daar is geen terugzetten nodig.
- Back-up: Neon maakt zelf automatische back-ups (beperkt op het gratis plan). JSON/CSV-export komt in fase 5.
- Data uit de eerdere lokale SQLite-versie is niet overgezet.
