# Fase 2 — Design System Consolidation

Datum: 2026-09-14  
Branch: `foundation-migration`  
Status: **afgerond — logische CSS-grenzen vastgelegd en automatisch bewaakt**

## Doel

De bestaande acht actieve LumiVault-stylesheets niet blind samenvoegen of visueel herschrijven, maar eerst onderbrengen in expliciete eigenaarsgrenzen met een vaste cascade. Daarmee wordt verdere opschoning controleerbaar zonder het huidige uiterlijk als neveneffect te veranderen.

## Besluit

De acht bestaande CSS-bestanden blijven in deze slice fysiek bestaan. Ze zijn nu echter niet meer een ongedefinieerde stapel overrides: `css/layers.json` is de machine-leesbare bron van waarheid voor zowel volgorde als verantwoordelijkheid.

De actieve cascade blijft exact:

1. `foundation.css`
2. `vds.css`
3. `theme.css`
4. `mobile-polish.css`
5. `mockup-rollout.css`
6. `mockup-fidelity-v2.css`
7. `home-exact.css`
8. `consolidation.css`

## Drie eigenaarszones

### 1. Foundation

`foundation.css`

Verantwoordelijk voor structurele primitives, basislayout en legacy-veilige funderingsregels.

### 2. Design System

- `vds.css`
- `theme.css`
- `mobile-polish.css`

Verantwoordelijk voor visuele tokens, gedeelde componenttaal, navigatie en mobiele presentatie.

### 3. Product Compatibility

- `mockup-rollout.css`
- `mockup-fidelity-v2.css`
- `home-exact.css`
- `consolidation.css`

Dit zijn bestaande product-/fidelity-overrides die bewust blijven staan totdat ze afzonderlijk en visueel gecontroleerd naar het design system kunnen worden gemigreerd. Ze zijn dus compatibiliteitslaag, niet de gewenste eindarchitectuur.

## Automatische guard

Nieuw: `tests/design-system-boundary.test.js`.

Deze bewaakt dat:

- de actieve first-party CSS in `index.html` exact dezelfde cascadevolgorde houdt als het manifest;
- iedere actieve stylesheet exact één eigenaarszone heeft;
- het manifest geen ontbrekende CSS-bestanden bevat.

Hierdoor kan niet ongemerkt een negende losse override-laag ontstaan of een bestaand bestand van plaats veranderen zonder dat CI rood wordt.

## Verificatie

Op commit `98d71e08437916e456863202adb37622cb7f0b04`:

- Node foundation regression gate: **groen**;
- Chromium bootstrap/navigation gate: **groen**.

De cascade zelf is in deze slice niet gewijzigd. Daarmee is dit een architectuurconsolidatie zonder visueel redesign.

## Bewust buiten scope

- geen selectors herschreven;
- geen kleuren, spacing, typography of componentvormgeving gewijzigd;
- geen CSS-bestanden verwijderd;
- geen fysieke bundling/minificatie toegevoegd;
- geen framework of CSS-preprocessor toegevoegd;
- geen product- of UI-featurewijzigingen;
- geen Decision Engine-, Capture- of storagewijzigingen.

## Exitpoort

| Criterium | Status |
| --- | --- |
| CSS-cascade expliciet vastgelegd | Behaald |
| Elke actieve stylesheet heeft één eigenaarszone | Behaald |
| Nieuwe losse override-laag wordt automatisch tegengehouden | Behaald |
| Bestaande cascade ongewijzigd | Behaald |
| Node foundation gate | Groen |
| Chromium gate | Groen |
| Visueel redesign onderdeel van slice | Nee, bewust buiten scope |

## Vervolg

De design-systemfundering is nu veilig genoeg om later compatibiliteits-CSS gecontroleerd af te bouwen. Volgens de foundationvolgorde is de volgende productfundering **RAW Capture + Provenance**: invoer eerst duurzaam bewaren vóór classificatie, met herkomst en reversibiliteit als onderdeel van het datacontract.
