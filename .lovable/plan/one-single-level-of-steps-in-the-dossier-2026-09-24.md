# One single level of steps in the dossier

## Problem
The dossier page currently shows 3 step bars stacked on top of each other:
1. The main bar "Statut administratif / commercial" (Collecte → Facturation, 10 steps).
2. Inside Approvisionnement / Fabrication / Livraison / Pose / Réception, a second bar of 8 site phases (Validation technique … Garantie).
3. A small mini phase list in the overview cards at the top.

It also shows a wrong phase ("Garantie / intervention — 0 %") because the site block picks its own "current phase" instead of following the main step.

## What changes
- Keep only the main 10-step bar. Rename its title to simply "Étapes du dossier".
- When you are on a site step (Approvisionnement, Fabrication, Livraison, Pose, Réception), the page shows directly the form for that phase only: status, % progress, responsible, dates, checklist, comments, documents, history. No second bar of phases.
- The phase header shows the right phase for the step you are on (e.g. "Fabrication — 65 %"), never Garantie.
- Remove the mini phase list from the overview cards; the "Chantier" card just shows one line: current phase and %.
- The "Informer le client (WhatsApp)" block moves below the phase form, smaller, and only on site steps. The "add phone number" hint links to the Chiffrage step.
- Garantie / intervention stays available as a small section inside the Facturation step (after the job is finished), not as a separate bar.
- The "Revenir à l'étape actuelle" / "Passer à l'étape suivante" button stays next to the single bar.

## Technical details
- `src/routes/dossiers.$ref.tsx`: pass `phaseId={ETAPES[viewStep].phaseId}` to `SuiviChantier`; retitle the stepper card; render a compact garantie panel in the `factures` stage.
- `src/components/erp/suivi-chantier.tsx`: accept a `phaseId` prop, use it for `sel`/header instead of `phaseCourante`; remove the 8-phase button grid; move `InformerClient` below the form in a compact card; export a `GarantiePanel` reusing the same form for phase `garantie`.
- `src/components/erp/dossier-erp.tsx` / mini list (`suivi-chantier.tsx` line ~45 `phases.slice(0,7)`): replace with a single-line summary.
