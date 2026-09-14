# Fase 2 — Bootstrap + Module Boundaries — Slice 3A: Data-load seam

Datum: 2026-09-14  
Branch: `foundation-migration`  
Status: **implementatie afgerond; Node foundation gate groen; browserkarakterisatie nog niet opnieuw uitgevoerd voor deze slice**

## Doel

De eerste veilige stap in het verkleinen van `js/core/bootstrap.js`: persisted data lezen en legacy/default-normalisatie als één expliciete verantwoordelijkheid afbakenen, zonder productgedrag, storagebron, UI, navigatie of datamodel te wijzigen.

Dit is bewust geen brede module-/frameworkrefactor.

## Wijziging

`bootstrap.js` bevat nu één expliciete seam:

```js
function loadBootstrapData() { ... }
```

Deze functie bezit de persisted reads voor de bootstrapfase en retourneert één `bootstrapData`-resultaat. De bestaande mutable runtimevariabelen (`actions`, `projects`, `wishlist`, `bucketlist`, `lists`, `ideas`, `inbox`, `financeItems`, `documents`, `appSettings`, `energy`, `checkin`, `feedbackDraft`) worden daarna uit dat resultaat geïnitialiseerd.

De bestaande normalisatie, defaults, legacycompatibiliteit en startup-writes zijn inhoudelijk behouden. `localStorage` blijft via de bestaande StorageGateway lopen.

## Waarom deze seam eerst

Voorheen waren persisted reads, normalisatie, globale runtime state en DOM-/navigatiewiring in één doorlopende top-level bootstrapstroom verweven. Door de data-loadstap eerst af te bakenen ontstaat een controleerbare grens waar later een andere storage-/syncbron achter kan worden gezet zonder tegelijk UI-wiring te hoeven herschrijven.

## Automatische guard

Nieuw:

`tests/bootstrap-boundary.test.js`

De test bewaakt dat:

- persisted `read(KEYS.*)`-calls in `bootstrap.js` binnen `loadBootstrapData()` blijven;
- de data-loadseam geen DOM-, render- of navigatiewiring bevat;
- mutable runtime state expliciet uit `bootstrapData` wordt geïnitialiseerd.

De test is toegevoegd aan `.github/workflows/foundation-tests.yml`.

## Verificatie

De GitHub Actions Foundation regression gate is na deze wijziging groen op de Node-teststap, inclusief de nieuwe bootstrap-boundarytest en de bestaande storage/lifecycle/recurrence/migratie/safety-tests.

De browserkarakterisatietests zijn in deze CI-workflow nog niet aangesloten en zijn voor deze bootstrapwijziging dus nog niet opnieuw als echte browsergate uitgevoerd. Daarom wordt de volledige Bootstrap + Module Boundaries-fase nog niet als afgesloten beschouwd.

## Bewust buiten scope

- geen IndexedDB read-switch;
- geen storagekey- of datamodelwijziging;
- geen UI/CSS-wijziging;
- geen Capture-, Vault- of Decision Engine-wijziging;
- geen i18n-refactor;
- geen framework, bundler, TypeScript of repo-brede ES-modulemigratie;
- geen legacycode verwijderd;
- navigation/showScreen nog niet verplaatst;
- DOM-installatie/wiring nog niet verplaatst.

## Exitpoort Slice 3A

| Criterium | Status |
| --- | --- |
| Persisted reads expliciet afgebakend | Behaald |
| Data-loadseam bevat geen DOM/render/navigation | Behaald |
| Runtime state initialiseert uit één bootstrapData-resultaat | Behaald |
| StorageGateway blijft actief | Behaald |
| Node foundation regression gate | Groen |
| Echte browserkarakterisatie na runtimewijziging | **Nog te verifiëren** |

## Volgende stap

Eerst de bestaande browserkarakterisatie opnieuw groen bewijzen tegen deze branch. Pas daarna Slice 3B: UI/navigation wiring uit de top-level bootstrapstroom afbakenen, opnieuw zonder productgedrag te wijzigen.
