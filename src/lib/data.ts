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
};

export type Qualification = {
  budgetMin: number;
  zones: string[];
  typesProjets: string[];
  delaiReponse: number;
  infosRequises: string[];
  scoreMin: number;
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
  qualification: Qualification;
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
  statut: "Envoyé" | "Vu par le client" | "Accepté" | "Refusé";
};

export type HistoEntry = { date: string; auteur: string; label: string };

export type StatutDossier =
  | "Nouveau"
  | "Collecte terrain"
  | "Chiffrage en cours"
  | "À valider"
  | "Validé"
  | "Devis envoyé"
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
  etape: number; // 0..4
  reperes: Repere[];
  notes: string;
  checklist: Record<string, boolean>;
  devis: DevisVersion[];
  historique: HistoEntry[];
  resume: string[];
  isNew?: boolean;
};

export type StatutProspect =
  | "Qualifié IA"
  | "Non qualifié IA"
  | "Informations incomplètes"
  | "Contacté"
  | "Devis envoyé"
  | "En négociation"
  | "Client signé"
  | "Perdu";

export type Prospect = {
  id: string;
  nom: string;
  contact: string;
  source: "WhatsApp" | "Email" | "Site web" | "Téléphone";
  besoin: string;
  budget: number;
  typeProjet: string;
  zone: string;
  statut: StatutProspect;
  statutIA: StatutProspect;
  justification: string;
  score: number;
  date: string;
  notes: string;
  corrigeManuellement?: boolean;
  historique: HistoEntry[];
};

export type Faq = {
  id: string;
  question: string;
  reponse: string;
  categorie: "Produits" | "Délais" | "Paiement" | "SAV";
  actif: boolean;
};

export type DocItem = {
  id: string;
  nom: string;
  type: string;
  taille: string;
  date: string;
};

export type Horaire = { jour: string; ouvert: boolean; debut: string; fin: string };

export type InfosPratiques = {
  reseaux: { id: string; nom: string; url: string; actif: boolean }[];
  adresse: string;
  telephone: string;
  email: string;
  horaires: Horaire[];
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
  qualification: {
    budgetMin: 25000,
    zones: ["Casablanca", "Mohammedia", "Bouskoura", "Dar Bouazza", "Rabat", "Marrakech"],
    typesProjets: ["Résidentiel standard", "Villa haut de gamme", "Commercial"],
    delaiReponse: 4,
    infosRequises: ["Dimensions approximatives connues", "Budget évoqué", "Zone confirmée"],
    scoreMin: 60,
  },
};

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
];

