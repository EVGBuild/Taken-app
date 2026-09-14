# LumiVault Continuity & Recovery Runbook

Datum: 2026-09-14  
Branch tijdens opstellen: `foundation-migration`  
Doel: LumiVault moet zonder eerdere ChatGPT-gesprekken en zonder afhankelijkheid van één host/provider overdraagbaar, testbaar en herstelbaar blijven.

## 1. START HERE

Als je deze repository voor het eerst ziet, lees in deze volgorde:

1. `README.md` — actuele code- en runtimekaart.
2. `docs/phase-0/decision-register.md` — goedgekeurde productbesluiten, researchconclusies en hypotheses.
3. `docs/phase-1/storage-safety-seam-report.md` — bewezen storageveiligheid en migratiegrenzen.
4. `docs/phase-2/foundation-architecture-contract.md` — bindende architectuurprincipes voor toekomstige groei.
5. `docs/phase-2/foundation-architecture-audit.md` — actuele gaten, risico's en aanbevolen migratieslices.
6. Dit document — starten, testen, back-uppen en herstellen zonder chatcontext.

## 2. Product in één alinea

LumiVault is een local-first extern geheugen en beslissingssysteem. De kernnavigatie is **Home → Orb → Vault**. De app bewaart informatie, beheert lifecycle zoals Open/Wachten/Later, en helpt bepalen wat op een gegeven moment logisch past. Capture hoort uiteindelijk vóór classificatie te komen: eerst veilig bewaren, daarna pas begrijpen/verrijken. De gebruiker houdt autoriteit; AI mag later ondersteunen maar niet de enige bron van kernlogica worden.

## 3. Actuele technische waarheid

### Runtime

- Browserapp in HTML/CSS/JavaScript.
- Geen framework en geen buildstap vereist voor de huidige app.
- Klassieke `<script>`-bestanden worden in vaste volgorde geladen vanuit `index.html`.
- Deze globale scriptarchitectuur is een **tussenarchitectuur**, geen gewenst eindmodel.

### Storage

- `localStorage` is de enige actieve product-read/write-bron.
- De actieve gateway staat in `js/core/storage.js`.
- IndexedDB bestaat alleen als shadow-/migratiekandidaat onder `js/storage/`.
- Er is **geen** IndexedDB read-switch.
- Legacy-data/code mag niet worden verwijderd zonder aparte migratiegate.

### Belangrijk bewezen storagepunt

De storage safety seam heeft export, checksum, lossless conversie, verificatie, round-trip, rollback en echte Chromium-IndexedDB-contracttests doorlopen. Zie `docs/phase-1/storage-safety-seam-report.md`.

### Bekende tussenarchitectuur

- `bootstrap.js` bezit nog te veel verantwoordelijkheden.
- Veel features delen browserglobals en zijn afhankelijk van scriptvolgorde.
- i18n is centraal begonnen maar nog niet schaalbaar naar meerdere locale-files.
- zichtbare copy staat nog deels hardcoded in HTML/runtimecode.
- meerdere CSS-generaties worden tegelijk geladen.
- RAW Capture/provenance is nog niet als kerncontract geïmplementeerd.

## 4. Repositorykaart

```text
index.html
│
├─ css/
│  ├─ foundation.css
│  ├─ vds.css
│  ├─ theme.css
│  ├─ mobile-polish.css
│  ├─ mockup-rollout.css
│  ├─ mockup-fidelity-v2.css
│  ├─ home-exact.css
│  └─ consolidation.css
│
├─ js/core/
│  ├─ storage.js
│  ├─ i18n.js
│  ├─ task-model.js
│  ├─ bootstrap.js
│  ├─ ui.js
│  ├─ navigation.js
│  └─ init.js
│
├─ js/features/
│  ├─ recommendations.js
│  ├─ checkin.js
│  ├─ home.js
│  ├─ tasks.js
│  ├─ projects.js
│  ├─ wishlist.js
│  ├─ lists.js
│  ├─ ideas.js
│  ├─ inbox.js
│  ├─ capture.js
│  ├─ today.js
│  ├─ task-capture.js
│  ├─ bucketlist-chores.js
│  ├─ finance-documents.js
│  ├─ settings.js
│  ├─ presentation.js
│  └─ consolidation.js
│
├─ js/storage/
│  ├─ indexeddb-shadow-adapter.js
│  ├─ migration-core.js
│  └─ storage-safety-seam.js
│
├─ tests/
└─ docs/
```

