# Fase 2 — Foundation Architecture Audit

Datum: 2026-09-14  
Branch: `foundation-migration`  
Architectuurcontract: `docs/phase-2/foundation-architecture-contract.md`  
Status: **audit afgerond; geen productcode gewijzigd**

## Conclusie in één zin

De **productfundering en storage-safetyfundering zijn sterk genoeg om gecontroleerd verder te bouwen**, maar de **applicatiearchitectuur zelf is nog een tussenarchitectuur**: globale scripts, bootstrap-verantwoordelijkheden, i18n, CSS-lagen, capture en continuïteit moeten eerst in kleine slices worden verstevigd voordat AI, cloud, accounts of abonnementen verantwoord worden toegevoegd.

---

# 1. Schematisch overzicht

```text
PRODUCTVISIE / BESLUITEN                    GROEN
        │
        ▼
LEGACYBASELINE + TESTBESCHERMING            GROEN/ORANJE
        │
        ▼
STORAGE SAFETY / EXPORT / ROLLBACK           GROEN
        │
        ▼
APP-LAGEN & MODULEGRENZEN                    ORANJE  ← eerst verstevigen
        │
        ├── i18n / localization              ORANJE
        ├── design system / CSS              ORANJE
        ├── capture + provenance              ROOD
        ├── domain/data boundaries            ORANJE
        └── continuity / backup / runbook     ROOD
        │
        ▼
CONNECTED VAULT                              ROOD
        │
        ▼
DECISION ENGINE V2                           LATER
        │
        ▼
AI SERVICE                                   LATER
        │
        ▼
CLOUD / AUTH / SYNC                          LATER
        │
        ▼
ENTITLEMENTS / BILLING                       LATER
```

**Betekenis**

- **Groen** — voldoende betrouwbaar fundament; niet opnieuw ontwerpen zonder nieuw bewijs.
- **Oranje** — bruikbaar, maar nog geen schaalbare eindgrens.
- **Rood** — essentieel fundament ontbreekt nog.
- **Later** — hoeft nu niet gebouwd te worden; alleen aansluiting moet vrij blijven.

---

# 2. Auditmatrix