const seeds: Seed[] = [
  [
    "M. Karim Benjelloun",
    "Villa",
    "Haut de gamme",
    "À valider",
    "Villa Anfa Supérieur, Casablanca",
    "o1",
    "p2",
    ["Baie coulissante salon 4 vantaux", "Baie coulissante suite parentale"],
  ],
  [
    "Groupe Palmeraie Développement",
    "Promotion",
    "Standard",
    "Chiffrage en cours",
    "Résidence Palmeraie, Bouskoura",
    "o1",
    "p1",
    ["Baies séjour type A", "Fenêtres chambres type A"],
  ],
  [
    "Sté Marocaine d'Industrie Légère",
    "Commercial",
    "Haut de gamme",
    "Validé",
    "Zone industrielle Ain Sebaâ, Casablanca",
    "o2",
    "p4",
    ["Mur rideau façade principale", "Mur rideau retour Est"],
  ],
  [
    "Mme Salma Bennani",
    "Résidentiel",
    "Standard",
    "Devis envoyé",
    "Racine, Casablanca",
    "o1",
    "p1",
    ["Baie coulissante terrasse", "Fenêtre cuisine"],
  ],
  [
    "M. Youssef El Amrani",
    "Villa",
    "Haut de gamme",
    "Collecte terrain",
    "Dar Bouazza",
    "o3",
    "p5",
    ["Pergola bioclimatique piscine"],
  ],
  [
    "Résidence Al Manar Promotion",
    "Promotion",
    "Standard",
    "Nouveau",
    "Sidi Maârouf, Casablanca",
    "o1",
    "p1",
    ["Baies type B x 12", "Garde-corps balcons"],
  ],
  [
    "M. Rachid Tazi",
    "Villa",
    "Haut de gamme",
    "Livré",
    "Californie, Casablanca",
    "o5",
    "p7",
    ["Portail coulissant motorisé", "Portillon assorti"],
  ],
  [
    "Clinique Atlas Santé",
    "Commercial",
    "Standard",
    "À valider",
    "Maârif, Casablanca",
    "o1",
    "p3",
    ["Fenêtres chambres étage 1", "Châssis fixes couloir"],
  ],
  [
    "Mme Nadia Cherkaoui",
    "Résidentiel",
    "Standard",
    "Chiffrage en cours",
    "Ain Diab, Casablanca",
    "o6",
    "p6",
    ["Brise-soleil façade Sud"],
  ],
  [
    "M. Hamza Fassi",
    "Villa",
    "Haut de gamme",
    "Validé",
    "Bouskoura Golf City",
    "o4",
    "p3",
    ["Verrière patio", "Baie coulissante séjour"],
  ],
  [
    "Groupe Anfa Realties",
    "Promotion",
    "Haut de gamme",
    "À valider",
    "Casa Anfa, Casablanca",
    "o2",
    "p4",
    ["Mur rideau lot 3", "Habillage aluminium entrée"],
  ],
  [
    "M. Omar Lahlou",
    "Résidentiel",
    "Standard",
    "Devis envoyé",
    "Oasis, Casablanca",
    "o1",
    "p1",
    ["Baie coulissante salon"],
  ],
  [
    "Hôtel Riad Atlantique",
    "Commercial",
    "Haut de gamme",
    "Chiffrage en cours",
    "Corniche, Casablanca",
    "o1",
    "p2",
    ["Baies chambres front de mer", "Garde-corps terrasses"],
  ],
  [
    "Mme Imane Sekkat",
    "Résidentiel",
    "Standard",
    "Nouveau",
    "CIL, Casablanca",
    "o7",
    "p8",
    ["Garde-corps escalier"],
  ],
  [
    "M. Adil Berrada",
    "Villa",
    "Haut de gamme",
    "Collecte terrain",
    "Mohammedia",
    "o3",
    "p5",
    ["Pergola bioclimatique terrasse", "Habillage poteaux"],
  ],
  [
    "Société Logistique Zenata",
    "Commercial",
    "Standard",
    "Livré",
    "Zenata, Casablanca",
    "o8",
    "p8",
    ["Habillage façade bureaux"],
  ],
  [
    "M. Mehdi Alaoui",
    "Villa",
    "Haut de gamme",
    "À valider",
    "Marrakech Route de l'Ourika",
    "o1",
    "p2",
    ["Grande baie salon 5 m", "Baie suite invités"],
  ],
  [
    "Résidence Les Jardins d'Anfa",
    "Promotion",
    "Standard",
    "Chiffrage en cours",
    "Anfa Supérieur, Casablanca",
    "o1",
    "p1",
    ["Baies type C x 20", "Brise-soleil façade Ouest"],
  ],
];

const statutEtape: Record<StatutDossier, number> = {
  Nouveau: 0,
  "Collecte terrain": 0,
  "Chiffrage en cours": 1,
  "À valider": 2,
  Validé: 3,
  "Devis envoyé": 3,
  Livré: 4,
};

function dateStr(daysAgo: number) {
  const d = new Date(2026, 8, 15);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export const initialDossiers: Dossier[] = seeds.map((s, i) => {
  const [client, typeProjet, gamme, statut, adresse, ouvrageId, profileId, designations] = s;
  const n = String(i + 1).padStart(3, "0");
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
      contraintes: [contraintesPool[(i + j) % contraintesPool.length]],
    };
  });
  const etape = statutEtape[statut];
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
            statut: statut === "Livré" ? "Accepté" : "Envoyé",
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

/* ------------------------------ Prospects mockés ------------------------------ */

