import { computeLignes } from "./calc";
import type { Config, Dossier } from "./data";

/* ============================ Chiffrage commercial ============================ */

export type LigneCom = {
  id: string;
  designation: string;
  description: string;
  qte: number;
  unite: string;
  achatU: number;
  venteU: number;
  /** Totaux saisis manuellement (prioritaires sur qte × prix unitaire). */
  achatTotalManuel?: number;
  venteTotalManuel?: number;
  /** Prix unitaires saisis à la main : jamais écrasés par un recalcul. */
  achatManuel?: boolean;
  venteManuel?: boolean;
  repereId?: string;
  /** Quantité métrée (brute) vs quantité réellement utilisée (qte). */
  qteMesuree?: number;
  modeVente?: string;
  methode?: string;
  speciale?: boolean;
};

export type OptionDevis = {
  id: string;
  nom: string;
  description: string;
  ratio: number;
  prixManuel?: number;
};

export const OPTIONS_DEFAUT: OptionDevis[] = [
  { id: "o1", nom: "Standard", description: "Gamme standard, renfort sans", ratio: 1 },
  { id: "o2", nom: "Renforcé 1 côté", description: "Renfort sur un seul côté", ratio: 1.12 },
  { id: "o3", nom: "Décoratif", description: "Profils décoratifs, finitions premium", ratio: 1.25 },
  { id: "o4", nom: "Technique", description: "Grandes ouvertures, renfort façade + côtés", ratio: 1.45 },
  { id: "o5", nom: "Premium", description: "Technique + vitrage acoustique / contrôle solaire", ratio: 1.7 },
];

export const prixOption = (o: OptionDevis, base: number) => o.prixManuel ?? base * o.ratio;

export type TypeFrais = "pose" | "mainOeuvre" | "livraison" | "autre";
export const TYPES_FRAIS: { value: TypeFrais; label: string }[] = [
  { value: "pose", label: "Pose / installation" },
  { value: "mainOeuvre", label: "Main-d'œuvre atelier" },
  { value: "livraison", label: "Livraison" },
  { value: "autre", label: "Autres coûts" },
];

export type Frais = {
  id: string;
  type: TypeFrais;
  libelle: string;
  description: string;
  montant: number;
  manuel?: boolean;
};

export type Commercial = {
  lignes: LigneCom[];
  frais: Frais[];
  remise: { mode: "pct" | "montant"; valeur: number };
  tvaTaux: number;
  tvaManuelle?: number;
  marge: { mode: "auto" | "pct" | "montant"; valeur: number };
  /** % de chute matière ajouté au coût fourniture. */
  chutePct?: number;
  options?: OptionDevis[];
  optionChoisie?: string;
  afficherOptions?: boolean;
};

export type DevisInfo = {
  numero: string;
  client: string;
  contact: string;
  projet: string;
  adresse: string;
  conditionsPaiement: string;
  validiteJours: number;
  notes: string;
  conditionsCommerciales: string;
  notesInternes: string;
  champsClient: { quantites: boolean; livraison: boolean; notes: boolean };
};

export type DevisSnapshot = { commercial: Commercial; info: DevisInfo };

export type ModifClient = { champ: string; avant: string; apres: string };
export type DemandeClient = {
  id: string;
  date: string;
  version: number;
  modifs: ModifClient[];
  commentaire: string;
  commentairesLignes: Record<string, string>;
  proposition: DevisSnapshot;
  statut: "En attente" | "Acceptée" | "Refusée";
};

export const uid = () => Math.random().toString(36).slice(2, 9);
export const nowStr = () => new Date().toISOString().slice(0, 16).replace("T", " ");
export const TVA_TAUX = [20, 14, 10, 7, 0];

