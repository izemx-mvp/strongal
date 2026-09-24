export type ModeVente = "ml-largeur" | "ml-hauteur" | "m2" | "unite";
export const MODES_VENTE: { value: ModeVente; label: string }[] = [
  { value: "ml-largeur", label: "Mètre linéaire (largeur)" },
  { value: "ml-hauteur", label: "Mètre linéaire (hauteur)" },
  { value: "m2", label: "Mètre carré (m²)" },
  { value: "unite", label: "À l'unité" },
];

export type Profile = {
  id: string;
  ref: string;
  serie: string;
  famille: string;
  finition: string;
  ratio: number; // coefficient de consommation par ml
  delai: number; // jours
  moq: number; // ml
  prixBarre: number; // MAD par barre
  fournisseur?: string;
  codeFournisseur?: string;
  modeVente?: ModeVente;
  methode?: string;
};

export type ConditionSite = "vent" | "bruit" | "mer" | "hauteur" | "soleil";
export const CONDITIONS_SITE: { value: ConditionSite; label: string }[] = [
  { value: "vent", label: "Zone ventée" },
  { value: "bruit", label: "Zone bruyante" },
  { value: "mer", label: "Bord de mer" },
  { value: "hauteur", label: "Étage élevé" },
  { value: "soleil", label: "Forte exposition soleil" },
];

export type RegleSavoirFaire = {
  id: string;
  condition: ConditionSite | "general";
  titre: string;
  conseil: string;
  prixSuggere: number;
  unite: string;
};

export type ChangementPrix = {
  date: string;
  fournisseur: string;
  pct: number;
  nbArticles: number;
  auteur: string;
};

export type Vitrage = {
  id: string;
  type: string;
  epaisseur: string;
  perf: string;
  prixM2: number;
};

export type Accessoire = {
  id: string;
  nom: string;
  unite: string;
  coutUnitaire: number;
  qteStandard: number;
};

export type Ouvrage = {
  id: string;
  nom: string;
  coefficient: number;
  delaiFabrication: number;
};

/** Base de calcul d'un composant : dépend des dimensions du repère. */
export type BaseComposant = "perimetre" | "largeur" | "hauteur" | "surface" | "unite";

export const BASES_COMPOSANT: { value: BaseComposant; label: string; unite: string }[] = [
  { value: "perimetre", label: "Périmètre (2×(L+H))", unite: "ml" },
  { value: "largeur", label: "Largeur", unite: "ml" },
  { value: "hauteur", label: "Hauteur", unite: "ml" },
  { value: "surface", label: "Surface (L×H)", unite: "m²" },
  { value: "unite", label: "À l'unité", unite: "u" },
];

export type ComposantProduit = {
  id: string;
  type: "profil" | "accessoire";
  refId: string;
  base: BaseComposant;
  coef: number;
};

/** Produit fini du catalogue + sa fiche technique (nomenclature paramétrée). */
export type Produit = {
  id: string;
  nom: string;
  categorie: string;
  description: string;
  ouvrageId: string;
  profileId: string;
  vitrageId: string;
  heuresM2: number;
  composants: ComposantProduit[];
  gamme?: "Standard" | "Décoratif" | "Technique";
  systeme?: string;
  typesChantier?: string[];
  modeVente?: ModeVente;
  methode?: string;
};

export type Config = {
  profiles: Profile[];
  vitrages: Vitrage[];
  accessoires: Accessoire[];
  ouvrages: Ouvrage[];
  produits: Produit[];
  longueurBarre: number;
  longueurBarreAlt: number;
  seuilLargeur: number;
  seuilHauteur: number;
  seuilCout: number;
  mainOeuvreHeure: number;
  transportForfait: number;
  margeStandard: number;
  margeHautDeGamme: number;
  arrondi: "cm" | "mm";
  validated: boolean;
  surchargeEtagePct?: number;
  reglesSavoirFaire?: RegleSavoirFaire[];
  historiquePrix?: ChangementPrix[];
};

