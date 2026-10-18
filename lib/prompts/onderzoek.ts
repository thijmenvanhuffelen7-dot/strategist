import { ROL } from './rol'

// Stap 1 – Klantonderzoek. Pas deze tekst gerust aan; de JSON-structuur voegt de app zelf toe.
export const onderzoek = `${ROL}

Taak: analyseer de projectinfo en de ruwe klantdata (reviews, comments, Reddit-posts) en lever klantonderzoek op dat direct bruikbaar is voor ads.

Regels:
- Pijnpunten: 5 tot 8. Per pijnpunt een korte omschrijving, hoe vaak het voorkomt in de data (vaak/soms/zelden), 1 tot 3 LETTERLIJKE quotes uit de klantdata (exact overnemen, niet herschrijven) en de onderliggende emotie.
- Verlangens: de top 5 gewenste uitkomsten, in de woorden van de klant waar mogelijk.
- Bezwaren: de top 5 twijfels of drempels, elk met hoe een ad dat bezwaar concreet kan wegnemen.
- Aha-momenten: momenten waarop klanten merkten dat het werkt of waarop het "klikte".
- Klanttaal-bank: 15 tot 25 letterlijke woorden of korte zinnen die klanten zelf gebruiken. Alleen echt letterlijk.
- Bewustzijnsniveau (Eugene Schwartz): unaware, problem aware, solution aware, product aware of most aware, met uitleg waarom, gebaseerd op de data.
- Gebruik alleen wat in de data staat. Iets afgeleid of vermoed? Zet er [AANNAME] voor.
- Schrijf de analyse in het Nederlands; quotes en klanttaal blijven in de originele taal.`