export function initCommercial(d: Dossier, config: Config): Commercial {
  const lignes = computeLignes(d, config);
  const margeTaux = d.gamme === "Haut de gamme" ? config.margeHautDeGamme : config.margeStandard;
  const mo = lignes.reduce((s, l) => s + l.coutMainOeuvre, 0);
  const heures = lignes.reduce((s, l) => s + l.heures, 0);
  return {
    lignes: lignes.map((l) => {
      const q = Math.max(1, l.repere.quantite);
      const achatU = Math.round((l.coutAlu + l.coutVitrage + l.coutAccessoires) / q);
      return {
        id: `l-${l.repere.id}`,
        repereId: l.repere.id,
        designation: l.produitNom === "Repère sur mesure" ? l.repere.designation : l.produitNom,
        description: `${l.repere.designation} — ${l.repere.largeur} × ${l.repere.hauteur} m, ${l.profileRef}, ${l.vitrageType}`,
        qte: l.repere.quantite,
        unite: "u",
        achatU,
        venteU: Math.round(achatU * (1 + margeTaux / 100)),
      };
    }),
    frais: [
      { id: "f-mo", type: "mainOeuvre", libelle: "Main-d'œuvre atelier", description: `${Math.round(heures)} h de fabrication`, montant: Math.round(mo) },
      { id: "f-pose", type: "pose", libelle: "Pose sur chantier", description: "Équipe de pose Strongal", montant: Math.round(heures * 0.45 * config.mainOeuvreHeure) },
      { id: "f-liv", type: "livraison", libelle: "Livraison", description: "Livraison chantier par camion Strongal", montant: config.transportForfait },
    ],
    remise: { mode: "pct", valeur: 0 },
    tvaTaux: 20,
    marge: { mode: "auto", valeur: 0 },
  };
}

export function initDevisInfo(d: Dossier): DevisInfo {
  return {
    numero: `DV-${d.ref.replace("STR-", "")}`,
    client: d.client,
    contact: d.contact,
    projet: `${d.typeProjet} — ${d.adresse.split(",")[0]}`,
    adresse: d.adresse,
    conditionsPaiement: "40 % à la commande, 40 % au lancement fabrication, 20 % à la réception",
    validiteJours: 30,
    notes: "",
    conditionsCommerciales: "Prix en MAD. Délai de fabrication indicatif à compter de l'acompte.",
    notesInternes: "",
    champsClient: { quantites: true, livraison: true, notes: true },
  };
}

export const getCommercial = (d: Dossier, c: Config) => d.commercial ?? initCommercial(d, c);
export const getDevisInfo = (d: Dossier) => d.devisInfo ?? initDevisInfo(d);

export function ligneTotaux(l: LigneCom) {
  return {
    achatTotal: l.achatTotalManuel ?? l.qte * l.achatU,
    venteTotal: l.venteTotalManuel ?? l.qte * l.venteU,
  };
}

export function calcCommercial(c: Commercial) {
  const lignes = c.lignes.map((l) => ({ ...l, ...ligneTotaux(l) }));
  const fournitureBrute = lignes.reduce((s, l) => s + l.achatTotal, 0);
  const chute = (fournitureBrute * (c.chutePct ?? 0)) / 100;
  const fourniture = fournitureBrute + chute;
  const venteLignes = lignes.reduce((s, l) => s + l.venteTotal, 0);
  const par = (t: TypeFrais) => c.frais.filter((f) => f.type === t).reduce((s, f) => s + f.montant, 0);
  const pose = par("pose");
  const mainOeuvre = par("mainOeuvre");
  const livraison = par("livraison");
  const autres = par("autre");
  const fraisTotal = pose + mainOeuvre + livraison + autres;
  const coutTotal = fourniture + fraisTotal;
  const margeAuto = venteLignes - fournitureBrute;
  const margeBrute =
    c.marge.mode === "auto"
      ? margeAuto
      : c.marge.mode === "pct"
        ? (coutTotal * c.marge.valeur) / 100
        : c.marge.valeur;
  const prixVenteBrut = coutTotal + margeBrute;
  const remise = c.remise.mode === "pct" ? (prixVenteBrut * c.remise.valeur) / 100 : c.remise.valeur;
  const totalHT = prixVenteBrut - remise;
  const tvaCalculee = (totalHT * c.tvaTaux) / 100;
  const tva = c.tvaManuelle ?? tvaCalculee;
  const marge = totalHT - coutTotal;
  /** Écart entre prix de vente brut et somme vente lignes + frais (marge forcée). */
  const ajustement = prixVenteBrut - (venteLignes + fraisTotal);
  // chute matière incluse dans le coût : répercutée dans l'ajustement (marge auto conserve la vente lignes)
  return {
    lignes,
    fourniture,
    fournitureBrute,
    chute,
    venteLignes,
    pose,
    mainOeuvre,
    livraison,
    autres,
    fraisTotal,
    coutTotal,
    margeAuto,
    margeBrute,
    prixVenteBrut,
    remise,
    totalHT,
    tvaCalculee,
    tva,
    totalTTC: totalHT + tva,
    marge,
    margePct: coutTotal ? (marge / coutTotal) * 100 : 0,
    tauxMarque: totalHT ? (marge / totalHT) * 100 : 0,
    ajustement,
  };
}

