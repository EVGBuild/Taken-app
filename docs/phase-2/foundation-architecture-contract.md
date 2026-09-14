# Fase 2 — Foundation Architecture Contract

Datum: 2026-09-14  
Branch: `foundation-migration`  
Basis: storage safety seam afgesloten op commit `f235738fc2a51ed7800f56c85f0dad9213d91db7`  
Status: **architectuurcontract; nog geen toestemming voor brede refactor of nieuwe productfeatures**

## Doel

LumiVault moet zo worden opgebouwd dat toekomstige groei geen nieuwe fundering vereist. De app moet overdraagbaar, herstelbaar en uitbreidbaar blijven als ChatGPT, GitHub, een AI-provider, backendprovider, betaalprovider of andere externe dienst wegvalt.

Dit document maakt daarom onderscheid tussen:

1. **wat nu al bewezen is**;
2. **welke architectuurgrenzen vanaf nu verplicht zijn**;
3. **wat later mag worden aangesloten zonder de kern opnieuw te bouwen**;
4. **welke beslissingen nog expliciet open blijven**.

De kernregel is: **nu voorbereiden op schaal, zonder nu al enterprise-complexiteit te bouwen.**

---

## 1. Huidige staat van de fundering

### Groen — voldoende basis aanwezig

- Productrichting en kernnavigatie Home → Orb → Vault zijn vastgelegd.
- Goedgekeurde productbesluiten, researchconclusies en hypotheses worden in het beslisregister gescheiden.
- Bestaand gedrag is gedeeltelijk beschermd met characterization- en regressietests.
- `localStorage` is nog de enige actieve productbron.
- De storage safety seam levert export, checksums, lossless conversie, shadow-write, verificatie, round-trip en rollback zonder read-switch.
- IndexedDB is alleen bewezen als shadow-kandidaat; geen productactivatie.
- Legacy-ID's, onbekende velden en ruwe payload kunnen behouden blijven.
- Eén plat universeel Item-model is verworpen; samengestelde datarepresentatie blijft het uitgangspunt.

### Oranje — bruikbaar, maar nog tussenarchitectuur

- De app gebruikt klassieke browserscripts in expliciete laadvolgorde en gedeelde globals.
- Domeinverantwoordelijkheid is gedeeltelijk opgesplitst in `core`, `features`, `storage` en `utils`, maar grenzen zijn nog niet overal hard.
- `js/core/i18n.js` bestaat, maar localization is nog niet als volledige schaalbare taalcontractlaag afgedwongen.
- CSS bestaat uit meerdere generaties/lagen; het designsysteem is nog niet de enige bron van visuele waarheid.
- Recommendation/Today-logica bestaat, maar is nog niet de definitieve Decision Engine-architectuur.
- Capture bestaat, maar de gewenste RAW-first/provenance/progressive-enrichment-keten is nog niet als end-to-end kerncontract gebouwd.

### Rood — essentieel maar nog niet gebouwd

- Connected Vault als gedeelde relationele kennislaag.
- Provider-onafhankelijke AI-servicegrens.
- Sync/cloud/accountgrens.
- Centrale entitlementlaag voor abonnementen.
- Herstelbaar continuity-/disaster-recoverypad buiten GitHub en buiten AI.
- Geautomatiseerde release-/backupdiscipline.

---

## 2. Doelarchitectuur in lagen

```text
┌─────────────────────────────────────────────────────────────┐
│ PRESENTATIE                                                 │
│ UI • Design System • i18n • Accessibility • Motion          │
├─────────────────────────────────────────────────────────────┤
│ PRODUCT / DOMEIN                                            │
│ Capture • Lifecycle • Decision • Search • Relations         │
│ Tasks • Collections • Context • Projects • Household       │
├─────────────────────────────────────────────────────────────┤
│ APPLICATIESERVICES                                          │
│ Storage • AI • Sync • Auth • Entitlements • Notifications   │
├─────────────────────────────────────────────────────────────┤
│ DATA & INFRASTRUCTUUR                                       │
│ Local store • migrations • export • cloud adapters          │
├─────────────────────────────────────────────────────────────┤
│ EXTERNE PROVIDERS                                           │
│ AI vendor • backend/cloud • billing • integrations          │
└─────────────────────────────────────────────────────────────┘
```

### Afhankelijkheidsregel

