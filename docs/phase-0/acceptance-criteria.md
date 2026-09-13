# Acceptance criteria voor de funderingsmigratie

## Baseline en gedrag

- De baseline-SHA, tag, tests en visuele opnamen zijn reproduceerbaar vastgelegd.
- Voor elke te migreren flow bestaan vóór vervanging karakterisatietests van correct huidig gedrag.
- Per domein wordt expliciet gekozen: behouden, omhullen, in-place refactoren of vervangen achter een adapter.
- Een slice kan onafhankelijk worden geactiveerd en teruggedraaid zonder handmatige datacorrectie.
- Visuele vergelijking omvat minimaal Home, Check-in, Capture, Vault, Masterlist, Kopen en Huishouden.

## Data-integriteit

- Voor iedere migratie wordt een ongewijzigde legacy-export gemaakt met schema-versie, tijdstip en checksum.
- De migratie is copy-on-write: legacy-keys blijven intact tot verificatie en expliciete opruimfase.
- De migratie is idempotent: twee runs leveren inhoudelijk hetzelfde resultaat en geen duplicaten.
- Aantallen, titels/tekst, statussen, datums, voltooiingshistorie, herhalingsankers, relaties en instellingen blijven semantisch gelijk.
- Ontbrekende identifiers worden deterministisch of traceerbaar toegevoegd; bestaande identifiers veranderen niet.
- Onbekende velden blijven bewaard in een legacy-payload of quarantaine met foutreden; niets verdwijnt stilzwijgend.
- Ongeldige records blokkeren geldige records niet en krijgen een herstelbaar foutenrapport.
- Bestanden, base64-inhoud en grote payloads worden apart getest op limieten en exporteerbaarheid.
- Een round-tripvergelijking rapporteert recordaantallen, veldmapping, afwijkingen en quarantainerecords.
- Rollback herstelt de baselineweergave op de oorspronkelijke legacy-data.

## Productcontract

- Capture bewaart ruwe invoer vóór verrijking en blijft bruikbaar zonder typekeuze.
- Wachten en Later blijven volwaardige, terugvindbare levenscycli.
- Terugkerende huishoudelijke items kunnen worden voltooid; de volgende datum wordt vanaf de werkelijke voltooiingsdatum berekend.
- Vault-zoeken doorzoekt iteminhoud en metadata, niet alleen modulelabels.
- De goedgekeurde check-in-copy en het niet-blokkerende gedrag blijven intact.
- AI- of normalisatieresultaten zijn corrigeerbaar en herleidbaar naar de broninvoer.

## Kwaliteitsgrenzen

- Geen nieuwe globale monkey patches of onduidelijke dubbele ownership per domein.
- Geen nieuwe productfeatures tijdens de funderingsmigratie, behalve fixes voor dataverlies of blokkerende defecten.
- Unit-, contract-, migratie- en relevante end-to-endtests slagen vóór een slice wordt omgezet.
- Toetsenbordbediening, toegankelijke namen, focus, reduced motion en 200% reflow worden per aangepakte flow gecontroleerd.
- Een migratiebesluit bevat eigenaar, scope, rollback, bewijs en resterend risico.

## Exitcriteria fase 0

- [x] Auditbaseline getagd en branch aangemaakt.
- [x] Actuele build via bereikbare preview geïnspecteerd zonder productiegegevens.
- [x] Alle voorgeschreven kernflows visueel vastgelegd.
- [x] Synthetische legacy-fixture met ontbrekende/verouderde velden vastgelegd.
- [x] Besluiten, researchconclusies en hypotheses expliciet gescheiden.
- [x] Geen productcode gewijzigd.