export type Repere = {
  id: string;
  designation: string;
  largeur: number;
  hauteur: number;
  quantite: number;
  ouvrageId: string;
  profileId: string;
  vitrageId: string;
  produitId?: string;
  contraintes: string[];
  modifieManuellement?: boolean;
  raisonModif?: string;
  valideManuellement?: boolean;
};

export type DevisVersion = {
  version: number;
  date: string;
  total: number;
  statut: "Envoyé" | "Vu par le client" | "Modification demandée" | "Accepté" | "Refusé";
  snapshot?: import("./erp").DevisSnapshot;
};

export type HistoEntry = {
  date: string;
  auteur: string;
  label: string;
  action?: string;
  avant?: string;
  apres?: string;
};

export type StatutDossier =
  | "Nouveau"
  | "Collecte terrain"
  | "Chiffrage en cours"
  | "À valider"
  | "Validé"
  | "Devis envoyé"
  | "Devis accepté"
  | "Livré";

export type Dossier = {
  ref: string;
  client: string;
  contact: string;
  typeProjet: "Résidentiel" | "Villa" | "Commercial" | "Promotion";
  gamme: "Standard" | "Haut de gamme";
  adresse: string;
  technicien: string;
  dateCollecte: string;
  date: string;
  statut: StatutDossier;
  etape: number; // 0..9 — cycle opérationnel complet
  reperes: Repere[];
  notes: string;
  checklist: Record<string, boolean>;
  devis: DevisVersion[];
  historique: HistoEntry[];
  resume: string[];
  isNew?: boolean;
  commercial?: import("./erp").Commercial;
  devisInfo?: import("./erp").DevisInfo;
  suivi?: import("./erp").Suivi;
  relances?: import("./erp").RelanceEnvoyee[];
  demandesClient?: import("./erp").DemandeClient[];
  telephone?: string;
  etage?: number;
  conditionsSite?: ConditionSite[];
  premierAppel?: { fait: boolean; date?: string; note?: string };
};

/* ------------------------------ Config par défaut ------------------------------ */

