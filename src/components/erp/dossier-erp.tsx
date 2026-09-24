import { Link } from "@tanstack/react-router";
import { Check, Copy, Download, Eye, FileCheck2, RefreshCw, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CommercialEditor, ManuelBadge } from "@/components/erp/commercial-editor";
import { FactureBadge, FactureEditor, nouvelleFacture } from "@/components/erp/facture-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { fmt, fmtNum } from "@/lib/calc";
import { LOGO_URL, type DevisVersion, type Dossier } from "@/lib/data";
import { downloadTexte } from "@/lib/download";
import {
  calcCommercial,
  prixOption,
  diffCommercial,
  getCommercial,
  getDevisInfo,
  getSuivi,
  nomPhase,
  nowStr,
  phaseCourante,
  planRelances,
  fmtDate,
  recalculerDepuisChiffrage,
  type Commercial,
  type DevisInfo,
  type Facture,
} from "@/lib/erp";
import { useStore } from "@/lib/store";

/* ------------------------------ Dossier de chiffrage ------------------------------ */

function useCommercialDraft(dossier: Dossier) {
  const { config, updateDossier, utilisateur } = useStore();
  const saved = getCommercial(dossier, config);
  const [draft, setDraft] = useState<Commercial>(saved);
  const savedJson = JSON.stringify(saved);
  useEffect(() => {
    setDraft(JSON.parse(savedJson));
  }, [savedJson]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const save = (extra: Partial<Dossier> = {}, extraHisto: { label: string; action: string; avant?: string; apres?: string }[] = []) => {
    const diffs = diffCommercial(saved, draft);
    const a = calcCommercial(saved);
    const b = calcCommercial(draft);
    const resume =
      diffs.length > 0
        ? [{ action: "Chiffrage modifié", label: "Totaux du chiffrage mis à jour", avant: `HT ${fmt(a.totalHT)} · TTC ${fmt(a.totalTTC)}`, apres: `HT ${fmt(b.totalHT)} · TTC ${fmt(b.totalTTC)}` }]
        : [];
    updateDossier(dossier.ref, { commercial: draft, ...extra }, [...diffs, ...resume, ...extraHisto].map((h) => ({ auteur: utilisateur, ...h })));
    return diffs.length;
  };
  return { draft, setDraft, dirty, save, saved };
}

export function DossierChiffrage({ dossier }: { dossier: Dossier }) {
  const { config } = useStore();
  const { draft, setDraft, dirty, save } = useCommercialDraft(dossier);
  return (
    <div className="space-y-4">
      <Card className="glass flex flex-wrap items-center gap-3 p-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Dossier de chiffrage — contrôle commercial</h2>
          <p className="text-xs text-muted-foreground">
            Les calculs assistent, vous décidez : toute valeur saisie à la main est conservée et signalée. Les totaux se mettent à jour instantanément.
          </p>
        </div>
        {dirty && <ManuelBadge>Modifications non enregistrées</ManuelBadge>}
        <Button
          variant="outline"
          onClick={() => {
            setDraft(recalculerDepuisChiffrage(draft, dossier, config));
            toast.success("Prix recalculés depuis le chiffrage matières (valeurs manuelles conservées)");
          }}
        >
          <RefreshCw className="mr-1 h-4 w-4" /> Recalculer depuis les matières
        </Button>
        <Button
          className="shine"
          disabled={!dirty}
          onClick={() => {
            const n = save();
            toast.success(`Chiffrage enregistré (${n} modification${n > 1 ? "s" : ""} tracée${n > 1 ? "s" : ""})`);
          }}
        >
          <Save className="mr-1 h-4 w-4" /> Enregistrer
        </Button>
      </Card>
      <CommercialEditor value={draft} onChange={setDraft} />
    </div>
  );
}

/* ------------------------------------- Devis ------------------------------------- */

export function devisTexte(info: DevisInfo, c: Commercial, version?: number) {
  const r = calcCommercial(c);
  return [
    `STRONGAL — DEVIS ${info.numero}${version ? ` v${version}` : ""}`,
    `Client : ${info.client} — ${info.contact}`,
    `Projet : ${info.projet}`,
    `Chantier : ${info.adresse}`,
    `Date : ${nowStr().slice(0, 10)} — validité ${info.validiteJours} jours`,
    "",
    ...r.lignes.map((l) => `- ${l.designation} | ${l.description} | ${l.qte} ${l.unite} × ${fmt(l.venteU)} = ${fmt(l.venteTotal)}`),
    ...c.frais.map((f) => `- ${f.libelle}${f.description ? ` (${f.description})` : ""} = ${fmt(f.montant)}`),
    Math.abs(r.ajustement) > 0.5 ? `- Ajustement commercial = ${fmt(r.ajustement)}` : "",
    r.remise > 0 ? `Remise : -${fmt(r.remise)}` : "",
    `TOTAL HT : ${fmt(r.totalHT)}`,
    `TVA ${fmtNum(c.tvaTaux)} % : ${fmt(r.tva)}`,
    `TOTAL TTC : ${fmt(r.totalTTC)}`,
    "",
    `Conditions de paiement : ${info.conditionsPaiement}`,
    `Conditions commerciales : ${info.conditionsCommerciales}`,
    info.notes,
  ]
    .filter((x) => x !== "")
    .join("\n");
}

/** Document client : aucune donnée interne (coûts d'achat, marge, notes internes). */
export function DevisDocument({ info, c, version }: { info: DevisInfo; c: Commercial; version?: number }) {
  const r = calcCommercial(c);
  return (
    <div className="rounded-xl border bg-card p-8 text-sm">
      <div className="flex items-start justify-between border-b pb-4">
        <img src={LOGO_URL} alt="Strongal" className="h-12 object-contain" />
        <div className="text-right">
          <p className="text-lg font-bold">DEVIS {info.numero}{version ? ` v${version}` : ""}</p>
          <p className="text-xs text-muted-foreground">Valable {info.validiteJours} jours</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-1 text-xs">
        <p><b>Client :</b> {info.client}</p>
        <p><b>Contact :</b> {info.contact}</p>
        <p><b>Projet :</b> {info.projet}</p>
        <p><b>Chantier :</b> {info.adresse}</p>
      </div>
      <table className="mt-5 w-full text-xs">
        <thead className="border-b text-left"><tr><th className="py-2">Désignation</th><th>Qté</th><th className="text-right">P.U. HT</th><th className="text-right">Total HT</th></tr></thead>
        <tbody>
          {r.lignes.map((l) => (
            <tr key={l.id} className="border-b"><td className="py-2">{l.designation}<br /><span className="text-muted-foreground">{l.description}</span></td><td>{l.qte} {l.unite}</td><td className="text-right">{fmt(l.venteU)}</td><td className="text-right">{fmt(l.venteTotal)}</td></tr>
          ))}
          {c.frais.map((f) => (
            <tr key={f.id} className="border-b"><td className="py-2">{f.libelle}<br /><span className="text-muted-foreground">{f.description}</span></td><td>1 forfait</td><td className="text-right">{fmt(f.montant)}</td><td className="text-right">{fmt(f.montant)}</td></tr>
          ))}
          {Math.abs(r.ajustement) > 0.5 && (
            <tr className="border-b"><td className="py-2">Ajustement commercial</td><td /><td /><td className="text-right">{fmt(r.ajustement)}</td></tr>
          )}
        </tbody>
      </table>
      {c.options && c.options.length > 0 && (
        <div className="mt-4 rounded-lg border p-3 text-xs">
          <p className="mb-2 font-semibold">{c.afficherOptions ? "Options proposées" : "Option retenue"}</p>
          {c.options
            .filter((o) => c.afficherOptions || o.id === c.optionChoisie)
            .map((o) => (
              <div key={o.id} className="flex justify-between border-b py-1 last:border-0">
                <span><b>{o.nom}</b>{o.description && ` — ${o.description}`}{o.id === c.optionChoisie && c.afficherOptions ? " (recommandée)" : ""}</span>
                <span>{fmt(prixOption(o, r.totalHT))} HT</span>
              </div>
            ))}
        </div>
      )}
      <div className="mt-4 ml-auto w-64 space-y-1 text-xs">
        {r.remise > 0 && <div className="flex justify-between"><span>Remise</span><span>-{fmt(r.remise)}</span></div>}
        <div className="flex justify-between"><span>Total HT</span><span>{fmt(r.totalHT)}</span></div>
        <div className="flex justify-between"><span>TVA {fmtNum(c.tvaTaux)} %</span><span>{fmt(r.tva)}</span></div>
        <div className="flex justify-between border-t pt-1 font-bold"><span>Total TTC</span><span>{fmt(r.totalTTC)}</span></div>
      </div>
      <p className="mt-6 text-[11px] text-muted-foreground">Paiement : {info.conditionsPaiement}</p>
      <p className="text-[11px] text-muted-foreground">{info.conditionsCommerciales}</p>
      {info.notes && <p className="mt-2 text-[11px]">{info.notes}</p>}
    </div>
  );
}

export function DossierDevis({ dossier }: { dossier: Dossier }) {
  const { updateDossier, utilisateur } = useStore();
  const { draft, setDraft, dirty: dirtyC, save } = useCommercialDraft(dossier);
  const savedInfo = getDevisInfo(dossier);
  const [info, setInfo] = useState<DevisInfo>(savedInfo);
  const [preview, setPreview] = useState(false);
  useEffect(() => setInfo(getDevisInfo(dossier)), [dossier.ref, JSON.stringify(dossier.devisInfo ?? null)]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirtyI = JSON.stringify(info) !== JSON.stringify(savedInfo);
  const setI = (p: Partial<DevisInfo>) => setInfo({ ...info, ...p });

  const infoDiffs = () =>
    (Object.keys(info) as (keyof DevisInfo)[])
      .filter((k) => k !== "champsClient" && info[k] !== savedInfo[k])
      .map((k) => ({ action: "Devis modifié", label: `Devis : ${k} modifié`, avant: String(savedInfo[k]), apres: String(info[k]) }));

  const enregistrer = () => {
    save({ devisInfo: info }, infoDiffs());
    toast.success("Devis enregistré");
  };

  const generer = () => {
    const version = (dossier.devis.at(-1)?.version ?? 0) + 1;
    const r = calcCommercial(draft);
    const v: DevisVersion = { version, date: nowStr().slice(0, 10), total: r.totalTTC, statut: "Envoyé", snapshot: { commercial: draft, info } };
    save(
      { devisInfo: info, devis: [...dossier.devis, v], etape: Math.max(dossier.etape, 3), statut: "Devis envoyé" },
      [...infoDiffs(), { action: "Devis généré", label: `Devis ${info.numero} v${version} généré`, avant: "—", apres: fmt(r.totalTTC) }],
    );
    downloadTexte(`${info.numero}-v${version}.txt`, devisTexte(info, draft, version));
    toast.success(`Devis v${version} généré`);
    setPreview(false);
  };

  const setStatut = (d: DevisVersion, s: DevisVersion["statut"]) =>
    updateDossier(
      dossier.ref,
      {
        devis: dossier.devis.map((x) => (x.version === d.version ? { ...x, statut: s } : x)),
        ...(s === "Accepté" ? { statut: "Devis accepté" as const } : {}),
      },
      { auteur: utilisateur, action: "Statut devis", label: `Devis v${d.version} — ${s}`, avant: d.statut, apres: s },
    );

  const lienClient = typeof window !== "undefined" ? `${window.location.origin}/devis-client/${dossier.ref}` : "";

  return (
    <div className="space-y-4">
      <Card className="glass flex flex-wrap items-center gap-2 p-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Devis {info.numero}</h2>
          <p className="text-xs text-muted-foreground">Modifier → Enregistrer → Prévisualiser → Générer / Régénérer</p>
        </div>
        {(dirtyC || dirtyI) && <ManuelBadge>Non enregistré</ManuelBadge>}
        <Button variant="outline" disabled={!dirtyC && !dirtyI} onClick={enregistrer}><Save className="mr-1 h-4 w-4" /> Enregistrer</Button>
        <Button variant="outline" onClick={() => setPreview(true)}><Eye className="mr-1 h-4 w-4" /> Prévisualiser</Button>
        <Button className="shine" onClick={generer}><FileCheck2 className="mr-1 h-4 w-4" /> {dossier.devis.length ? "Régénérer le devis" : "Générer le devis"}</Button>
      </Card>

      <Card className="glass grid gap-3 p-5 md:grid-cols-3">
        <label className="text-xs">N° devis<Input value={info.numero} onChange={(e) => setI({ numero: e.target.value })} /></label>
        <label className="text-xs">Client<Input value={info.client} onChange={(e) => setI({ client: e.target.value })} /></label>
        <label className="text-xs">Contact<Input value={info.contact} onChange={(e) => setI({ contact: e.target.value })} /></label>
        <label className="text-xs">Projet<Input value={info.projet} onChange={(e) => setI({ projet: e.target.value })} /></label>
        <label className="text-xs">Adresse chantier<Input value={info.adresse} onChange={(e) => setI({ adresse: e.target.value })} /></label>
        <label className="text-xs">Validité (jours)<Input type="number" value={info.validiteJours} onChange={(e) => setI({ validiteJours: Number(e.target.value) || 0 })} /></label>
        <label className="text-xs md:col-span-3">Conditions de paiement<Input value={info.conditionsPaiement} onChange={(e) => setI({ conditionsPaiement: e.target.value })} /></label>
        <label className="text-xs md:col-span-3">Conditions commerciales<Textarea rows={2} value={info.conditionsCommerciales} onChange={(e) => setI({ conditionsCommerciales: e.target.value })} /></label>
        <label className="text-xs md:col-span-2">Notes (visibles client)<Textarea rows={2} value={info.notes} onChange={(e) => setI({ notes: e.target.value })} /></label>
        <label className="text-xs">Notes internes (jamais visibles client)<Textarea rows={2} className="border-warm/40" value={info.notesInternes} onChange={(e) => setI({ notesInternes: e.target.value })} /></label>
      </Card>

      <CommercialEditor value={draft} onChange={setDraft} />

      <Card className="glass space-y-3 p-5">
        <h3 className="font-semibold">Espace client</h3>
        <p className="text-xs text-muted-foreground">Le client consulte le dernier devis généré et ne peut modifier que les éléments autorisés. Coûts d'achat, marge et notes internes ne lui sont jamais montrés.</p>
        <div className="flex flex-wrap gap-4">
          {([["quantites", "Modifier les quantités"], ["livraison", "Modifier la livraison (description)"], ["notes", "Ajouter des commentaires"]] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <Switch checked={info.champsClient[k]} onCheckedChange={(c) => setI({ champsClient: { ...info.champsClient, [k]: c } })} /> {l}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Input readOnly value={lienClient} className="max-w-md font-mono text-xs" />
          <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(lienClient); toast.success("Lien copié"); }}><Copy className="mr-1 h-4 w-4" /> Copier</Button>
          <Button variant="outline" asChild><Link to="/devis-client/$ref" params={{ ref: dossier.ref }} target="_blank">Ouvrir la vue client</Link></Button>
        </div>
      </Card>

      <DemandesClient dossier={dossier} />

      <Card className="glass p-5">
        <h3 className="mb-3 font-semibold">Versions du devis</h3>
        {dossier.devis.length === 0 && <p className="text-sm text-muted-foreground">Aucun devis généré.</p>}
        <div className="space-y-2">
          {dossier.devis.map((d) => (
            <div key={d.version} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
              <b>v{d.version}</b><span>{d.date}</span><span className="font-semibold">{fmt(d.total)}</span>
              <div className="flex-1" />
              <select className="rounded-md border bg-background px-2 py-1 text-sm" value={d.statut} onChange={(e) => setStatut(d, e.target.value as DevisVersion["statut"])}>
                {["Envoyé", "Vu par le client", "Modification demandée", "Accepté", "Refusé"].map((s) => <option key={s}>{s}</option>)}
              </select>
              {d.snapshot && (
                <Button size="sm" variant="ghost" onClick={() => downloadTexte(`${d.snapshot!.info.numero}-v${d.version}.txt`, devisTexte(d.snapshot!.info, d.snapshot!.commercial, d.version))}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>Aperçu — tel que le client le verra</DialogTitle></DialogHeader>
          <DevisDocument info={info} c={draft} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(false)}>Modifier</Button>
            <Button className="shine" onClick={generer}><FileCheck2 className="mr-1 h-4 w-4" /> Générer le devis</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DemandesClient({ dossier }: { dossier: Dossier }) {
  const { updateDossier, utilisateur } = useStore();
  const demandes = dossier.demandesClient ?? [];
  if (!demandes.length) return null;
  const traiter = (id: string, ok: boolean) => {
    const dem = demandes.find((x) => x.id === id)!;
    const list = demandes.map((x) => (x.id === id ? { ...x, statut: ok ? ("Acceptée" as const) : ("Refusée" as const) } : x));
    const patch: Partial<Dossier> = { demandesClient: list };
    if (ok) {
      patch.commercial = dem.proposition.commercial;
      patch.devisInfo = dem.proposition.info;
    }
    updateDossier(dossier.ref, patch, {
      auteur: utilisateur,
      action: "Modification client",
      label: `Demande client du ${dem.date} ${ok ? "acceptée et appliquée au devis" : "refusée"}`,
      avant: "En attente",
      apres: ok ? "Acceptée" : "Refusée",
    });
    toast.success(ok ? "Modifications appliquées : régénérez le devis pour l'envoyer" : "Demande refusée");
  };
  return (
    <Card className="glass border-warm/40 p-5">
      <h3 className="mb-3 font-semibold">Modifications demandées par le client</h3>
      <div className="space-y-4">
        {[...demandes].reverse().map((d) => (
          <div key={d.id} className="rounded-xl border p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <b>Sur devis v{d.version}</b>
              <span className="text-muted-foreground">{d.date}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d.statut === "En attente" ? "bg-warm/15 text-warm" : d.statut === "Acceptée" ? "bg-success/15 text-success" : "bg-muted"}`}>{d.statut}</span>
              <div className="flex-1" />
              {d.statut === "En attente" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => traiter(d.id, false)}><X className="mr-1 h-4 w-4" /> Refuser</Button>
                  <Button size="sm" onClick={() => traiter(d.id, true)}><Check className="mr-1 h-4 w-4" /> Accepter et appliquer</Button>
                </>
              )}
            </div>
            {d.modifs.length > 0 && (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground"><tr><th>Élément</th><th>Devis original</th><th>Version client</th></tr></thead>
                <tbody>{d.modifs.map((m, i) => <tr key={i} className="border-t"><td className="py-1">{m.champ}</td><td className="line-through opacity-70">{m.avant}</td><td className="font-semibold text-warm">{m.apres}</td></tr>)}</tbody>
              </table>
            )}
            {Object.entries(d.commentairesLignes).filter(([, v]) => v).map(([k, v]) => <p key={k} className="mt-1 text-xs"><b>{k} :</b> {v}</p>)}
            {d.commentaire && <p className="mt-2 rounded-lg bg-accent-soft p-2 text-sm">« {d.commentaire} »</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ----------------------------------- Factures ----------------------------------- */

export function DossierFactures({ dossier }: { dossier: Dossier }) {
  const { factures, config } = useStore();
  const [open, setOpen] = useState<Facture | null>(null);
  const liste = factures.filter((f) => f.dossierRef === dossier.ref);
  return (
    <Card className="glass p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Factures du dossier</h3>
        <Button className="shine" onClick={() => setOpen(nouvelleFacture(dossier, config, factures))}>Créer une facture</Button>
      </div>
      {liste.length === 0 && <p className="py-4 text-sm text-muted-foreground">Aucune facture. Elle héritera du dernier devis et restera modifiable avant génération.</p>}
      <div className="space-y-2">
        {liste.map((f) => (
          <button key={f.id} onClick={() => setOpen(f)} className="flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm hover:bg-accent-soft/60">
            <span className="font-mono font-semibold">{f.numero}</span><span>{f.date}</span>
            <div className="flex-1" />
            <span className="font-semibold">{fmt(calcCommercial(f.commercial).totalTTC)}</span>
            <FactureBadge f={f} />
          </button>
        ))}
      </div>
      <FactureEditor facture={open} onClose={() => setOpen(null)} />
    </Card>
  );
}

/* ------------------------------------ Vue d'ensemble ------------------------------------ */

function Bloc({ titre, children, accent }: { titre: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <Card className={`glass p-4 ${accent ? "border-l-4 border-l-warm" : ""}`}>
      <p className={`mb-2 text-[11px] font-bold tracking-wider uppercase ${accent ? "text-warm" : "text-muted-foreground"}`}>{titre}</p>
      <div className="space-y-1 text-sm">{children}</div>
    </Card>
  );
}
function L({ k, v, b }: { k: string; v: React.ReactNode; b?: boolean }) {
  return <div className="flex justify-between gap-2"><span className="text-muted-foreground">{k}</span><span className={`text-right ${b ? "font-bold" : ""}`}>{v}</span></div>;
}

export function DossierOverview({ dossier, onTab }: { dossier: Dossier; onTab: (t: string) => void }) {
  const { config, factures, relanceConfig } = useStore();
  const r = calcCommercial(getCommercial(dossier, config));
  const s = getSuivi(dossier);
  const cur = phaseCourante(s);
  const dv = dossier.devis.at(-1);
  const plan = planRelances(dossier, relanceConfig);
  const envoyees = (dossier.relances ?? []).filter((x) => x.statut === "Envoyée");
  const next = plan.find((x) => !x.envoi);
  const facs = factures.filter((f) => f.dossierRef === dossier.ref);
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      <Bloc titre="Client">
        <p className="font-semibold">{dossier.client}</p>
        <p className="text-xs">{dossier.contact}</p>
        <p className="text-xs text-muted-foreground">{dossier.adresse}</p>
      </Bloc>
      <Bloc titre="Commercial">
        <L k="Statut" v={dossier.statut} />
        <L k="Devis" v={dv ? `v${dv.version} · ${dv.statut}` : "—"} />
        <L k="Total HT" v={fmt(r.totalHT)} />
        <L k="TVA" v={fmt(r.tva)} />
        <L k="TTC" v={fmt(r.totalTTC)} b />
      </Bloc>
      <Bloc titre="Projet réel (terrain)" accent>
        <button className="w-full text-left" onClick={() => onTab("suivi")}>
          <p className="font-semibold">{nomPhase(cur.id)} — {cur.progression} %</p>
          <div className="my-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-warm" style={{ width: `${cur.progression}%` }} /></div>
          <L k="Responsable" v={cur.responsable || "—"} />
          <L k="Fin prévue" v={cur.dateFinPrevue || "—"} />
        </button>
      </Bloc>
      <Bloc titre="Financier">
        <L k="Coût total" v={fmt(r.coutTotal)} />
        <L k="Marge" v={`${fmt(r.marge)} (${fmtNum(r.margePct, 1)} %)`} />
        <L k="Vente HT" v={fmt(r.totalHT)} />
        <L k="TVA" v={fmt(r.tva)} />
        <L k="TTC" v={fmt(r.totalTTC)} b />
      </Bloc>
      <Bloc titre="Documents">
        <button className="block text-left hover:underline" onClick={() => onTab("synthese")}>Dossier technique ({dossier.reperes.length} repères)</button>
        <button className="block text-left hover:underline" onClick={() => onTab("devis")}>Devis : {dossier.devis.length} version(s)</button>
        <button className="block text-left hover:underline" onClick={() => onTab("factures")}>Factures : {facs.length}</button>
        <button className="block text-left hover:underline" onClick={() => onTab("suivi")}>Photos / docs chantier : {s.phases.reduce((a, p) => a + p.documents.length, 0)}</button>
      </Bloc>
      <Bloc titre="Relances">
        <L k="Envoyées" v={`${envoyees.length}/${relanceConfig.max}`} />
        <L k="Dernière" v={envoyees.at(-1)?.dateEnvoi ?? "—"} />
        <L k="Prochaine" v={next ? fmtDate(next.dateDue) : "—"} />
        <L k="Statut" v={next ? next.statut : plan.length ? "Terminées" : "Aucune"} />
      </Bloc>
    </div>
  );
}