Afhankelijkheden lopen **naar beneden**, niet willekeurig zijwaarts of terug omhoog.

Voorbeelden:

- de UI mag niet rechtstreeks weten hoe IndexedDB werkt;
- lifecyclelogica mag niet afhankelijk zijn van een betaalprovider;
- de Decision Engine mag niet alleen binnen een AI-prompt bestaan;
- een AI-provider mag niet de enige plek zijn waar interpretatiehistorie of gebruikerscorrecties bestaan;
- billing mag niet rechtstreeks door losse features verspreide `if (paid)`-checks afdwingen;
- cloudsync mag niet het lokale datamodel dicteren.

---

## 3. Niet-onderhandelbare architectuurregels

### 3.1 Geen single point of failure

Geen van deze diensten mag de enige bron van waarheid worden:

- ChatGPT / Codex / andere AI;
- GitHub;
- Supabase of andere backend;
- Stripe of andere billingprovider;
- één AI-model of één AI-provider.

De broncode, productbesluiten en gebruikersdata moeten los van zulke diensten begrijpelijk en herstelbaar blijven.

### 3.2 Data-eigenaarschap

LumiVault-data moet:

- versioneerbaar zijn;
- exporteerbaar zijn;
- herstelbaar zijn;
- migraties kunnen doorlopen zonder bronverlies;
- provenance kunnen behouden;
- onbekende data niet stilzwijgend verliezen of invullen;
- stabiele identiteit behouden over migraties heen.

Geen toekomstige cloudfunctie mag deze eis verzwakken.

### 3.3 AI is optioneel

De kernapp moet zonder AI kunnen:

- starten;
- bestaande data openen;
- data bewaren;
- lifecycle toepassen;
- zoeken/navigeren;
- basisbeslislogica uitvoeren;
- exporteren/herstellen.

AI mag later helpen met onder andere interpretatie, samenvatten, verbanden voorstellen, natuurlijke taal, uitleg en complexere contextweging. AI mag niet de enige implementatie van kernregels worden.

### 3.4 Providergrenzen

Toekomstige externe diensten worden achter expliciete applicatieservices/adapters geplaatst:

- `AIService`
- `SyncService`
- `AuthService`
- `Billing/EntitlementService`
- `NotificationService`
- `StorageGateway`

De concrete namen mogen later veranderen; het scheidingsprincipe niet.

### 3.5 Geen brede refactor zonder exitpoort

Een infrastructuurmigratie krijgt altijd:

1. huidige baseline;
2. expliciete scope;
3. karakterisatietests;
4. migratie-/compatibiliteitspad;
5. rollback;
6. exitcriteria;
7. afzonderlijk besluit voor activering.

De storage safety seam geldt als voorbeeld.

---

## 4. Internationalisatie als fundering

LumiVault wordt niet gebouwd voor slechts Nederlands en Engels.

### Nu verplicht

- alle zichtbare UI-copy via centrale localization;
- applicatielogica bevat geen verspreide vertaalstrings;
- locale-code is configuratie, geen featurecode;
- formattering van datum, tijd, getal en valuta is locale-aware;
- meervoudsvormen zijn locale-aware;
- layouts tolereren verschillende tekstlengtes;
- taalnamen worden in de eigen taal getoond;
- ontbrekende vertalingen hebben een expliciete fallbackstrategie;
- tests kunnen ongekende/extra locale registreren zonder appcode te wijzigen.

### Later toevoegen zonder architectuurwijziging

Bijvoorbeeld:

- Nederlands (`nl`)
- English (`en`)
- Deutsch (`de`)
- Español (`es`)
- Italiano (`it`)

De exacte releasetalen blijven een productbesluit; de architectuur ondersteunt meer dan twee talen.

---

## 5. Design system en motion

### Probleem in de huidige staat

De repository bevat meerdere CSS-generaties en specifieke rollout-/polishlagen. Daardoor is nog niet één ondubbelzinnige visuele bron van waarheid afgedwongen.

### Doel

De presentatielaag krijgt uiteindelijk centrale tokens en componentregels voor:

- kleur;
- spacing;
- typografie;
- radius;
- elevation/glass;
- states;
- focus;
- iconografie;
- motion duration;
- easing;
- motion intensity;
- reduced motion;
- reduced transparency.

Animatie wordt hiermee later rijker te maken zonder scherm-voor-scherm willekeurige effecten toe te voegen.

### Harde regel

