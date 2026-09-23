import { Download, Eye, FileCheck2, Pencil, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CommercialEditor } from "@/components/erp/commercial-editor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fmt, fmtNum } from "@/lib/calc";
import { LOGO_URL, type Config, type Dossier } from "@/lib/data";
import { downloadTexte } from "@/lib/download";
import {
  calcCommercial,
  commercialPourFacture,
  getCommercial,
  getDevisInfo,
  nowStr,
  statutFactureEffectif,
  STATUTS_FACTURE,
  uid,
  type Facture,
  type StatutFacture,
} from "@/lib/erp";
import { useStore } from "@/lib/store";

export const factureColors: Record<StatutFacture, string> = {
  Brouillon: "bg-accent-soft text-foreground",
  Générée: "bg-primary/10 text-primary",
  Envoyée: "bg-warm/15 text-warm",
  Payée: "bg-success/15 text-success",
  "En retard": "bg-destructive/15 text-destructive",
  Annulée: "bg-muted text-muted-foreground line-through",
};
export function FactureBadge({ f }: { f: Facture }) {
  const s = statutFactureEffectif(f);
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${factureColors[s]}`}>{s}</span>;
}

/** Nouvelle facture en brouillon, héritée du dernier devis (snapshot) ou du chiffrage courant. */
export function nouvelleFacture(d: Dossier, config: Config, existantes: Facture[]): Facture {
  const dv = d.devis.at(-1);
  const snap = dv?.snapshot;
  const info = snap?.info ?? getDevisInfo(d);
  const year = new Date().getFullYear();
  const n = existantes.filter((f) => f.numero.startsWith(`FAC-${year}`)).length + 1;
  const today = new Date();
  const ech = new Date(today.getTime() + 30 * 86400000);
  return {
    id: uid(),
    numero: `FAC-${year}-${String(n).padStart(3, "0")}`,
    dossierRef: d.ref,
    devisVersion: dv?.version ?? null,
    client: info.client,
    adresse: info.adresse,
    date: today.toISOString().slice(0, 10),
    echeance: ech.toISOString().slice(0, 10),
    commercial: commercialPourFacture(snap?.commercial ?? getCommercial(d, config)),
    conditionsPaiement: info.conditionsPaiement,
    notes: "",
    statut: "Brouillon",
    historique: [{ date: nowStr(), auteur: "M. Aboulssaad", label: `Brouillon créé depuis ${dv ? `le devis v${dv.version}` : "le chiffrage"}` }],
  };
}

export function factureTexte(f: Facture) {
  const r = calcCommercial(f.commercial);
  return [
    `STRONGAL — FACTURE ${f.numero}`,
    `Date : ${f.date} — Échéance : ${f.echeance}`,
    `Client : ${f.client}`,
    `Adresse : ${f.adresse}`,
    `Dossier : ${f.dossierRef}${f.devisVersion ? ` — Devis v${f.devisVersion}` : ""}`,
    "",
    ...r.lignes.map((l) => `- ${l.designation} | ${l.qte} ${l.unite} × ${fmt(l.venteU)} = ${fmt(l.venteTotal)}`),
    ...f.commercial.frais.map((x) => `- ${x.libelle}${x.description ? ` (${x.description})` : ""} = ${fmt(x.montant)}`),
    "",
    r.remise > 0 ? `Remise : -${fmt(r.remise)}` : "",
    `Total HT : ${fmt(r.totalHT)}`,
    `TVA ${fmtNum(f.commercial.tvaTaux)} % : ${fmt(r.tva)}`,
    `TOTAL TTC : ${fmt(r.totalTTC)}`,
    "",
    `Conditions de paiement : ${f.conditionsPaiement}`,
    f.notes,
  ].join("\n");
}

export function FactureEditor({ facture, onClose }: { facture: Facture | null; onClose: () => void }) {
  const { factures, setFactures, updateDossier, utilisateur } = useStore();
  const [f, setF] = useState<Facture | null>(facture);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    setF(facture);
    setPreview(false);
  }, [facture]);
  if (!f) return null;
  const locked = f.statut !== "Brouillon";
  const r = calcCommercial(f.commercial);

  const persist = (next: Facture, label: string) => {
    const withH = { ...next, historique: [...next.historique, { date: nowStr(), auteur: utilisateur, label }] };
    setFactures(factures.some((x) => x.id === next.id) ? factures.map((x) => (x.id === next.id ? withH : x)) : [...factures, withH]);
    setF(withH);
    return withH;
  };

  const generer = () => {
    persist({ ...f, statut: "Générée" }, "Facture validée et générée");
    updateDossier(f.dossierRef, {}, { auteur: utilisateur, action: "Facture générée", label: `Facture ${f.numero} générée`, avant: "Brouillon", apres: fmt(r.totalTTC) });
    downloadTexte(`${f.numero}.txt`, factureTexte(f));
    toast.success(`Facture ${f.numero} générée`);
    setPreview(false);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Facture {f.numero} <FactureBadge f={f} />
          </DialogTitle>
        </DialogHeader>

        {preview ? (
          <div className="rounded-xl border bg-card p-8 text-sm">
            <div className="flex items-start justify-between border-b pb-4">
              <img src={LOGO_URL} alt="Strongal" className="h-12 object-contain" />
              <div className="text-right">
                <p className="text-lg font-bold">FACTURE {f.numero}</p>
                <p className="text-xs text-muted-foreground">Date {f.date} · Échéance {f.echeance}</p>
              </div>
            </div>
            <p className="mt-4 text-xs"><b>Client :</b> {f.client} — {f.adresse}</p>
            <p className="text-xs"><b>Dossier :</b> {f.dossierRef}{f.devisVersion ? ` · Devis v${f.devisVersion}` : ""}</p>
            <table className="mt-4 w-full text-xs">
              <thead className="border-b text-left"><tr><th className="py-2">Désignation</th><th>Qté</th><th className="text-right">P.U.</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {r.lignes.map((l) => (
                  <tr key={l.id} className="border-b"><td className="py-2">{l.designation}<br /><span className="text-muted-foreground">{l.description}</span></td><td>{l.qte} {l.unite}</td><td className="text-right">{fmt(l.venteU)}</td><td className="text-right">{fmt(l.venteTotal)}</td></tr>
                ))}
                {f.commercial.frais.map((x) => (
                  <tr key={x.id} className="border-b"><td className="py-2">{x.libelle}<br /><span className="text-muted-foreground">{x.description}</span></td><td>1</td><td className="text-right">{fmt(x.montant)}</td><td className="text-right">{fmt(x.montant)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 ml-auto w-64 space-y-1 text-xs">
              {r.remise > 0 && <div className="flex justify-between"><span>Remise</span><span>-{fmt(r.remise)}</span></div>}
              <div className="flex justify-between"><span>Total HT</span><span>{fmt(r.totalHT)}</span></div>
              <div className="flex justify-between"><span>TVA {fmtNum(f.commercial.tvaTaux)} %</span><span>{fmt(r.tva)}</span></div>
              <div className="flex justify-between border-t pt-1 font-bold"><span>Total TTC</span><span>{fmt(r.totalTTC)}</span></div>
            </div>
            <p className="mt-6 text-[11px] text-muted-foreground">{f.conditionsPaiement}</p>
            {f.notes && <p className="mt-1 text-[11px]">{f.notes}</p>}
          </div>
        ) : (
          <fieldset disabled={locked} className="space-y-4">
            {locked && <p className="rounded-lg bg-accent-soft p-3 text-xs">Facture générée : repassez-la en brouillon pour la modifier.</p>}
            <div className="grid gap-3 md:grid-cols-4">
              <label className="text-xs">N° facture<Input value={f.numero} onChange={(e) => setF({ ...f, numero: e.target.value })} /></label>
              <label className="text-xs">Client<Input value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} /></label>
              <label className="text-xs">Date<Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
              <label className="text-xs">Échéance<Input type="date" value={f.echeance} onChange={(e) => setF({ ...f, echeance: e.target.value })} /></label>
              <label className="text-xs md:col-span-2">Adresse<Input value={f.adresse} onChange={(e) => setF({ ...f, adresse: e.target.value })} /></label>
              <label className="text-xs md:col-span-2">Conditions de paiement<Input value={f.conditionsPaiement} onChange={(e) => setF({ ...f, conditionsPaiement: e.target.value })} /></label>
            </div>
            <CommercialEditor value={f.commercial} onChange={(c) => setF({ ...f, commercial: c })} showInternal={false} readOnly={locked} />
            <Textarea placeholder="Notes de facture" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          </fieldset>
        )}

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Statut</span>
            <Select
              value={f.statut}
              onValueChange={(v) => {
                persist({ ...f, statut: v as StatutFacture }, `Statut : ${f.statut} → ${v}`);
                toast.success(`Facture ${v.toLowerCase()}`);
              }}
            >
              <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUTS_FACTURE.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {preview ? (
              <Button variant="outline" onClick={() => setPreview(false)}><Pencil className="mr-1 h-4 w-4" /> Modifier</Button>
            ) : (
              <Button variant="outline" onClick={() => setPreview(true)}><Eye className="mr-1 h-4 w-4" /> Prévisualiser</Button>
            )}
            {!locked && (
              <Button variant="outline" onClick={() => { persist(f, "Brouillon enregistré"); toast.success("Brouillon enregistré"); }}>
                <Save className="mr-1 h-4 w-4" /> Enregistrer
              </Button>
            )}
            {!locked ? (
              <Button className="shine" onClick={generer}><FileCheck2 className="mr-1 h-4 w-4" /> Valider et générer la facture</Button>
            ) : (
              <Button className="shine" onClick={() => downloadTexte(`${f.numero}.txt`, factureTexte(f))}><Download className="mr-1 h-4 w-4" /> Télécharger</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