export const defaultConfig: Config = {
  profiles: [
    {
      id: "p1",
      ref: "STR-CL-70",
      serie: "Sepalumic 6500",
      famille: "Coulissant",
      finition: "Anodisé bronze",
      ratio: 1.12,
      delai: 21,
      moq: 60,
      prixBarre: 980,
    },
    {
      id: "p2",
      ref: "STR-CL-90XL",
      serie: "Schüco ASS 77",
      famille: "Coulissant à levage",
      finition: "Laqué RAL 9005",
      ratio: 1.18,
      delai: 35,
      moq: 80,
      prixBarre: 1640,
    },
    {
      id: "p3",
      ref: "STR-OF-65",
      serie: "Technal Soleal",
      famille: "Ouvrant à la française",
      finition: "Laqué RAL 7016",
      ratio: 1.1,
      delai: 18,
      moq: 50,
      prixBarre: 860,
    },
    {
      id: "p4",
      ref: "STR-MR-52",
      serie: "Schüco FW 50+",
      famille: "Mur rideau",
      finition: "Anodisé naturel",
      ratio: 1.25,
      delai: 45,
      moq: 200,
      prixBarre: 2150,
    },
    {
      id: "p5",
      ref: "STR-PB-120",
      serie: "Aluminium du Maroc PB",
      famille: "Pergola bioclimatique",
      finition: "Laqué RAL 7039",
      ratio: 1.2,
      delai: 28,
      moq: 100,
      prixBarre: 1780,
    },
    {
      id: "p6",
      ref: "STR-BS-200",
      serie: "Sepalumic Brise-soleil",
      famille: "Brise-soleil",
      finition: "Anodisé bronze",
      ratio: 1.08,
      delai: 25,
      moq: 90,
      prixBarre: 1240,
    },
    {
      id: "p7",
      ref: "STR-PT-80",
      serie: "Aluminium du Maroc Portail",
      famille: "Portail villa",
      finition: "Laqué RAL 9006",
      ratio: 1.15,
      delai: 30,
      moq: 70,
      prixBarre: 1320,
    },
    {
      id: "p8",
      ref: "STR-GC-45",
      serie: "Technal Garde-corps",
      famille: "Garde-corps",
      finition: "Anodisé naturel",
      ratio: 1.05,
      delai: 15,
      moq: 40,
      prixBarre: 720,
    },
  ],
  vitrages: [
    { id: "v1", type: "Simple vitrage", epaisseur: "6 mm", perf: "Basique", prixM2: 190 },
    { id: "v2", type: "Double vitrage", epaisseur: "4/16/4", perf: "Ug 1.1 — 32 dB", prixM2: 420 },
    {
      id: "v3",
      type: "Double vitrage FE",
      epaisseur: "6/16/6",
      perf: "Ug 1.0 — 36 dB",
      prixM2: 560,
    },
    { id: "v4", type: "Feuilleté 44.2", epaisseur: "8.8 mm", perf: "Sécurité — 35 dB", prixM2: 610 },
    { id: "v5", type: "Trempé", epaisseur: "10 mm", perf: "Sécurité renforcée", prixM2: 680 },
  ],
  accessoires: [
    { id: "a1", nom: "Roulette double galet", unite: "u", coutUnitaire: 145, qteStandard: 2 },
    { id: "a2", nom: "Poignée cuvette alu", unite: "u", coutUnitaire: 210, qteStandard: 1 },
    { id: "a3", nom: "Joint EPDM", unite: "ml", coutUnitaire: 18, qteStandard: 12 },
    { id: "a4", nom: "Serrure multipoints", unite: "u", coutUnitaire: 690, qteStandard: 1 },
    { id: "a5", nom: "Verrou de sécurité", unite: "u", coutUnitaire: 120, qteStandard: 2 },
    { id: "a6", nom: "Motorisation verrouillage", unite: "u", coutUnitaire: 2400, qteStandard: 0 },
    { id: "a7", nom: "Équerre de renfort", unite: "u", coutUnitaire: 65, qteStandard: 4 },
  ],
  ouvrages: [
    { id: "o1", nom: "Baie coulissante", coefficient: 1, delaiFabrication: 21 },
    { id: "o2", nom: "Mur rideau", coefficient: 1.85, delaiFabrication: 60 },
    { id: "o3", nom: "Pergola bioclimatique", coefficient: 1.5, delaiFabrication: 35 },
    { id: "o4", nom: "Verrière", coefficient: 1.6, delaiFabrication: 40 },
    { id: "o5", nom: "Portail de villa", coefficient: 1.35, delaiFabrication: 30 },
    { id: "o6", nom: "Brise-soleil", coefficient: 1.25, delaiFabrication: 25 },
    { id: "o7", nom: "Garde-corps", coefficient: 1.1, delaiFabrication: 18 },
    { id: "o8", nom: "Habillage aluminium", coefficient: 0.9, delaiFabrication: 15 },
  ],
  produits: [
    {
      id: "pr1",
      nom: "Baie coulissante 2 vantaux",
      categorie: "Coulissant",
      description:
        "Baie coulissante à rupture de pont thermique, 2 vantaux sur rail bas, vitrage isolant.",
      ouvrageId: "o1",
      profileId: "p1",
      vitrageId: "v2",
      heuresM2: 1.6,
      composants: [
        { id: "c1", type: "profil", refId: "p1", base: "perimetre", coef: 1 },
        { id: "c2", type: "profil", refId: "p1", base: "hauteur", coef: 4 },
        { id: "c3", type: "profil", refId: "p1", base: "largeur", coef: 2 },
        { id: "c4", type: "accessoire", refId: "a1", base: "unite", coef: 4 },
        { id: "c5", type: "accessoire", refId: "a2", base: "unite", coef: 2 },
        { id: "c6", type: "accessoire", refId: "a3", base: "perimetre", coef: 1.2 },
        { id: "c7", type: "accessoire", refId: "a7", base: "unite", coef: 4 },
      ],
    },
    {
      id: "pr2",
      nom: "Baie coulissante 3 vantaux",
      categorie: "Coulissant",
      description: "Grande baie 3 vantaux, seuil PMR possible, vitrage faible émissivité.",
      ouvrageId: "o1",
      profileId: "p1",
      vitrageId: "v3",
      heuresM2: 1.9,
      composants: [
        { id: "c1", type: "profil", refId: "p1", base: "perimetre", coef: 1 },
        { id: "c2", type: "profil", refId: "p1", base: "hauteur", coef: 6 },
        { id: "c3", type: "profil", refId: "p1", base: "largeur", coef: 3 },
        { id: "c4", type: "accessoire", refId: "a1", base: "unite", coef: 6 },
        { id: "c5", type: "accessoire", refId: "a2", base: "unite", coef: 3 },
        { id: "c6", type: "accessoire", refId: "a3", base: "perimetre", coef: 1.4 },
        { id: "c7", type: "accessoire", refId: "a5", base: "unite", coef: 3 },
      ],
    },
    {
      id: "pr3",
      nom: "Fenêtre oscillo-battante 2 vantaux",
      categorie: "Ouvrant",
      description: "Fenêtre à frappe 2 vantaux, un ouvrant oscillo-battant, serrure multipoints.",
      ouvrageId: "o1",
      profileId: "p2",
      vitrageId: "v2",
      heuresM2: 1.4,
      composants: [
        { id: "c1", type: "profil", refId: "p2", base: "perimetre", coef: 1 },
        { id: "c2", type: "profil", refId: "p2", base: "perimetre", coef: 0.95 },
        { id: "c3", type: "profil", refId: "p2", base: "hauteur", coef: 1 },
        { id: "c4", type: "accessoire", refId: "a4", base: "unite", coef: 1 },
        { id: "c5", type: "accessoire", refId: "a2", base: "unite", coef: 2 },
        { id: "c6", type: "accessoire", refId: "a3", base: "perimetre", coef: 2 },
        { id: "c7", type: "accessoire", refId: "a7", base: "unite", coef: 8 },
      ],
    },
    {
      id: "pr4",
      nom: "Mur rideau trame verticale",
      categorie: "Façade",
      description: "Façade rideau à trame verticale, remplissage vitré, fixation sur nez de dalle.",
      ouvrageId: "o2",
      profileId: "p3",
      vitrageId: "v3",
      heuresM2: 2.4,
      composants: [
        { id: "c1", type: "profil", refId: "p3", base: "hauteur", coef: 3 },
        { id: "c2", type: "profil", refId: "p3", base: "largeur", coef: 4 },
        { id: "c3", type: "accessoire", refId: "a3", base: "surface", coef: 2.5 },
        { id: "c4", type: "accessoire", refId: "a7", base: "surface", coef: 4 },
      ],
    },
    {
      id: "pr5",
      nom: "Pergola bioclimatique à lames orientables",
      categorie: "Extérieur",
      description: "Structure alu laqué, lames orientables motorisées, évacuation des eaux intégrée.",
      ouvrageId: "o3",
      profileId: "p4",
      vitrageId: "v1",
      heuresM2: 2,
      composants: [
        { id: "c1", type: "profil", refId: "p4", base: "perimetre", coef: 1.2 },
        { id: "c2", type: "profil", refId: "p4", base: "largeur", coef: 6 },
        { id: "c3", type: "accessoire", refId: "a6", base: "unite", coef: 1 },
        { id: "c4", type: "accessoire", refId: "a7", base: "unite", coef: 8 },
      ],
    },
    {
      id: "pr6",
      nom: "Garde-corps vitré",
      categorie: "Extérieur",
      description: "Garde-corps tout verre sur profil de serrage alu, verre feuilleté de sécurité.",
      ouvrageId: "o7",
      profileId: "p5",
      vitrageId: "v4",
      heuresM2: 1.1,
      composants: [
        { id: "c1", type: "profil", refId: "p5", base: "largeur", coef: 2 },
        { id: "c2", type: "profil", refId: "p5", base: "hauteur", coef: 2 },
        { id: "c3", type: "accessoire", refId: "a7", base: "largeur", coef: 2 },
        { id: "c4", type: "accessoire", refId: "a3", base: "largeur", coef: 2 },
      ],
    },
  ],
  longueurBarre: 6.4,
  longueurBarreAlt: 6,
  seuilLargeur: 3,
  seuilHauteur: 3,
  seuilCout: 10000,
  mainOeuvreHeure: 180,
  transportForfait: 1500,
  margeStandard: 18,
  margeHautDeGamme: 28,
  arrondi: "cm",
  validated: false,
  surchargeEtagePct: 6,
  reglesSavoirFaire: [
    { id: "r1", condition: "vent", titre: "Renfort façade et côtés", conseil: "En zone ventée, prévoir un renfort de dormant sur la façade et les côtés, et des équerres supplémentaires.", prixSuggere: 180, unite: "ml" },
    { id: "r2", condition: "bruit", titre: "Vitrage acoustique", conseil: "Zone bruyante : proposer un double vitrage acoustique feuilleté 44.2 silence et joints renforcés.", prixSuggere: 420, unite: "m²" },
    { id: "r3", condition: "mer", titre: "Finition marine", conseil: "Bord de mer : anodisation qualité marine ou laquage Qualimarine, visserie inox A4.", prixSuggere: 90, unite: "ml" },
    { id: "r4", condition: "hauteur", titre: "Levage et sécurité", conseil: "Étage élevé : prévoir moyen de levage, harnais et une demi-journée d'équipe supplémentaire.", prixSuggere: 1500, unite: "forfait" },
    { id: "r5", condition: "soleil", titre: "Vitrage contrôle solaire", conseil: "Forte exposition : vitrage à contrôle solaire ou brise-soleil orientable.", prixSuggere: 350, unite: "m²" },
    { id: "r6", condition: "general", titre: "Mesures réelles", conseil: "Toujours reprendre les mesures finales après enduit : la quantité réellement posée est souvent inférieure au métré brut.", prixSuggere: 0, unite: "" },
  ],
  historiquePrix: [],
};

