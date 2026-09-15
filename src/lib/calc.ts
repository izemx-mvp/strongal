import type { BaseComposant, Config, Dossier, Produit, Repere } from "./data";

export type LigneProfil = {
  profileId: string;
  ref: string;
  serie: string;
  detail: string;
  ml: number;
  cout: number;
};

export type LigneRepere = {
  repere: Repere;
  produitNom: string;
  produitId: string;
  profils: LigneProfil[];
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

/** Valeur de base d'un composant pour une unité de repère (hors quantité). */
export function valeurBase(base: BaseComposant, largeur: number, hauteur: number) {
  switch (base) {
    case "perimetre":
      return 2 * (largeur + hauteur);
    case "largeur":
      return largeur;
    case "hauteur":
      return hauteur;
    case "surface":
      return largeur * hauteur;
    default:
      return 1;
  }
}

export const produitDuRepere = (r: Repere, config: Config): Produit | undefined =>
  config.produits.find((p) => p.id === r.produitId);

/** Nomenclature détaillée d'un produit fini appliquée à des dimensions données. */
export function ficheTechnique(
  produit: Produit,
  config: Config,
  largeur: number,
  hauteur: number,
  quantite = 1,
) {
  const profils = produit.composants
    .filter((c) => c.type === "profil")
    .map((c) => {
      const p = config.profiles.find((x) => x.id === c.refId) ?? config.profiles[0];
      const unitaire = valeurBase(c.base, largeur, hauteur) * c.coef;
      const ml = arrondi(unitaire * quantite * p.ratio, config.arrondi);
      return {
        profileId: p.id,
        ref: p.ref,
        serie: p.serie,
        detail: `${c.coef} × ${c.base === "unite" ? "ml" : c.base}`,
        longueurPiece: unitaire / Math.max(1, Math.round(c.coef)),
        pieces: Math.max(1, Math.round(c.coef)) * quantite,
        ml,
        cout: (ml / config.longueurBarre) * p.prixBarre,
      };
    });
  const accessoires = produit.composants
    .filter((c) => c.type === "accessoire")
    .map((c) => {
      const a = config.accessoires.find((x) => x.id === c.refId) ?? config.accessoires[0];
      const brut = valeurBase(c.base, largeur, hauteur) * c.coef * quantite;
      const qte = a.unite === "u" ? Math.ceil(brut) : Math.round(brut * 10) / 10;
      return {
        nom: a.nom,
        qte,
        unite: a.unite,
        coutUnitaire: a.coutUnitaire,
        total: qte * a.coutUnitaire,
      };
    });
  return { profils, accessoires };
}

export function computeLignes(dossier: Dossier, config: Config): LigneRepere[] {
  return dossier.reperes.map((r) => {
    const produit = produitDuRepere(r, config);
    const profile =
      config.profiles.find((p) => p.id === (produit?.profileId ?? r.profileId)) ?? config.profiles[0];
    const vitrage =
      config.vitrages.find((v) => v.id === (produit?.vitrageId ?? r.vitrageId)) ?? config.vitrages[0];
    const ouvrage =
      config.ouvrages.find((o) => o.id === (produit?.ouvrageId ?? r.ouvrageId)) ?? config.ouvrages[0];
    const perimetre = 2 * (r.largeur + r.hauteur);
    const surface = Math.round(r.largeur * r.hauteur * r.quantite * 100) / 100;
    const coutVitrage = surface * vitrage.prixM2;

    const fiche = produit
      ? ficheTechnique(produit, config, r.largeur, r.hauteur, r.quantite)
      : undefined;

    const profils: LigneProfil[] = fiche
      ? fiche.profils.map((p) => ({
          profileId: p.profileId,
          ref: p.ref,
          serie: p.serie,
          detail: p.detail,
          ml: p.ml,
          cout: p.cout,
        }))
      : [
          {
            profileId: profile.id,
            ref: profile.ref,
            serie: profile.serie,
            detail: "Périmètre × ratio catalogue",
            ml: arrondi(perimetre * r.quantite * profile.ratio, config.arrondi),
            cout:
              (arrondi(perimetre * r.quantite * profile.ratio, config.arrondi) /
                config.longueurBarre) *
              profile.prixBarre,
          },
        ];

    const ml = Math.round(profils.reduce((s, p) => s + p.ml, 0) * 100) / 100;
    const coutAlu = profils.reduce((s, p) => s + p.cout, 0);

    const accessoires =
      fiche?.accessoires ??
      config.accessoires
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
    const heures =
      Math.round(surface * (produit?.heuresM2 ?? 1.6) * ouvrage.coefficient * 10) / 10;
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
      produitNom: produit?.nom ?? "Repère sur mesure",
      produitId: produit?.id ?? "",
      profils,
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
    const produit = produitDuRepere(r, config);
    if (produit) {
      for (const c of produit.composants.filter((x) => x.type === "profil")) {
        const pieces = byProfile.get(c.refId) ?? [];
        const nb = Math.max(1, Math.round(c.coef));
        const longueur = arrondi(
          (valeurBase(c.base, r.largeur, r.hauteur) * c.coef) / nb,
          config.arrondi,
        );
        for (let q = 0; q < r.quantite; q++)
          for (let k = 0; k < nb; k++)
            pieces.push({ longueur, label: `${r.id} • ${c.base}` });
        byProfile.set(c.refId, pieces);
      }
      continue;
    }
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
