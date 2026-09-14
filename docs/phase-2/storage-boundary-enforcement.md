# Fase 2 — Storage Boundary Enforcement

Datum: 2026-09-14  
Branch: `foundation-migration`  
Basis: continuity/documentation truth afgerond  
Status: **afgerond; foundation regression gate groen**

## Doel

Voorkomen dat actieve productfeatures rechtstreeks browser-`localStorage` muteren buiten de bestaande `StorageGateway` om.

Deze slice verandert geen datamodel, geen storagebron, geen productfeature en geen UI. `localStorage` blijft de enige actieve productbron. IndexedDB blijft shadow-only en wordt niet door de normale app geladen.

## Wijzigingen

### 1. Volledige actieve storagegrens

`js/core/storage.js` exposeert nu alle actieve persistentiehandelingen via de `StorageGateway`:

- `getRaw(key)`
- `setRaw(key, value)`
- `read(key, fallback)`
- `write(key, value)`
- `remove(key)`

`getRaw` en `setRaw` zijn toegevoegd zodat bestaande raw-stringsemantiek, zoals de wishlist-tipflag, bytecompatibel via dezelfde gateway kan blijven lopen.

### 2. Directe feature-bypasses verwijderd

De repositoryguard bracht drie directe featuretoegangen aan het licht. Ze zijn allemaal via de gateway geleid:

- `js/features/settings.js` — verwijderen van alle persistente LumiVault-keys loopt via `remove(key)`;
- `js/features/task-capture.js` — verwijderen van action draft loopt via `remove(KEYS.actionDraft)`;
- `js/features/wishlist.js` — de bestaande raw tipflag loopt via `getRaw(KEYS.tip)` en `setRaw(KEYS.tip, 'shown')`, zodat de bestaande raw waarde `shown` behouden blijft.

De tijdelijke sessieflag `lumiCheckinOffered` blijft `sessionStorage` gebruiken. Dat is sessiestatus en geen persistente LumiVault-productstore.

### 3. Repositoryguard

`tests/storage-boundary-enforcement.test.js` leest de actieve `<script src>`-bestanden uit `index.html` en faalt wanneer een actief productscript buiten `js/core/storage.js` rechtstreeks `localStorage` gebruikt.

De guard beschermt daarmee de architectuurgrens tegen toekomstige regressie.

### 4. Reproduceerbare CI-gate

Nieuw:

`.github/workflows/foundation-tests.yml`

De workflow draait op iedere push naar `foundation-migration`, op pull requests en handmatig. De gate gebruikt Node 22 en draait de niet-browsergebonden foundationtests voor:

- storagekarakterisatie;
- lifecycle;
- recurrence;
- storage migration spike;
- storage safety seam;
- storage boundary enforcement.

De browsercontractgate uit de storage-safetyfase blijft een aparte bewezen browsergate; deze CI-workflow vervangt die niet.

## Validatieresultaat

De eerste CI-run deed precies wat de guard moest doen en vond nog twee bestaande bypasses in `wishlist.js` en `task-capture.js`. Die run was rood en is niet stil aangepast.

Na het herstellen van beide bypasses is workflowrun `34819901492` groen afgerond op commit:

`cdbe09565503fb427cc7a201ffbc869728f89573`

Resultaat van de foundation regression set:

- **45 tests**
- **45 geslaagd**
- **0 mislukt**
- **0 overgeslagen**

Daarmee is de eerdere `validation pending` opgeheven.

## Scope die bewust niet is gewijzigd

- geen IndexedDB read-switch;
- geen legacy-key gewijzigd of verwijderd;
- geen data gemigreerd;
- geen bootstraprefactor;
- geen UI/CSS-wijziging;
- geen Capture-, Vault- of Decision Engine-redesign;
- geen cloud-, auth-, AI- of billingcode;
- het losse niet-actieve `js/storage.js` ES-modulebestand is niet geactiveerd of verwijderd;
- `index.html` laadt uitsluitend `js/core/storage.js` als actieve storagecode.

## Exitpoort

| Criterium | Status |
| --- | --- |
| Alle actieve producttoegang tot `localStorage` loopt via storagegrens | **Behaald** |
| Raw en JSON-semantiek blijven beschikbaar via één gateway | **Behaald** |
| `localStorage` blijft enige actieve productbron | **Behaald** |
| Geen IndexedDB read-switch | **Behaald** |
| Geen product/UI/datamodelwijziging | **Behaald** |
| Automatische guard tegen nieuwe actieve `localStorage`-bypasses | **Behaald** |
| Reproduceerbare foundation CI-gate aanwezig | **Behaald** |
| Foundation regression set groen | **Behaald: 45/45** |

**Formele status: exitpoort behaald.**

## Volgende funderingsslice

De volgende stap is **Bootstrap + module boundaries**.

Doel daarvan is niet om de app ineens om te bouwen naar een framework of ES-modules. Eerst wordt de huidige startknoop gecontroleerd opgesplitst in herkenbare verantwoordelijkheden, met behoud van bestaand gedrag en de nu groene foundationgate.
