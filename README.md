# Creative Strategist OS

Werkplek voor creative strategists (Meta, TikTok, YouTube Shorts): klantonderzoek, angles, hooks, creative briefs, swipe file en testlog.

Draait online op **Vercel** met een **Postgres-database** en is afgeschermd met een **wachtwoord**.

## Online zetten op Vercel (eenmalig)

1. **Framework:** staat in `vercel.json` (Next.js). Controleer bij **Settings → Build and Deployment** dat "Output Directory" niet op `dist` staat (zet de override uit).
2. **Database:** Vercel → je project → **Storage → Create Database → Neon (Postgres)** → Free plan → **Connect** aan dit project (alle omgevingen). Vercel zet `DATABASE_URL` en `DATABASE_URL_UNPOOLED` dan zelf klaar.
3. **Uploadopslag:** **Storage → Create → Blob** → koppel aan dit project. Nodig voor screenshots en video's in de Swipe File. Vercel zet `BLOB_READ_WRITE_TOKEN` zelf.
4. **Variabelen:** **Settings → Environment Variables**, voeg toe:
   - `APP_WACHTWOORD`: een sterk wachtwoord om in te loggen
   - `GROQ_API_KEY`: je gratis key van console.groq.com
5. **Deployments → … → Redeploy.** Bij de build worden de databasetabellen automatisch aangemaakt.
6. Open je Vercel-link, log in met je wachtwoord.

## Lokaal werken (optioneel)

1. Installeer **Node.js** (LTS) via https://nodejs.org en download dit project.
2. `npm install`
3. Kopieer `.env.example` naar `.env.local`. Vul in:
   - `DATABASE_URL` en `DATABASE_URL_UNPOOLED`: Vercel → **Storage** → je database → tabblad **.env.local** → kopiëren.
   - `GROQ_API_KEY`, en eventueel `APP_WACHTWOORD` (lokaal zonder wachtwoord staat de app open).
4. `npm run dev` → http://localhost:3000

Lokaal en online gebruik je dezelfde database, dus je ziet overal dezelfde data.

## Handige commando's

| Commando | Wat het doet |
|---|---|
| `npm run dev` | App lokaal starten |
| `npm run build` | Controleren of alles goed bouwt |
| `npm run lint` | Code controleren op fouten |
| `npm run db:studio` | Database bekijken in de browser |

## Documentatie

- `CLAUDE.md`: werkafspraken en techniek
- `docs/spec-basis.md`: specificatie modules 1–6
- `docs/voortgang.md`: wat af is en wat nog moet
