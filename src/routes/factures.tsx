import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { FactureBadge, FactureEditor, nouvelleFacture } from "@/components/erp/facture-editor";
import { PageTransition } from "@/components/motion-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmt } from "@/lib/calc";
import { calcCommercial, statutFactureEffectif, STATUTS_FACTURE, type Facture } from "@/lib/erp";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/factures")({
  head: () => ({
    meta: [
      { title: "Facturation — Strongal Control" },
      { name: "description", content: "Factures Strongal créées depuis les dossiers et devis, éditables avant génération." },
      { property: "og:title", content: "Facturation — Strongal Control" },
      { property: "og:description", content: "Création, génération et suivi des factures Strongal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacturesPage,
});

function FacturesPage() {
  const { factures, dossiers, config } = useStore();
  const [open, setOpen] = useState<Facture | null>(null);
  const [statut, setStatut] = useState("Tous");
  const [q, setQ] = useState("");
  const [dossierRef, setDossierRef] = useState("");

  const vis = factures
    .filter((f) => statut === "Tous" || statutFactureEffectif(f) === statut)
    .filter((f) => (f.numero + f.client + f.dossierRef).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = (s: string[]) =>
    factures.filter((f) => s.includes(statutFactureEffectif(f))).reduce((a, f) => a + calcCommercial(f.commercial).totalTTC, 0);

  return (
    <AppShell>
      <PageTransition>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Facturation</h1>
            <p className="mt-1 text-sm text-muted-foreground">Client → Dossier → Devis → Facture. Chaque facture reste modifiable jusqu'à sa génération.</p>
          </div>
          <div className="flex gap-2">
            <Select value={dossierRef} onValueChange={setDossierRef}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Choisir un dossier…" /></SelectTrigger>
              <SelectContent>{dossiers.map((d) => <SelectItem key={d.ref} value={d.ref}>{d.ref} — {d.client}</SelectItem>)}</SelectContent>
            </Select>
            <Button
              className="shine"
              disabled={!dossierRef}
              onClick={() => {
                const d = dossiers.find((x) => x.ref === dossierRef);
                if (d) setOpen(nouvelleFacture(d, config, factures));
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Nouvelle facture
            </Button>
          </div>
        </div>

        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <Card className="glass p-4"><p className="text-xs text-muted-foreground">À encaisser</p><p className="text-2xl font-bold">{fmt(total(["Générée", "Envoyée"]))}</p></Card>
          <Card className="glass p-4"><p className="text-xs text-muted-foreground">En retard</p><p className="text-2xl font-bold text-destructive">{fmt(total(["En retard"]))}</p></Card>
          <Card className="glass p-4"><p className="text-xs text-muted-foreground">Encaissé</p><p className="text-2xl font-bold text-success">{fmt(total(["Payée"]))}</p></Card>
        </div>

        <Card className="glass p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <Input className="w-64" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{["Tous", ...STATUTS_FACTURE].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Dossier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead className="text-right">Total TTC</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vis.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Aucune facture. Choisissez un dossier pour en créer une.</TableCell></TableRow>
              )}
              {vis.map((f) => (
                <TableRow key={f.id} className="cursor-pointer" onClick={() => setOpen(f)}>
                  <TableCell className="font-mono text-xs font-semibold">{f.numero}</TableCell>
                  <TableCell>{f.client}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Link to="/dossiers/$ref" params={{ ref: f.dossierRef }} className="font-mono text-xs text-warm underline">{f.dossierRef}</Link>
                  </TableCell>
                  <TableCell>{f.date}</TableCell>
                  <TableCell>{f.echeance}</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(calcCommercial(f.commercial).totalTTC)}</TableCell>
                  <TableCell><FactureBadge f={f} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <FactureEditor facture={open} onClose={() => setOpen(null)} />
      </PageTransition>
    </AppShell>
  );
}