// Valeurs fournisseur / méthode de vente par défaut (démo, à remplacer par le catalogue réel).
const FOURNISSEURS = ["Technal", "Schüco", "Sapa", "Aluk"];
defaultConfig.profiles = defaultConfig.profiles.map((p, i) => ({
  ...p,
  fournisseur: p.fournisseur ?? FOURNISSEURS[i % FOURNISSEURS.length],
  codeFournisseur: p.codeFournisseur ?? `F-${1000 + i * 37}`,
  modeVente: p.modeVente ?? (i % 3 === 0 ? "m2" : i % 3 === 1 ? "ml-largeur" : "ml-hauteur"),
  methode: p.methode ?? "Prix de base au ml × ratio de consommation, chute incluse.",
}));
defaultConfig.produits = defaultConfig.produits.map((p, i) => ({
  ...p,
  gamme: p.gamme ?? (["Standard", "Décoratif", "Technique"] as const)[i % 3],
  systeme: p.systeme ?? FOURNISSEURS[i % FOURNISSEURS.length],
  typesChantier: p.typesChantier ?? [["Villa", "Appartement"], ["Villa", "Façade"], ["Portail", "Villa"]][i % 3],
  modeVente: p.modeVente ?? (i % 2 ? "m2" : "unite"),
  methode: p.methode ?? "Prix de base × ratio de gamme ; ajuster selon étage et contraintes chantier.",
}));

