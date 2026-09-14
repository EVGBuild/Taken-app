# Fase 2 — Storage Boundary Enforcement

Datum: 2026-09-14  
Branch: `foundation-migration`  
Basis: continuity/documentation truth afgerond  
Status: **implementatie afgerond; repositoryguard toegevoegd; volledige lokale regressierun nog niet opnieuw uitgevoerd vanuit deze omgeving**

## Doel

Voorkomen dat actieve productfeatures rechtstreeks browser-`localStorage` muteren buiten de bestaande `StorageGateway` om.

Deze slice verandert geen datamodel, geen storagebron, geen productfeature en geen UI. `localStorage` blijft de enige actieve productbron. IndexedDB blijft shadow-only en wordt niet door de normale app geladen.

## Wijzigingen

### 1. Verwijderen toegevoegd aan de actieve storagegrens

`js/core/storage.js` exposeert nu naast `read(...)` en `write(...)` ook:

```js
function remove(key) {
  storageGateway.removeRaw(key);
}
```

De bestaande legacy-adapter en gateway hadden al `removeRaw`; deze slice maakt die capaciteit beschikbaar aan actieve productcode zonder de adapter te omzeilen.

### 2. Settings-bypass verwijderd

De actie “alle lokale gegevens verwijderen” in `js/features/settings.js` gebruikte rechtstreeks:

```js
localStorage.removeItem(key)
```

Dat loopt nu via:

```js
remove(key)
```

De bestaande sessieflag `lumiCheckinOffered` blijft via `sessionStorage` verwijderd worden. Dit is tijdelijke sessiestatus en geen persistente LumiVault-productstore.

### 3. Repositoryguard toegevoegd

Nieuw:

`tests/storage-boundary-enforcement.test.js`

De guard leest de actieve `<script src>`-bestanden uit `index.html` en faalt wanneer een actief productscript buiten `js/core/storage.js` rechtstreeks `localStorage` gebruikt.

De test controleert daarnaast dat de actieve storagegrens `read`, `write` en `remove` aanbiedt en dat `remove` via `storageGateway.removeRaw(...)` loopt.

Hiermee wordt een toekomstige bypass van de actieve productgrens expliciet detecteerbaar.

## Scope die bewust niet is gewijzigd

- geen IndexedDB read-switch;
- geen legacy-key gewijzigd of verwijderd;
- geen data gemigreerd;
- geen bootstraprefactor;
- geen UI/CSS-wijziging;
- geen Capture-, Vault- of Decision Engine-wijziging;
- geen cloud-, auth-, AI- of billingcode;
- het losse niet-actieve `js/storage.js` ES-modulebestand is in deze slice niet verwijderd of geactiveerd; `index.html` laadt uitsluitend `js/core/storage.js` als actieve storagecode.

## Verificatie

GitHub-vergelijking van de slicebasis met de implementatie toont uitsluitend:

- `js/core/storage.js`: 4 regels toegevoegd;
- `js/features/settings.js`: één directe mutatie vervangen;
- `tests/storage-boundary-enforcement.test.js`: nieuwe guardtest.

De actuele branchbestanden bevestigen dat Settings geen directe `localStorage.removeItem(...)` meer gebruikt en dat verwijderen door de gateway loopt.

Een volledige `node --test tests/*.test.js` regressierun kon vanuit de huidige uitvoeringsomgeving niet opnieuw worden gestart, omdat deze omgeving de repository niet via het openbare GitHub-netwerk kan clonen. Dit wordt niet als groen testresultaat voorgesteld.

## Exitpoort

| Criterium | Status |
| --- | --- |
| Actieve Settings-mutatie loopt via storagegrens | Behaald |
| `read`, `write` en `remove` hebben één actieve gateway | Behaald |
| `localStorage` blijft enige actieve productbron | Behaald |
| Geen IndexedDB read-switch | Behaald |
| Geen product/UI/datamodelwijziging | Behaald |
| Automatische guard tegen nieuwe actieve `localStorage`-bypasses | Toegevoegd |
| Volledige bestaande regressiesuite opnieuw groen gedraaid | **Nog te verifiëren in een runner met repositorytoegang** |

Daarom is de **codewijziging afgerond**, maar de formele slice-exitpoort blijft technisch op **validation pending** totdat de volledige testset opnieuw is gedraaid.

## Volgende stap na groene regressierun

Pas na die verificatie door naar de volgende funderingsslice: **Bootstrap + module boundaries**. Die slice moet eerst responsibilities scheiden zonder productgedrag, storagebron of UI te veranderen.
