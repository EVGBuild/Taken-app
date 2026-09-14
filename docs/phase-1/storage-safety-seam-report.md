# Fase 1 — storage safety seam

Datum: 2026-09-13  
Branch: `foundation-migration`  
Basiscommit: `e6bc7fb8537070b30e310183c6a27ae5ce6d881d`  
Status: **exitpoort behaald voor de storage safety seam; twee bekende UI/baseline-afwijkingen uitgesloten van deze slice**  
Commit/push: formeel vastgelegd in de Git-historie van deze slice.

## Scope en stopgrens

Deze slice voegt uitsluitend een opslaggrens, pure migratiecode, een niet-actieve IndexedDB-shadow-adapter, verificatie, rollback en tests toe. Er is geen read-switch, productfeature, UI-wijziging, Decision Engine-wijziging, universeel Item-model, TypeScript, bundler, Vitest of brede ES-modulemigratie uitgevoerd.

`localStorage` is en blijft de enige actieve read- en write-bron van de productcode. De shadowbestanden zijn niet aan `index.html` toegevoegd en draaien dus niet in de app.

## Geïmplementeerd

### 1. Actieve legacy StorageGateway

`js/core/storage.js` bevat nu een kleine `StorageGateway` met één actieve adapter: `legacy-localStorage`. De bestaande globale functies `read` en `write` delegeren hiernaar met dezelfde JSON-, fallback- en foutsemantiek als vóór de wijziging.

De gateway biedt raw byte-toegang voor export en herstel. Er is geen IndexedDB-adapter aan de gateway gekoppeld en geen dynamische storeselectie toegevoegd.

### 2. Immutable legacy-export

De migratiekern maakt vóór conversie een snapshot van exact de zestien bekende legacy-keys met:

- originele stringbytes of `null` per key;
- vast formaat en versie;
- exporttijdstip en actieve bron;
- geordende keylijst;
- totale bytegrootte;
- SHA-256-integriteitscontrole.

Exports worden append-only opgeslagen in een afzonderlijke IndexedDB-database, los van de shadow-database. Rollback van shadow-data raakt deze export niet. Herstel accepteert alleen een export waarvan formaat, keys en checksum kloppen.

### 3. Samengestelde shadow-representatie

De spikeconversie is doorontwikkeld tot een browsergeschikte pure kern. De representatie behoudt afzonderlijk:

- items;
- collections;
- relations;
- contexts;
- auxiliary data;
- quarantine.

Bestaande ID's blijven exact behouden. Alleen ontbrekende interne ID's worden deterministisch afgeleid. `recordKey` is namespaced per brondomein, zodat identieke legacy-ID's niet botsen. Elk record behoudt de volledige legacy-payload, inclusief onbekende velden en bijlagen.

### 4. IndexedDB-shadow-adapter

De adapter gebruikt een eigen shadow-database met afzonderlijke stores voor migrations, items, collections en relations. Schrijven gebeurt generationeel binnen één transactie:

- data start als `pending`;
- een afgebroken transactie laat geen gedeeltelijke generatie achter;
- `verified` wordt pas in een aparte stap gezet na read-back en volledige verificatie;
- een reeds geverifieerde, ongewijzigde bron wordt hergebruikt zonder duplicaten;
- fouten en quota-exceptions worden doorgegeven zonder legacy-data te schrijven;
- rollback verwijdert alleen de gekozen shadow-generatie en migratiestatus.

### 5. Verificatie

De verificatie controleert expliciet:

- bron- en targetchecksum;
- item-, collection- en relationaantallen;
- bestaande ID's;
- states en lifecycle;
- deadlines, follow-up- en resurface-datums;
- recurrence;
- household-context onafhankelijk van recurrence;
- collections en relations;
- onbekende velden;
- bijlagen;
- semantische round-trip van alle zestien keys.

De bronchecksum wordt na export, na de shadow-write en vlak voor `verified` opnieuw bepaald. Een bronwijziging stopt de migratie; een generationele shadow-write wordt waar nodig teruggedraaid.

## Aantoonbaar bewezen

Met de fase-0-fixture en gegenereerde testvarianten is bewezen dat:

