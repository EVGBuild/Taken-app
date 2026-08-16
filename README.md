# LumiVault — technische architectuur

LumiVault is momenteel een browser-app in HTML, CSS en JavaScript zonder framework of buildstap. De architectuur is bewust licht gehouden: bestanden worden rechtstreeks door `index.html` geladen, in een vaste volgorde. Dat maakt de app ook zonder Codex onderhoudbaar.

## Belangrijkste regels

- `index.html` bevat de schermen en modals, maar geen applicatielogica.
- Nieuwe featurelogica hoort in `js/features/`; algemene infrastructuur in `js/core/`; pure helpers in `js/utils/`.
- De localStorage-sleutels in `js/core/storage.js` zijn een compatibiliteitscontract. Niet hernoemen zonder expliciete datamigratie.
- Voeg geen nieuwe directe localStorage-toegang toe als `read()`/`write()` volstaan.
- Houd recommendation-logica los van Home-weergave.
- Houd datum-/herhalingsberekeningen in `js/utils/dates.js`; datum-UI hoort bij task/capture-logica totdat een zelfstandige date-picker component nodig is.
- Refactors mogen niet stilletjes productgedrag of styling veranderen.

## Entry point

`index.html` laadt alle scripts met `defer` in een vaste volgorde. `js/app.js` is alleen nog een retired/compatibility-bestand en wordt niet geladen.

## Core

- `js/core/storage.js` — localStorage keys, `read()` en `write()`.
- `js/core/bootstrap.js` — data inlezen/normaliseren, gedeelde runtime-state en eerste basisverbindingen.
- `js/core/ui.js` — generieke UI-bouwstenen zoals overlays, menu's, bevestigen, undo, toast, empty states en drag/reorder.
- `js/core/navigation.js` — navigatiepresentatie, actieve tab, VDS-iconen en ambient Lumi-gedrag.
- `js/core/init.js` — laatste initialisatie nadat alle features geladen zijn.

## Utilities

- `js/utils/dates.js` — datum parsing/formatting en recurrence/next-due berekeningen.
- `js/utils/formatting.js` — prijs- en duurweergave.
- `js/utils/helpers.js` — generieke helpers zoals IDs en number-normalisatie.

## Features

- `js/features/tasks.js` — basis taakweergave, taakdetail, taakformulier, deadlinekalender, herhaling en basis-saveflow.
- `js/features/task-capture.js` — latere capture/draft-functionaliteit en definitieve actieve taak-submitflow.
- `js/features/projects.js` — projecten en projectdetail.
- `js/features/wishlist.js` — aankopen/wensen.
- `js/features/lists.js` — lijstjes, sublijstjes en list-detail.
- `js/features/ideas.js` — ideeën.
- `js/features/inbox.js` — Nog uitzoeken en conversie naar andere objecttypen.
- `js/features/capture.js` — universele capture en objecttypekeuze.
- `js/features/recommendations.js` — recommendation scoring en sets; rendert Home niet.
- `js/features/home.js` — Home-presentatie; berekent recommendations niet zelf.
- `js/features/checkin.js` — check-in UI-controller.
- `js/features/checkin-context.js` — huidige dagbelasting/check-in context en mobile recovery-gedrag.
- `js/features/today.js` — Today-interactie, wisselen/ordenen en feedbackgedrag.
- `js/features/finance-documents.js` — Financiën en Documenten.
- `js/features/presentation.js` — gedeelde recente Vault/presentatie-updates die meerdere features raken.
- `js/features/settings.js` — instellingen, accessibility-voorkeuren en lokale-data-controls.

## CSS

De oude cascade is zonder inhoudelijke wijziging in vier opeenvolgende bestanden gesplitst. De concatenatie van deze vier bestanden is byte-for-byte gelijk aan de vorige `style.css`.

- `css/foundation.css` — oorspronkelijke basis, formulieren, algemene componenten en vroege responsive regels.
- `css/vds.css` — VDS/thema-overgang en bijbehorende layouts.
- `css/theme.css` — latere design-system/presentatielagen.
- `css/mobile-polish.css` — meest recente mobile/polish overrides.

`style.css` blijft alleen als retired compatibility-bestand bestaan en wordt niet meer geladen.

## Waar wijzig ik…?

- Recommendation ranking → `js/features/recommendations.js`
- Home recommendations/weergave → `js/features/home.js` + `js/features/today.js`
- Check-in → `js/features/checkin.js` + `js/features/checkin-context.js`
- Taakformulier / verplichte taakvelden → `js/features/tasks.js` en de definitieve submitflow in `js/features/task-capture.js`
- Datum parsing / recurrence → `js/utils/dates.js`
- Projecten → `js/features/projects.js`
- Aankopen/wensen → `js/features/wishlist.js`
- Lijstjes → `js/features/lists.js`
- Inbox/Nog uitzoeken → `js/features/inbox.js`
- Financiën/documenten → `js/features/finance-documents.js`
- Settings → `js/features/settings.js`
- Bottom navigation / globale add / actieve navigatiecontext → `js/core/navigation.js` en `js/core/ui.js`
- Algemene styling → `css/foundation.css`
- Recente/mobile overrides → `css/mobile-polish.css`

## Bekende architectuurkeuze

De JavaScriptbestanden zijn op dit moment klassieke browser-scripts die in een vaste volgorde worden geladen en dezelfde globale lexical scope delen. Dit is bewust gekozen als tussenweg: het maakt de monoliet direct fysiek modulair zonder een framework, bundler of grote rewrite te introduceren. Voor de huidige schaal van LumiVault is lokale vindbaarheid en veilige handmatige vervanging belangrijker dan een complex modulesysteem.

Wanneer een domein later verder groeit, kan dat specifieke bestand alsnog intern naar ES modules/factories worden omgezet. Dat hoeft niet applicatiebreed tegelijk.

## Regression discipline

Na architectuurwijzigingen minimaal controleren:

- Home en bottom navigation
- check-in en Aanpassen
- recommendations wisselen/afronden
- taak nieuw/bewerken/verwijderen
- verplichte taakvelden
- deadline en recurrence
- projecten
- aankopen/wensen
- lijstjes/sublijstjes
- ideeën en Nog uitzoeken
- Financiën en Documenten
- Settings
- refresh: bestaande localStorage-data blijft intact
- browserconsole: geen uncaught JavaScript-errors
