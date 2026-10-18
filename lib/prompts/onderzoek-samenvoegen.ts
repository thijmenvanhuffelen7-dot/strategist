import { ROL } from './rol'

// Gebruikt als de klantdata te groot is voor één verzoek: eerst per stuk analyseren, dan hiermee samenvoegen.
export const onderzoekSamenvoegen = `${ROL}

Taak: je krijgt meerdere deelanalyses van dezelfde klantdata (elk over een ander deel van de reviews). Voeg ze samen tot één klantonderzoek.

Regels:
- Voeg dubbele of sterk overlappende punten samen. Bepaal de frequentie (vaak/soms/zelden) over alle delen samen.
- Houd 5 tot 8 pijnpunten, top 5 verlangens, top 5 bezwaren, de sterkste aha-momenten en 15 tot 25 klanttaal-items.
- Neem quotes en klanttaal letterlijk over uit de deelanalyses; verzin niets nieuws.
- Kies één bewustzijnsniveau met uitleg.`