- de bestaande product-`read`/`write`-semantiek gelijk blijft;
- de actieve gateway uitsluitend `legacy-localStorage` gebruikt;
- SHA-256 correct is voor bekende testvectoren;
- snapshots originele bytes behouden en manipulatie detecteren;
- export vóór shadow-write plaatsvindt;
- legacy-data tijdens succesvolle en mislukte shadow-runs onaangeraakt blijft;
- alle gevraagde semantische verificatiechecks slagen;
- een tweede run dezelfde export en generatie hergebruikt zonder duplicaten;
- een bronwijziging na export vóór schrijven stopt;
- een bronwijziging tijdens schrijven shadow-state opruimt en nieuwere legacy-data laat staan;
- een write-fout nooit `verified` wordt;
- gemanipuleerde read-back `pending` blijft;
- ongeldige JSON raw in quarantaine blijft terwijl geldige domeinen doorgaan;
- dubbele legacy-ID's intact blijven met unieke namespaced recordkeys;
- een gegenereerde base64-bijlage van 6 MiB in de in-memory contractlaag volledig door conversie, verificatie en herstel komt;
- rollback alleen shadow-state verwijdert en de export behoudt;
- herstel uit export alle zestien legacy-keys byte-exact terugzet.

## Testresultaat

Commando: `node --test tests/*.test.js`

| Resultaat | Aantal |
| --- | ---: |
| Geslaagd | 43 |
| Mislukt | 0 |
| Overgeslagen | 6 |
| Totaal | 49 |

De zes skips zijn vijf bestaande browserkarakterisatietests en één nieuwe IndexedDB-browsercontracttest. De lokale Playwright-browserbinary ontbreekt nog steeds.

## Browsergate

Er is een zelfstandige browserrunner toegevoegd die in de echte paginacontext test:

- IndexedDB-beschikbaarheid;
- transactionele commit;
- atomische abort na gesimuleerde onderbreking;
- herhaalde migratie;
- rollback;
- exportbehoud en byte-exact herstel;
- een migreerbare base64-payload van 2 MiB plus een legacy-quotaproef van 6 MiB;
- beschikbare browserstorage-estimates;
- legacy ↔ shadow ↔ round-trip.

De runner is uitgevoerd in een echte Chromium-browser vanaf een bereikbare tijdelijke origin. De geteste runner en IndexedDB-shadow-adapter waren bytegelijk aan de repositorybestanden.

### IndexedDB-contract: geslaagd

| Controle | Resultaat |
| --- | --- |
| IndexedDB beschikbaar | Geslaagd |
| Transactionele commit | Geslaagd |
| Onderbroken transactie atomisch teruggedraaid | Geslaagd |
| Tweede migratierun idempotent | Geslaagd |
| Rollback verwijdert alleen shadow-state | Geslaagd |
| Immutable export blijft na rollback bestaan | Geslaagd |
| Byte-exact herstel van legacy-data | Geslaagd |
| Legacy ↔ shadow ↔ round-trip | Geslaagd |
| Alle semantische verificatiechecks | Geslaagd |
| Base64-payload van 2 MiB | Geslaagd |
| Legacy-localStorage-payload van 6 MiB | Verwachte `QuotaExceededError` vóór migratie |
| Betrouwbare browserstorage-estimate | Niet beschikbaar |
| Geforceerde IndexedDB-quota-uitputting | Niet uitgevoerd; niet betrouwbaar reproduceerbaar |

### Vijf bestaande browserkarakterisaties

| Test | Resultaat |
| --- | --- |
| Legacy-records behouden betekenis bij bootstrap | Geslaagd |
| Home, optionele check-in en primaire navigatie | **Mislukt:** `#globalAddButton` mist het verwachte `aria-label="Toevoegen"` |
| Orb draagt invoer over en bewaart een titeltaak | Geslaagd |
| Vault en lifecycle-views houden records bereikbaar | Geslaagd |
| Bekende gaten blijven diagnostisch | **Mislukt:** detailacties zijn `•••`, `Bewerken`, `Verwijderen`; de bestaande test verwacht alleen `Bewerken`, `Verwijderen` |

Browserresultaat totaal: **4 geslaagd, 2 mislukt, 0 overgeslagen**. De twee mislukkingen raken geen storagepad en zijn niet door deze seam veroorzaakt. Ze worden ook niet stilzwijgend groen gemaakt.

Uitputtend IndexedDB-quota-falen wordt bewust niet geforceerd: quota verschillen per browser, apparaat en vrije schijfruimte. De runner heeft wel betrouwbaar aangetoond dat 6 MiB al niet in de legacy-localStorage-bron past en dat 2 MiB volledig door de shadowmigratie komt.

## Formele exitpoort

**Status: behaald voor de storage safety seam.**

