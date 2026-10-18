# Strategist OS

Lokale werkplek voor creative strategists (Meta, TikTok, YouTube Shorts): klantonderzoek, angles, hooks, creative briefs, swipe file en testlog.

## Eerste keer installeren

1. Installeer **Node.js** (versie 20 of hoger) via https://nodejs.org (kies "LTS").
2. Download dit project (groene knop **Code → Download ZIP** op GitHub, of `git clone`), en open een terminal in de projectmap.
3. Installeer de onderdelen:
   ```bash
   npm install
   ```
4. Vanaf fase 2: kopieer `.env.example` naar `.env.local` en vul je Anthropic API-key in.

## Starten

```bash
npm run dev
```

Open daarna http://localhost:3000. De database (`prisma/strategist.db`) wordt bij de eerste start vanzelf aangemaakt.

## Handige commando's

| Commando | Wat het doet |
|---|---|
| `npm run dev` | App starten |
| `npm run build` | Controleren of alles goed bouwt |
| `npm run lint` | Code controleren op fouten |
| `npm run db:studio` | Database bekijken in de browser |

## Je data

Alles staat op je eigen computer: de database in `prisma/strategist.db` en uploads in `uploads/`. Kopieer die twee om een back-up te maken. Ze komen niet in git.

## Documentatie

- `CLAUDE.md`: werkafspraken en techniek
- `docs/spec-basis.md`: specificatie modules 1–6
- `docs/voortgang.md`: wat af is en wat nog moet
