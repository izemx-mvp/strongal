import type { StatutDossier, StatutProspect } from "@/lib/data";

const dossierColors: Record<StatutDossier, string> = {
  Nouveau: "bg-accent-soft text-foreground",
  "Collecte terrain": "bg-accent-glow/40 text-foreground",
  "Chiffrage en cours": "bg-warm/15 text-warm",
  "À valider": "bg-warm/25 text-warm",
  Validé: "bg-success/15 text-success",
  "Devis envoyé": "bg-primary/10 text-primary",
  Livré: "bg-success/20 text-success",
};

const prospectColors: Record<StatutProspect, string> = {
  "Qualifié IA": "bg-success/15 text-success",
  "Non qualifié IA": "bg-destructive/10 text-destructive",
  "Informations incomplètes": "bg-warning/20 text-warm",
  Contacté: "bg-accent-soft text-foreground",
  "Devis envoyé": "bg-primary/10 text-primary",
  "En négociation": "bg-warm/20 text-warm",
  "Client signé": "bg-success/25 text-success",
  Perdu: "bg-destructive/15 text-destructive",
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

export function ProspectBadge({ statut }: { statut: StatutProspect }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${prospectColors[statut]}`}
    >
      {statut}
    </span>
  );
}
