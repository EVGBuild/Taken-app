# Beslisrapport fase 1 — karakterisatie en verliesvrije migratiespike

Datum: 2026-09-13  
Branch: `foundation-migration`  
Fase-0-baseline: `fd09b279987159a47202cc9a500aa5afb650d600`  
Scope: uitsluitend karakterisatie van bestaand gedrag en een niet-geactiveerde opslag-/datamigratiespike.

## Besluit in één zin

Ga door met een kleine, adaptergestuurde migratie waarbij `localStorage` voorlopig de gezaghebbende bron en fallback blijft, een byte-exacte export vóór iedere conversie verplicht is en een aparte IndexedDB-shadow store pas wordt ingevoerd nadat dezelfde migratiecontracttests in een echte browser slagen; voer nu geen TypeScript-, bundler-, Vitest- of universeel Item-modelbesluit door.

Deze activiteit heeft geen productcode, gebruikersinterface, goedgekeurd gedrag of bestaande opslagkeys gewijzigd. De spike is losstaand en wordt nergens door de applicatie geladen.

## 1. Onderzocht en getest

De actuele implementatie en de fase-0-legacy-fixture zijn gebruikt om drie bewijssoorten op te bouwen:

1. **Gedragskarakterisatie**
   - de zestien bestaande opslagkeys en de huidige `read`/`write`-semantiek;
   - normalisatie van legacy deadline-, Wachten- en Later-velden;
   - omkeerbare overgangen tussen Open, Wachten en Later zonder wijziging van identifier of titel;
   - herhaling vanaf de werkelijke voltooiingsdatum, inclusief dag, week, maand, maandeinde en schrikkeljaar;
   - onafhankelijkheid van huishoudcontext en herhaling;
   - geldige energieniveaus en normalisatie van Vault-zoektermen;
   - browserflows voor Home, optionele check-in, primaire navigatie, Orb-capture, Vault, Masterlist, Kopen en Huishouden.
2. **Conversie- en herstelspike**
   - ongewijzigde legacy-snapshot met formaatversie, tijdstip en SHA-256-checksum;
   - copy-on-write-conversie van alle zestien keys;
   - behoud van bestaande identifiers, deterministische identifiers waar ze ontbreken en unieke interne recordkeys bij dubbele legacy-ID's;
   - behoud van onbekende velden en base64-bijlagen;
   - expliciete collecties en relaties voor geneste lijsten;
   - quarantaine van ongeldige JSON zonder verlies van de ruwe bytes;
   - idempotentie, bronwijziging tijdens migratie, quotafout, round-trip, rollback en byte-exact herstel.
3. **Capaciteitsproef met de fase-0-fixture**
   - legacy-data: 1.857 bytes;
   - export: 2.635 bytes;
   - rijk shadow-model: 7.442 bytes;
   - tijdelijk totaal bij drie kopieën: 11.934 bytes, oftewel **6,43×** de legacy-footprint;
   - resultaat: 16 items, 4 collecties, 3 relaties, 0 quarantainerecords en een geslaagde semantische round-trip.

Testresultaat: `node --test tests/*.test.js` levert 35 tests op: **30 geslaagd, 0 mislukt, 5 overgeslagen**. De vijf overgeslagen tests vormen de browserkarakterisatiesuite. De benodigde Playwright-browserbinary is niet aanwezig en kon in deze omgeving niet betrouwbaar worden opgehaald. Een aanvullende cloudbrowserproef kon de actuele build wel laden, maar stelde IndexedDB niet beschikbaar aan zijn automatiseringscontext. Deze twee beperkingen zijn als onzekerheid vastgelegd; ze zijn niet als technisch falen van IndexedDB geïnterpreteerd.

## 2. Bestaand gedrag dat nu beschermd is

| Contract | Bescherming | Status |
| --- | --- | --- |
| De 16 legacy-keynamen blijven herkenbaar | Exacte contracttest tegen `js/core/storage.js` | Groen |
| Geldige falsey waarden blijven geldig; alleen ontbrekende of ongeldige JSON valt terug | Test van huidige `read`-semantiek | Groen |
| Huidige writes blijven JSON-equivalent | Test van huidige `write`-semantiek | Groen |
| Bestaande ID, titel/tekst en onbekende bronvelden blijven behouden bij normalisatie | Lifecycle-karakterisatietests | Groen |
| Wachten is niet uitvoerbaar en vraagt aandacht vanaf follow-updatum | Relevantie-karakterisatietest | Groen |
| Later wordt pas op de terugkeerdatum uitvoerbaar | Relevantie-karakterisatietest | Groen |
| Open, Wachten en Later zijn omkeerbaar zonder identiteitsverlies | Transitie-karakterisatietest | Groen |
| Herhaling ankert aan werkelijke voltooiing | Bestaande regressiesuite, inclusief randdatums | Groen |
| Huishoudcontext en herhaling zijn onafhankelijke eigenschappen | Bestaande regressietest | Groen |
| Energie accepteert alleen 1–5 en zoeken blijft genormaliseerd | Bestaande regressietests | Groen |
| Legacy-records blijven bereikbaar via kernflows | Browserkarakterisatiesuite met fase-0-fixture | Geschreven, nog geen geautomatiseerde groene run |
| Visuele vorm en bereikbaarheid van de kernflows | Fase-0 visual baseline | Vastgelegde handmatige baseline |

