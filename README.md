# Strongal Command Center

# Prompt Lovable — Backoffice Strongal (spécifications détaillées)

Copiez-collez tout le bloc ci-dessous dans Lovable pour générer le backoffice.

---

## PROMPT À COLLER DANS LOVABLE

Crée une application web **backoffice / tableau de bord interne** pour **Strongal**, une entreprise marocaine de menuiserie aluminium premium basée à Casablanca (fenêtres et baies coulissantes, murs rideaux, pergolas bioclimatiques, systèmes vitrés, portails aluminium pour villas, brise-soleil, garde-corps, habillages). Ce backoffice pilote des agents IA qui automatisent le chiffrage et le calcul des matières premières (avec optimisation du débitage des barres d'aluminium) et la réponse aux questions courantes des clients (service client multicanal) ; il centralise aussi le besoin de chaque prospect, déjà qualifié en amont par un agent IA conversationnel (WhatsApp/email), pour que l'équipe pilote elle-même chaque dossier jusqu'à la signature ou la perte du client.

Le design doit être somptueux, moderne, animé, du niveau d'un SaaS premium (type Linear, Vercel Dashboard, Stripe Dashboard) — à la hauteur d'une marque qui vend du sur-mesure haut de gamme, pas un tableau administratif générique. Mais la priorité absolue de ce prompt est **fonctionnelle** : chaque page listée ci-dessous décrit précisément ses boutons, filtres, barres de recherche, tris, pagination et aperçus — chacun de ces éléments doit se comporter exactement comme décrit, avec un vrai changement d'état visible côté front (pas un élément visuel statique qui ne fait rien). S'il y a un doute entre "plus joli" et "vraiment fonctionnel", choisis toujours fonctionnel.

**Règles techniques non négociables, valables sur toute l'application :**
1. Le login est un pur mock sans validation bloquante : champs en état contrôlé (`useState` + `value`/`onChange`, jamais un simple `defaultValue`), et les deux boutons de connexion redirigent systématiquement vers le tableau de bord au clic.
2. Sur **chaque** liste avec recherche/filtre/tri (Dossiers & Chiffrage, Prospects, FAQ), le tableau affiché et le compteur de résultats doivent lire **exactement la même variable filtrée** calculée une seule fois — jamais deux sources de vérité différentes.
3. Chaque bouton d'action (lancer, valider, générer, relancer, changer un statut, télécharger, enregistrer) doit déclencher un vrai changement d'état local (nouvel élément ajouté, statut modifié, badge mis à jour, chiffre recalculé) accompagné d'un toast de confirmation — jamais un clic silencieux sans effet visible.
4. **Rien de purement décoratif ou écrit "en théorie" n'est acceptable.** Chaque effet visuel décrit dans ce prompt (fond aurora animé, cartes en verre dépoli, lift au survol, brillance qui traverse les boutons, compteurs KPI progressifs, transitions de page en fondu, skeletons shimmer, scrollbar personnalisée) doit être réellement codé et visible à l'écran, pas seulement mentionné en commentaire ou implémenté partiellement sur une seule page témoin — applique-les de façon identique et cohérente sur **toutes** les pages concernées. De la même façon, chaque champ de recherche, chaque filtre déroulant, chaque tri de colonne, chaque pagination et chaque bouton listé plus bas doit fonctionner réellement au premier chargement de l'aperçu, sans exception et sans qu'il soit nécessaire de le redemander.

### 1. Identité visuelle

- **Logo** (sidebar + écran de login) : `https://strongal.ma/wp-content/uploads/2025/11/Black-Monoline-Real-Estate-Logo-copie.png` — logo monoline noir sur fond transparent.
- **Favicon** : le site réel n'expose aucun favicon dédié dans son code. Génère un favicon cohérent avec le logo : un monogramme "S" en trait fin monoline noir sur fond blanc, dans le même style graphique épuré que le logo.
- **Important — palette de marque** : contrairement aux précédents projets, strongal.ma n'expose aucun token de couleur ni de police dans son code (site en noir/blanc minimaliste autour du logo uniquement). La palette ci-dessous est donc une proposition de système de marque cohérente avec le logo réel et le positionnement (aluminium premium, technique, haut de gamme) — à considérer comme un vrai système de design à appliquer partout, pas une suggestion vague :
  - **Couleur principale** : anthracite profond `#14161A` (écho du noir du logo) — `--primary-glow: #3A3F47`.
  - **Couleur d'accent froide** : gris aluminium brossé `#9BA3AC` — `--accent-soft: #F1F2F3` / `--accent-glow: #C7CDD3`.
  - **Couleur d'accent chaude (CTA, highlights, succès)** : bronze/cuivre anodisé `#C08552` — évoque l'aluminium anodisé bronze, courant dans le haut de gamme du secteur — `--warm-glow: #E0A876`.
  - **Fond/texte** : `--background: #ffffff` / `--foreground: #14161A` / `--muted: #F4F4F5` / `--border: #E4E4E7`.
  - **Polices** : "Manrope" (600-800) pour les titres, "Inter" pour le corps — via Google Fonts.
- **Univers visuel** : façades vitrées, murs rideaux, baies coulissantes, texture aluminium brossé, chantiers de pose soignés, lignes architecturales épurées — pas d'imagerie médicale ni de topographie. Écran de login : grande photo de baie vitrée/mur rideau aluminium avec dégradé anthracite sombre en superposition.
- **Fond d'écran coloré et vivant (priorité de design n°1, à faire avant tout le reste)** : abandonne le fond blanc plat. Construis un arrière-plan riche en profondeur derrière toutes les pages : plusieurs formes de dégradé "aurora" superposées (mélange de `--primary-glow` anthracite, `--accent-glow` gris aluminium, et le `--warm-glow` bronze à faible dose pour casser le tout-gris), à une opacité clairement visible (~15-25% sur les zones de dégradé, fondu vers transparent), qui dérive lentement en boucle (`@keyframes`, 20-30s). Le résultat doit se sentir "vivant" et premium au premier coup d'œil, tout en gardant les cartes et le texte parfaitement lisibles par-dessus (cartes en verre dépoli suffisamment opaques). Applique ce même fond sur l'écran de login ET sur toutes les pages internes.
- **Autres effets, à appliquer partout et pas seulement mentionnés une fois** : cartes en verre dépoli avec ombres douces teintées (anthracite ou bronze selon le contexte, jamais un gris générique) qui se soulèvent au survol ; boutons avec un léger effet de brillance métallique qui traverse au survol ; chiffres et KPI qui comptent progressivement de 0 à leur valeur finale à l'affichage ; transitions de page fluides en fondu + léger décalage (framer-motion `AnimatePresence`) ; skeletons avec effet de balayage lumineux (shimmer) pendant les traitements IA simulés ; scrollbar personnalisée discrète dans les tons anthracite/bronze sur les zones à défilement interne (comme le panneau de chat).

### 2. Écran de connexion

- Deux colonnes plein écran (`min-h-screen w-full`, aucune zone morte) : formulaire à gauche, photo de baie vitrée/mur rideau + dégradé anthracite à droite avec "Strongal Control" et une accroche ("Pilotez vos chiffrages, vos prospects et votre service client, du terrain au dossier signé").
- Champs pré-remplis en état contrôlé : Email `contact@strongal.ma`, mot de passe `Strongal@2026`. Encart "Accès démonstration" + bouton "Connexion instantanée (démo)". Les deux boutons ("Se connecter" et le bouton démo) redirigent systématiquement vers `/dashboard`, sans aucune condition de validation.

### 3. Sidebar — comportement précis

Sidebar fixe à gauche, avec un comportement de fermeture/ouverture réellement fonctionnel :
- **État ouvert** (par défaut) : largeur ~260px, logo Strongal en haut (sans texte à côté — le nom est déjà dans le logo), agrandi nettement par rapport à un logo standard (au moins 40-48px de hauteur, espacement généreux, éventuellement sur une carte discrète qui le fait ressortir), puis la liste des 5 modules de navigation avec icône + libellé, chacun étant un lien qui charge réellement la page correspondante et affiche un indicateur visuel (fond teinté + barre latérale colorée bronze) sur le module actif.
- **Bouton de fermeture** : en bas de la sidebar, icône chevron/hamburger avec le libellé "Réduire". Au clic, la sidebar anime sa largeur jusqu'à ~64px (transition ~200ms ease), les libellés disparaissent (fondu), seules les icônes restent centrées, le logo passe en version réduite (monogramme) bien centré, et le bouton devient une icône "Agrandir" qui rouvre la sidebar au clic suivant. Tooltip au survol de chaque icône quand la sidebar est réduite.
- Le contenu principal (`main`) se réajuste en largeur à chaque changement d'état (`margin-left` animé), jamais de saut brutal. L'état ouvert/réduit est mémorisé (state local) pour ne pas se réinitialiser en changeant de page.
- Modules de navigation, dans cet ordre : **Tableau de bord**, **Configuration**, **Dossiers & Chiffrage**, **Prospects & Qualification**, **Agent Service Client**.

Header en haut de chaque page : recherche rapide "aller à" (tape une référence exacte de dossier ou nom de prospect, Entrée redirige vers sa page détail si elle existe, sinon affiche "Aucun résultat pour cette référence"), icône notifications (badge avec le nombre d'éléments non lus, ouvre un petit panneau listant les dernières activités des agents IA), avatar (M. Aboulssaad, Strongal) avec menu déroulant (Profil / Déconnexion → redirige vers `/`).

### 4. Page "Tableau de bord"

- 5 cartes KPI qui comptent progressivement à l'affichage, chacune cliquable et redirigeant vers la page correspondante : "Dossiers en cours", "Chiffrages en attente de validation" (redirige vers Dossiers filtrée sur "À valider"), "Prospects qualifiés ce mois-ci", "Taux de chute moyen sur débitage (%)", "Questions traitées par l'agent service client ce mois-ci".
- Graphique en barres de l'activité des 30 derniers jours (dossiers créés vs chiffrages validés), données mockées cohérentes avec les listes des autres pages.
- Flux "Activité récente des agents IA" avec au moins 6 entrées horodatées réalistes (ex. "Agent Chiffrage a calculé les matières premières du dossier STR-2026-014 — il y a 12 min", "Agent Service Client a répondu à 3 questions via WhatsApp — il y a 40 min", "Agent Qualification a qualifié un nouveau prospect — il y a 2h", "Zone d'équilibrage détectée sur STR-2026-011, validation humaine requise — il y a 3h").
- Bandeau d'avertissement si la Configuration n'est pas encore validée ("Configurez votre catalogue de profilés et vos seuils de chiffrage avant de lancer un dossier"), avec bouton "Configurer" qui redirige vers `/configuration`. Bandeau qui disparaît réellement une fois la configuration validée (state partagé, ex. contexte React global).

### 5. Page "Configuration" — prérequis réel, 2 onglets, très détaillée

**Onglet "Chiffrage"**
- **Catalogue de profilés aluminium** : tableau éditable avec, par ligne : référence interne, série/fournisseur (Schüco, Sepalumic, Aluminium du Maroc, Technal…), famille de système (coulissant, ouvrant à la française, mur rideau, brise-soleil…), coloris/finition (RAL, anodisé, laqué), ratio de consommation par mètre linéaire selon le type d'ouvrage, délai d'approvisionnement fournisseur (en jours), quantité minimum de commande. Ajout/édition/suppression de lignes.
- **Catalogue de vitrages** (tableau séparé et éditable) : type (simple, double vitrage, feuilleté, trempé), épaisseur, performance thermique/acoustique affichée comme un petit label, prix au m² par type — pour que chaque combinaison profilé + vitrage soit calculable précisément dans un dossier.
- **Catalogue d'accessoires** (tableau éditable, distinct des deux précédents) : roulettes, poignées, joints, serrures, verrous, systèmes de verrouillage motorisés — chacun avec un coût unitaire et une quantité standard consommée par type d'ouvrage (ex. une baie coulissante standard consomme 2 roulettes, 1 poignée, X ml de joint), pour que le chiffrage détaille chaque accessoire plutôt qu'un simple forfait.
- **Types d'ouvrages de référence** : tableau des prestations Strongal (baie coulissante, mur rideau, pergola bioclimatique, verrière, portail de villa, brise-soleil, garde-corps, habillage), chacun avec un coefficient de complexité (influence la main d'œuvre estimée) et un délai de fabrication standard en jours, réutilisé automatiquement pour préremplir les devis.
- **Longueur(s) standard des barres de débitage** : champ numérique, valeur par défaut **6,40 m**, modifiable, avec un second champ optionnel pour une longueur alternative si un fournisseur en propose une autre.
- **Seuils "zone d'équilibrage"** : dimensions (largeur × hauteur en mètres, valeur par défaut suggérée 3,00 m × 3,00 m) **et** seuil de coût (ex. tout repère dont le risque de perte dépasse 10 000 MAD) au-delà desquels une validation humaine devient obligatoire avant chiffrage automatique — les deux seuils sont indépendants, chacun peut déclencher l'alerte seul.
- **Barème de coûts unitaires** : tableau éditable (aluminium /barre selon profil, vitrage /m² selon type, accessoires au forfait ou à l'unité, main d'œuvre /heure, transport/déplacement au forfait selon zone).
- **Marges commerciales** : pourcentage de marge configurable, distinct par gamme (Standard / Haut de gamme), appliqué automatiquement sur le total matière + main d'œuvre pour obtenir le prix affiché sur le devis.
- **Règle d'arrondi de débitage** : sélecteur indiquant comment arrondir les longueurs de coupe (au centimètre ou au millimètre supérieur), pour que le moteur d'optimisation reste cohérent avec les pratiques réelles de l'atelier.

**Onglet "Critères de qualification (agent IA)"**
Il n'y a pas de bouton de calcul dans cette application : ces critères sont ceux utilisés par l'agent IA conversationnel (WhatsApp/email) qui échange avec le prospect **avant même qu'il n'entre dans ce backoffice**, pour décider s'il transmet le contact comme "Qualifié" ou "Non qualifié". Les garder ici, éditables, permet à Strongal d'ajuster à tout moment ce que l'IA considère comme un bon prospect, sans toucher au code.
- Budget minimum accepté (champ numérique en MAD).
- Zones géographiques couvertes (tags ajoutables/supprimables).
- Types de projets acceptés (cases à cocher : Résidentiel standard, Villa haut de gamme, Commercial, Promotion immobilière).
- Délai de réponse cible (en heures).
- Informations minimales requises pour qu'un lead soit exploitable (cases à cocher : dimensions approximatives connues, budget évoqué, zone confirmée, délai du projet connu) — si l'IA amont n'a pas pu les collecter, le prospect arrive avec un badge "Informations incomplètes" plutôt qu'un statut tranché.
- Score de qualification minimum (%) en dessous duquel l'IA amont classe automatiquement un prospect "Non qualifié".

Bouton "Enregistrer la configuration" (par onglet) : au clic, sauvegarde l'état (contexte global), toast de succès, badge "Configuration active ✅" en haut de page, retire le bandeau d'avertissement du Tableau de bord. **Effet réel et vérifiable** : le catalogue/barème/marges modifiés ici doivent changer concrètement les totaux calculés sur la page Dossiers & Chiffrage (section 6).

### 6. Page "Dossiers & Chiffrage" — cœur de l'application (Agent de Chiffrage)

**a) Liste**
- Barre d'outils : recherche en temps réel (client, référence, mot-clé — un seul champ, pas de doublon avec la recherche globale du header), filtres déroulants fonctionnels (Statut : Nouveau / Collecte terrain / Chiffrage en cours / À valider / Validé / Devis envoyé / Livré — Type de projet : Résidentiel / Villa / Commercial / Promotion — Gamme : Standard / Haut de gamme), tri de colonnes cliquable (Référence, Client, Budget estimé, Date, Statut), bouton "Réinitialiser les filtres".
- Pagination fonctionnelle (10/25/50 lignes par page), total affiché et lignes du tableau provenant strictement de la même liste filtrée (règle n°2).
- Génère **18 dossiers mockés réalistes** : mélange de particuliers (noms marocains plausibles) et de promoteurs/entreprises (ex. "Groupe Palmeraie Développement", "Villa Anfa Résidence", une société industrielle pour un mur rideau de siège social), types de produits réalistes du catalogue Strongal (baies coulissantes, murs rideaux, pergola bioclimatique, verrière, portail de villa, brise-soleil).
- Bouton "Nouveau dossier" : modal avec formulaire (client, type de projet, gamme, liste de "repères" — chaque repère avec désignation, dimensions largeur × hauteur, quantité) ; à la validation, ajoute réellement un dossier au statut "Nouveau" en tête de liste, toast de confirmation, badge "Nouveau" temporaire.

