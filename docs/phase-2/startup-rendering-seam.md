# Fase 2 — Bootstrap + Module Boundaries — Slice 3B: Startup rendering seam

Datum: 2026-09-14  
Branch: `foundation-migration`  
Status: **afgerond; Node foundation gate groen; Chromium bootstrap gate groen**

## Doel

De UI-helperlaag niet langer tijdens het laden van `js/core/ui.js` de volledige applicatie laten renderen. De eerste render hoort pas te starten nadat alle featuredefinities die daarvoor nodig zijn daadwerkelijk geladen zijn.

Dit lost de bekende startup/load-orderfout op zonder productgedrag, storagebron, UI-ontwerp of datamodel te wijzigen.

## Bestaande fout

De browserkarakterisatie van Slice 3A maakte een bestaande fout zichtbaar:

```text
ReferenceError: renderHome is not defined
at refresh (js/core/ui.js)
```

`ui.js` riep onderaan tijdens scriptload direct `populateProjects(); refresh(); renderSettings();` aan, terwijl `renderHome()` pas later door `js/features/today.js` werd gedefinieerd. De browser ging daarna verder met laden, maar de applicatie had daarmee een echte verborgen afhankelijkheid van scriptvolgorde en een startup-error.

## Wijzigingen

### 1. UI-laag triggert de eerste render niet meer

De top-level startup-call is uit `js/core/ui.js` verwijderd. `ui.js` definieert de bestaande helpers en wiring nog steeds, maar start niet langer zelfstandig de volledige runtimepresentatie.

### 2. Eén expliciete initialisatieseam

`js/core/init.js` bezit nu:

```js
function initializeRuntimePresentation(){
  populateProjects();
  refresh();
  renderSettings();
  syncVdsNavIcons();
  applyI18n();
}
```

Daarna wordt deze functie één keer aangeroepen.

`init.js` staat in `index.html` na `today.js`, `task-capture.js` en de overige featuredefinities. Daardoor start de eerste volledige render pas wanneer de functies die `refresh()` nodig heeft beschikbaar zijn.

### 3. Automatische startup-boundary guard

Nieuw:

`tests/startup-boundary.test.js`

De guard bewaakt dat:

- `ui.js` niet opnieuw de initiële volledige render gaat uitvoeren;
- `init.js` één expliciete presentatie-initialisatieseam bezit;
- `today.js` en `task-capture.js` vóór `init.js` geladen blijven.

De test is opgenomen in `.github/workflows/foundation-tests.yml`.

## Verificatie

Na de wijziging zijn beide CI-gates groen:

- Node foundation regression gate: **success**, inclusief storage-, lifecycle-, recurrence-, migratie-, storage-boundary-, bootstrap-boundary- en startup-boundarytests;
- echte Chromium bootstrap gate: **success**.

De Chromium-gate start LumiVault met de legacy fixture, controleert startup zonder page errors en verifieert onder andere dat:

- `legacy-localStorage` de actieve storage-adapter blijft;
- taken behouden en genormaliseerd worden;
- lifecycle `waiting` en `later` intact blijft;
- household-context intact blijft;
- projecten en wishlist intact blijven;
- documenten byte-equivalent in de actieve legacy store blijven.

De eerdere `renderHome is not defined` startupfout treedt in deze gate niet meer op.

## Bewust buiten scope

- geen IndexedDB read-switch;
- geen storagekey- of datamodelwijziging;
- geen visuele/CSS-wijziging;
- geen Capture-, Vault- of Decision Engine-wijziging;
- geen i18n-refactor;
- geen framework/bundler/TypeScript;
- geen legacycode verwijderd;
- `showScreen(...)` en de bestaande navigatiebindings zitten nog niet in een eigen lifecycle/install-seam.

## Exitpoort Slice 3B

| Criterium | Status |
| --- | --- |
| UI-helperlaag start niet langer voortijdig de volledige render | Behaald |
| Initial render heeft één expliciete init-seam | Behaald |
| Vereiste featurefuncties zijn geladen vóór init | Behaald |
| Bekende `renderHome` load-orderfout verwijderd | Behaald |
| Node foundation regression gate | Groen |
| Chromium startup/data gate | Groen |
| Storagebron en productgedrag ongewijzigd | Behaald |

Slice 3B is daarmee formeel gesloten.

## Volgende stap

Slice 3C: **navigation wiring boundary**. De bestaande `showScreen(...)`, primaire nav-bindings, Vault-terugknoppen en modulesprongen worden eerst als één expliciete navigatieverantwoordelijkheid afgebakend. Dat moet opnieuw zonder routes, schermgedrag of UI te veranderen.