| Gebied | Huidige staat | Risico | Moet nu | Kan later | Voorgestelde slice | Exitgate |
| --- | --- | --- | --- | --- | --- | --- |
| Productwaarheid | Beslisregister scheidt goedgekeurd, research en hypothese | Documenten kunnen uit sync raken | Ja | — | Documentation consistency | README + phase docs spreken elkaar niet meer tegen over actieve architectuur |
| Storage | Gateway + legacy adapter; IndexedDB shadow-only | Nieuwe code kan gateway omzeilen | Ja | Read-switch | Storage boundary cleanup | Geen directe product-`localStorage`-mutaties buiten storagegrens; bestaande semantiek groen |
| Bootstrap | `bootstrap.js` initialiseert data, normaliseert, schrijft, beheert UI/nav en state | Groot wijzigingsoppervlak en impliciete side effects bij opstart | Ja | Volledige frameworkrewrite | Bootstrap seam | Init, data loading/normalisatie en UI wiring als afzonderlijke verantwoordelijkheden herkenbaar/testbaar |
| Modules | Featurebestanden bestaan, maar delen browserglobals | Onzichtbare afhankelijkheden en laadvolgorde | Ja | Brede ES-modulemigratie | Dependency map + module seams | Kritieke domeinfuncties hebben expliciete inputs/outputs; geen big-bang rewrite |
| Capture | Universele capture vraagt eerst classificatie; unknown wordt door consolidation verwijderd | In strijd met Capture First/provenance; gedachte kan niet als ruwe bron veilig bestaan | Ja | AI-interpretatie | RAW capture slice | Ruwe tekst wordt direct duurzaam opgeslagen vóór classificatie; origineel blijft bewaard |
| Data-/domeinmodel | Tasks hebben model; andere modules vooral eigen arrays/structuren | Connected Vault kan weer silo's creëren | Ja, ontwerpgrens | Definitief databaseschema | Domain identity + relation contract | Stabiele identiteit/provenance/relationregels vastgelegd en getest zonder universal flat Item |
| Decision Engine | `recommendations.js` is opslag-onafhankelijk maar berekent één samengestelde score | Huidig prototype kan verward worden met definitieve beslisarchitectuur | Beschermen, niet redesignen | V2 | Characterize only | Huidig gedrag beschermd; nieuwe engine pas na apart ontwerp/validatie |
| i18n | Centrale `LUMI_TRANSLATIONS`, maar NL/EN hardcoded in één JS-bestand; locale selector kent alleen NL/EN | Nieuwe talen vragen codewijziging; zichtbare strings blijven buiten i18n | Ja | Vertaalinhoud DE/ES/IT | Localization foundation | Nieuwe locale kan via bestand/config worden toegevoegd; datum/getal/pluralisatie locale-aware; geen nieuwe zichtbare losse strings |
| UI-copy | Veel Nederlandse tekst staat rechtstreeks in `index.html` en runtime DOM-fragmenten | Onvolledige vertaling en inconsistente copy | Ja, bij i18n slice | Copy-redesign | Extract visible copy | Audit/test detecteert zichtbare hardcoded productstrings |
| CSS/design | `index.html` laadt 8 CSS-lagen incl. rollout/fidelity/exact/consolidation | Cascade/overrides worden nieuwe verborgen architectuur | Ja | Rijke animatie | CSS ownership consolidation | Één duidelijke token/component/override-hiërarchie; geen nieuwe tijdelijke polishlaag |
| Motion/accessibility | Reduced motion setting bestaat; labels deels aanwezig | Geen volledige definition-of-done en baselinefouten bestaan | Ja als contract | Rijke motion | Accessibility baseline | Kernflows voldoen aan labels/focus/reduced motion; bekende Orb-labelafwijking opgelost in eigen slice |
| Externe assets | Google Fonts + jsDelivr Phosphor CSS worden live geladen | App is visueel afhankelijk van externe CDN-beschikbaarheid | Niet blocker, wel vastleggen | Lokale bundling/assets | Dependency resilience | Externe runtime-dependencies geïnventariseerd; offline/fallbackbeleid bepaald |
| Cloud/auth/sync | Niet actief | Te vroeg koppelen creëert vendor lock-in | Nee | Ja | Pas later via adapters | Lokale app blijft zonder backend werken en data blijft exporteerbaar |
| AI | Niet actief in kern | Provider lock-in als later overal direct API-calls komen | Alleen servicecontract later | Ja | AI adapter na kernfundering | App blijft volledig kernbruikbaar zonder AI |
| Billing | Niet actief | Losse betaalchecks kunnen features vervuilen | Nee | Ja | Entitlement layer later | Featurecode vraagt capabilities, niet providerstatus |
| Back-up/herstel | GitHub + lokale ontwikkelkopie; storage export technisch aanwezig | Chat/host/accountverlies kan continuïteit breken | Ja | Automatisering verfijnen | Continuity pack + recovery drill | Schone machine kan repo starten/testen/herstellen zonder eerdere chats |
| CI/release | Tests bestaan; browsergate handmatig/extern uitgevoerd | Geen aantoonbare continue releasebescherming in repo-tree | Ja, lichtgewicht | Zwaardere pipeline | Minimal CI/release gate | Kern unit/storage/browsergate reproduceerbaar gedocumenteerd; releases herkenbaar/versioned |

---

# 3. Concrete bevindingen uit de actuele repository

## 3.1 Storagegrens is goed begonnen, maar nog niet volledig afgedwongen

`js/core/storage.js` heeft nu een echte `StorageGateway` met uitsluitend `legacy-localStorage` als actieve adapter. Dit is de juiste seam.

Maar `js/features/settings.js` verwijdert bij “alle lokale gegevens verwijderen” rechtstreeks keys via `localStorage.removeItem(...)` in plaats van via de gateway. Daarmee bestaat al één concrete bypass van de nieuwe storagegrens.

**Conclusie:** geen nieuw storagedesign nodig; wel één kleine cleanup-slice om directe producttoegang tot browserstorage uit featurecode te verwijderen en vervolgens af te dwingen met een test/lint-achtige repositorycheck.

---

## 3.2 `bootstrap.js` is de grootste architectuurknoop