export const CHECKLIST_ITEMS = [
  "Dimensions confirmées sur site",
  "Ratio catalogue appliqué sans anomalie",
  "Tous les repères en zone d'équilibrage validés manuellement",
  "Marge minimale respectée",
  "Délai de fabrication cohérent avec le souhait du client",
];

/* ------------------------------ Dossiers mockés ------------------------------ */

const techniciens = ["Y. Benali", "K. Rahmouni", "S. El Idrissi", "A. Toufik", "M. Ouazzani"];
const contraintesPool = [
  "Présence d'un coffre de volet roulant",
  "Accès chantier difficile (étage sans ascenseur)",
  "Appui maçonné à reprendre",
  "Seuil PMR demandé",
  "Exposition vent fort (front de mer)",
  "Alignement à respecter avec l'existant",
];

type Seed = [
  string,
  Dossier["typeProjet"],
  Dossier["gamme"],
  StatutDossier,
  string,
  string,
  string,
  string[],
  number,
];

const seeds: Seed[] = [
  [
    "Villa Alia — Famille Bennani",
    "Villa",
    "Haut de gamme",
    "Devis accepté",
    "Lot 14, Bouskoura Green Town",
    "o1",
    "p2",
    ["Baie à levage séjour 4 vantaux", "Baie suite parentale", "Châssis cuisine oscillo-battant"],
    5,
  ],
  [
    "Résidence Les Terrasses d'Anfa",
    "Promotion",
    "Standard",
    "Devis accepté",
    "Boulevard Sidi Abderrahmane, Casablanca",
    "o1",
    "p1",
    ["Baies séjour type T3 — tranche A", "Fenêtres chambres type F2", "Portes-fenêtres terrasses"],
    4,
  ],
  [
    "Siège Novatech Industries",
    "Commercial",
    "Haut de gamme",
    "Devis accepté",
    "Parc industriel Sapino, Nouaceur",
    "o2",
    "p4",
    ["Mur rideau façade principale", "Mur rideau patio", "Portes aluminium hall"],
    6,
  ],
  [
    "Clinique Horizon Santé",
    "Commercial",
    "Haut de gamme",
    "Devis accepté",
    "Quartier Oasis, Casablanca",
    "o1",
    "p3",
    ["Châssis chambres patients", "Ensemble vitré accueil", "Portes de service"],
    7,
  ],
  [
    "Villa Riad — M. Amine Idrissi",
    "Villa",
    "Haut de gamme",
    "Devis accepté",
    "Route de l'Ourika, Marrakech",
    "o3",
    "p5",
    ["Pergola bioclimatique terrasse", "Fermeture latérale vitrée"],
    8,
  ],
  [
    "Atelier Atlas Mobilité",
    "Commercial",
    "Standard",
    "À valider",
    "Zone industrielle Aïn Sebaâ, Casablanca",
    "o8",
    "p8",
    ["Habillage façade bureaux", "Châssis fixes atelier"],
    2,
  ],
  [
    "Mme Laila El Mansouri",
    "Résidentiel",
    "Standard",
    "Chiffrage en cours",
    "Quartier CIL, Casablanca",
    "o1",
    "p1",
    ["Baie coulissante salon", "Fenêtre cuisine", "Fenêtres chambres"],
    1,
  ],
  [
    "Villa Océan — M. Adil Tazi",
    "Villa",
    "Haut de gamme",
    "Collecte terrain",
    "Plage des Nations, Bouknadel",
    "o7",
    "p5",
    ["Garde-corps vitré terrasse", "Baie à levage séjour"],
    0,
  ],
  [
    "Résidence Yasmine — Lot menuiserie",
    "Promotion",
    "Standard",
    "Devis envoyé",
    "Sidi Maârouf, Casablanca",
    "o1",
    "p1",
    ["Baies type B — bâtiment 1", "Fenêtres type F1", "Portes-fenêtres balcons"],
    3,
  ],
  [
    "Showroom Mobilia Design",
    "Commercial",
    "Standard",
    "Livré",
    "Boulevard Al Massira, Casablanca",
    "o2",
    "p4",
    ["Façade vitrée showroom", "Porte d'entrée aluminium"],
    9,
  ],
];