export const totalDossier = (d: Dossier, c: Config) => calcCommercial(getCommercial(d, c));

/** Journal d'audit : compare deux états commerciaux et produit les événements. */
export function diffCommercial(a: Commercial, b: Commercial) {
  const out: { label: string; action: string; avant: string; apres: string }[] = [];
  const n = (v: number | undefined) => (v === undefined ? "calculé" : String(Math.round(v * 100) / 100));
  for (const l of b.lignes) {
    const o = a.lignes.find((x) => x.id === l.id);
    if (!o) {
      out.push({ action: "Ligne ajoutée", label: `Ligne ajoutée — ${l.designation}`, avant: "—", apres: `${l.qte} × ${l.venteU}` });
      continue;
    }
    const champs: [keyof LigneCom, string][] = [
      ["designation", "Désignation"],
      ["description", "Description"],
      ["qte", "Quantité"],
      ["unite", "Unité"],
      ["achatU", "Prix d'achat unitaire"],
      ["venteU", "Prix de vente unitaire"],
      ["achatTotalManuel", "Prix d'achat total"],
      ["venteTotalManuel", "Prix de vente total"],
    ];
    for (const [k, lab] of champs)
      if (o[k] !== l[k])
        out.push({
          action: "Prix modifié",
          label: `${lab} modifié — ${l.designation}`,
          avant: typeof o[k] === "number" || o[k] === undefined ? n(o[k] as number) : String(o[k]),
          apres: typeof l[k] === "number" || l[k] === undefined ? n(l[k] as number) : String(l[k]),
        });
  }
  for (const o of a.lignes)
    if (!b.lignes.find((x) => x.id === o.id))
      out.push({ action: "Ligne supprimée", label: `Ligne supprimée — ${o.designation}`, avant: `${o.qte} × ${o.venteU}`, apres: "—" });
  for (const f of b.frais) {
    const o = a.frais.find((x) => x.id === f.id);
    if (!o) out.push({ action: "Frais ajouté", label: `${f.libelle} ajouté`, avant: "—", apres: n(f.montant) });
    else if (o.montant !== f.montant || o.description !== f.description || o.libelle !== f.libelle)
      out.push({ action: "Frais modifié", label: `${f.libelle} modifié`, avant: `${o.montant} (${o.description})`, apres: `${f.montant} (${f.description})` });
  }
  for (const o of a.frais)
    if (!b.frais.find((x) => x.id === o.id))
      out.push({ action: "Frais supprimé", label: `${o.libelle} supprimé`, avant: n(o.montant), apres: "—" });
  if (a.tvaTaux !== b.tvaTaux)
    out.push({ action: "TVA modifiée", label: "Taux de TVA modifié", avant: `${a.tvaTaux} %`, apres: `${b.tvaTaux} %` });
  if (a.tvaManuelle !== b.tvaManuelle)
    out.push({ action: "TVA modifiée", label: "Montant de TVA modifié", avant: n(a.tvaManuelle), apres: n(b.tvaManuelle) });
  if (a.marge.mode !== b.marge.mode || a.marge.valeur !== b.marge.valeur)
    out.push({
      action: "Marge modifiée",
      label: "Marge modifiée",
      avant: a.marge.mode === "auto" ? "calculée" : `${a.marge.valeur}${a.marge.mode === "pct" ? " %" : " MAD"}`,
      apres: b.marge.mode === "auto" ? "calculée" : `${b.marge.valeur}${b.marge.mode === "pct" ? " %" : " MAD"}`,
    });
  if (a.remise.mode !== b.remise.mode || a.remise.valeur !== b.remise.valeur)
    out.push({
      action: "Remise modifiée",
      label: "Remise modifiée",
      avant: `${a.remise.valeur}${a.remise.mode === "pct" ? " %" : " MAD"}`,
      apres: `${b.remise.valeur}${b.remise.mode === "pct" ? " %" : " MAD"}`,
    });
  return out;
}

