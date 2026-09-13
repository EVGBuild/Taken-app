# Visuele en runtimebaseline

Previewcondities: commit `edf5439`, viewport 1348 × 926, synthetische legacy-localStorage. Er zijn geen productiegegevens gebruikt.

| Stap | Flow | Status | Bewijs en gevolg |
| ---: | --- | --- | --- |
| 1 | Home | Goed | Rustige donkere hiërarchie, vijfdelige batterij en compacte suggestie; kernnavigatie zichtbaar. |
| 2 | Check-in | Deels | Werkt en is visueel coherent, maar toont “Hoeveel ruimte heb je nu?” in plaats van de goedgekeurde copy. |
| 3 | Orb / eerste capture | Goed | Snelle vrije invoer is direct bereikbaar. |
| 4 | Typepoort en taakcontext | Deels | Zeven typen zijn zichtbaar, maar “Weet ik nog niet” ontbreekt; titel-only bewaren kan, contextscherm is lang. |
| 5 | Vault | Deels | Zeven kaarten zijn bereikbaar; bestaande schermen Nog uitzoeken, Financiën en Documenten missen een ingang. |
| 6 | Vault zoeken | Geblokkeerd | Zoekterm “garantiebon” vindt het opgeslagen document niet; zoeken doorzoekt modulelabels, niet de inhoud. |
| 7 | Masterlist Open | Goed | Legacy-taak zonder id/titelvorm wordt genormaliseerd en zichtbaar. |
| 8 | Masterlist Wachten | Deels | Item verschijnt, maar wachtpartij en follow-upcontext ontbreken in de rij. |
| 9 | Masterlist Later | Goed | Uitgesteld legacy-item en terugkeerdatum worden getoond. |
| 10 | Kopen | Deels | Legacy-wensen en noodzakelijke aankoop renderen; terugknop mist een toegankelijke naam. |
| 11 | Huishouden | Geblokkeerd | Terugkerende routine verschijnt, maar menu en detail bieden geen voltooiactie; completion-based recurrence is dus niet uitvoerbaar in deze flow. |
| 12 | Runtime | Deels | `renderHome is not defined` treedt op doordat `ui.js` al ververst vóór `today.js` is geladen; latere scripts maskeren veel van de impact. |

## Aanvullende observaties

- De Vault-kaart heet “Huishouden”, het doelscherm nog “Klusjes”.
- Meerdere `.vault-back`-knoppen missen een toegankelijke naam.
- De README beschrijft vier CSS-bestanden, terwijl de build acht lokale CSS-lagen laadt; zij verwijst ook naar een ontbrekend check-in-contextbestand.
- De twaalf bestaande recurrence-tests slagen, maar de visuele flow toont dat unitdekking alleen het gebruikerscontract niet bewijst.

## Niet volledig gevalideerd in fase 0

Mobiele reflow, softwaretoetsenbord, screenreadersemantiek, 200% zoom, reduced transparency en een volledige toetsenbordronde zijn nog geen bewijsbaar afgeronde checks. Fase 0 maakt daarom geen WCAG-conformiteitsclaim; deze checks worden acceptance criteria per migratieslice.