De browserdiagnostiek legt bekende tekortkomingen apart vast — onvolledig Vault-zoeken, ontbrekende onbekende capture-keuze en ontbrekende voltooiingsactie voor een huishoudroutine — zodat die niet per ongeluk als goedgekeurd gedrag worden bevroren.

## 3. Wat de opslag-/datamigratiespike aantoont

De spike toont aan dat een verliesvrije conversiekern voor de huidige data mogelijk is zonder legacy-data te muteren:

- alle huidige domeinen kunnen uit één snapshot worden gelezen en semantisch worden teruggebouwd;
- bestaande identifiers kunnen exact blijven staan;
- ontbrekende identifiers kunnen deterministisch en herhaalbaar worden toegevoegd zonder legacy-records te herschrijven;
- dubbele identifiers tussen domeinen vereisen een afzonderlijke, namespaced interne sleutel;
- onbekende velden en bijlagen moeten als volledige legacy-payload naast canonieke velden blijven bestaan;
- lijsten en bucketlists passen niet veilig in één plat itemtype zonder expliciete collectie- en relatielaag;
- een tweede run op dezelfde bron is een no-op;
- een gewijzigde bron na export stopt de migratie in plaats van bewijs te overschrijven;
- quotafouten laten legacy-data intact;
- rollback kan uitsluitend de shadow-data en migratiestatus verwijderen, terwijl de export behouden blijft;
- de export kan de oorspronkelijke zestien keys byte-exact herstellen.

De spike toont óók aan dat export, legacy-data en het rijkere shadow-model niet tijdelijk samen in nieuwe `localStorage`-keys moeten worden gezet. De 6,43× footprint op een kleine fixture maakt dat ontwerp onnodig gevoelig voor browserquota en grote base64-documenten.

Nog niet aangetoond is dat IndexedDB in alle doelbrowsers voldoende capaciteit en betrouwbare transacties biedt voor echte LumiVault-volumes. Dat vereist een browser-run met een beschikbare IndexedDB-context en grotere, representatieve exports. Daarom wordt IndexedDB aanbevolen als volgende shadow-store-kandidaat, maar nog niet als geactiveerde productstore.

## 4. Aanbevolen technische keuzes

| Onderwerp | Aanbeveling | Reden |
| --- | --- | --- |
| Migratiestrategie | Gecontroleerde verticale slices achter een opslagadapter | Klein terugroloppervlak; legacy blijft bruikbaar |
| Bron tijdens migratie | `localStorage` blijft gezaghebbend en fallback | Voldoet aan het migratiecontract en voorkomt onomkeerbare omschakeling |
| Eerste target | IndexedDB als afzonderlijke shadow store, pas na echte browsercontracttests | Past beter bij transacties en grote payloads; voorkomt verdubbeling binnen de kleine localStorage-quota |
| Model | Gedeelde record-envelope plus afzonderlijke items, collecties, relaties, context en auxiliary data | Behoudt samenhang zonder alle domeinen kunstmatig tot hetzelfde object te reduceren |
| Identiteit | Legacy-ID als domeinidentiteit; aparte namespaced interne `recordKey` | Behoudt externe identiteit en voorkomt botsingen |
| Onbekende data | Volledige legacy-payload plus quarantaine | Maakt conversie verliesvrij en latere mapping herstelbaar |
| Modules | Nieuwe migratie-infrastructuur mag als kleine native ES-module-eiland worden onderzocht achter een adapter | Geeft een heldere grens zonder bestaande globals direct om te bouwen |
| TypeScript en bundler | Nu niet invoeren | De spike levert geen bewijs dat de migratiebaten de extra toolchain en omzetting nu rechtvaardigen |
| Test runner | `node:test` voorlopig behouden; Vitest pas heroverwegen bij browser-/modulebehoefte | De huidige suite draait zonder dependency- of buildmigratie |

Dit is een architectuurrichting, geen toestemming om de read-path al om te zetten. De omschakeling mag pas na export, conversie, vergelijking, round-trip en rollback op representatieve data.

## 5. Status van hypotheses

De labels hieronder blijven gescheiden van productwaarheid.

### A — Elise-goedgekeurde productbesluiten

Geen besluit is in deze spike gewijzigd. Home–Orb–Vault, de optionele check-in, Wachten/Later, herhaling vanaf werkelijke voltooiing, de gebruikersautoriteit en de overige fase-0-besluiten blijven randvoorwaarden. De tests beschermen alleen bestaand gedrag dat hiermee verenigbaar is; bekende afwijkingen worden niet tot besluit verheven.

### B — Rechtstreeks uit research volgende conclusies