/** Recalcule uniquement les lignes non modifiées manuellement. */
export function recalculerDepuisChiffrage(cur: Commercial, d: Dossier, config: Config): Commercial {
  const fresh = initCommercial(d, config);
  return {
    ...cur,
    lignes: cur.lignes.map((l) => {
      const f = fresh.lignes.find((x) => x.repereId && x.repereId === l.repereId);
      if (!f) return l;
      return {
        ...l,
        achatU: l.achatManuel ? l.achatU : f.achatU,
        venteU: l.venteManuel ? l.venteU : f.venteU,
      };
    }),
  };
}

/* ================================ Suivi chantier ================================ */

export type EtatPhase = "À venir" | "En cours" | "Terminée" | "Bloquée";

export const PHASES: { id: string; nom: string; statuts: string[]; points: string[] }[] = [
  { id: "validation", nom: "Validation technique", statuts: ["Non démarrée", "En cours", "Validée"], points: ["Dimensions vérifiées", "Choix du système aluminium", "Vitrage", "Quincaillerie", "Contraintes techniques", "Validation technique"] },
  { id: "appro", nom: "Approvisionnement", statuts: ["Non démarré", "Commande fournisseur passée", "Réception partielle", "Matières reçues"], points: ["Commande fournisseur", "Profils", "Vitrage", "Quincaillerie", "Autres matériaux"] },
  { id: "fabrication", nom: "Fabrication", statuts: ["Non démarrée", "Planifiée", "En cours", "Partiellement terminée", "Terminée", "Contrôle qualité"], points: ["Débit des profilés", "Usinage", "Assemblage", "Vitrage posé en atelier", "Contrôle qualité atelier"] },
  { id: "livraison", nom: "Livraison / logistique", statuts: ["Préparation", "Livraison planifiée", "Transport", "Livrée", "Problème de livraison"], points: ["Emballage", "Chargement", "Transport", "Déchargement chantier"] },
  { id: "prepa", nom: "Préparation du chantier", statuts: ["Non démarrée", "En cours", "Chantier prêt"], points: ["Chantier prêt", "Support vérifié", "Mesures finales", "Accès chantier", "Préparation équipe"] },
  { id: "pose", nom: "Pose / installation", statuts: ["Pose planifiée", "Équipe affectée", "Pose en cours", "Pose partiellement terminée", "Pose terminée"], points: ["Pose des dormants", "Pose des ouvrants", "Calfeutrement / étanchéité", "Réglages quincaillerie"] },
  { id: "controle", nom: "Contrôle / réception", statuts: ["Contrôle qualité", "Réserves", "Corrections nécessaires", "Réception client", "Réception finale"], points: ["Contrôle qualité", "Levée des réserves", "Réception client", "PV de réception signé"] },
  { id: "garantie", nom: "Garantie / intervention", statuts: ["Aucun problème", "Intervention demandée", "Intervention planifiée", "Intervention en cours", "Intervention terminée"], points: [] },
];

export type Phase = {
  id: string;
  etat: EtatPhase;
  statut: string;
  progression: number;
  responsable: string;
  dateDebut: string;
  dateFinPrevue: string;
  dateMaj: string;
  commentaire: string;
  points: Record<string, boolean>;
  documents: string[];
};

export type SuiviMaj = { date: string; phaseId: string; auteur: string; label: string };
export type Suivi = { phases: Phase[]; historique: SuiviMaj[] };