`js/core/bootstrap.js` doet momenteel onder andere:

- recommendation-engine aanmaken;
- een toekomstige calendar stub definiëren;
- persisted data lezen;
- legacydata normaliseren;
- ontbrekende identifiers genereren;
- sommige genormaliseerde data direct terugschrijven;
- defaults maken;
- globale mutable appstate definiëren;
- savefuncties definiëren;
- DOM-elementen aanmaken;
- navigatie en screens aansturen;
- Vault search wiring installeren.

Dat is functioneel werkend, maar te veel verantwoordelijkheid voor één funderingsbestand.

**Risico:** een toekomstige storage-, sync-, auth- of modulewijziging raakt dezelfde startknoop en kan daardoor onbedoeld productgedrag beïnvloeden.

**Conclusie:** bootstrap niet herschrijven in één keer. Eerst scheiden in kleine seams: data-load/normalization, app-state/init en UI-wiring.

---

## 3.3 Globale scriptarchitectuur is nog expliciet afhankelijk van laadvolgorde

`index.html` laadt tientallen klassieke `<script>`-bestanden in vaste volgorde. Featurebestanden gebruiken globale namen zoals `actions`, `wishlist`, `$`, `showScreen`, `t`, `write`, enzovoort.

Dit is geen acuut defect, maar het maakt grenzen impliciet. De huidige README erkent zelf dat dit een tussenarchitectuur is.

**Conclusie:** nu geen repo-brede ES-module/TypeScript/frameworkmigratie. Wel per toekomstige slice expliciete pure functies/services maken zodat globals geleidelijk minder belangrijk worden.

---

## 3.4 De README is al deels verouderd en vormt een continuïteitsrisico

De README zegt dat vier CSS-bestanden samen de stylesheet vormen, terwijl `index.html` momenteel acht CSS-bestanden laadt:

1. `foundation.css`
2. `vds.css`
3. `theme.css`
4. `mobile-polish.css`
5. `mockup-rollout.css`
6. `mockup-fidelity-v2.css`
7. `home-exact.css`
8. `consolidation.css`

De README noemt bovendien `js/features/checkin-context.js`, terwijl dat bestand niet in de actuele branch-tree staat.

**Conclusie:** documentatie is nog niet betrouwbaar genoeg om een nieuwe developer zonder chatcontext zelfstandig te laten werken. Dit moet vóór verdere architectuurmigratie worden gecorrigeerd.

---

## 3.5 i18n bestaat, maar ondersteunt architectonisch nog maar twee talen

`js/core/i18n.js` bevat NL en EN samen in één bestand. `lumiLocale()` kent feitelijk alleen twee uitkomsten: `en` of `nl`.

Daarnaast bevat `index.html` veel zichtbare Nederlandse tekst rechtstreeks in markup, bijvoorbeeld Home, Settings, Capture, Vault, detailflows en accessibility labels. `consolidation.js` voegt ook op runtime nog NL/EN-translations toe via `Object.assign`.

**Conclusie:** de centrale functie `t(...)` is een nuttige basis, maar de localizationfundering is nog niet klaar voor Duits, Spaans, Italiaans enzovoort.

**Doel van de slice:** locale registry + gescheiden locale-bestanden + Intl-formatters + fallback + hardcoded-copy-audit. De talen zelf hoeven nog niet allemaal vertaald te worden.

---

## 3.6 Capture is momenteel fundamenteel anders dan de gewenste productarchitectuur

De huidige universele captureflow bewaart de ruwe tekst niet direct. Submit sluit de eerste overlay en opent eerst de typekeuze. `openCapturedType()` stuurt de tekst daarna naar een taak/project/wishlist/idee/lijst/etc.

Daarbovenop verwijdert `consolidation.js` expliciet de knop `data-capture-type="unknown"` uit de DOM.

Dat botst rechtstreeks met het researchcontract:

> Capture vóór classificatie; eerst duurzaam bewaren, daarna interpreteren/verrijken.

**Conclusie:** dit is het grootste product-architectuurgat na continuïteit. RAW capture/provenance moet vóór Connected Vault en vóór AI worden gebouwd.

---

## 3.7 Recommendation engine heeft juist al een nuttige grens

