import type { StatutDossier } from "@/lib/data";

const dossierColors: Record<StatutDossier, string> = {
  Nouveau: "bg-accent-soft text-foreground",
  "Collecte terrain": "bg-accent-glow/40 text-foreground",
  "Chiffrage en cours": "bg-warm/15 text-warm",
  "À valider": "bg-warm/25 text-warm",
  Validé: "bg-success/15 text-success",
  "Devis envoyé": "bg-primary/10 text-primary",
  "Devis accepté": "bg-success/15 text-success",
  Livré: "bg-success/20 text-success",
};

export function StatutBadge({ statut }: { statut: StatutDossier }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${dossierColors[statut]}`}
    >
      {statut}
    </span>
  );
}