**b) Détail d'un dossier**

Stepper à 5 étapes (Collecte terrain → Chiffrage matières → Validation → Devis technique → Livré), avec sous l'étape actuelle une courte phrase expliquant ce qui se passe (ex. « L'agent IA calcule actuellement les besoins matière à partir des repères collectés. »). Ligne de connexion qui se remplit en dégradé animé selon la progression, point pulsant sur l'étape actuelle, bouton "Passer à l'étape suivante" avec toast + micro-animation. Onglets qui ne se débloquent qu'à l'étape atteinte :

- **Fiche de synthèse** : client, contact, type de projet, gamme, adresse du chantier, technicien ayant réalisé la collecte terrain, date de collecte, liste des repères avec leurs dimensions et contraintes relevées sur site (ex. « présence d'un coffre de volet roulant », « accès chantier difficile »), une petite galerie de vignettes photo par repère, et un résumé généré par l'IA en 3-4 points.

- **Chiffrage matières** (cœur de l'agent), détaillé ligne par ligne :
  - Un tableau par repère avec, par ligne : le profilé retenu (référence + série, tiré du catalogue de la Configuration), le nombre de mètres linéaires nécessaires, le vitrage retenu (type + surface en m² + prix), les accessoires listés un par un avec leur coût unitaire (pas un simple forfait global), la main d'œuvre estimée en heures (à partir du coefficient de complexité du type d'ouvrage), et le sous-total du repère.
  - La **visualisation de l'optimisation du débitage** : représentation visuelle des barres (6,40 m ou la longueur configurée) sous forme de segments horizontaux empilés, un diagramme par référence de profil utilisée dans le dossier, avec le taux de chute affiché et coloré (vert/orange/rouge) barre par barre, plus un taux de chute global du dossier.
  - Un bloc **Totaux** recalculé en direct : total matière, total main d'œuvre, total transport, marge appliquée (selon la gamme définie en Configuration), Total HT, TVA 20 %, Total TTC.
  - **Ajustement manuel** : toute ligne calculée automatiquement peut être corrigée à la main (ex. changer de profilé, ajuster une quantité) via un bouton "Recalculer" qui met à jour les totaux ; chaque ajustement manuel affiche un badge "Modifié manuellement" et est conservé dans l'historique du dossier avec la raison saisie.
  - **Alerte "zone d'équilibrage"** automatique et bien visible (badge rouge pulsant) si un repère dépasse l'un des deux seuils définis en Configuration (dimension ou coût) — bloque le passage à l'étape "Validation" tant que ce repère précis n'a pas été validé manuellement via un bouton dédié "Valider manuellement ce repère" (modal avec justification texte obligatoire).

- **Validation** : checklist détaillée, chaque point explicite et coché individuellement — dimensions confirmées sur site, ratio catalogue appliqué sans anomalie, tous les repères en zone d'équilibrage validés manuellement, marge minimale respectée, délai de fabrication cohérent avec le souhait du client — plus un champ de notes internes libre. Statut "100 % complet" affiché, ou liste précise de ce qui manque en rouge. Bouton **"Valider et générer le devis technique"** actif uniquement à 100 % — c'est la validation humaine explicite demandée par le client, jamais d'automatisation totale à cette étape.
- **Devis technique (Documents)** : dès validation, génération automatique d'un devis détaillé (en-tête Strongal avec logo, détail par repère, matières et prix, TVA 20%, mentions légales standards marocaines), avec boutons **Aperçu** (modal fidèle à un vrai document) et **Télécharger** (déclenche un téléchargement réel côté client) fonctionnels. Le devis garde un **historique de versions** (v1, v2…) si le dossier est recalculé après une demande de modification du client, et un **statut de suivi propre au devis** (Envoyé / Vu par le client / Accepté / Refusé), modifiable manuellement et affiché comme badge sur la fiche du dossier.
- **Historique** : timeline verticale animée (ligne + points), horodatée, avec un événement par changement d'étape réel **et** par ajustement manuel ou changement de statut du devis.
- **Assistant IA du dossier** : bouton flottant "Demander à l'assistant IA" en bas à droite (glow animé, toujours visible en scrollant), ouvre un panneau coulissant à droite (~400px, overlay léger, ne cache jamais tout le contenu). En-tête avec avatar/logo Strongal et titre "Assistant — {référence du dossier}". Bulles de conversation (utilisateur à droite en anthracite, assistant à gauche en fond clair avec avatar IA), défilement automatique. 4-5 questions suggérées au premier ouverture (ex. "Quel est le total matière de ce dossier ?", "Y a-t-il une zone d'équilibrage à valider ?", "Quel est le taux de chute sur ce dossier ?", "Quand ce dossier a-t-il été créé ?", "Résume ce dossier en 3 points"). Champ de saisie libre + bouton d'envoi, indicateur "L'assistant écrit…" (~800-1200ms) avant chaque réponse. Implémentation : une fonction unique `getAssistantReply(question, dossier)` qui génère une réponse pertinente à partir des données mockées du dossier ouvert (budget, matières, statut zone d'équilibrage, étape actuelle) via une correspondance par mots-clés simple. Chaque dossier a son propre contexte de conversation, remis à zéro si on change de dossier.

### 7. Page "Prospects & Qualification" — le besoin arrive déjà qualifié par l'IA

Il n'y a **pas** de bouton "Lancer la qualification" dans cette application : la qualification est faite **en amont**, par l'agent IA conversationnel qui échange directement avec le prospect sur WhatsApp, email ou le site. Chaque prospect arrive donc dans ce backoffice avec son besoin déjà capté et un statut de qualification déjà posé par l'IA — le rôle de l'équipe Strongal ici est de **piloter manuellement** chaque prospect jusqu'à la fin du processus commercial avec lui, pas de le qualifier elle-même.

- Barre d'outils : recherche en temps réel (nom, contact, mot-clé), filtres fonctionnels (Statut : Qualifié IA / Non qualifié IA / Informations incomplètes / Contacté / Devis envoyé / En négociation / Client signé / Perdu — Source : WhatsApp / Email / Site web / Téléphone), tri de colonnes, pagination fonctionnelle (10/25/50). Tableau et compteur lisent la même liste filtrée (règle n°2).
- Génère **15 prospects mockés réalistes**, chacun avec : le canal d'entrée, le **besoin exprimé tel que capté par l'IA** (texte brut réaliste, ex. « Bonjour, je cherche une baie vitrée coulissante de 4m pour mon salon, budget autour de 45 000 MAD, idéalement avant fin d'année »), le budget et le type de projet extraits de cet échange par l'IA, et un **badge de qualification déjà posé** (Qualifié IA / Non qualifié IA / Informations incomplètes) accompagné d'une **courte justification générée par l'IA** (ex. « Budget compatible avec le seuil minimum, zone couverte (Casablanca), projet résidentiel standard »).
- **Aucun calcul de qualification ne se déclenche dans cette page** — si une version précédente du projet contient encore un bouton "Lancer la qualification" et son animation de traitement, retire-les entièrement.
- **Statut piloté manuellement de bout en bout** : sur la liste comme sur la fiche détail, un contrôle de statut (menu déroulant ou petit stepper horizontal) permet à l'utilisateur de faire avancer — ou de corriger — le statut du prospect à tout moment, à travers tout le cycle commercial : `Qualifié IA` / `Non qualifié IA` / `Informations incomplètes` → `Contacté` → `Devis envoyé` → `En négociation` → `Client signé` ou `Perdu`. L'utilisateur peut aussi corriger manuellement le statut initial posé par l'IA si besoin (badge "Corrigé manuellement" affiché dans ce cas). Chaque changement de statut, qu'il vienne de l'IA ou de l'utilisateur, déclenche un toast de confirmation et une nouvelle entrée horodatée dans l'historique du prospect.
- Détail d'un prospect : fiche complète (nom, contact, canal, besoin exprimé intégral, budget estimé, type de projet, zone géographique, statut de qualification IA + justification), le contrôle de changement de statut décrit ci-dessus, un champ de notes internes libre, et un historique horodaté de tous les changements de statut du prospect (qui a changé quoi, IA ou utilisateur, et quand) — pour suivre précisément où en est chaque prospect jusqu'à la signature ou la perte du client.

### 8. Page "Agent Service Client" — configuration à 3 onglets + simulateur

En-tête de page : toggle "Agent actif" (badge vert "Actif" / gris "Inactif"), indicateurs de canaux connectés (WhatsApp ✅, Email ✅ — badges mockés), 2 mini-KPI ("Questions répondues ce mois", "Taux de résolution automatique").

**Exactement 3 onglets, pas plus :**

1. **FAQ** : tableau éditable des questions/réponses utilisées par l'agent pour répondre automatiquement — colonnes Question / Réponse / Catégorie (Produits, Délais, Paiement, SAV) / Actif (toggle). Boutons "Ajouter une question" (modal), édition inline, suppression avec confirmation, barre de recherche dans la liste. Génère **10-12 FAQ mockées réalistes** pour le secteur (ex. "Proposez-vous un devis en ligne ?" → réponse expliquant que chaque solution est technique et sur mesure, un échange direct est nécessaire ; "Quels sont vos délais de fabrication ?" ; "Intervenez-vous en dehors de Casablanca ?" ; "Proposez-vous une garantie ?").
2. **Documents** : bibliothèque de documents que l'agent peut partager avec les prospects (catalogue produits, fiches techniques par profilé, book de réalisations). Zone de dépôt (drag & drop simulé) avec barre de progression d'upload (~1,5s), liste des documents avec icône selon le type, taille, date d'ajout, boutons Aperçu / Télécharger / Supprimer fonctionnels.
3. **Infos pratiques** : réseaux sociaux (champs URL éditables pour Instagram / Facebook / LinkedIn, chacun avec icône et toggle actif/inactif), adresse (champ texte éditable), téléphone et email de contact (pré-remplis avec les vraies coordonnées `contact@strongal.ma`, `+212 669-910658`), et un tableau des **horaires d'ouverture** (heures de travail) Lundi à Dimanche, chaque jour avec un toggle Ouvert/Fermé et des champs heure de début / heure de fin éditables quand le jour est ouvert.

**Simulateur de conversation** (en dessous des onglets ou dans un panneau latéral, toujours visible) : mini widget de chat façon WhatsApp (bulles vertes pour l'utilisateur test, bulles grises pour l'agent), avec un champ de saisie pour tester une question. Les réponses sont générées par une fonction `getServiceClientReply(question, { faq, infosPratiques })` qui : cherche d'abord une correspondance par mots-clés dans les FAQ actives et renvoie la réponse correspondante ; si la question porte sur les horaires, l'adresse ou les réseaux sociaux, répond directement à partir des données de l'onglet Infos pratiques ; sinon renvoie un message par défaut invitant à laisser ses coordonnées pour un rappel. **Le simulateur doit refléter immédiatement toute modification faite dans les 3 onglets** (state partagé, pas besoin de recharger la page) — c'est le moyen concret de vérifier que la configuration fonctionne vraiment.

Bouton "Enregistrer les modifications" par onglet, avec toast de confirmation.

### 9. Exigences transverses

- Stack : React + Tailwind + shadcn/ui + framer-motion, responsive complet.
- Données mockées cohérentes entre toutes les pages (un même dossier/prospect garde les mêmes informations partout où il apparaît — dashboard, liste, détail, chat IA).
- Toasts de confirmation sur chaque action listée ci-dessus, états vides soignés ("Aucun résultat pour cette recherche"), mode clair uniquement.
- **Avant de livrer, vérifie concrètement, page par page** (pas en supposant que le code "devrait" marcher — recharge réellement l'aperçu et teste chaque interaction) :
  - Que **chaque** champ de recherche, **chaque** filtre déroulant, **chaque** tri de colonne et **chaque** pagination, sur **chaque** page qui en possède (Dossiers & Chiffrage, Prospects, FAQ), mettent bien à jour le même tableau affiché que le compteur de résultats.
  - Que **chaque** bouton de l'application clique réellement à quelque chose : "Nouveau dossier", "Changer le statut du prospect" (à chaque étape, jusqu'à Client signé/Perdu), "Recalculer" (après un ajustement manuel), "Valider manuellement ce repère", "Valider et générer le devis technique", "Enregistrer" (sur chacun des onglets Configuration et Agent Service Client), "Ajouter une question" (FAQ), l'upload de documents, Aperçu, Télécharger, le toggle "Agent actif", les toggles Ouvert/Fermé des horaires, la sidebar (réduire/agrandir), le stepper ("Passer à l'étape suivante"), et l'assistant IA (ouverture, envoi de message, réinitialisation par dossier).
  - Que modifier le catalogue/barème/marges/seuils en Configuration change bien les totaux calculés sur un dossier de Chiffrage.
  - Qu'aucun bouton "Lancer la qualification" ne subsiste sur la page Prospects, et que le statut d'un prospect (badge IA initial inclus) peut être changé manuellement à tout moment, avec une entrée d'historique horodatée à chaque changement.
  - Que la visualisation de débitage des barres reflète bien le taux de chute affiché, et qu'une zone d'équilibrage bloque bien le passage à l'étape "Validation" tant qu'elle n'est pas validée manuellement.
  - Que la page Agent Service Client a bien exactement 3 onglets (FAQ / Documents / Infos pratiques) et que le simulateur de conversation reflète **immédiatement** toute modification faite dans ces onglets.
  - Que **tous** les effets visuels de la section 1 (fond aurora animé, verre dépoli, lift au survol, brillance des boutons, compteurs KPI progressifs, transitions de page, skeletons shimmer) sont bien visibles sur toutes les pages concernées, pas seulement sur l'écran de login ou le tableau de bord.
  - Si un seul de ces points ne fonctionne pas à la relecture, corrige-le avant de considérer le travail terminé — ne livre jamais une page avec un bouton, un filtre ou un effet qui ne fait rien.

---

*Prompt préparé à partir de la fiche besoins de Strongal (M. Aboulssaad) et du logo réel extrait de https://strongal.ma/ — la palette de couleurs et les polices sont une proposition de système de marque, le site source n'exposant pas de tokens de couleur propres.*

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/010ccc46-669d-41b4-ade7-5c20fb7a828f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