| Exitcriterium | Uitkomst |
| --- | --- |
| Legacy-productpad blijft actief | Behaald: `localStorage` is de enige actieve adapter voor `read` en `write` |
| Geen IndexedDB read-switch | Behaald: de IndexedDB-adapter wordt niet door `index.html` of productcode geladen |
| Lossless export, shadow-write, verificatie en rollback | Behaald in unit-, migratie- en echte Chromium-contracttest |
| Idempotentie, onderbreking en bronwijziging | Behaald |
| Grote representatieve payload | Behaald op 2 MiB; 6 MiB faalt aantoonbaar al bij de legacy-bronquota |
| Geen legacy-keys/data/code verwijderd | Behaald: keys en legacy-adapter blijven bestaan; rollback verwijdert alleen shadow-generatie en status |
| Geen zichtbaar productgedrag, UI, feature of Decision Engine gewijzigd | Behaald binnen deze slice |
| Twee bestaande UI/baseline-afwijkingen | Vastgelegd, **niet-storagegerelateerd en buiten deze exitpoort** |

De exitpoort geeft uitsluitend vrij voor het afronden van deze shadow-only slice. Zij activeert geen IndexedDB-readpad en geeft geen toestemming voor legacy-opruiming of een volgende migratieslice.

## Afwijkingen en onzekerheden

- De storage-specifieke browsergate is groen; twee bestaande UI-karakterisaties zijn rood door baseline-/verwachtingsverschillen buiten storage.
- IndexedDB-quota-uitputting en een browserstorage-estimate zijn niet beschikbaar gebleken.
- De legacy-bron kan in deze Chromium-omgeving geen 6 MiB-record dragen; de bewezen succesvolle grotere migratie is 2 MiB.
- Multi-tabgelijktijdigheid is nog geen acceptatieonderdeel; bronchecks voorkomen overschrijven, maar gelijktijdige exports verdienen later een aparte race-test.
- De bestaande vijf UI-browserkarakterisaties blijven eveneens overgeslagen. Er is geen nieuwe visuele baseline nodig omdat index, HTML, CSS en features onaangeraakt zijn, maar automatische visuele regressiedekking ontbreekt nog.

## Risico's en rollback

| Risico | Beheersing | Rollback |
| --- | --- | --- |
| IndexedDB werkt anders in een doelbrowser | Geen activering zonder groene browserrunner | Shadow blijft volledig buiten productpad |
| Transactie, quota of onderbreking faalt | Eén generationele transactie; status eerst `pending` | Verwijder alleen generatie en status |
| Bron verandert tijdens migratie | Checksum op drie momenten; veilig stoppen | Shadow-generatie verwijderen; legacy laten staan |
| Mapping verliest onbekende data | Volledige legacy-payload en raw quarantaine | Byte-exact herstellen uit immutable export |
| Dubbele ID's botsen | Namespaced interne `recordKey` | Target verwijderen; legacy-ID blijft ongewijzigd |
| Herhaalde run dupliceert data | Generatie per bronchecksum en hergebruik van verified target | Dezelfde run is een no-op |

De praktische noodrem blijft: deze shadowbestanden worden niet geladen door de app. Terugdraaien van de huidige productwijziging betekent alleen de kleine StorageGateway-wrapper verwijderen; de onderliggende localStorage-semantiek en keys zijn niet veranderd.

## Productwaarheid versus technische validatie

### A — Elise-goedgekeurde productbesluiten

Geen productbesluit is gewijzigd of toegevoegd. Bestaande semantiek blijft randvoorwaarde.

### B — Researchconclusies

Provenance, reversibiliteit, één extern geheugen en “onbekend blijft onbekend” zijn uitgevoerd als bronpayloadbehoud, checksum, quarantaine, expliciete relations en herstelbaarheid.

### C — Hypotheses

- IndexedDB blijft **kandidaat en shadow-only**; een groen shadow-browsercontract is geen toestemming om het als productstore te activeren.
- Het universele platte Item-model blijft verworpen.
- TypeScript, bundler, Vitest en brede ES-modules blijven niet ingevoerd.
- De storage safety seam is technisch uitvoerbaar gebleken; activering is niet onderzocht of toegestaan.

## Aanbeveling voor de volgende stap

Start nog geen nieuwe migratieslice. De IndexedDB-shadowgate zelf is opgelost. Reconcileer eerst afzonderlijk de twee bestaande browserkarakterisaties: het ontbrekende Orb-label is een echte toegankelijkheidsafwijking; de `•••`-knop vereist vaststelling of de testverwachting verouderd is. Dat mag niet binnen deze storage-opdracht worden gerepareerd.

Ook na een groene gate is de volgende beslissing hooguit toestemming voor verdere shadow-validatie. Een read-switch of legacy-opruiming blijft apart en niet toegestaan.
