# Client feedback: what already exists and what to add

## Already in the app (kept, small improvements only)
- Manual price control: every price, margin, VAT and cost can be changed by hand and is marked "Prix manuel", "Marge manuelle"...
- Units: meter, m² and per unit exist for product components (width, height, perimeter, surface).
- Offcuts: the cutting plan already calculates lost material (% offcut) — but it is not added to the price yet.
- Delivery / installation / labour costs, and custom lines in the quote.
- Real site progress by phase (order, production, delivery, installation...).
- Follow-ups can be scheduled; WhatsApp exists as a channel but email is still the default.
- Product catalog with technical sheets (what each product contains based on size).

## New things to add

### 1. Pricing: base price + ratio, 4-5 options per client
- In the dossier "Chiffrage" step, a new "Options de devis" panel: one base price, then 4-5 options (e.g. Standard, Décoratif, Technique, Renforcé, Premium), each = base × ratio, all editable by hand.
- Options side by side with their price gap; the client chooses one; the chosen option feeds the quote.
- Quote shows one option or several options, chosen by the user.

### 2. Sales method remembered per item
- Each product/profile stores how it is sold: by meter (length or height), by m², or per unit, plus a note "méthode de chiffrage". Shown every time the item is used.

### 3. Real vs measured quantity
- Each quote line gets "quantité mesurée" and "quantité réelle utilisée" (e.g. 100 m² measured, 70 m² used); price uses the real one; both shown.

### 4. Offcuts in the price
- Offcut % (from the cutting plan or typed by hand) added to material cost, shown as its own line.

### 5. Installation floor
- Floor field on each dossier (ground, 1st... 5th+). Configurable surcharge per floor in Configuration, added to installation cost automatically (still editable).

### 6. Custom requests
- "Demande spéciale" lines (e.g. wood or composite cladding): free description, unit, quantity, cost, sale price.

### 7. Aluminium ranges & reinforcement
- Ranges on products: Standard, Décoratif, Technique (large openings).
- Reinforcement option: none, one side, front + sides, with its own price.

### 8. Site recommendations
- Dossier site conditions: windy area, noisy area, sea side, high floor. The system suggests reinforcement, acoustic glazing, etc. with one click to add them to an option.

### 9. Supplier prices
- Profiles get supplier name, supplier code and own reference.
- New "Prix fournisseurs" tab in Configuration: pick a supplier (or all), apply +10 / +20 / +50 % (or any %), preview old vs new prices, confirm; history of every price change kept.

### 10. Catalog by system/brand and job type
- Products tagged with system/brand and job type (villa, apartment, gate, façade); filters for both; add new products anytime. Positioning set to mid-range defaults.

### 11. WhatsApp first
- WhatsApp becomes the default channel for follow-ups: "Envoyer sur WhatsApp" opens WhatsApp with the message ready (still sent manually).
- "Premier appel" task on new dossiers so he calls the client himself first.
- Progress messages to client from the site follow-up ("Commande passée", "Production sous 10 jours", "Pose niveau 1 terminée"...) via WhatsApp, with pre-filled texts.

### 12. Know-how
- "Savoir-faire" section in Configuration: rules and tips (e.g. "zone ventée → renfort façade"), linked to recommendations and shown in the dossier assistant.

## Not done now (waiting on the client)
- Odoo connection: needs to know what he wants synced; plan only an export (CSV) of quotes/invoices for now.
- Website change: unclear request.
- His real pricing method and catalogs: will replace the demo values once provided.

## Technical details
- `src/lib/data.ts`: extend `Profile` (fournisseur, codeFournisseur, refInterne, modeVente, methode), `Produit` (gamme, systeme, typesChantier, renfort), `Dossier` (etage, conditionsSite, optionsDevis, premierAppel), `Config` (surchargeEtage[], reglesSavoirFaire[], historiquePrix[]).
- `src/lib/erp.ts`: lines gain `qteMesuree`/`qteReelle`, `chutePct`, type `speciale`; new `computeOptions(base, ratios)`; floor surcharge in installation fee; recommendation engine from conditions + rules; WhatsApp link builder (`wa.me`).
- UI: `commercial-editor.tsx` (options panel, real qty, offcut, special lines), `configuration.tsx` (Prix fournisseurs, Savoir-faire, floor surcharges tabs), `produits-tab.tsx` (filters), `nouveau-dossier.tsx` (floor, site conditions), `relances.tsx` + `suivi-chantier.tsx` (WhatsApp).
- Bump storage key to `strongal-erp-v3` with migration of existing data defaults.
