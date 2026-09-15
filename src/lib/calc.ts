import type { Config, Dossier, Repere } from "./data";

export type LigneRepere = {
  repere: Repere;
  profileRef: string;
  profileSerie: string;
  profileId: string;
  ouvrageNom: string;
  ml: number;
  coutAlu: number;
  vitrageType: string;
  surface: number;
  coutVitrage: number;
  accessoires: { nom: string; qte: number; unite: string; coutUnitaire: number; total: number }[];
  coutAccessoires: number;
  heures: number;
  coutMainOeuvre: number;
  sousTotal: number;
  risquePerte: number;
  zoneEquilibrage: boolean;
  motifsZone: string[];
};

export type Barre = { segments: { longueur: number; label: string }[]; utilise: number };
export type PlanDebitage = {
  profileId: string;
  profileRef: string;
  longueurBarre: number;
  barres: Barre[];
  tauxChute: number;
};

export type Totaux = {
  matiere: number;
  mainOeuvre: number;
  transport: number;
  margeTaux: number;
  marge: number;
  totalHT: number;
  tva: number;
  totalTTC: number;
  tauxChuteGlobal: number;
};

export const fmt = (n: number) =>
  new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(Math.round(n)) + " MAD";

export const fmtNum = (n: number, d = 2) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d }).format(n);

function arrondi(v: number, mode: Config["arrondi"]) {
  const f = mode === "cm" ? 100 : 1000;
  return Math.ceil(v * f) / f;
}

export function computeLignes(dossier: Dossier, config: Config): LigneRepere[] {
  return dossier.reperes.map((r) => {
    const profile = config.profiles.find((p) => p.id === r.profileId) ?? config.profiles[0];
    const vitrage = config.vitrages.find((v) => v.id === r.vitrageId) ?? config.vitrages[0];
    const ouvrage = config.ouvrages.find((o) => o.id === r.ouvrageId) ?? config.ouvrages[0];
    const perimetre = 2 * (r.largeur + r.hauteur);
    const ml = arrondi(perimetre * r.quantite * profile.ratio, config.arrondi);
    const coutAlu = (ml / config.longueurBarre) * profile.prixBarre;
    const surface = Math.round(r.largeur * r.hauteur * r.quantite * 100) / 100;
    const coutVitrage = surface * vitrage.prixM2;
    const accessoires = config.accessoires
      .filter((a) => a.qteStandard > 0)
      .map((a) => {
        const qte =
          a.unite === "ml"
            ? Math.round(perimetre * r.quantite * 10) / 10
            : a.qteStandard * r.quantite;
        return {
          nom: a.nom,
          qte,
          unite: a.unite,
          coutUnitaire: a.coutUnitaire,
          total: qte * a.coutUnitaire,
        };
      });
    const coutAccessoires = accessoires.reduce((s, a) => s + a.total, 0);
    const heures = Math.round(surface * 1.6 * ouvrage.coefficient * 10) / 10;
    const coutMainOeuvre = heures * config.mainOeuvreHeure;
    const sousTotal = coutAlu + coutVitrage + coutAccessoires + coutMainOeuvre;

    const motifsZone: string[] = [];
    if (r.largeur > config.seuilLargeur)
      motifsZone.push(`Largeur ${r.largeur} m > seuil ${config.seuilLargeur} m`);
    if (r.hauteur > config.seuilHauteur)
      motifsZone.push(`Hauteur ${r.hauteur} m > seuil ${config.seuilHauteur} m`);
    const risquePerte = sousTotal * 0.18;
    if (risquePerte > config.seuilCout)
      motifsZone.push(`Risque de perte ${fmt(risquePerte)} > seuil ${fmt(config.seuilCout)}`);

    return {
      repere: r,
      profileId: profile.id,
      profileRef: profile.ref,
      profileSerie: profile.serie,
      ouvrageNom: ouvrage.nom,
      ml,
      coutAlu,
      vitrageType: `${vitrage.type} ${vitrage.epaisseur}`,
      surface,
      coutVitrage,
      accessoires,
      coutAccessoires,
      heures,
      coutMainOeuvre,
      sousTotal,
      risquePerte,
      zoneEquilibrage: motifsZone.length > 0,
      motifsZone,
    };
  });
}

/** First-Fit Decreasing bin packing sur les barres standard. */
export function computeDebitage(dossier: Dossier, config: Config): PlanDebitage[] {
  const L = config.longueurBarre;
  const byProfile = new Map<string, { longueur: number; label: string }[]>();

  for (const r of dossier.reperes) {
    const pieces = byProfile.get(r.profileId) ?? [];
    for (let q = 0; q < r.quantite; q++) {
      pieces.push({ longueur: arrondi(r.largeur, config.arrondi), label: `${r.id} • dormant L` });
      pieces.push({ longueur: arrondi(r.largeur, config.arrondi), label: `${r.id} • traverse L` });
      pieces.push({ longueur: arrondi(r.hauteur, config.arrondi), label: `${r.id} • montant H` });
      pieces.push({ longueur: arrondi(r.hauteur, config.arrondi), label: `${r.id} • montant H` });
    }
    byProfile.set(r.profileId, pieces);
  }

  return [...byProfile.entries()].map(([profileId, pieces]) => {
    const sorted = [...pieces].sort((a, b) => b.longueur - a.longueur);
    const barres: Barre[] = [];
    for (const piece of sorted) {
      const len = Math.min(piece.longueur, L);
      let placed = false;
      for (const b of barres) {
        if (b.utilise + len <= L + 1e-9) {
          b.segments.push({ ...piece, longueur: len });
          b.utilise += len;
          placed = true;
          break;
        }
      }
      if (!placed) barres.push({ segments: [{ ...piece, longueur: len }], utilise: len });
    }
    const capacite = barres.length * L;
    const utilise = barres.reduce((s, b) => s + b.utilise, 0);
    const profile = config.profiles.find((p) => p.id === profileId);
    return {
      profileId,
      profileRef: profile?.ref ?? profileId,
      longueurBarre: L,
      barres,
      tauxChute: capacite ? ((capacite - utilise) / capacite) * 100 : 0,
    };
  });
}

export function computeTotaux(dossier: Dossier, config: Config): Totaux {
  const lignes = computeLignes(dossier, config);
  const plans = computeDebitage(dossier, config);
  const matiere = lignes.reduce((s, l) => s + l.coutAlu + l.coutVitrage + l.coutAccessoires, 0);
  const mainOeuvre = lignes.reduce((s, l) => s + l.coutMainOeuvre, 0);
  const transport = config.transportForfait;
  const margeTaux = dossier.gamme === "Haut de gamme" ? config.margeHautDeGamme : config.margeStandard;
  const base = matiere + mainOeuvre + transport;
  const marge = (base * margeTaux) / 100;
  const totalHT = base + marge;
  const tva = totalHT * 0.2;
  const capacite = plans.reduce((s, p) => s + p.barres.length * p.longueurBarre, 0);
  const utilise = plans.reduce(
    (s, p) => s + p.barres.reduce((x, b) => x + b.utilise, 0),
    0,
  );
  return {
    matiere,
    mainOeuvre,
    transport,
    margeTaux,
    marge,
    totalHT,
    tva,
    totalTTC: totalHT + tva,
    tauxChuteGlobal: capacite ? ((capacite - utilise) / capacite) * 100 : 0,
  };
}

export function budgetEstime(dossier: Dossier, config: Config) {
  return computeTotaux(dossier, config).totalTTC;
}