`js/features/recommendations.js` rendert Home niet en leest/schrijft storage niet rechtstreeks. De engine krijgt data/context aangeleverd en retourneert profielen/sets.

Dat is architectonisch een goed patroon om te behouden.

Wel berekent de huidige implementatie één samengestelde `score`. Dat is bestaand prototypegedrag en niet automatisch de definitieve Decision Engine uit de research.

**Conclusie:** nu niet aanpassen. Eerst karakteriseren; later V2 afzonderlijk ontwerpen.

---

## 3.8 CSS is aantoonbaar een stapel van verschillende generaties

De acht stylesheets bevatten namen die zelf de geschiedenis verraden: `mobile-polish`, `mockup-rollout`, `mockup-fidelity-v2`, `home-exact`, `consolidation`.

Dat is niet alleen cosmetisch. Het betekent dat ownership/cascade onderdeel van de architectuur is geworden.

**Conclusie:** vóór een grote nieuwe visuele rollout eerst vastleggen welke laag tokens, componenten, screens en tijdelijke compatibility bezit. Daarna de tijdelijke lagen gecontroleerd consolideren met screenshots/regressie als gate.

---

## 3.9 Externe runtime-afhankelijkheden bestaan al

`index.html` haalt Plus Jakarta Sans van Google Fonts en Phosphor Icons van jsDelivr.

Als die diensten tijdelijk niet beschikbaar zijn, blijft de kerncode grotendeels bestaan maar kan presentatie/iconografie degraderen.

**Conclusie:** geen urgente blokkade, maar voor echte onafhankelijkheid moet later bewust worden gekozen tussen lokale assets, fallbacks of geaccepteerde netwerkafhankelijkheid.

---

# 4. Gewenste repository-eigenaarschap

Niet alles hoeft nu al fysiek zo te heten. Dit is de gewenste verantwoordelijkheidskaart.

```text
index.html
└─ alleen shell / mounts / minimale statische semantiek

presentation/
├─ design tokens
├─ components
├─ screens
├─ motion
├─ accessibility
└─ localization hooks

domain/
├─ capture
├─ lifecycle
├─ recommendations
├─ relations
├─ search
├─ tasks
├─ collections
└─ context

application/
├─ app state / orchestration
├─ storage service
├─ AI service (later)
├─ sync service (later)
├─ auth service (later)
├─ entitlement service (later)
└─ notification service (later)

data/
├─ storage adapters
├─ migrations
├─ export/restore
├─ schemas/versions
└─ provenance

locales/
├─ nl
├─ en
├─ de (later content)
├─ es (later content)
└─ it (later content)
```

Dit is **geen opdracht om nu al mappen te hernoemen of bestanden massaal te verplaatsen**. Het is de ownershipkaart waartegen kleine slices worden beoordeeld.

---

# 5. Prioriteit: wat nu echt eerst moet

## Slice 2A — Continuity & Documentation Truth

Waarom eerst: als ChatGPT morgen wegvalt, moet de repository zichzelf kunnen uitleggen.

Werk:

- README actualiseren naar de echte brancharchitectuur;
- `START_HERE.md` toevoegen;
- lokale start/test/browsergate/restore-stappen documenteren en echt uitvoeren;
- repository/back-up/exportstrategie vastleggen;
- release/tagbeleid vastleggen;
- recovery drill beschrijven.

**Geen productgedrag wijzigen.**

Exitgate: een developer zonder chatgeschiedenis kan met alleen repo + documentatie bepalen hoe LumiVault werkt en hoe hij veilig wordt gestart/getest/hersteld.

---

## Slice 2B — Storage Boundary Enforcement

Werk:

- directe `localStorage`-mutatie uit `settings.js` achter StorageGateway brengen;
- repositorycheck toevoegen die nieuwe directe producttoegang buiten toegestane storagefiles detecteert;
- legacy-semantiek exact behouden.

Exitgate: alle bestaande storage-/browsercontracttests groen; geen read-switch.

---

## Slice 2C — Bootstrap & Dependency Seams

Werk:

- eerst dependency map schrijven;
- pure data-load/normalization losmaken van DOM-wiring;
- bootstrap side effects karakteriseren;
- alleen kleine extracties met dezelfde globals/gedrag waar nodig.

