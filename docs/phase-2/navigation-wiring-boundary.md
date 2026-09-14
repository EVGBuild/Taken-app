# Fase 2 — Bootstrap + Module Boundaries — Slice 3C: Navigation Wiring Boundary

Datum: 2026-09-14  
Branch: `foundation-migration`  
Status: **afgerond; Node foundation gate groen; echte Chromium navigatiegate groen**

## Doel

Navigatierouting en navigatie-eventwiring uit `js/core/bootstrap.js` halen en onder één expliciete verantwoordelijkheid in `js/core/navigation.js` brengen, zonder productgedrag, UI, storagebron of datamodel te wijzigen.

## Wijzigingen

### 1. `bootstrap.js` bezit geen schermrouting meer

Uit `js/core/bootstrap.js` zijn verwijderd:

- `showScreen(...)`;
- bottom-navigation clickwiring;
- Vault-terugknoppen;
- moduleknoppen voor Masterlist, Kopen, Lijstjes, Ideeën, Bucketlist en Huishouden;
- Vault-zoekveld-wiring.

`bootstrap.js` houdt voorlopig alleen de gedeelde runtime-state en `syncGlobalAdd()` die nog door UI-overlaygedrag wordt gebruikt.

### 2. `navigation.js` bezit routing en wiring

`js/core/navigation.js` bevat nu expliciet:

- `navContextFor(screen)`;
- `showScreen(name)`;
- `wireNavigation()`;
- bottom-navigation wiring;
- Vault/module/back wiring;
- Vault-zoekveld-wiring;
- bestaande navigatie-iconen en ambient navigation presentation-hooks.

De bestaande renders per scherm en de bestaande Home → Orb/Vault navigatiebetekenis zijn inhoudelijk niet veranderd.

### 3. Automatische architectuurguard

Nieuw:

`tests/navigation-boundary.test.js`

De guard bewaakt dat:

- `bootstrap.js` geen `showScreen()` meer definieert;
- bootstrap geen nav-button/vault-back/Vault-search wiring meer bezit;
- `navigation.js` zowel routing als de expliciete `wireNavigation()`-seam bezit.

De test is opgenomen in de Foundation regression gate.

### 4. Chromium-gate uitgebreid

`tests/bootstrap-browser-gate.test.js` controleert nu naast startup/data ook echte navigatie:

1. Home start actief;
2. bottom-nav opent Vault;
3. Masterlist-module opent Masterlist;
4. Masterlist-terugknop keert terug naar Vault;
5. tijdens deze flow ontstaan geen browser page errors.

De tijdelijke tolerantie voor de eerder opgeloste `renderHome is not defined`-fout is verwijderd. De browsergate vereist nu opnieuw nul page errors.

## Verificatie

GitHub Actions run `34822819524` op commit `3a41ee5ab8080c368d6dfca82b9994bdddfc1de6`:

- `node-foundation-tests`: **success**;
- `chromium-bootstrap-gate`: **success**.

Daarmee is zowel de architectuurgrens als de actuele browserflow groen bewezen.

## Bewust buiten scope

- geen IndexedDB read-switch;
- geen storagekey- of datamodelwijziging;
- geen UI/CSS-wijziging;
- geen Capture-, Vault- of Decision Engine-herontwerp;
- geen i18n-refactor;
- geen framework, bundler, TypeScript of repo-brede ES-modulemigratie;
- geen legacy-data of legacycode verwijderd;
- `syncGlobalAdd()` en andere algemene UI-helpers zijn nog niet verder opgesplitst.

## Exitpoort Slice 3C

| Criterium | Status |
| --- | --- |
| Bootstrap bezit geen screen routing | Behaald |
| Navigation core bezit routing + wiring | Behaald |
| Automatische boundary guard | Groen |
| Bestaande storage-/lifecycle-/recurrence-/migratiegates | Groen |
| Echte Chromium startupgate | Groen |
| Echte Chromium Vault → Masterlist → Vault navigatie | Groen |
| Geen browser page errors | Groen |
| Geen product/UI/datamodelwijziging | Behaald |

**Slice 3C is gesloten.**

## Volgende stap

De eerstvolgende funderingsstap is de **i18n/meertaligheidsfundering**: zichtbare copy en locale-configuratie scheiden van applicatielogica, uitbreidbaar maken naar extra talen en locale-aware formatting afdwingbaar maken zonder productfeatures te veranderen.