Deze kaart beschrijft de **huidige** repository. De gewenste toekomstige ownershiplagen staan in `docs/phase-2/foundation-architecture-contract.md`.

## 5. Lokaal starten zonder AI

De huidige app heeft geen buildstap nodig.

### Minimale route

1. Zorg dat de repository lokaal aanwezig is.
2. Checkout de gewenste branch/commit.
3. Serveer de repository als statische site vanuit de repositoryroot.
4. Open `index.html` via die lokale server in een moderne browser.

Een algemene, provider-onafhankelijke manier op een computer met Python is bijvoorbeeld:

```bash
python -m http.server 8000
```

Open daarna:

```text
http://localhost:8000/
```

Dit commando is een algemene statische-servermethode; het is geen LumiVault-specifieke dependency of buildtool.

## 6. Tests draaien

De bewezen huidige Node-testsuite draait met:

```bash
node --test tests/*.test.js
```

Belangrijk:

- storage-, lifecycle-, recurrence- en migratietests draaien met `node:test`;
- browserkarakterisatietests vereisen een beschikbare echte browser/Chromium-omgeving;
- een ontbrekende browserbinary mag niet worden geïnterpreteerd als een productpass;
- storage-activatie of migratie-read-switch mag nooit alleen op unit-tests worden gebaseerd.

## 7. Vóór iedere grote technische wijziging

Controleer minimaal:

- welke productbesluiten geraakt worden;
- welke bestaande flows/tests de baseline vormen;
- welke data kan veranderen;
- of export nodig is vóór conversie;
- wat rollback is;
- welke exitgate groen moet zijn;
- of UI/featuregedrag buiten scope hoort te blijven.

Geen brede refactor, frameworkmigratie, storage-switch of dataverwijdering zonder expliciet rollbackpad.

## 8. Back-upmodel: drie onafhankelijke kopieën

LumiVault is pas voldoende provider-onafhankelijk als er steeds drie kopieën bestaan:

### Kopie A — lokale Git-repository

Een volledige lokale clone met volledige `.git`-historie.

### Kopie B — remote Git-host

Nu GitHub. GitHub is een host en samenwerkingskopie, niet de enige bron.

### Kopie C — onafhankelijk archief

Een periodieke volledige repository-export/clone buiten GitHub, samen met relevante documentatie en later ook productdata-export. Geschikte opslag is bijvoorbeeld een lokale/externe schijf en/of een onafhankelijke Drive-map.

### Minimale inhoud van Kopie C

- volledige repository inclusief Git-historie waar mogelijk;
- `docs/`;
- actuele release/commitreferentie;
- eventuele data-export;
- dit recovery-runbook.

## 9. Aanbevolen back-upfrequentie

Tot er echte externe gebruikers of clouddata zijn:

- **na iedere afgesloten funderings-/migratieslice:** maak of ververs de onafhankelijke repo-back-up;
- **na iedere belangrijke release:** bewaar een herkenbare releasekopie/tag + documentatie;
- **vóór iedere datamigratie:** immutable data-export volgens het migratiecontract.

Wanneer echte gebruikers/clouddata bestaan, moet daarnaast een apart geautomatiseerd databack-upbeleid worden ontworpen.

## 10. Herstel als GitHub verdwijnt

Als GitHub niet beschikbaar is:

