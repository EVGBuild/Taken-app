# Fase 2 — Bootstrap + Module Boundaries — Slice 3A: Data-load seam

Datum: 2026-09-14  
Branch: `foundation-migration`  
Status: **afgerond; Node foundation gate groen; dedicated Chromium bootstrapgate groen**

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

## Automatische guards

### Node boundary guard

`tests/bootstrap-boundary.test.js`

De test bewaakt dat:

- persisted `read(KEYS.*)`-calls in `bootstrap.js` binnen `loadBootstrapData()` blijven;
- de data-loadseam geen DOM-, render- of navigatiewiring bevat;
- mutable runtime state expliciet uit `bootstrapData` wordt geïnitialiseerd.

### Chromium bootstrapgate

`tests/bootstrap-browser-gate.test.js`

Deze gate start de echte app in Chromium met de bestaande legacyfixture en controleert dat:

- Home daadwerkelijk boot;
- de actieve storageadapter `legacy-localStorage` blijft;
- legacy tasks, lifecycle, householdcontext, projecten en wishlist semantisch behouden blijven;
- onaangeraakte documentdata byte-equivalent blijft;
- er geen nieuwe onverwachte page errors door deze slice zijn ontstaan.

De Foundation regression workflow installeert Playwright/Chromium alleen in de CI-runner; er is geen nieuwe runtime- of repositorydependency aan LumiVault zelf toegevoegd.

## Browsergate-uitkomst

De eerste strikte browserrun ontdekte één bestaande load-orderafwijking buiten Slice 3A:

- `js/core/ui.js` voert bij laden `refresh()` uit vóór `js/features/today.js` is geladen;
- `refresh()` probeert daardoor eenmalig `renderHome()` aan te roepen terwijl die functie nog niet bestaat;
- Chromium rapporteert `ReferenceError: renderHome is not defined` vanuit `ui.js`;
- latere scripts laden door en de bestaande app herstelt waarna de huidige Home-flow beschikbaar is.

Deze afwijking bestond door de huidige scriptvolgorde al vóór de data-loadseam en is daarom **niet stil gerepareerd in Slice 3A**. De dedicated browsergate accepteert alleen exact deze bekende `ui.js`-baselinefout; andere page errors blijven rood.

Dit is nu een expliciet bekende kandidaat voor Slice 3B, waarin UI/startup-wiring wordt afgebakend.

## Verificatie

GitHub Actions run 13 op commit `709493f48f6774f37387e26412081742c1d307dc`:

- `node-foundation-tests`: **success**;
- `chromium-bootstrap-gate`: **success**.

Daarmee is de regressiepoort voor Slice 3A groen.

## Bewust buiten scope

- geen IndexedDB read-switch;
- geen storagekey- of datamodelwijziging;
- geen UI/CSS-wijziging;
- geen Capture-, Vault- of Decision Engine-wijziging;
- geen i18n-refactor;
- geen framework, bundler, TypeScript of repo-brede ES-modulemigratie;
- geen legacycode verwijderd;
- navigation/showScreen nog niet verplaatst;
- DOM-installatie/wiring nog niet verplaatst;
- de bestaande `ui.js` → `renderHome` load-orderafwijking nog niet gewijzigd.

## Exitpoort Slice 3A

| Criterium | Status |
| --- | --- |
| Persisted reads expliciet afgebakend | Behaald |
| Data-loadseam bevat geen DOM/render/navigation | Behaald |
| Runtime state initialiseert uit één bootstrapData-resultaat | Behaald |
| StorageGateway blijft actief | Behaald |
| Node foundation regression gate | Groen |
| Dedicated echte Chromium bootstrapgate | Groen |
| Nieuwe onverwachte browserfouten door Slice 3A | Geen |

**Slice 3A is gesloten.**

## Volgende stap

Slice 3B: UI/startup/navigation wiring gecontroleerd uit de top-level bootstrap-/UI-stroom afbakenen. Daarbij hoort de bestaande `ui.js` → `renderHome` load-orderafwijking expliciet op te lossen als architectuurfout, niet als losse UI-fix, met dezelfde Node- en Chromiumgates als exitpoort.