const prospectSeeds: [
  string,
  Prospect["source"],
  string,
  number,
  string,
  string,
  StatutProspect,
  string,
  number,
][] = [
  [
    "Yassine Moutaouakil",
    "WhatsApp",
    "Bonjour, je cherche une baie vitrée coulissante de 4m pour mon salon, budget autour de 45 000 MAD, idéalement avant fin d'année.",
    45000,
    "Résidentiel standard",
    "Casablanca",
    "Qualifié IA",
    "Budget compatible avec le seuil minimum, zone couverte (Casablanca), projet résidentiel standard.",
    82,
  ],
  [
    "Leila Bouhaddou",
    "Email",
    "Nous rénovons une villa à Dar Bouazza : 8 fenêtres et une grande baie. Merci de me rappeler pour une visite technique.",
    180000,
    "Villa haut de gamme",
    "Dar Bouazza",
    "Qualifié IA",
    "Volume important, zone couverte, projet villa haut de gamme correspondant au cœur de cible.",
    91,
  ],
  [
    "Hicham Naciri",
    "Site web",
    "Prix d'une fenêtre alu 1m x 1m svp ?",
    3000,
    "Résidentiel standard",
    "Casablanca",
    "Non qualifié IA",
    "Budget très inférieur au seuil minimum de 25 000 MAD, demande unitaire non rentable.",
    24,
  ],
  [
    "Groupe Chaabi Immobilier",
    "Email",
    "Consultation pour menuiserie aluminium sur 46 appartements, livraison T3. Merci d'envoyer vos références.",
    2400000,
    "Promotion immobilière",
    "Casablanca",
    "Qualifié IA",
    "Promoteur avec volume élevé, zone couverte, délai réaliste.",
    95,
  ],
  [
    "Sanaa El Khatib",
    "WhatsApp",
    "Bonjour, je voudrais une pergola pour ma terrasse.",
    0,
    "Résidentiel standard",
    "Non précisée",
    "Informations incomplètes",
    "Budget non évoqué et zone non confirmée : informations minimales requises manquantes.",
    38,
  ],
  [
    "Mounir Tahiri",
    "Téléphone",
    "Je veux un portail coulissant motorisé pour ma villa à Bouskoura, budget 70 000 MAD environ.",
    70000,
    "Villa haut de gamme",
    "Bouskoura",
    "Contacté",
    "Budget et zone conformes, projet villa haut de gamme.",
    88,
  ],
  [
    "Fatima Zahra Idrissi",
    "WhatsApp",
    "Bonjour, mur rideau pour un immeuble de bureaux au Maârif, environ 300 m² de façade.",
    900000,
    "Commercial",
    "Casablanca",
    "Devis envoyé",
    "Projet commercial de grande surface, parfaitement dans le cœur de métier.",
    93,
  ],
  [
    "Anas Skalli",
    "Email",
    "Besoin d'un garde-corps en verre pour un duplex, 18 ml. Budget 55 000 MAD.",
    55000,
    "Résidentiel standard",
    "Casablanca",
    "En négociation",
    "Budget conforme, zone couverte, produit standard du catalogue.",
    79,
  ],
  [
    "Villa Anfa Résidence",
    "Site web",
    "Nous souhaitons un devis pour les baies coulissantes de 6 villas témoins.",
    1100000,
    "Promotion immobilière",
    "Casablanca",
    "Client signé",
    "Client promoteur récurrent, volume élevé et délai compatible.",
    96,
  ],
  [
    "Khalid Ouhadi",
    "Téléphone",
    "Je cherche quelqu'un pour réparer une roulette de baie coulissante.",
    800,
    "Résidentiel standard",
    "Casablanca",
    "Non qualifié IA",
    "Demande de SAV ponctuel hors périmètre de fabrication sur mesure.",
    12,
  ],
  [
    "Meriem Lamrani",
    "WhatsApp",
    "Nous construisons une villa à Marrakech, besoin de menuiserie alu complète, budget 350 000 MAD.",
    350000,
    "Villa haut de gamme",
    "Marrakech",
    "Qualifié IA",
    "Budget élevé, zone couverte, projet complet villa haut de gamme.",
    90,
  ],
  [
    "Société Agro Maghreb",
    "Email",
    "Remplacement des châssis de notre siège social, 42 unités, avant juin.",
    620000,
    "Commercial",
    "Mohammedia",
    "Contacté",
    "Volume conforme, zone couverte, délai réaliste.",
    86,
  ],
  [
    "Samir Belhaj",
    "Site web",
    "Verrière d'atelier pour un patio, dimensions approximatives 3m x 4m, budget non fixé.",
    0,
    "Résidentiel standard",
    "Rabat",
    "Informations incomplètes",
    "Dimensions connues mais budget non évoqué : lead à requalifier par téléphone.",
    51,
  ],
  [
    "Nawal Saadi",
    "WhatsApp",
    "Brise-soleil pour façade sud d'une maison à Ain Diab, environ 30 m².",
    120000,
    "Villa haut de gamme",
    "Casablanca",
    "Perdu",
    "Projet qualifié mais client parti chez un concurrent sur le délai.",
    74,
  ],
  [
    "Reda Chraibi",
    "Email",
    "Bonjour, extension véranda aluminium 25 m² à Mohammedia, budget 160 000 MAD, démarrage sous 2 mois.",
    160000,
    "Villa haut de gamme",
    "Mohammedia",
    "Qualifié IA",
    "Budget conforme, zone couverte, délai compatible avec la charge atelier.",
    87,
  ],
];

