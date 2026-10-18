# Strategist OS

Een lokale webapp voor mijn werk als creative strategist (performance marketing: Meta, TikTok, YouTube Shorts).
Ik ben geen ervaren programmeur. Leg dingen kort en in gewone taal uit.

## Specificaties
- docs/spec-basis.md: basis-app (modules 1–6)
- docs/spec-uitbreiding.md: uitbreiding (modules 7–10)
- docs/voortgang.md: wat af is, wat nog moet, bekende problemen. Werk dit bij na elke fase.

Lees de relevante spec voordat je aan een module begint. Wijk er niet van af zonder het te vragen.

## Techniek
- Next.js (App Router) + TypeScript + Tailwind CSS
- Database: SQLite via Prisma (lokaal bestand, geen account nodig)
- AI: Anthropic SDK, alleen server-side (API routes / server actions). Key staat in .env.local als ANTHROPIC_API_KEY en komt nooit in de browser.
- Validatie van AI-output met Zod
- Grafieken met Recharts
- Geen login nodig: de app draait alleen lokaal voor mij. Negeer de Supabase-, auth- en Row Level Security-onderdelen uit de specs; gebruik Prisma-modellen met dezelfde velden.
- Uploads (screenshots, video's) opslaan in /uploads in de projectmap.

## Werkwijze
- Werk per fase. Maak eerst een kort plan en wacht op mijn akkoord voordat je veel bestanden aanmaakt.
- Na elke fase: app starten en controleren dat hij zonder fouten draait, `npm run build` en lint draaien, docs/voortgang.md bijwerken, en mij in maximaal 10 regels vertellen wat ik moet testen.
- Maak een git-commit na elke werkende fase, met een duidelijke Nederlandse commit-message.
- Geen nieuwe libraries toevoegen zonder reden te noemen.
- Alle AI-prompts staan in /lib/prompts als aparte bestanden, zodat ik ze makkelijk kan aanpassen. Ze moeten ook bewerkbaar zijn via Instellingen (opgeslagen in de database, met het bestand als standaard).
- Interface in het Nederlands.

## Starten
npm run dev  → http://localhost:3000

## Technische notities (voor AI-assistenten)
- Next.js 16 met `cacheComponents`: zie AGENTS.md en `node_modules/next/dist/docs/`. Databasequeries staan in `lib/data.ts`, beginnen met `await connection()` en worden in `<Suspense>` gerenderd. Bezochte pagina's blijven verborgen bewaard (React Activity): reset formulierstate na opslaan.
- Prisma 7 + SQLite: Json-velden hebben geen `@default` (werkt niet op SQLite); standaardwaarden in code. Schema wijzigen: `npm run db:migrate`.
- Server actions in `lib/actions.ts` nemen alleen bekende velden over van de invoer.
