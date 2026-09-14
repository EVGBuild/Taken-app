# Beslisregister

Dit register voorkomt dat goedkeuring, research en ontwerpafleiding door elkaar lopen.

## A — Eerder door Elise goedgekeurde productbesluiten

| Onderwerp | Geldend besluit |
| --- | --- |
| Productstrategie | Eerst een uitzonderlijk goed persoonlijk systeem voor Elise; wel een nette doorgroeiroute naar een consumentenproduct. |
| Kernnavigatie | Home, centrale Orb en Vault; Instellingen via het tandwiel. |
| Home | Geen persoonlijke begroeting “Goedemorgen Elise”; rustig en selectief, geen volledig dashboard. |
| Check-in | Optioneel en niet-blokkerend; vijf visuele batterijbalken, zonder “2/5”; vraag: “Hoeveel kun je op dit moment aan?” |
| Visuele wereld | Donker, volwassen en rustig; petrol voor interactie, goud voor betekenisvolle aandacht, violet voor de wereldlaag, oudroze voor warmte; subtiele galaxy/nebula en spaarzame twinkles; kleuren terughoudender dan eerdere mock-ups. |
| Vault | Compact tweekoloms mobiel raster; zes primaire verzamelingen plus een ‘Meer’-mechanisme; echte inhoudszoekfunctie met directe navigatie. |
| Levenscyclus | Wachten en Later zijn volwaardige staten; geen verplichte datum of check-in om iets veilig weg te zetten. |
| Herhaling | Huishoudelijke routines herhalen vanaf de werkelijke voltooiingsdatum, niet vanaf een gemiste geplande datum. |
| Taal | Centrale i18n-architectuur, aanvankelijk Nederlands en Engels, met gescheiden vertaalbestanden en schaalbare locales. |
| Autoriteit | De gebruiker beslist; AI-voorstellen zijn uitlegbaar, corrigeerbaar en waar mogelijk omkeerbaar. |

Niet als goedgekeurd behandelen: de definitieve productnaam. “LumiVault” is een werknaam; eerdere naamshortlists en beschikbaarheidsvragen zijn niet afgesloten.

## B — Conclusies rechtstreeks uit bestaande research

| Researchconclusie | Consequentie voor het product |
| --- | --- |
| Capture vóór classificatie | Ruwe invoer wordt onmiddellijk duurzaam opgeslagen; categorisatie mag opslag niet blokkeren. |
| Progressive enrichment | Eerst bewaren, daarna alleen relevante verrijking vragen of voorstellen. |
| Provenance en reversibiliteit | Originele invoer blijft naast interpretaties bestaan; splitsen en samenvoegen moet herleidbaar zijn. |
| Eén extern geheugen | Modules zijn verbonden views op gedeelde informatie, geen onafhankelijke datasilo’s. |
| Gescheiden signalen | Noodzaak, impact, weerstand, belasting, duur en deadline blijven afzonderlijk. |
| Onbekend blijft onbekend | Geen stille standaardwaarde die later als gebruikersvoorkeur wordt geïnterpreteerd. |
| Gefaseerde selectie | Context- en geschiktheidsfilters vóór rangschikking; geen universele prioriteitsscore. |
| Voorzichtig leren | Expliciete correcties wegen het zwaarst; confidence en recentheid begrenzen automatisering; geen psychologisch profiel. |
| Agenda als context | Tijdvensters en verplichtingen informeren een voorstel, maar worden niet automatisch omgerekend tot energie. |
| Toegankelijkheidsbaseline | Toetsenbord, zichtbare focus, labels, doelgroottes, contrast en reduced-motion/transparency horen in de definitie van klaar. |

## C — Nieuwe hypotheses uit de blauwdruk, nog te valideren

| Hypothese | Validatie vóór besluit |
| --- | --- |
| Home toont één primaire suggestie en maximaal twee alternatieven | Test met Elise in meerdere energie- en tijdcontexten; vergelijk met 3–5 suggesties. |
| “Bewaard” is de juiste brede naam voor documenten, links en screenshots | Begrips- en terugvindtest. |
| Eén canonieke state-set bevat Open, Wachten, Later, Gepland, Afgerond, Alleen bewaren en Geannuleerd | Domeinmapping en scenario-review; voorkom geforceerde staten. |
| Eén generiek Item-model met capabilities en relaties kan alle huidige modules dragen | Technische spike met volledige legacy-fixture en verliesvrije round-trip. |
| TypeScript, lichte bundling en Vitest zijn de passende volgende tooling | Spike op migratiekosten, debugbaarheid en deploybaarheid; geen stackbesluit vooraf. |
| IndexedDB wordt de geschikte duurzame browserstore | Capaciteits-, export-, transacties- en migratiespike; localStorage blijft bron tot bewezen migratie. |
| Geen zwaar UI-framework is nodig | Bevestigen na componentinventarisatie en toegankelijkheidsproef. |
| Huishoudelijke taken horen wel of niet in Masterlist | Persoonlijke productbeslissing van Elise; eerdere formulering was geen definitief besluit. |
| De voorgestelde migratievolgorde is optimaal | Herprioriteren op risico en afhankelijkheden na karakterisatietests. |

Nieuwe hypotheses mogen fase 1 sturen als onderzoeksvraag, maar niet als stilzwijgend goedgekeurde productregel.

## Technisch validatielog fase 1

Dit log wijzigt geen productbesluiten uit A of researchconclusies uit B.

| Datum | Hypothese uit C | Nieuw bewijs | Actuele status |
| --- | --- | --- | --- |
| 2026-09-13 | IndexedDB wordt de geschikte duurzame browserstore | StorageGateway, immutable export, lossless conversie, afzonderlijke IndexedDB-shadow-adapter, verificatie en rollback zijn geïmplementeerd. De echte Chromium-run bevestigt transacties, atomische abort, idempotentie, rollback, exportbehoud, 2 MiB-bijlage en volledige round-trip. Een 6 MiB-bron faalt al op de legacy-localStorage-quota; een betrouwbare IndexedDB-quota-estimate was niet beschikbaar. | **Geschikt als shadow-kandidaat; browsercontract groen.** Nog steeds geen toestemming voor product-read. |
| 2026-09-13 | Eén generiek Item-model kan alle modules dragen | De implementatie gebruikt items, collections, relations, contexts en auxiliary data met volledige legacy-payload. | **Universeel plat model verworpen.** Samengestelde representatie bevestigd voor verdere shadow-validatie. |
| 2026-09-13 | TypeScript, bundling en Vitest zijn passende volgende tooling | De seam en contracttests zijn zonder deze tooling implementeerbaar en testbaar. | **Niet invoeren in deze slice.** Geen nieuw bewijs dat invoering nu nodig is. |
| 2026-09-13 | De voorgestelde migratievolgorde is optimaal | De storage safety seam kan worden geïsoleerd terwijl `localStorage` de enige actieve bron blijft. De formele storage-exitpoort is behaald; twee bestaande UI/baseline-afwijkingen zijn expliciet buiten deze technische slice vastgelegd. | **Eerste stap technisch bevestigd en afgerond.** Geen read-switch, legacy-opruiming of volgende slice zonder afzonderlijk besluit. |