Nieuwe UI-refactors mogen niet nog een nieuwe tijdelijke stijllaag bovenop bestaande tijdelijke lagen stapelen zonder consolidatieplan.

---

## 6. Domein- en datamodel

### Bevestigde richting

Geen universeel plat Item-model voor alles.

De fundering blijft relationeel/samengesteld, met conceptueel afzonderlijke:

- records/items;
- collections;
- relations;
- contexts;
- auxiliary data;
- provenance/raw source;
- quarantine voor niet veilig geïnterpreteerde data.

### Nodige eigenschappen

- stabiele interne identiteit naast eventuele legacy-/domein-ID;
- expliciete relaties in plaats van impliciete koppeling via tekst;
- lifecycle als domeinconcept, niet als UI-truc;
- unknown blijft unknown;
- ruwe capture blijft terug te leiden tot interpretatie;
- splitsen/samenvoegen blijft herleidbaar;
- views/modules mogen dezelfde onderliggende informatie tonen zonder datasilo's te maken.

Dit contract schrijft nog geen definitief databaseschema voor.

---

## 7. Capture-kerncontract

De gewenste keten is:

```text
Gedachte
  ↓
RAW Capture — direct duurzaam bewaren
  ↓
Understand — interpreteren zonder origineel te overschrijven
  ↓
Enrich — alleen informatie verzamelen die aanbevelingen verandert
  ↓
Connect — relaties/context koppelen
  ↓
Lifecycle — Open / Wachten / Later / etc.
  ↓
Return — op het juiste moment terugbrengen
```

### Regel

Opslag mag nooit wachten op perfecte classificatie.

AI mag de `Understand`- of `Enrich`-stappen ondersteunen, maar RAW capture en provenance zijn onafhankelijk van AI.

---

## 8. Decision Engine

De huidige `recommendations.js` blijft voorlopig beschermd bestaand gedrag; geen redesign in deze contractfase.

De toekomstige Decision Engine moet minimaal rekening kunnen houden met afzonderlijke signalen, waaronder:

- geschiktheid/context;
- hard tijdsvenster;
- deadline/noodzaak;
- impact;
- belasting;
- weerstand/frictie;
- duur;
- expliciete gebruikerscorrecties;
- confidence en recentheid van geleerde signalen.

### Harde regel

Deze signalen mogen niet stilzwijgend worden samengevoegd tot één universele persoonlijkheidsscore of psychologisch profiel.

Het uiteindelijke selectieproces wordt apart ontworpen en gevalideerd voordat bestaand recommendation-gedrag wordt vervangen.

---

## 9. Cloud, accounts en sync

Nog niet bouwen.

### Nu al voorbereiden

- stabiele recordidentiteit;
- schema-/recordversies;
- exporteerbare data;
- provider-onafhankelijke `SyncService`/`AuthService`-grens;
- lokale bron mag begrijpelijk blijven zonder backend;
- conflictstrategie wordt ontworpen vóór automatische bidirectionele sync.

### Later mogelijk

- account;
- multi-device;
- encrypted backup;
- synchronisatie;
- collaboration/sharing indien productmatig gewenst.

Supabase mag kandidaat zijn, maar wordt niet de architectuur zelf.

---

## 10. Abonnementen en commerciële laag

Nog niet bouwen.

### Architectuurregel

Productrechten worden later centraal als **entitlements/capabilities** gemodelleerd, bijvoorbeeld conceptueel:

- `cloudSync`
- `aiAssist`
- `extendedStorage`
- toekomstige premiumfuncties

De betaalprovider vertaalt betalingen naar entitlementstatus, maar featurecode vraagt alleen naar de entitlement. Daardoor kan een betaalprovider worden vervangen zonder het productmodel te herschrijven.

---

## 11. Continuïteit zonder ChatGPT of GitHub

LumiVault voldoet pas aan de continuïteitseis als minimaal drie onafhankelijke kopieën bestaan:

1. **lokale Git-repository**;
2. **remote Git-host** (nu GitHub);
3. **onafhankelijk archief/back-up** buiten die Git-host, met broncode + documentatie + benodigde export-/restore-informatie.

### Nog te realiseren