Exitgate: dezelfde UI/dataoutput; tests groen; minder verantwoordelijkheden in bootstrap; geen frameworkmigratie.

---

## Slice 2D — Localization Foundation

Werk:

- locale registry;
- aparte locale-bestanden;
- Intl-gebaseerde datum/tijd/getal/valuta/pluralisatiehelpers;
- fallbackbeleid;
- zichtbare hardcoded-copy-inventaris;
- test dat een dummy derde locale kan worden geregistreerd zonder functionele appcode te wijzigen.

Exitgate: NL/EN blijven gelijk; derde locale technisch plug-inbaar; nog geen verplichting om DE/ES/IT volledig te vertalen.

---

## Slice 2E — Design System Ownership

Werk:

- inventariseer tokens/componenten/screen overrides;
- bepaal canonieke laag;
- consolideer tijdelijke CSS één voor één achter screenshot-/browsergate;
- motion tokens + reduced-motion contract vastleggen.

Exitgate: geen extra tijdelijke CSS-laag; visuele baseline bewust behouden of expliciet goedgekeurd gewijzigd.

---

## Slice 2F — RAW Capture & Provenance

Werk:

- ruwe invoer vóór classificatie duurzaam bewaren;
- originele invoer immutable/herleidbaar houden;
- unknown/inbox als geldige tussenstatus herstellen;
- classificatie/splitsing/verrijking als afgeleide data modelleren;
- zonder AI werkend maken.

Exitgate: invoer kan nooit verloren gaan omdat type/context nog onbekend is; round-trip/provenance bewezen.

---

# 6. Wat bewust NIET als volgende stap komt

Nog niet:

- IndexedDB als actieve readstore;
- legacy localStorage verwijderen;
- Supabase/backend aansluiten;
- accounts/auth bouwen;
- AI-provider integreren;
- abonnementen/Stripe;
- Decision Engine V2 herschrijven;
- repo-brede TypeScriptmigratie;
- repo-brede ES-modules;
- React/Vue/ander framework;
- grote visuele redesign.

Deze onderwerpen zijn niet afgewezen. Ze zijn **te vroeg** totdat de lagen erboven stabiel zijn.

---

# 7. Definitieve funderingsroute na deze audit

```text
1. CONTINUITY / DOCUMENTATION TRUTH
   ↓
2. STORAGE BOUNDARY ENFORCEMENT
   ↓
3. BOOTSTRAP + DEPENDENCY SEAMS
   ↓
4. LOCALIZATION FOUNDATION
   ↓
5. DESIGN SYSTEM OWNERSHIP
   ↓
6. RAW CAPTURE + PROVENANCE
   ↓
7. DOMAIN / RELATION CONTRACT
   ↓
8. CONNECTED VAULT
   ↓
9. DECISION ENGINE V2
   ↓
10. AI SERVICE
   ↓
11. CLOUD / AUTH / SYNC
   ↓
12. ENTITLEMENTS / BILLING
   ↓
13. PLATFORM / SCALE
```

## Waarom deze volgorde

- Eerst zorgen dat LumiVault zonder chat/host begrepen en hersteld kan worden.
- Daarna grenzen afdwingen rond data en startup, zodat volgende migraties kleiner worden.
- Daarna taal en UI-ownership schaalbaar maken voordat nieuwe schermen bijkomen.
- Daarna Capture First werkelijk bouwen, omdat Connected Vault en AI anders op een verkeerde intakebasis zouden rusten.
- Pas daarna intelligente, cloud- en commerciële lagen toevoegen.

---

# 8. Status van de fundering na audit

### Staat als een huis

Nog **nee**.

### Is het huidige werk weggegooid of verkeerd gebouwd

Ook **nee**.

De storage safety seam, productbesluiten en bestaande characterization vormen juist het veilige platform waarmee de tussenarchitectuur zonder big-bang kan worden verstevigd.

### Eerstvolgende opdracht

**Slice 2A — Continuity & Documentation Truth.**

Deze slice moet eerst aantonen dat LumiVault zonder ChatGPT-context en zonder GitHub als enige bron begrijpelijk, reproduceerbaar en herstelbaar is.