const statutEtape: Record<StatutDossier, number> = {
  Nouveau: 0,
  "Collecte terrain": 0,
  "Chiffrage en cours": 1,
  "À valider": 2,
  Validé: 3,
  "Devis envoyé": 3,
  "Devis accepté": 4,
  Livré: 4,
};

function dateStr(daysAgo: number) {
  const d = new Date(2026, 8, 15);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export const initialDossiers: Dossier[] = seeds.map((s, i) => {
  const [client, typeProjet, gamme, statut, adresse, ouvrageId, profileId, designations, cycleEtape] = s;
  const n = String(i === seeds.length - 1 ? 18 : i + 1).padStart(3, "0");
  const ref = `STR-2026-${n}`;
  const reperes: Repere[] = designations.map((designation, j) => {
    const big = i === 0 || i === 10 || i === 16;
    const largeur = big && j === 0 ? 4.2 + j : 1.4 + ((i + j) % 4) * 0.55;
    const hauteur = big && j === 0 ? 3.1 : 1.3 + ((i + j) % 3) * 0.45;
    return {
      id: `${ref}-R${j + 1}`,
      designation,
      largeur: Math.round(largeur * 100) / 100,
      hauteur: Math.round(hauteur * 100) / 100,
      quantite: 1 + ((i + j) % 4),
      ouvrageId,
      profileId,
      vitrageId: gamme === "Haut de gamme" ? "v3" : "v2",
      produitId:
        ouvrageId === "o1"
          ? gamme === "Haut de gamme"
            ? "pr2"
            : "pr1"
          : ouvrageId === "o2"
            ? "pr4"
            : ouvrageId === "o3"
              ? "pr5"
              : ouvrageId === "o7"
                ? "pr6"
                : "pr3",
      contraintes: [contraintesPool[(i + j) % contraintesPool.length]],
    };
  });
  const etape = cycleEtape ?? statutEtape[statut];
  const historique: HistoEntry[] = [
    { date: dateStr(30 - i), auteur: "Système", label: "Dossier créé" },
    { date: dateStr(28 - i), auteur: "Agent Collecte", label: "Collecte terrain enregistrée" },
  ];
  if (etape >= 1)
    historique.push({
      date: dateStr(22 - i),
      auteur: "Agent Chiffrage",
      label: "Chiffrage matières calculé automatiquement",
    });
  if (etape >= 3)
    historique.push({
      date: dateStr(14 - i),
      auteur: "M. Aboulssaad",
      label: "Chiffrage validé et devis technique généré",
    });
  const devis: DevisVersion[] =
    etape >= 3
      ? [
          {
            version: 1,
            date: dateStr(14 - i),
            total: 0,
            statut: statut === "Livré" || statut === "Devis accepté" ? "Accepté" : "Envoyé",
          },
        ]
      : [];
  return {
    ref,
    client,
    contact: `+212 6${String(10000000 + i * 137711).slice(0, 8)}`,
    typeProjet,
    gamme,
    adresse,
    technicien: techniciens[i % techniciens.length],
    dateCollecte: dateStr(28 - i),
    date: dateStr(30 - i),
    statut,
    etape,
    reperes,
    notes: "",
    checklist: Object.fromEntries(CHECKLIST_ITEMS.map((c) => [c, etape >= 3])),
    devis,
    historique,
    resume: [
      `${reperes.length} repère(s) relevés sur site par ${techniciens[i % techniciens.length]}.`,
      `Projet ${typeProjet.toLowerCase()} en gamme ${gamme.toLowerCase()} — ${adresse}.`,
      `Contraintes principales : ${reperes[0].contraintes[0].toLowerCase()}.`,
      `Système préconisé : ${defaultConfig.profiles.find((p) => p.id === profileId)?.serie}.`,
    ],
  };
});

export const LOGO_URL =
  "https://strongal.ma/wp-content/uploads/2025/11/Black-Monoline-Real-Estate-Logo-copie.png";