export const EQUIPE = ["Mohamed", "Youssef", "Karim", "Hicham", "Samir", "M. Aboulssaad"];

export function initSuivi(d: Dossier): Suivi {
  // Le suivi terrain démarre après acceptation du devis, sans fusionner avec le statut commercial.
  const cyclePhase: Record<number, string> = {
    4: "appro",
    5: "fabrication",
    6: "livraison",
    7: "pose",
    8: "controle",
    9: "garantie",
  };
  const currentId = cyclePhase[d.etape];
  const currentIndex = currentId ? PHASES.findIndex((p) => p.id === currentId) : -1;
  const done = d.etape >= 9 ? 7 : Math.max(0, currentIndex);
  const current = d.etape >= 4 && d.etape < 9 ? currentIndex : -1;
  return {
    phases: PHASES.map((p, i) => {
      const fini = i < done;
      const enCours = i === current && !fini;
      return {
        id: p.id,
        etat: fini ? "Terminée" : enCours ? "En cours" : "À venir",
        statut: fini ? (p.statuts.at(-1) ?? p.statuts[0]) : enCours ? (p.statuts[1] ?? p.statuts[0]) : p.statuts[0],
        progression: fini ? 100 : enCours ? (p.id === "fabrication" ? 65 : 30) : 0,
        responsable: fini || enCours ? d.technicien.split(" ")[0] || "Mohamed" : "",
        dateDebut: fini || enCours ? d.date : "",
        dateFinPrevue: "",
        dateMaj: fini || enCours ? d.date + " 09:00" : "",
        commentaire: "",
        points: Object.fromEntries(p.points.map((x) => [x, fini])),
        documents: [],
      };
    }),
    historique: [],
  };
}
export const getSuivi = (d: Dossier) => d.suivi ?? initSuivi(d);

export function phaseCourante(s: Suivi) {
  const cur = s.phases.find((p) => p.etat === "En cours" || p.etat === "Bloquée");
  if (cur) return cur;
  const next = s.phases.find((p) => p.etat !== "Terminée");
  return next ?? s.phases[s.phases.length - 1];
}
export const nomPhase = (id: string) => PHASES.find((p) => p.id === id)?.nom ?? id;
export function avancementGlobal(s: Suivi) {
  return s.phases.slice(0, 7).reduce((a, p) => a + p.progression, 0) / 7;
}

/* =================================== Relances =================================== */

export type RelanceConfig = {
  max: number;
  premierJours: number;
  intervalleJours: number;
  intervalleHeures: number;
  jours: number[]; // 0 = dimanche … 6 = samedi
  heure: string;
};

export type RelanceTemplate = { id: string; nom: string; contenu: string };

export type RelanceEnvoyee = {
  numero: number;
  dateDue: string;
  dateEnvoi: string;
  auteur: string;
  canal: "Email" | "WhatsApp" | "Téléphone";
  message: string;
  statut: "Envoyée" | "Ignorée";
};

export const defaultRelanceConfig: RelanceConfig = {
  max: 3,
  premierJours: 3,
  intervalleJours: 4,
  intervalleHeures: 0,
  jours: [1, 2, 3, 4, 5],
  heure: "10:00",
};

export const defaultTemplates: RelanceTemplate[] = [
  {
    id: "t1",
    nom: "Relance devis standard",
    contenu:
      "Bonjour {{client_name}},\n\nNous revenons vers vous concernant votre devis {{devis_number}} d'un montant de {{montant_ttc}}.\n\nNous restons à votre disposition pour toute question.\n\nCordialement,\n{{user_name}}",
  },
  {
    id: "t2",
    nom: "Dernière relance",
    contenu:
      "Bonjour {{client_name}},\n\nSauf erreur de notre part, nous n'avons pas eu de retour sur le devis {{devis_number}}. Sa validité arrive bientôt à échéance.\n\nSouhaitez-vous que nous planifions un rendez-vous ?\n\nCordialement,\n{{user_name}}",
  },
];

export const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export type RelancePlanifiee = {
  numero: number;
  dateDue: Date;
  statut: "Planifiée" | "Due" | "Envoyée" | "Ignorée";
  envoi?: RelanceEnvoyee;
};

