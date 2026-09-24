import { Plus, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmt, fmtNum } from "@/lib/calc";
import {
  calcCommercial,
  TVA_TAUX,
  TYPES_FRAIS,
  uid,
  type Commercial,
  type Frais,
  type LigneCom,
  OPTIONS_DEFAUT,
  prixOption,
} from "@/lib/erp";

export function ManuelBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1 inline-flex shrink-0 items-center rounded-full bg-warm/15 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-warm">
      {children}
    </span>
  );
}

const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")) || 0);

function NumInput({
  value,
  onChange,
  className = "",
  manuel,
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  manuel?: boolean;
}) {
  return (
    <Input
      type="number"
      value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
      onChange={(e) => onChange(num(e.target.value))}
      className={`h-8 text-right tabular-nums ${manuel ? "border-warm/60 bg-warm/5" : ""} ${className}`}
    />
  );
}

/**
 * Éditeur commercial partagé (chiffrage, devis, facture).
 * showInternal=false masque coûts d'achat et marge (usage facture).
 */
export function CommercialEditor({
  value,
  onChange,
  showInternal = true,
  readOnly = false,
}: {
  value: Commercial;
  onChange: (c: Commercial) => void;
  showInternal?: boolean;
  readOnly?: boolean;
}) {
  const r = calcCommercial(value);
  const setLigne = (id: string, patch: Partial<LigneCom>) =>
    onChange({ ...value, lignes: value.lignes.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const setFrais = (id: string, patch: Partial<Frais>) =>
    onChange({ ...value, frais: value.frais.map((f) => (f.id === id ? { ...f, ...patch, manuel: true } : f)) });

  return (
    <fieldset disabled={readOnly} className="space-y-4">
      <Card className="glass p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Produits / prestations</h3>
          <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...value,
                lignes: [
                  ...value.lignes,
                  { id: uid(), designation: "Nouvelle prestation", description: "", qte: 1, unite: "u", achatU: 0, venteU: 0, achatManuel: true, venteManuel: true },
                ],
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Ajouter une ligne
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...value,
                lignes: [
                  ...value.lignes,
                  { id: uid(), designation: "Demande spéciale — bardage bois / composite", description: "Matériau, finition, fournisseur…", qte: 1, unite: "m²", achatU: 0, venteU: 0, achatManuel: true, venteManuel: true, speciale: true },
                ],
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Demande spéciale
          </Button>
          </div>
        </div>
        <div className="scroll-slim overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-56">Produit / description</TableHead>
                <TableHead className="w-24">Qté mesurée</TableHead>
                <TableHead className="w-24">Qté réelle</TableHead>
                <TableHead className="w-24">Unité</TableHead>
                {showInternal && <TableHead className="w-28 text-right">Achat U.</TableHead>}
                {showInternal && <TableHead className="w-32 text-right">Achat total</TableHead>}
                <TableHead className="w-28 text-right">Vente U.</TableHead>
                <TableHead className="w-32 text-right">Vente totale</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.lignes.map((l) => (
                <TableRow key={l.id} className="align-top">
                  <TableCell className="space-y-1">
                    <Input value={l.designation} onChange={(e) => setLigne(l.id, { designation: e.target.value })} className="h-8 font-medium" />
                    <Input value={l.description} placeholder="Description" onChange={(e) => setLigne(l.id, { description: e.target.value })} className="h-8 text-xs" />
                    <div className="flex flex-wrap gap-1">
                      {l.speciale && <ManuelBadge>Demande spéciale</ManuelBadge>}
                      {l.methode && <span className="text-[10px] text-muted-foreground" title={l.methode}>Méthode : {l.methode}</span>}
                      {l.qteMesuree !== undefined && l.qteMesuree !== l.qte && <ManuelBadge>Qté corrigée</ManuelBadge>}
                      {(l.venteManuel || l.venteTotalManuel !== undefined) && <ManuelBadge>Prix manuel</ManuelBadge>}
                      {showInternal && (l.achatManuel || l.achatTotalManuel !== undefined) && <ManuelBadge>Achat manuel</ManuelBadge>}
                    </div>
                  </TableCell>
                  <TableCell><NumInput value={l.qteMesuree ?? l.qte} onChange={(n) => setLigne(l.id, { qteMesuree: n })} /></TableCell>
                  <TableCell><NumInput value={l.qte} manuel={l.qteMesuree !== undefined && l.qteMesuree !== l.qte} onChange={(n) => setLigne(l.id, { qte: n, qteMesuree: l.qteMesuree ?? l.qte })} /></TableCell>
                  <TableCell><Input value={l.unite} onChange={(e) => setLigne(l.id, { unite: e.target.value })} className="h-8" /></TableCell>
                  {showInternal && (
                    <TableCell><NumInput value={l.achatU} manuel={l.achatManuel} onChange={(n) => setLigne(l.id, { achatU: n, achatManuel: true, achatTotalManuel: undefined })} /></TableCell>
                  )}
                  {showInternal && (
                    <TableCell>
                      <NumInput value={l.achatTotal} manuel={l.achatTotalManuel !== undefined} onChange={(n) => setLigne(l.id, { achatTotalManuel: n })} />
                      {l.achatTotalManuel !== undefined && (
                        <button className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground" onClick={() => setLigne(l.id, { achatTotalManuel: undefined })}>
                          <RotateCcw className="h-3 w-3" /> calculé
                        </button>
                      )}
                    </TableCell>
                  )}
                  <TableCell><NumInput value={l.venteU} manuel={l.venteManuel} onChange={(n) => setLigne(l.id, { venteU: n, venteManuel: true, venteTotalManuel: undefined })} /></TableCell>
                  <TableCell>
                    <NumInput value={l.venteTotal} manuel={l.venteTotalManuel !== undefined} onChange={(n) => setLigne(l.id, { venteTotalManuel: n })} />
                    {l.venteTotalManuel !== undefined && (
                      <button className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground" onClick={() => setLigne(l.id, { venteTotalManuel: undefined })}>
                        <RotateCcw className="h-3 w-3" /> calculé
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Supprimer la ligne" onClick={() => onChange({ ...value, lignes: value.lignes.filter((x) => x.id !== l.id) })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="glass p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Pose, main-d'œuvre, livraison et autres coûts</h3>
          <div className="flex flex-wrap gap-2">
            {TYPES_FRAIS.map((t) => (
              <Button
                key={t.value}
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({ ...value, frais: [...value.frais, { id: uid(), type: t.value, libelle: t.label, description: "", montant: 0, manuel: true }] })
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> {t.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {value.frais.length === 0 && <p className="py-3 text-sm text-muted-foreground">Aucun frais annexe.</p>}
          {value.frais.map((f) => (
            <div key={f.id} className="grid items-center gap-2 rounded-lg border p-2 sm:grid-cols-[160px_1fr_1.4fr_140px_36px]">
              <Select value={f.type} onValueChange={(v) => setFrais(f.id, { type: v as Frais["type"] })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES_FRAIS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input value={f.libelle} onChange={(e) => setFrais(f.id, { libelle: e.target.value })} className="h-8" />
              <Input value={f.description} placeholder="Description (ex. livraison Casablanca)" onChange={(e) => setFrais(f.id, { description: e.target.value })} className="h-8" />
              <NumInput value={f.montant} manuel={f.manuel} onChange={(n) => setFrais(f.id, { montant: n })} />
              <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Supprimer le frais" onClick={() => onChange({ ...value, frais: value.frais.filter((x) => x.id !== f.id) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {showInternal && (
        <Card className="glass flex flex-wrap items-end gap-4 p-5">
          <div>
            <h3 className="flex items-center font-semibold">Chute matière {!!value.chutePct && <ManuelBadge>{value.chutePct} % inclus</ManuelBadge>}</h3>
            <p className="text-xs text-muted-foreground">Pertes à la découpe ajoutées au coût fourniture (voir le plan de débitage).</p>
          </div>
          <label className="w-32 text-xs">% de chute<NumInput value={value.chutePct ?? 0} onChange={(n) => onChange({ ...value, chutePct: n })} /></label>
          <p className="text-sm">= {fmt(r.chute)}</p>
        </Card>
      )}

      {showInternal && <OptionsDevis value={value} onChange={onChange} />}

      <div className={`grid gap-4 ${showInternal ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        {showInternal && (
          <Card className="glass space-y-3 p-5">
            <h3 className="flex items-center font-semibold">
              Marge {value.marge.mode !== "auto" && <ManuelBadge>Marge manuelle</ManuelBadge>}
            </h3>
            <p className="text-xs text-muted-foreground">
              Calculée : {fmt(r.margeAuto)} (prix de vente lignes − coût fourniture). Saisissez un % ou un montant pour la forcer.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">
                Marge en %
                <NumInput value={value.marge.mode === "pct" ? value.marge.valeur : r.coutTotal ? (r.margeBrute / r.coutTotal) * 100 : 0} manuel={value.marge.mode === "pct"} onChange={(n) => onChange({ ...value, marge: { mode: "pct", valeur: n } })} />
              </label>
              <label className="text-xs">
                Marge en MAD
                <NumInput value={value.marge.mode === "montant" ? value.marge.valeur : r.margeBrute} manuel={value.marge.mode === "montant"} onChange={(n) => onChange({ ...value, marge: { mode: "montant", valeur: n } })} />
              </label>
            </div>
            {value.marge.mode !== "auto" && (
              <Button size="sm" variant="ghost" onClick={() => onChange({ ...value, marge: { mode: "auto", valeur: 0 } })}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Revenir à la marge calculée
              </Button>
            )}
          </Card>
        )}
        <Card className="glass space-y-3 p-5">
          <h3 className="flex items-center font-semibold">
            Remise {value.remise.valeur > 0 && <ManuelBadge>Remise appliquée</ManuelBadge>}
          </h3>
          <div className="grid grid-cols-[1fr_110px] gap-2">
            <NumInput value={value.remise.valeur} onChange={(n) => onChange({ ...value, remise: { ...value.remise, valeur: n } })} />
            <Select value={value.remise.mode} onValueChange={(v) => onChange({ ...value, remise: { ...value.remise, mode: v as "pct" | "montant" } })}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pct">%</SelectItem>
                <SelectItem value="montant">MAD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">Montant de la remise : {fmt(r.remise)}</p>
        </Card>
        <Card className="glass space-y-3 p-5">
          <h3 className="flex items-center font-semibold">
            TVA
            {(value.tvaTaux !== 20 || value.tvaManuelle !== undefined) && <ManuelBadge>TVA personnalisée</ManuelBadge>}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">
              Taux (%)
              <div className="flex gap-1">
                <NumInput value={value.tvaTaux} onChange={(n) => onChange({ ...value, tvaTaux: n })} />
                <Select value={String(value.tvaTaux)} onValueChange={(v) => onChange({ ...value, tvaTaux: Number(v) })}>
                  <SelectTrigger className="h-8 w-16 px-2"><SelectValue placeholder="…" /></SelectTrigger>
                  <SelectContent>
                    {TVA_TAUX.map((t) => <SelectItem key={t} value={String(t)}>{t} %</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </label>
            <label className="text-xs">
              Montant TVA
              <NumInput value={r.tva} manuel={value.tvaManuelle !== undefined} onChange={(n) => onChange({ ...value, tvaManuelle: n })} />
            </label>
          </div>
          {value.tvaManuelle !== undefined && (
            <Button size="sm" variant="ghost" onClick={() => onChange({ ...value, tvaManuelle: undefined })}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> TVA calculée ({fmt(r.tvaCalculee)})
            </Button>
          )}
        </Card>
      </div>

      <RecapFinancier c={value} showInternal={showInternal} />
    </fieldset>
  );
}

function Row({ label, value, strong, sign, badge }: { label: string; value: number; strong?: boolean; sign?: string; badge?: string }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-1.5 text-sm ${strong ? "border-t pt-2 font-bold" : ""}`}>
      <span className="flex items-center">
        {sign && <span className="mr-2 w-3 text-muted-foreground">{sign}</span>}
        {label}
        {badge && <ManuelBadge>{badge}</ManuelBadge>}
      </span>
      <span className="tabular-nums">{fmt(value)}</span>
    </div>
  );
}

/** Calcul financier transparent, en trois blocs. */
export function RecapFinancier({ c, showInternal = true }: { c: Commercial; showInternal?: boolean }) {
  const r = calcCommercial(c);
  return (
    <Card className="glass p-5">
      <h3 className="mb-3 font-semibold">Calcul financier</h3>
      <div className={`grid gap-6 ${showInternal ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {showInternal && (
          <div>
            <Row label="Coût fourniture" value={r.fournitureBrute} />
            {r.chute > 0 && <Row sign="+" label={`Chute matière ${fmtNum(c.chutePct ?? 0)} %`} value={r.chute} />}
            <Row sign="+" label="Coût pose" value={r.pose} />
            <Row sign="+" label="Coût main-d'œuvre" value={r.mainOeuvre} />
            <Row sign="+" label="Livraison" value={r.livraison} />
            <Row sign="+" label="Autres coûts" value={r.autres} />
            <Row sign="=" label="COÛT TOTAL" value={r.coutTotal} strong />
          </div>
        )}
        <div>
          {showInternal ? (
            <>
              <Row label="Coût total" value={r.coutTotal} />
              <Row sign="+" label="Marge" value={r.margeBrute} badge={c.marge.mode !== "auto" ? "Marge manuelle" : undefined} />
            </>
          ) : (
            <>
              <Row label="Produits / prestations" value={r.venteLignes} />
              <Row sign="+" label="Pose, livraison et frais" value={r.fraisTotal} />
            </>
          )}
          {r.remise > 0 && <Row sign="−" label="Remise" value={r.remise} />}
          <Row sign="=" label="PRIX DE VENTE HT" value={r.totalHT} strong />
        </div>
        <div>
          <Row label="Prix de vente HT" value={r.totalHT} />
          <Row sign="+" label={`TVA ${fmtNum(c.tvaTaux)} %`} value={r.tva} badge={c.tvaManuelle !== undefined ? "TVA personnalisée" : undefined} />
          <Row sign="=" label="TOTAL TTC" value={r.totalTTC} strong />
        </div>
      </div>
      {showInternal && (
        <div className="mt-4 grid gap-3 rounded-xl bg-accent-soft/50 p-4 text-sm sm:grid-cols-4">
          <div><p className="text-xs text-muted-foreground">Coût total</p><p className="font-bold">{fmt(r.coutTotal)}</p></div>
          <div><p className="text-xs text-muted-foreground">Prix de vente HT</p><p className="font-bold">{fmt(r.totalHT)}</p></div>
          <div><p className="text-xs text-muted-foreground">Marge nette (après remise)</p><p className={`font-bold ${r.marge < 0 ? "text-destructive" : "text-success"}`}>{fmt(r.marge)}</p></div>
          <div><p className="text-xs text-muted-foreground">Marge % (sur coût) · taux de marque</p><p className="font-bold">{fmtNum(r.margePct, 1)} % · {fmtNum(r.tauxMarque, 1)} %</p></div>
        </div>
      )}
    </Card>
  );
}

/** Prix de base (total HT) × ratio : 4-5 options proposées au client, chacune ajustable à la main. */
export function OptionsDevis({ value, onChange }: { value: Commercial; onChange: (c: Commercial) => void }) {
  const base = calcCommercial(value).totalHT;
  const options = value.options ?? [];
  const setOpt = (id: string, patch: Partial<(typeof options)[number]>) =>
    onChange({ ...value, options: options.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  return (
    <Card className="glass space-y-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Options de devis (prix de base × ratio)</h3>
          <p className="text-xs text-muted-foreground">Prix de base = total HT actuel : {fmt(base)}. Chaque option est modifiable à la main.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {options.length === 0 ? (
            <Button size="sm" onClick={() => onChange({ ...value, options: OPTIONS_DEFAUT.map((o) => ({ ...o })), optionChoisie: "o1" })}>
              <Plus className="mr-1 h-4 w-4" /> Générer 5 options
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => onChange({ ...value, options: [...options, { id: uid(), nom: "Nouvelle option", description: "", ratio: 1 }] })}>
                <Plus className="mr-1 h-4 w-4" /> Option
              </Button>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={!!value.afficherOptions} onChange={(e) => onChange({ ...value, afficherOptions: e.target.checked })} />
                Afficher toutes les options sur le devis
              </label>
            </>
          )}
        </div>
      </div>
      {options.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {options.map((o) => {
            const prix = prixOption(o, base);
            const actif = value.optionChoisie === o.id;
            return (
              <div key={o.id} className={`space-y-2 rounded-xl border p-3 ${actif ? "border-warm bg-warm/5" : ""}`}>
                <Input value={o.nom} onChange={(e) => setOpt(o.id, { nom: e.target.value })} className="h-8 font-semibold" />
                <Input value={o.description} placeholder="Contenu de l'option" onChange={(e) => setOpt(o.id, { description: e.target.value })} className="h-8 text-xs" />
                <label className="block text-xs">Ratio<NumInput value={o.ratio} onChange={(n) => setOpt(o.id, { ratio: n, prixManuel: undefined })} /></label>
                <label className="block text-xs">Prix HT {o.prixManuel !== undefined && <ManuelBadge>Prix manuel</ManuelBadge>}
                  <NumInput value={prix} manuel={o.prixManuel !== undefined} onChange={(n) => setOpt(o.id, { prixManuel: n })} />
                </label>
                <p className="text-[11px] text-muted-foreground">Écart vs base : {fmt(prix - base)}</p>
                <div className="flex gap-1">
                  <Button size="sm" variant={actif ? "default" : "outline"} className="h-7 flex-1 text-xs" onClick={() => onChange({ ...value, optionChoisie: o.id })}>
                    {actif ? "Choisie" : "Choisir"}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Supprimer l'option" onClick={() => onChange({ ...value, options: options.filter((x) => x.id !== o.id) })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
