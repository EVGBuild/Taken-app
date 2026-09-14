# Fase 2 — i18n Foundation

Datum: 2026-09-14  
Branch: `foundation-migration`  
Status: **afgerond**

## Doel

Vertaalcopy losmaken van functionele applicatiecode zodat LumiVault later extra talen kan toevoegen zonder productlogica te verbouwen.

## Uitgevoerd

- Nederlandse vertalingen staan nu in `js/i18n/locales/nl.js`.
- Engelse vertalingen staan nu in `js/i18n/locales/en.js`.
- `js/core/i18n.js` bezit alleen nog locale-selectie, fallback, interpolatie en `applyI18n()`.
- De vertalingen die `consolidation.js` tijdens runtime met `Object.assign()` toevoegde, zijn naar de locale-bestanden verhuisd.
- Nederlands blijft de expliciete fallbacktaal.
- `en-GB`/`en-US` normaliseren naar `en`; `nl-NL` naar `nl`; nog niet ondersteunde talen vallen veilig terug op `nl`.

## Guardrails

`tests/i18n-foundation.test.js` bewaakt dat:

- NL en EN afzonderlijke locale-bestanden zijn;
- beide talen dezelfde translation keys bevatten;
- featurecode de centrale translation registry niet opnieuw muteert;
- core i18n geen productcopy bevat;
- locale-normalisatie en fallback expliciet blijven.

## Verificatie

GitHub Actions run `34825957348`:

- Node foundation regression gate: groen;
- echte Chromium bootstrap/navigation gate: groen.

## Bewust nog niet gedaan

Deze slice verandert de architectuur, niet alle zichtbare copy. In `index.html` en meerdere runtime-renderers staat nog Nederlandse tekst hardcoded. Dat is bestaande migratieschuld en wordt in kleinere copy-migratieslices naar translation keys verplaatst. Er is nog geen taalkeuzescherm in Settings.

Ook is de huidige classic-scriptloader nog tussenarchitectuur. `core/i18n.js` laadt de twee locale-bestanden parser-synchroon zodat bestaand startupgedrag behouden blijft; bij een latere module/bundlerbeslissing kan dit zonder wijziging van de locale-contracten worden vervangen.

## Exitpoort

| Criterium | Status |
| --- | --- |
| Vertaaldata los van functionele core | Behaald |
| Consolidation muteert vertaalregister niet | Behaald |
| NL/EN key-pariteit automatisch bewaakt | Behaald |
| Veilige locale fallback | Behaald |
| Node regressiegate | Groen |
| Chromium regressiegate | Groen |
| Alle zichtbare copy al gemigreerd | Nog niet; expliciete vervolgslice |

## Volgende stap

Design System Consolidation: de acht huidige CSS-lagen inventariseren en gecontroleerd terugbrengen naar duidelijke token/component/override-grenzen, zonder visuele redesign tijdens de funderingsslice.