- vaste back-upfrequentie;
- vaste onafhankelijke opslaglocatie;
- release-archief/tagbeleid;
- gevalideerd `START_HERE`/runbook;
- exacte lokale start-/test-/restore-instructies;
- recovery drill: aantonen dat een schone machine zonder ChatGPT de app kan reconstrueren/starten;
- periodieke export van productdata zodra echte gebruikersdata relevant wordt.

### Exitcriterium

Een competente developer die geen toegang heeft tot eerdere chats moet met de repository, documentatie en back-up kunnen vaststellen:

- wat LumiVault is;
- welke productregels gelden;
- hoe de app wordt gestart;
- hoe tests draaien;
- waar data staat;
- hoe export/herstel werkt;
- welke architectuurbesluiten bindend zijn;
- welke zaken hypotheses/open beslissingen zijn.

---

## 12. Tooling en frameworkbeleid

Niet vooraf kiezen omdat een app 'groot moet worden'.

### Voorlopig behouden

- native HTML/CSS/JavaScript waar dit voldoende is;
- `node:test` waar dit voldoende bewijs levert;
- bestaande productcode niet repo-breed converteren zonder concrete baten.

### Later alleen invoeren bij bewezen noodzaak

- TypeScript;
- bundler/buildtool;
- framework;
- alternatieve test runner;
- repo-brede ES-modulemigratie.

De juiste vraag is steeds: **welk aantoonbaar risico of schaalprobleem lost deze tool op, en wat kost de migratie?**

---

## 13. Eerstvolgende technische verificatie vóór nieuwe code

Voer eerst een **Foundation Architecture Audit** uit tegen de actuele repository. Dit is nog geen refactor.

De audit moet per laag opleveren:

1. huidige bestanden/verantwoordelijkheden;
2. ongewenste cross-layer dependencies/globals;
3. directe `localStorage`-toegang buiten de gateway;
4. zichtbare strings buiten i18n;
5. CSS-lagen en overrides die dezelfde verantwoordelijkheid bezitten;
6. domeinlogica die in UI-bestanden zit;
7. ontbrekende servicegrenzen voor toekomstige AI/sync/auth/billing;
8. huidige backup/runbook-gaten;
9. minimale migratieslices om bovenstaande te verbeteren zonder big-bang rewrite.

### Vereist auditresultaat

Maak één tabel:

| Gebied | Huidige staat | Risico | Moet nu | Kan later | Voorgestelde slice | Exitgate |
| --- | --- | --- | --- | --- | --- | --- |

En één dependencykaart van de huidige repository tegenover de gewenste lagen.

### Stopgrens

Tijdens deze audit:

- geen productcode wijzigen;
- geen CSS/UI wijzigen;
- geen storage read-switch;
- geen nieuwe backend/AI/billingcode;
- geen legacycode verwijderen;
- geen framework/toolchain invoeren.

---

## 14. Prioriteitsvolgorde na de audit

Onder voorbehoud van auditbewijs is de gewenste volgorde:

```text
FOUNDATION CONTRACT
      ↓
ARCHITECTURE AUDIT
      ↓
CONTINUITY / BACKUP / RUNBOOK
      ↓
MODULE + DOMAIN BOUNDARIES
      ↓
I18N + DESIGN-SYSTEM CONSOLIDATION
      ↓
CAPTURE CORE / PROVENANCE / LIFECYCLE
      ↓
CONNECTED VAULT
      ↓
DECISION ENGINE V2
      ↓
AI SERVICE LAYER
      ↓
CLOUD / ACCOUNT / SYNC
      ↓
ENTITLEMENTS / BILLING
      ↓
PLATFORM INTEGRATIONS / SCALE
```

De audit mag deze volgorde wijzigen als repositorybewijs laat zien dat een andere afhankelijkheid eerst opgelost moet worden.

---

## 15. Exitpoort van dit architectuurcontract

Dit contract is geslaagd zodra:

- het als niet-chat bron in de repository staat;
- de actuele repository ertegen is geaudit;
- tegenstrijdigheden met bestaande productbesluiten expliciet zijn gemarkeerd in plaats van stil opgelost;
- iedere voorgestelde refactor een kleine, terugrolbare slice met exitcriteria kan worden;
- toekomstige AI, cloud, talen, motion en abonnementen een duidelijke aansluiting hebben zonder dat ze nu gebouwd hoeven te worden;
- continuïteit buiten ChatGPT/GitHub als technische eis op de roadmap staat.

Tot die audit is afgerond geeft dit document **geen toestemming voor brede implementatie**.