1. gebruik de lokale clone of onafhankelijke archiefkopie;
2. controleer `git log` en de laatst bekende stabiele commit;
3. serveer de app lokaal;
4. draai de tests;
5. maak indien gewenst een nieuwe remote bij een andere Git-host;
6. push de volledige repository/historie daarheen.

De apparchitectuur mag geen GitHub-specifieke runtimeafhankelijkheid hebben.

## 11. Herstel als ChatGPT/Codex verdwijnt

Er is geen AI nodig om de huidige kernapp te draaien.

Een developer moet verder kunnen op basis van:

- repository;
- README;
- decision register;
- architecture contract;
- architecture audit;
- tests;
- storage/migratierapport;
- dit runbook.

Belangrijke nieuwe besluiten horen daarom altijd in de repositorydocumentatie en niet alleen in chatgeschiedenis.

## 12. Herstel van productdata

### Huidige situatie

Productdata leeft lokaal in browser-`localStorage` onder zestien bekende keys uit `js/core/storage.js`.

### Veilige migratie-/herstelprincipes

- export vóór conversie;
- bronbytes/checksum behouden;
- target eerst shadow;
- verified pas na read-back + round-trip;
- rollback verwijdert target/shadow, niet de bron;
- legacybron blijft actief totdat aparte read-switchgate groen is.

Voor exacte migratiedetails: `docs/phase-1/storage-safety-seam-report.md`.

### Nog ontbrekend voor normale eindgebruikers

Er is nog geen gebruiksvriendelijke "Exporteer mijn volledige LumiVault" / "Herstel LumiVault"-flow in de product-UI. Dit blijft een belangrijk continuity-item vóór brede ingebruikname.

## 13. Externe runtime-afhankelijkheden

De huidige presentatie haalt onder meer assets extern op:

- Plus Jakarta Sans via Google Fonts;
- Phosphor Icons via jsDelivr.

Als die providers uitvallen, kan de presentatie degraderen. Dit is geen storage/data-single-point-of-failure, maar hoort vóór productie bewust te worden opgelost of geaccepteerd met fallbacks/lokale assets.

## 14. Bekende gaten die een nieuwe developer niet zelf mag 'oplossen'

Zonder apart besluit niet stil wijzigen:

- IndexedDB activeren als product-readstore;
- legacykeys of legacycode verwijderen;
- Recommendation Engine vervangen;
- universeel plat Item-model invoeren;
- TypeScript/framework/bundler repo-breed invoeren;
- productbesluiten uit hypotheses afleiden;
- UI-baselinefouten stil groen maken door tests aan te passen.

## 15. Eerstvolgende architectuurvolgorde

```text
CONTINUITY / DOCUMENTATION TRUTH
        ↓
STORAGE BOUNDARY ENFORCEMENT
        ↓
BOOTSTRAP + MODULE SEAMS
        ↓
I18N FOUNDATION
        ↓
DESIGN-SYSTEM CONSOLIDATION
        ↓
RAW CAPTURE + PROVENANCE
        ↓
DOMAIN IDENTITY + RELATIONS
        ↓
CONNECTED VAULT
        ↓
DECISION ENGINE V2
        ↓
AI SERVICE
        ↓
CLOUD / AUTH / SYNC
        ↓
ENTITLEMENTS / BILLING
```

## 16. Exitgate Continuity-slice

Deze continuity-slice is pas compleet wanneer:

- dit runbook in de repository staat;
- de root README de actuele repository correct beschrijft;
- oude/verwijderde bestanden niet meer als actueel worden genoemd;
- start- en testprocedure zonder AI beschreven zijn;
- drie-kopieën-backupbeleid expliciet is;
- herstel bij verlies van ChatGPT of GitHub beschreven is;
- dataherstelprincipes verwijzen naar het bewezen storagecontract;
- open gaten expliciet als open gat blijven staan.

Dit document voert geen productcode-, UI-, feature-, storage-readswitch- of Decision Engine-wijziging uit.
