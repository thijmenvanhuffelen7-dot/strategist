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
- AI: zie het blok "AI-provider" hieronder. Alleen server-side; keys komen nooit in de browser.
- Validatie van AI-output met Zod
- Grafieken met Recharts
- Geen login nodig: de app draait alleen lokaal voor mij. Negeer de Supabase-, auth- en Row Level Security-onderdelen uit de specs; gebruik Prisma-modellen met dezelfde velden.
- Uploads (screenshots, video's) opslaan in /uploads in de projectmap.

## AI-provider
- Gebruik Groq (gratis abonnement) via de OpenAI-compatibele API: base URL https://api.groq.com/openai/v1, met het `openai` npm-pakket.
- Key en model komen uit .env.local: GROQ_API_KEY en GROQ_MODEL. Nooit in de browser, alleen server-side.
- Controleer op https://console.groq.com/docs/models welke modellen beschikbaar zijn en zet een goede standaard in .env.example. Het model moet ook in Instellingen te kiezen zijn.
- Bouw één AI-laag in /lib/ai met een provider-interface, zodat ik later kan wisselen naar Anthropic (Claude) of OpenAI door alleen een instelling en key te veranderen. Geen Groq-specifieke code buiten /lib/ai.
- Gebruik JSON-modus (response_format: json_object) en valideer met Zod. Bij ongeldige JSON: één keer automatisch opnieuw proberen met de foutmelding erbij.
- Rekening houden met de gratis limieten (ongeveer 30 verzoeken/minuut en 8.000 tokens/minuut; exacte limieten staan in de console):
  - Schat het aantal tokens vóór een verzoek. Te veel klantdata? Splits in stukken, analyseer per stuk en voeg de resultaten samen in een laatste verzoek.
  - Bij een 429-fout (limiet bereikt): lees de retry-after-header, toon "Even wachten, limiet bereikt (X sec)" in de interface en probeer automatisch opnieuw.
  - Stuur per AI-functie alleen de context mee die nodig is.
- Toon per AI-actie hoeveel tokens er gebruikt zijn, zodat ik zie hoe dicht ik bij de daglimiet zit.

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
