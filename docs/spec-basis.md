# Specificatie basis-app: Creative Strategist OS (modules 1–6)

> **Afwijkingen van deze spec** (zie CLAUDE.md):
> - Geen Supabase en geen Row Level Security. De data staat in een Postgres-database (Neon via Vercel, met Prisma), met dezelfde velden als in het datamodel hieronder. "users" wordt één profielrij.
> - In plaats van accounts: één wachtwoord (APP_WACHTWOORD), want de app is alleen voor mij.
> - Uploads komen in Vercel Blob, niet in Supabase Storage.
> - De AI draait server-side via Groq (zie CLAUDE.md → AI-provider).

## Context
Ik ben een (beginnende) creative strategist voor performance marketing (Meta-, TikTok- en YouTube Shorts-ads). Bouw een webapplicatie die mijn dagelijkse workflow ondersteunt: klantonderzoek doen, angles en hooks bedenken, creative briefs schrijven, inspiratie verzamelen (swipe file) en testresultaten bijhouden. De app moet AI gebruiken om analyses en teksten te genereren, maar ik moet alles kunnen bewerken en opslaan.

De interface is in het Nederlands. Gegenereerde ad-teksten (hooks, scripts) komen in de taal die ik per project kies.

## Techniek (oorspronkelijk)
- Frontend: React + TypeScript + Tailwind CSS
- Backend/database: Supabase (Postgres, auth met e-mail, storage voor afbeeldingen/video's) — *vervangen, zie boven*
- AI: Anthropic Claude API (of OpenAI als alternatief), aangeroepen via een server-side functie zodat de API-key nooit in de browser staat
- Responsive: werkt op desktop en mobiel
- Alle data is privé per gebruiker (Row Level Security in Supabase) — *vervalt, zie boven*

## Navigatie (zijbalk)
1. Dashboard
2. Projecten (per merk/product)
3. Brief Builder
4. Swipe File
5. Testlog
6. Instellingen

---

## Module 1 – Projecten
Elk project = één merk of product. Alle andere data (onderzoek, angles, briefs, tests) hangt aan een project.

Velden per project:
- Naam merk/product
- Omschrijving (wat doet het product)
- Prijs
- Website-URL
- Landingspagina-tekst (groot tekstveld)
- Doelgroep (vrije tekst)
- Platforms (multi-select: Meta, TikTok, YouTube Shorts, overig)
- Campagnedoel (cold traffic, retargeting, lancering, overig)
- Taal van de ads
- Concurrenten (lijst met naam + URL)
- Ruwe klantdata: groot tekstveld waar ik reviews, comments en Reddit-posts plak. Ook upload van .txt/.csv met reviews.

Projectpagina toont tabbladen: Overzicht | Onderzoek | Angles | Hooks | Briefs | Tests.

---

## Module 2 – Brief Builder (kern van de app)
Een wizard in 4 stappen. Elke stap toont AI-output die ik kan bewerken, opnieuw genereren of goedkeuren voordat ik doorga. Alles wordt automatisch opgeslagen bij het project.

### Stap 1: Klantonderzoek
Knop "Analyseer klantdata". AI analyseert de projectinfo en ruwe klantdata en levert gestructureerde output (JSON) met:
- Pijnpunten (5–8): omschrijving, frequentie (vaak/soms/zelden), 1–3 letterlijke quotes, onderliggende emotie
- Verlangens / gewenste uitkomst (top 5)
- Bezwaren (top 5) + hoe een ad ze kan wegnemen
- Aha-momenten
- Klanttaal-bank: 15–25 letterlijke woorden/zinnen
- Bewustzijnsniveau (Eugene Schwartz: unaware → most aware) met uitleg

Weergave: kaarten per categorie. Quotes zijn aanklikbaar om ze te kopiëren. Ik kan items toevoegen, bewerken, verwijderen en markeren met een ster.

### Stap 2: Angles
Knop "Genereer angles". AI maakt 8–10 angles op basis van het onderzoek, gevarieerd over types: pijnpunt, verlangen, vijand, bezwaar-ontkrachtend, identiteit, vergelijking, nieuw mechanisme, social proof, gemak, contrair.

Per angle: naam, type, kernboodschap (1 zin), voor wie, waarom het werkt (met verwijzing naar pijnpunten/quotes), risico, score 1–10.

Weergave: lijst gesorteerd op score. Ik kan angles selecteren (max 5) voor stap 3, en zelf een angle toevoegen.

### Stap 3: Hooks
Per geselecteerde angle genereert AI 5 hooks. Per hook:
- Gesproken tekst (max 12 woorden)
- Tekst-overlay
- Beschrijving eerste shot
- Hook-type (vraag, gedurfde stelling, POV, resultaat eerst, waarschuwing, nieuwsgierigheidskloof, directe aanspreking, visueel)

Regels voor de AI: gebruik de klanttaal-bank, vermijd clichés ("game changer", "dit veranderde alles"). Knop "Meer hooks" per angle. Ik kan hooks een ster geven; gemarkeerde hooks worden opgeslagen in een hook-bibliotheek.

### Stap 4: Creative brief
Ik kies één angle + één hook. AI genereert een volledige brief:
1. Overzicht: titel, angle, doel, platform, formaat (9:16, 4:5), lengte, format-type (UGC talking head, demo, voor/na, street interview, green screen, skit, unboxing, testimonial-montage)
2. Doelgroep: persona (3–4 zinnen), situatie waarin ze scrollen, bewustzijnsniveau
3. Kernboodschap, belangrijkste bewijs, bezwaar om weg te nemen
4. Script als tabel: Tijd | Beeld | Gesproken tekst | Tekst op beeld | Opmerkingen (hook → probleem → oplossing → bewijs → bezwaar → CTA)
5. Testvariaties: 3 alternatieve hooks, 1 alternatieve CTA, 1 alternatief format
6. Richtlijnen voor creator/editor: toon, setting, muziek, ondertitels, do's en don'ts
7. Succescriteria: welke metrics (hook rate, hold rate, CTR, CPA) en drempelwaarden

De brief is volledig bewerkbaar (rich-text editor, scripttabel met rijen toevoegen/verwijderen). Acties:
- Status: Concept / Klaar voor productie / In productie / Live / Gearchiveerd
- Exporteren als PDF en als Markdown
- Delen via een alleen-lezen link (voor een editor of creator)
- Dupliceren als variant
- "Maak testlog-item aan" (koppelt de brief aan Module 4)

Na elke stap: knop "Kritische review" waarbij de AI als creative director de zwakste aannames en ontbrekende informatie benoemt.

---

## Module 3 – Swipe File
Database van ads die ik als inspiratie bewaar.

Velden: titel, merk, platform, link naar de ad, upload van screenshot of video, transcript/script (tekstveld), branche, format, hook-type, angle-type, emotie, eigen notities, beoordeling 1–5, datum toegevoegd.

AI-functie "Analyseer deze ad": op basis van transcript/omschrijving (en optioneel screenshot) vult de AI automatisch in:
- Hook (gesproken + visueel) en hook-type
- Angle en kernboodschap
- Structuur per tijdsblok
- Aangesproken emotie/pijnpunt
- Bewustzijnsniveau
- 3 redenen waarom het werkt
- 3 ideeën om het toe te passen op een van mijn projecten (kies project in dropdown)
- Suggesties voor tags

Weergave: grid met kaarten (thumbnail, titel, tags) én tabelweergave. Filters op alle tags, zoeken in alle tekst, sorteren op datum of beoordeling. Een ad kan ik "koppelen" aan een brief als referentie.

---

## Module 4 – Testlog
Bijhouden van creative-tests en wat ik ervan leer.

Per creative (rij):
- Naam, project, gekoppelde brief, angle, hook, format, platform
- Live-datum, status (Testen / Winnaar / Verliezer / Gestopt)
- Metrics: spend, impressies, hook rate (3-sec views / impressies), hold rate, CTR, CPC, CPA, ROAS
- Hypothese (wat verwachtte ik)
- Resultaat en les (wat leerde ik)

Functies:
- Handmatig invoeren én CSV-import (export van Meta Ads Manager / TikTok Ads Manager); bij import een kolommen-koppelscherm
- Automatisch berekende velden (hook rate, CPA) als de ruwe getallen aanwezig zijn
- Kleurcodering t.o.v. drempelwaarden die ik per project instel
- Grafieken: prestaties per angle-type, per hook-type, per format (staafdiagrammen) en CPA over tijd (lijn)
- AI-functie "Analyseer resultaten": winnaars/verliezers, patronen, waar kijkers afhaken (hook vs. body vs. offer), 3 hypotheses, 5 nieuwe testvoorstellen, wat te stoppen. Testvoorstellen kan ik met één klik omzetten naar een nieuwe brief in de Brief Builder.

---

## Module 5 – Dashboard
- Aantal actieve projecten, briefs per status, lopende tests
- Laatste 5 briefs en laatste 5 swipe-items
- "Learnings": de 5 recentste lessen uit de testlog
- Top-presterende angle-types en hook-types over alle projecten
- Snelknoppen: Nieuw project, Nieuwe brief, Ad toevoegen aan swipe file

---

## Module 6 – Instellingen
- Profiel
- Standaardtaal en standaardplatform
- Standaard drempelwaarden voor metrics
- Beheer van tag-lijsten (formats, hook-types, emoties, branches)
- Bewerkbare AI-systeemprompts per functie (zodat ik ze kan finetunen)
- Data-export (alles als JSON/CSV)

---

## Datamodel
*(Oorspronkelijk Supabase; nu Prisma-modellen met dezelfde velden in `prisma/schema.prisma`.)*
- users *(→ één profielrij)*
- projects (user_id, naam, omschrijving, prijs, url, landingspagina_tekst, doelgroep, platforms[], doel, taal, concurrenten jsonb, klantdata text, drempels jsonb)
- research (project_id, pijnpunten jsonb, verlangens jsonb, bezwaren jsonb, aha_momenten jsonb, klanttaal jsonb, bewustzijnsniveau, bijgewerkt_op)
- angles (project_id, naam, type, kernboodschap, doelgroep, onderbouwing, risico, score, geselecteerd bool)
- hooks (angle_id, project_id, gesproken, overlay, eerste_shot, type, ster bool)
- briefs (project_id, angle_id, hook_id, titel, inhoud jsonb, status, share_token, aangemaakt_op)
- swipe_items (user_id, titel, merk, platform, url, media_url, transcript, tags jsonb, analyse jsonb, notities, beoordeling)
- tests (project_id, brief_id, naam, angle, hook, format, platform, live_datum, status, metrics jsonb, hypothese, les)
- prompt_templates (user_id, functie, systeemprompt)

---

## AI-implementatie
- Elke AI-functie heeft een eigen systeemprompt (opgeslagen in prompt_templates, met een goede standaardversie).
- Rol in elke prompt: "Je bent een ervaren creative strategist voor performance marketing. Je bent concreet en kritisch, baseert alles op klantdata, verzint geen productfeiten en markeert aannames met [AANNAME]."
- Vraag de AI om gestructureerde JSON terug te geven volgens een vast schema per functie; valideer het schema (bijv. met Zod) en toon een nette foutmelding met "Opnieuw proberen" als het mislukt.
- Stuur altijd de relevante projectcontext mee (projectinfo + goedgekeurd onderzoek + gekozen angle).
- Stream de output zodat ik de tekst zie verschijnen.
- Toon bij elke AI-actie een indicatie van verbruik (tokens) en sla AI-output op met tijdstempel, zodat ik eerdere versies kan terugzetten.

---

## Design
- Rustig, professioneel werkgereedschap, geen marketing-look. Denk aan Linear of Notion.
- Licht én donker thema.
- Duidelijke statuslabels (pillen) in kleur.
- Veel ruimte voor tekst; scripts en briefs moeten prettig leesbaar zijn.
- Toetsenbord-sneltoetsen: N = nieuw item, / = zoeken.
- Lege staten met uitleg en een voorbeeldknop ("Laad voorbeeldproject").

---

## Voorbeelddata
Maak één voorbeeldproject aan (bijv. een fictief merk "Slaapwel", een gewogen deken van €129) met 20 realistische, verzonnen reviews, zodat ik de hele flow direct kan uitproberen. Markeer het duidelijk als voorbeeld.

---

## Bouwvolgorde
Bouw in fases en laat me na elke fase testen:
1. Auth, projecten, basislayout en navigatie *(lokaal: zonder auth)*
2. Brief Builder stap 1–4 met AI
3. Swipe File met AI-analyse
4. Testlog met CSV-import, grafieken en AI-analyse
5. Dashboard, instellingen, export en deellinks