/** Planning des relances à partir de l'envoi du dernier devis. Aucun envoi automatique. */
export function planRelances(d: Dossier, cfg: RelanceConfig, now = new Date()): RelancePlanifiee[] {
  const dv = d.devis.at(-1);
  if (!dv) return [];
  const envoyees = d.relances ?? [];
  const actif = dv.statut === "Envoyé" || dv.statut === "Vu par le client";
  const base = new Date(dv.date + "T00:00:00");
  const [h, m] = cfg.heure.split(":").map(Number);
  const out: RelancePlanifiee[] = [];
  let cursor = new Date(base.getTime() + cfg.premierJours * 86400000);
  for (let n = 1; n <= cfg.max; n++) {
    if (n > 1) cursor = new Date(cursor.getTime() + cfg.intervalleJours * 86400000 + cfg.intervalleHeures * 3600000);
    const due = new Date(cursor);
    if (!cfg.intervalleHeures || n === 1) due.setHours(h || 0, m || 0, 0, 0);
    let guard = 0;
    while (cfg.jours.length && !cfg.jours.includes(due.getDay()) && guard++ < 7) due.setDate(due.getDate() + 1);
    cursor = due;
    const envoi = envoyees.find((r) => r.numero === n);
    if (envoi) out.push({ numero: n, dateDue: due, statut: envoi.statut, envoi });
    else if (actif) out.push({ numero: n, dateDue: due, statut: due <= now ? "Due" : "Planifiée" });
  }
  return out;
}

export const fmtDate = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
  " " +
  d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export function remplirTemplate(t: string, vars: Record<string, string>) {
  return t.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

/* =================================== Factures =================================== */

export type StatutFacture = "Brouillon" | "Générée" | "Envoyée" | "Payée" | "En retard" | "Annulée";
export const STATUTS_FACTURE: StatutFacture[] = ["Brouillon", "Générée", "Envoyée", "Payée", "En retard", "Annulée"];

export type Facture = {
  id: string;
  numero: string;
  dossierRef: string;
  devisVersion: number | null;
  client: string;
  adresse: string;
  date: string;
  echeance: string;
  commercial: Commercial;
  conditionsPaiement: string;
  notes: string;
  statut: StatutFacture;
  historique: { date: string; auteur: string; label: string }[];
};

/** Convertit un chiffrage en base de facturation (marge forcée → ligne d'ajustement). */
export function commercialPourFacture(c: Commercial): Commercial {
  const r = calcCommercial(c);
  const lignes = [...c.lignes];
  if (Math.abs(r.ajustement) > 0.5)
    lignes.push({ id: uid(), designation: "Ajustement commercial", description: "", qte: 1, unite: "forfait", achatU: 0, venteU: Math.round(r.ajustement) });
  return { ...c, lignes, marge: { mode: "auto", valeur: 0 } };
}

export function statutFactureEffectif(f: Facture, today = new Date().toISOString().slice(0, 10)): StatutFacture {
  if ((f.statut === "Envoyée" || f.statut === "Générée") && f.echeance && f.echeance < today) return "En retard";
  return f.statut;
}


/* ============================ WhatsApp & recommandations ============================ */

export function lienWhatsApp(tel: string | undefined, message: string) {
  const n = (tel ?? "").replace(/[^0-9]/g, "").replace(/^0/, "212");
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

export const MESSAGES_AVANCEMENT = [
  "Bonjour {client}, votre commande est passée chez notre fournisseur. Nous vous tenons informé. — Strongal",
  "Bonjour {client}, la fabrication de vos menuiseries a démarré, livraison prévue sous 10 jours. — Strongal",
  "Bonjour {client}, vos menuiseries sont livrées sur le chantier. — Strongal",
  "Bonjour {client}, la pose du niveau 1 est terminée. — Strongal",
  "Bonjour {client}, la pose du niveau 2 est terminée. — Strongal",
  "Bonjour {client}, les travaux sont terminés, nous planifions la réception avec vous. — Strongal",
];
