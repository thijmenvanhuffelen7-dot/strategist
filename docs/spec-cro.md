# Specificatie extra module: CRO-check

Afgesproken op 18 oktober 2026 (niet in de oorspronkelijke specs). Gebouwd na fase 2, vóór fase 3.

## Doel
Een landingspagina (eigen of van een concurrent) laten beoordelen op conversie, met concrete verbeteringen die direct bruikbaar zijn.

## Invoer
- Webadres: de server haalt de pagina op en zet die om naar tekst (titel, meta-omschrijving, koppen, knopteksten, prijzen, paginatekst, signalen voor reviews/garantie/verzending).
- Of: tekst van de pagina plakken (als ophalen niet lukt, bijv. door blokkade of omdat de site de inhoud pas later laadt).
- Optioneel een project: dan wordt het klantonderzoek (pijnpunten, bezwaren, klanttaal) meegestuurd en vergelijkt de AI de pagina daarmee.
- De opgehaalde tekst ("Wat de AI leest") is zichtbaar en aan te passen.

## Uitvoer (AI, JSON + Zod)
- Score 1–10 en samenvatting.
- Top 3 quick wins.
- 8–15 verbeterpunten, elk met: categorie (boven de vouw, waardepropositie, social proof, bezwaren & risico-omkering, CTA & flow, prijs & aanbod, vertrouwen, aansluiting ads & klanttaal), probleem, bewijs (citaat van de pagina), aanbeveling, voorbeeldtekst, impact en moeite (hoog/midden/laag).
- 3–5 A/B-testideeën met hypothese, variant en metric.

## Weergave en bewerken
- Punten gesorteerd op prioriteit (hoge impact + lage moeite eerst), filter per categorie, afvinken als gedaan, teksten bewerken, voorbeeldtekst kopiëren, punten verwijderen.
- Opnieuw beoordelen, eerdere versies terugzetten, kritische review van het advies.
- Overzicht van eerdere checks. Link "Check deze pagina" vanuit het projectoverzicht.

## Beperkingen
- Alleen tekst en structuur; geen ontwerp, afbeeldingen of laadsnelheid.
- Lange pagina's worden ingekort tot wat binnen het tokenlimiet past.
- Ophalen: alleen http(s), geen interne adressen, tijdslimiet 12 s, maximaal 3 MB.

## Later
- A/B-testideeën omzetten naar de Testlog (fase 4).
- Beoordeling op basis van een screenshot (vision-model).
