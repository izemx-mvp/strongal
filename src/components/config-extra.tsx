import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { fmt } from "@/lib/calc";
import { CONDITIONS_SITE, MODES_VENTE, type ModeVente, type Profile, type RegleSavoirFaire } from "@/lib/data";
import { nowStr, uid } from "@/lib/erp";
import { useStore } from "@/lib/store";

const num = (v: string) => Number(v.replace(",", ".")) || 0;

/** Profils avec code fournisseur + hausse de prix en % appliquée en masse. */
export function PrixFournisseursTab() {
  const { config, setConfig, utilisateur } = useStore();
  const [fournisseur, setFournisseur] = useState("tous");
  const [pct, setPct] = useState(10);
  const [q, setQ] = useState("");
  const fournisseurs = [...new Set(config.profiles.map((p) => p.fournisseur).filter(Boolean))] as string[];
  const cible = (p: Profile) => fournisseur === "tous" || p.fournisseur === fournisseur;
  const liste = useMemo(
    () => config.profiles.filter((p) => `${p.ref} ${p.serie} ${p.codeFournisseur} ${p.fournisseur}`.toLowerCase().includes(q.toLowerCase())),
    [config.profiles, q],
  );
  const setP = (id: string, patch: Partial<Profile>) =>
    setConfig((c) => ({ ...c, profiles: c.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const appliquer = () => {
    const n = config.profiles.filter(cible).length;
    setConfig((c) => ({
      ...c,
      profiles: c.profiles.map((p) => (cible(p) ? { ...p, prixBarre: Math.round(p.prixBarre * (1 + pct / 100)) } : p)),
      historiquePrix: [{ date: nowStr(), fournisseur: fournisseur === "tous" ? "Tous" : fournisseur, pct, nbArticles: n, auteur: utilisateur }, ...(c.historiquePrix ?? [])],
    }));
    toast.success(`${n} prix mis à jour (${pct > 0 ? "+" : ""}${pct} %)`);
  };

  return (
    <div className="space-y-4">
      <Card className="glass flex flex-wrap items-end gap-3 p-5">
        <div className="mr-auto">
          <h2 className="text-lg font-semibold">Hausse / baisse fournisseur</h2>
          <p className="text-xs text-muted-foreground">Appliquez un pourcentage : tous les prix concernés se mettent à jour.</p>
        </div>
        <label className="text-xs">Fournisseur
          <Select value={fournisseur} onValueChange={setFournisseur}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous</SelectItem>
              {fournisseurs.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>
        <div className="flex gap-1">
          {[10, 20, 50].map((v) => <Button key={v} size="sm" variant={pct === v ? "default" : "outline"} onClick={() => setPct(v)}>+{v} %</Button>)}
        </div>
        <label className="w-24 text-xs">% libre<Input type="number" className="h-9" value={pct} onChange={(e) => setPct(num(e.target.value))} /></label>
        <Button onClick={appliquer}>Appliquer</Button>
      </Card>

      <Card className="glass p-5">
        <div className="relative mb-3 max-w-xs">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Rechercher code, référence…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="scroll-slim overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Code fournisseur</TableHead>
                <TableHead>Réf. Strongal</TableHead>
                <TableHead>Vendu</TableHead>
                <TableHead className="min-w-56">Méthode de chiffrage</TableHead>
                <TableHead className="text-right">Prix barre</TableHead>
                <TableHead className="text-right">Après {pct} %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liste.map((p) => (
                <TableRow key={p.id}>
                  <TableCell><Input className="h-8 w-28" value={p.fournisseur ?? ""} onChange={(e) => setP(p.id, { fournisseur: e.target.value })} /></TableCell>
                  <TableCell><Input className="h-8 w-28" value={p.codeFournisseur ?? ""} onChange={(e) => setP(p.id, { codeFournisseur: e.target.value })} /></TableCell>
                  <TableCell><Input className="h-8 w-28" value={p.ref} onChange={(e) => setP(p.id, { ref: e.target.value })} /></TableCell>
                  <TableCell>
                    <Select value={p.modeVente ?? "ml-largeur"} onValueChange={(v) => setP(p.id, { modeVente: v as ModeVente })}>
                      <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>{MODES_VENTE.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input className="h-8" value={p.methode ?? ""} onChange={(e) => setP(p.id, { methode: e.target.value })} /></TableCell>
                  <TableCell className="text-right"><Input type="number" className="h-8 w-24 text-right" value={p.prixBarre} onChange={(e) => setP(p.id, { prixBarre: num(e.target.value) })} /></TableCell>
                  <TableCell className="text-right text-muted-foreground">{cible(p) ? fmt(p.prixBarre * (1 + pct / 100)) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="glass p-5">
        <h3 className="mb-2 font-semibold">Historique des changements de prix</h3>
        {(config.historiquePrix ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun changement enregistré.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {config.historiquePrix!.map((h, i) => (
              <li key={i}>{h.date} — {h.fournisseur} : {h.pct > 0 ? "+" : ""}{h.pct} % sur {h.nbArticles} article(s) — {h.auteur}</li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/** Savoir-faire : règles métier qui alimentent les recommandations des dossiers. */
export function SavoirFaireTab() {
  const { config, setConfig } = useStore();
  const regles = config.reglesSavoirFaire ?? [];
  const setR = (list: RegleSavoirFaire[]) => setConfig((c) => ({ ...c, reglesSavoirFaire: list }));
  const upd = (id: string, patch: Partial<RegleSavoirFaire>) => setR(regles.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-4">
      <Card className="glass flex flex-wrap items-end gap-3 p-5">
        <div className="mr-auto">
          <h2 className="text-lg font-semibold">Savoir-faire Strongal</h2>
          <p className="text-xs text-muted-foreground">Vos règles d'expérience, proposées automatiquement dans chaque dossier selon le chantier.</p>
        </div>
        <label className="w-40 text-xs">Majoration pose / étage (%)
          <Input type="number" className="h-9" value={config.surchargeEtagePct ?? 0} onChange={(e) => setConfig((c) => ({ ...c, surchargeEtagePct: num(e.target.value) }))} />
        </label>
        <Button onClick={() => setR([...regles, { id: uid(), condition: "general", titre: "Nouvelle règle", conseil: "", prixSuggere: 0, unite: "u" }])}>
          <Plus className="mr-1 h-4 w-4" /> Règle
        </Button>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {regles.map((r) => (
          <Card key={r.id} className="glass space-y-2 p-4">
            <div className="flex gap-2">
              <Select value={r.condition} onValueChange={(v) => upd(r.id, { condition: v as RegleSavoirFaire["condition"] })}>
                <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Toujours</SelectItem>
                  {CONDITIONS_SITE.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="h-8" value={r.titre} onChange={(e) => upd(r.id, { titre: e.target.value })} />
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" aria-label="Supprimer" onClick={() => setR(regles.filter((x) => x.id !== r.id))}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Textarea rows={2} value={r.conseil} onChange={(e) => upd(r.id, { conseil: e.target.value })} />
            <div className="flex gap-2">
              <label className="text-xs">Prix suggéré<Input type="number" className="h-8 w-28" value={r.prixSuggere} onChange={(e) => upd(r.id, { prixSuggere: num(e.target.value) })} /></label>
              <label className="text-xs">Unité<Input className="h-8 w-24" value={r.unite} onChange={(e) => upd(r.id, { unite: e.target.value })} /></label>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