export const initialProspects: Prospect[] = prospectSeeds.map((p, i) => {
  const [nom, source, besoin, budget, typeProjet, zone, statut, justification, score] = p;
  const iaStatut: StatutProspect = ["Qualifié IA", "Non qualifié IA", "Informations incomplètes"].includes(
    statut,
  )
    ? statut
    : statut === "Perdu" || statut === "Client signé" || statut === "En négociation"
      ? "Qualifié IA"
      : "Qualifié IA";
  return {
    id: `PRS-${String(i + 1).padStart(3, "0")}`,
    nom,
    contact: i % 2 === 0 ? `+212 6${String(20000000 + i * 913377).slice(0, 8)}` : `contact${i + 1}@mail.ma`,
    source,
    besoin,
    budget,
    typeProjet,
    zone,
    statut,
    statutIA: iaStatut,
    justification,
    score,
    date: dateStr(20 - i),
    notes: "",
    historique: [
      {
        date: dateStr(20 - i),
        auteur: "Agent Qualification (IA)",
        label: `Prospect capté via ${source} — statut initial : ${iaStatut}`,
      },
      ...(iaStatut !== statut
        ? [{ date: dateStr(18 - i), auteur: "M. Aboulssaad", label: `Statut passé à « ${statut} »` }]
        : []),
    ],
  };
});

/* ------------------------------ Service client ------------------------------ */