Capture vóór classificatie, progressive enrichment, provenance/reversibiliteit, één extern geheugen en “onbekend blijft onbekend” zijn als datacontract gebruikt. Concreet resulteert dat in bronpayloadbehoud, expliciete relaties, deterministische herleidbaarheid, quarantaine en uitstel van een onomkeerbare store-wissel. Dit zijn geen nieuwe producthypotheses.

### C — Nieuwe technische/producthypotheses uit de blauwdruk

| Hypothese | Uitkomst na spike | Consequentie |
| --- | --- | --- |
| Eén universeel generiek Item-model draagt alle modules | **Verworpen in deze vorm** | Gebruik een gedeelde envelope, maar behoud collecties, relaties en niet-itemcontext expliciet |
| IndexedDB is de geschikte duurzame browserstore | **Deels bevestigd, nog onzeker** | Structureel betere kandidaat dan shadow-data in localStorage; browsercapaciteit/transacties nog als gate testen |
| TypeScript is nu nodig | **Niet bevestigd** | Uitstellen tot een slice concrete typeveiligheidswinst kan aantonen |
| ES-modules zijn nu de juiste brede migratie | **Nog onzeker** | Alleen een klein geïsoleerd module-eiland onderzoeken; geen repo-brede omzetting |
| Lichte bundling is nu nodig | **Niet bevestigd** | Geen bundler toevoegen voor de storage-seam alleen |
| Vitest is nu de passende runner | **Niet bevestigd** | `node:test` voldoet voor deze bewijslaag; browserautomatisering apart oplossen |
| De exacte voorgestelde migratievolgorde staat vast | **Bijgesteld** | Eerst storage-seam, export en shadow-vergelijking; pas daarna model- of toolingmigratie |

De nog open persoonlijke producthypothesen — waaronder de positie van huishoudelijke taken in Masterlist — zijn niet geraakt en vragen in deze technische activiteit geen beslissing van Elise.

## 6. Risico's en rollback

| Risico | Beheersing | Rollback |
| --- | --- | --- |
| De huidige bootstrap vult ontbrekende ID's met tijd/willekeur en schrijft genormaliseerde data direct terug | Vóór read-switch exact karakteriseren; snapshot nemen vóór bootstrapmutatie; deterministische migratie-ID alleen in shadow-model | Legacy-export byte-exact herstellen; app op legacy-adapter laten lezen |
| Browserquota door export + bron + target | Export buiten shadow-localStorage houden; capaciteit preflighten; grote payload apart testen | Shadow store verwijderen; legacy-data blijven staan |
| Dubbele ID's tussen domeinen | Namespaced interne `recordKey`, legacy-ID ongewijzigd | Target weggooien; bron niet wijzigen |
| Onbekende of ongeldige velden | Volledige legacy-payload en raw quarantaine met foutreden | Herstel vanuit checksum-beveiligde export |
| Partiële conversie of onderbroken transactie | Status pas `verified` na volledige write, read-back en round-trip | Ongeverifieerde target verwijderen; migratie idempotent opnieuw uitvoeren |
| Shadow en bron lopen uiteen | Bronchecksum vóór hergebruik controleren en bij verschil stoppen | Nieuwe snapshot maken; oude export als bewijs behouden |
| Browser-E2E nog niet groen geautomatiseerd | Fase-0-visuals blijven baseline; browserbinary/CI wordt gate vóór activatie | Geen read-switch uitvoeren |

De beslissende rollbackregel blijft eenvoudig: zolang de vergelijkingspoort niet volledig groen is, leest en schrijft de productiecode uitsluitend via het huidige legacy-pad. Een mislukte of twijfelachtige shadow-run wordt verwijderd; legacy-keys en identifiers blijven onaangeroerd.

## 7. Eerstvolgende gecontroleerde verticale slice

Mijn aanbeveling is één **storage safety seam** zonder zichtbare productwijziging:

1. plaats een kleine `StorageGateway` rond de huidige `read`/`write`-semantiek, met de legacy-adapter als standaard en enige actieve bron;
2. leg vóór normalisatie een immutable, checksum-beveiligde export vast en rapporteer preflight-capaciteit;
3. implementeer de huidige pure conversiekern tegen een IndexedDB-shadow-adapter;
4. draai migratie alleen in shadow-modus: legacy blijft de enige read- en write-path;
5. vergelijk aantallen, ID's, states, datums, relaties, onbekende velden, bijlagen en round-trip per domein;
6. test browsertransacties, grote payload, onderbreking, herhaalde run, export en rollback in een browser-enabled CI-run;
7. activeer nog geen nieuwe read-path en verwijder geen legacy-code of -data.

### Exitpoort voor die slice

De slice is pas klaar als unit-, migratie- en browsercontracttests groen zijn, een representatieve grote fixture slaagt, rollback de fase-0-weergave herstelt en de diff geen productgedrag of visuele output wijzigt. Daarna volgt een afzonderlijk go/no-go-besluit voor de eerste shadow-readvergelijking; dat besluit is nadrukkelijk niet onderdeel van deze activiteit.

## Stopgrens

De volgende verticale slice is niet gestart. Dit rapport sluit de gevraagde karakterisatie- en migratiespike af.
