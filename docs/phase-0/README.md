# Fase 0 — gecontroleerde funderingsmigratie

Status: afgerond op 13 september 2026.

Deze map legt de auditbaseline en het migratiecontract vast. Zij besluit nadrukkelijk **geen big-bang rewrite**. De actuele applicatie op commit `edf54395959ee2846304f35b5ad7f1f3d25e1618` is zowel gedragsbaseline als bron van te behouden gebruikersdata. Iedere volgende technische stap moet bestaand correct gedrag karakteriseren en per domein kiezen voor behouden, omhullen, gecontroleerd refactoren of vervangen achter een adapter.

## Vastgelegde baseline

- Git-tag: `audit-baseline-2026-09-13`
- Werkbranch: `foundation-migration`
- Bestaande regressietests: 12 van 12 geslaagd
- Visuele preview: synthetische legacy-data, geen productie- of persoonsgegevens
- Opgenomen flows: Home, check-in, Orb/Capture, taakcontext, Vault, zoeken, Masterlist Open/Wachten/Later, Kopen en Huishouden

## Inhoud

- `decision-register.md`: drie expliciet gescheiden herkomsten van besluiten
- `acceptance-criteria.md`: bewijsbare eisen voor gedrag, data en migraties
- `visual-baseline.md`: bevindingen per gecontroleerde flow
- `legacy-localstorage-fixture.json`: synthetische migratie- en regressiefixture
- `screenshots/`: actuele browseropnamen van de baseline

## Guardrails voor fase 1

1. Geen domein wordt vervangen voordat huidig correct gedrag in karakterisatietests is vastgelegd.
2. Migraties zijn copy-on-write, idempotent, controleerbaar en terugrolbaar.
3. Legacy-data wordt pas verwijderd nadat export, conversie en semantische verificatie aantoonbaar zijn geslaagd.
4. Onbekende velden worden behouden of in quarantaine gezet; nooit stilzwijgend weggegooid.
5. Elke verticale slice heeft een adapter of feature flag en een expliciet rollbackpad.
6. Productfeatures blijven bevroren, behalve aantoonbaar dataverlies of blokkerende defecten.

Deze fase-0-bestanden veranderen geen productcode.