export const initialFaq: Faq[] = [
  {
    id: "f1",
    question: "Proposez-vous un devis en ligne ?",
    reponse:
      "Chaque solution Strongal est technique et sur mesure : dimensions, type de vitrage et contraintes du chantier changent tout. Nous réalisons donc un relevé puis un devis technique détaillé après un échange direct.",
    categorie: "Produits",
    actif: true,
  },
  {
    id: "f2",
    question: "Quels sont vos délais de fabrication ?",
    reponse:
      "Comptez 21 à 35 jours pour une baie coulissante ou une pergola, et 45 à 60 jours pour un mur rideau, à partir de la validation du devis technique.",
    categorie: "Délais",
    actif: true,
  },
  {
    id: "f3",
    question: "Intervenez-vous en dehors de Casablanca ?",
    reponse:
      "Oui. Nous intervenons sur Casablanca, Mohammedia, Bouskoura, Dar Bouazza, Rabat et Marrakech. Au-delà, un forfait de déplacement s'applique.",
    categorie: "Produits",
    actif: true,
  },
  {
    id: "f4",
    question: "Proposez-vous une garantie ?",
    reponse:
      "Oui : 10 ans sur les profilés et le laquage, 2 ans sur les accessoires et quincailleries, et 1 an sur la pose.",
    categorie: "SAV",
    actif: true,
  },
  {
    id: "f5",
    question: "Quels sont vos modes de paiement ?",
    reponse:
      "40 % à la commande, 40 % au lancement de la fabrication et 20 % à la réception du chantier. Virement, chèque ou effet.",
    categorie: "Paiement",
    actif: true,
  },
  {
    id: "f6",
    question: "Travaillez-vous avec quelles séries de profilés ?",
    reponse:
      "Nous travaillons principalement avec Schüco, Technal, Sepalumic et Aluminium du Maroc, en finition anodisée ou laquée RAL.",
    categorie: "Produits",
    actif: true,
  },
  {
    id: "f7",
    question: "Faites-vous la dépose de l'ancienne menuiserie ?",
    reponse:
      "Oui, la dépose et l'évacuation des anciens châssis peuvent être intégrées au devis, sur demande.",
    categorie: "Produits",
    actif: true,
  },
  {
    id: "f8",
    question: "Quel est le délai d'intervention en SAV ?",
    reponse:
      "Une intervention SAV est planifiée sous 72 heures ouvrées sur Casablanca et sous 5 jours sur les autres zones.",
    categorie: "SAV",
    actif: true,
  },
  {
    id: "f9",
    question: "Quel est le budget moyen d'une baie coulissante ?",
    reponse:
      "Une baie coulissante deux vantaux en double vitrage démarre autour de 3 500 MAD/m² posé, selon la série et la finition.",
    categorie: "Paiement",
    actif: true,
  },
  {
    id: "f10",
    question: "Pouvez-vous respecter un délai serré ?",
    reponse:
      "Nous pouvons prioriser un chantier en fonction de la charge atelier. Indiquez-nous votre date cible et nous confirmons sous 4 heures.",
    categorie: "Délais",
    actif: true,
  },
  {
    id: "f11",
    question: "Réalisez-vous des pergolas bioclimatiques motorisées ?",
    reponse:
      "Oui, en lames orientables motorisées avec capteur de pluie en option, jusqu'à 6 m de portée sans poteau intermédiaire.",
    categorie: "Produits",
    actif: true,
  },
  {
    id: "f12",
    question: "Puis-je visiter des réalisations ?",
    reponse:
      "Nous partageons un book de réalisations et, sur accord des clients, une visite de chantier peut être organisée à Casablanca.",
    categorie: "Produits",
    actif: false,
  },
];

export const initialDocuments: DocItem[] = [
  { id: "d1", nom: "Catalogue produits Strongal 2026.pdf", type: "pdf", taille: "8.4 Mo", date: "2026-01-12" },
  { id: "d2", nom: "Fiche technique STR-CL-70.pdf", type: "pdf", taille: "1.2 Mo", date: "2026-02-03" },
  { id: "d3", nom: "Fiche technique mur rideau FW 50+.pdf", type: "pdf", taille: "2.1 Mo", date: "2026-02-18" },
  { id: "d4", nom: "Book de réalisations villas.pdf", type: "pdf", taille: "14.6 Mo", date: "2026-03-05" },
  { id: "d5", nom: "Nuancier RAL & anodisations.jpg", type: "image", taille: "3.3 Mo", date: "2026-03-22" },
];

export const initialInfos: InfosPratiques = {
  reseaux: [
    { id: "r1", nom: "Instagram", url: "https://instagram.com/strongal.ma", actif: true },
    { id: "r2", nom: "Facebook", url: "https://facebook.com/strongal.ma", actif: true },
    { id: "r3", nom: "LinkedIn", url: "https://linkedin.com/company/strongal", actif: false },
  ],
  adresse: "Zone industrielle Ain Sebaâ, Casablanca, Maroc",
  telephone: "+212 669-910658",
  email: "contact@strongal.ma",
  horaires: [
    { jour: "Lundi", ouvert: true, debut: "08:30", fin: "18:30" },
    { jour: "Mardi", ouvert: true, debut: "08:30", fin: "18:30" },
    { jour: "Mercredi", ouvert: true, debut: "08:30", fin: "18:30" },
    { jour: "Jeudi", ouvert: true, debut: "08:30", fin: "18:30" },
    { jour: "Vendredi", ouvert: true, debut: "08:30", fin: "18:30" },
    { jour: "Samedi", ouvert: true, debut: "09:00", fin: "13:00" },
    { jour: "Dimanche", ouvert: false, debut: "—", fin: "—" },
  ],
};

export const LOGO_URL =
  "https://strongal.ma/wp-content/uploads/2025/11/Black-Monoline-Real-Estate-Logo-copie.png";
