import type { ProjectInput } from './types'

// Fictief voorbeeldmerk. Alle reviews zijn verzonnen voor demonstratiedoeleinden.
const reviews = `[Review – 5 sterren – Marloes, 34]
Ik lig al jaren uren wakker met een hoofd vol to-do's. De eerste nacht met de Slaapwel deken dacht ik: dit is gewoon een zware deken. Nacht drie sliep ik voor het eerst in maanden door tot de wekker. Mijn vriend vroeg of ik ziek was omdat ik zo stil lag haha.

[Review – 4 sterren – Joost, 41]
Goede deken, voelt als een stevige knuffel. Enige minpunt: in de zomer is hij te warm, ook met de koele hoes. Ik gebruik hem nu alleen van oktober tot april.

[Review – 5 sterren – Fatima, 29]
Ik was echt sceptisch, €129 voor een deken?? Maar ik had al melatonine, apps, thee en een slaapmasker geprobeerd. Dit is het enige dat écht verschil maakt. Ik val binnen 20 minuten in slaap in plaats van na anderhalf uur.

[Review – 2 sterren – Peter, 56]
Veel te zwaar voor mij. Ik heb de 9 kg genomen omdat ik dacht 'hoe zwaarder hoe beter' maar ik kreeg het benauwd. Klantenservice was wel netjes, ik mocht omruilen voor 7 kg. Daarmee gaat het beter.

[Review – 5 sterren – Sanne, 37, moeder van 2]
Sinds de kinderen er zijn word ik om 3 uur 's nachts wakker en lig ik te piekeren. Met deze deken word ik nog steeds weleens wakker, maar ik val weer in slaap. Dat is voor mij al goud waard. Ik voel me overdag weer een mens.

[Reddit – r/slapeloosheid]
"Heeft iemand ervaring met verzwaarde dekens? Ik heb er een van Slaapwel gekocht na een advertentie en eerlijk gezegd voelt het alsof iemand je vasthoudt. Mijn angst 's avonds is echt minder. Maar het is wel even wennen, de eerste nacht vond ik het raar."

[Review – 5 sterren – Daan, 26]
Ik heb ADHD en mijn lijf staat 's avonds nog 'aan'. De druk van de deken zet mijn lichaam op een of andere manier op 'uit'. Klinkt vaag maar zo voelt het echt.

[Review – 3 sterren – Ingrid, 62]
Ik slaap er iets beter door, maar het wonder dat ik in de reclame zag is het niet. Het verschoonbare hoesje is fijn. Het is wel lastig om hem in een gewone wasmachine te doen, de binnendeken is te zwaar.

[Instagram comment]
"ik dacht dat dit zo'n tiktok hype product was maar ik slaap nu echt beter 😭 waarom heeft niemand me dit eerder verteld"

[Review – 5 sterren – Mehmet, 45]
Werk in ploegendienst en moet overdag slapen. Altijd onrustig, telefoon pakken, draaien. Met de deken lig ik stil en voel ik me na 6 uur slaap uitgeruster dan vroeger na 8.

[Review – 4 sterren – Lotte, 31]
Fijne deken, mooie stof. Wel een tip: begin met een paar uurtjes op de bank, dan went het sneller. Eerste nacht werd ik wakker omdat hij half van het bed was gegleden.

[Review – 5 sterren – Kees, 49]
Mijn vrouw zei al jaren dat ik 'woel als een gek'. Nu niet meer. We slapen allebei beter. Had ik maar eerder gedaan in plaats van nog een nieuw matras te kopen voor €900.

[Reddit – r/thenetherlands]
"Verzwaarde dekens zijn gewoon marketing toch? Een normale dikke dekbed doet hetzelfde." — Reactie: "Nee echt niet, ik had dat ook gedacht. Het gaat om de druk, niet om de warmte. Is echt een ander gevoel."

[Review – 5 sterren – Yara, 23, student]
Tentamenstress = niet slapen. Deze deken was een cadeau van mijn moeder en ik ben er zo blij mee. Ik leg hem soms ook overdag op mijn schoot tijdens het studeren, dan word ik rustiger.

[Review – 1 ster – Anoniem]
Bezorging duurde 9 dagen terwijl er 2–3 werkdagen stond. Deken zelf is oké maar ik had hem nodig voor een verjaardag.

[Review – 5 sterren – Ellen, 52, overgang]
Door de overgang sliep ik slecht en had ik nachtelijk zweten. Ik was bang dat een verzwaarde deken het erger zou maken, maar met de koele bamboe hoes gaat het prima. Ik slaap weer dieper.

[TikTok comment]
"wacht dus dit is waarom ik altijd beter slaap als mijn hond op me ligt??"

[Review – 4 sterren – Rick, 38]
Doet wat het belooft. Ik slaap rustiger. Prijs vond ik wel aan de hoge kant, ik heb hem met de kortingscode gekocht. 30 nachten proberen gaf de doorslag.

[Review – 5 sterren – Noor, 35]
Ik heb een angststoornis en de avonden zijn het ergst. Onder de deken op de bank voelt het alsof alles even stil wordt. Mijn therapeut had me op het idee gebracht.

[Review – 5 sterren – Bas, 44]
Ik slaap normaal 4–5 uur per nacht en ben dan om 5 uur klaarwakker. Na twee weken met de deken haal ik bijna altijd 6,5 uur. Niet perfect, maar ik merk het aan mijn humeur. Mijn collega's ook denk ik 😅`

export const voorbeeldProject: ProjectInput = {
  naam: 'Slaapwel – gewogen deken',
  omschrijving:
    'Een verzwaarde deken (5, 7 of 9 kg) gevuld met glasparels in kleine vakjes, met een afneembare, wasbare hoes van koele bamboestof. De gelijkmatige druk geeft een kalmerend, "vastgehouden" gevoel waardoor gebruikers sneller in slaap vallen en rustiger slapen.',
  prijs: '€129 (30 nachten proefslapen, gratis retour)',
  url: 'https://slaapwel.example',
  landingspagina_tekst: `Eindelijk weer doorslapen.
De Slaapwel deken geeft je lichaam een zachte, gelijkmatige druk – alsof je wordt vastgehouden. Zo komt je hoofd tot rust en val je sneller in slaap.

✓ Glasparels in kleine vakjes: het gewicht blijft gelijk verdeeld
✓ Koele bamboe hoes, afneembaar en wasbaar op 40 graden
✓ Kies je gewicht: 5, 7 of 9 kg (vuistregel: ca. 10% van je lichaamsgewicht)
✓ 30 nachten proefslapen – niet goed, geld terug
✓ Verzending binnen 2–3 werkdagen

Meer dan 10.000 Nederlanders slapen al met Slaapwel.`,
  doelgroep:
    'Volwassenen van 25–55 jaar (vooral vrouwen) die moeite hebben met inslapen of doorslapen door stress, piekeren, onrust of angst. Hebben vaak al melatonine, slaap-apps of thee geprobeerd. Ook: mensen met ADHD, ploegendienst, overgang.',
  platforms: ['Meta', 'TikTok'],
  doel: 'cold_traffic',
  taal: 'Nederlands',
  concurrenten: [
    { naam: 'Zwaarwel Dekens (fictief)', url: 'https://zwaarwel.example' },
    { naam: 'RustRitme (fictief)', url: 'https://rustritme.example' },
  ],
  klantdata: reviews,
  drempels: { hook_rate: 30, hold_rate: 10, ctr: 1.2, cpa: 35, roas: 2 },
  is_voorbeeld: true,
}
