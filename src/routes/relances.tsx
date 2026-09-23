import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { RelanceBadge, RelanceDialog } from "@/components/erp/relances";
import { PageTransition } from "@/components/motion-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Dossier } from "@/lib/data";
import { fmtDate, JOURS, planRelances, uid, type RelancePlanifiee } from "@/lib/erp";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/relances")({
  head: () => ({
    meta: [
      { title: "Relances commerciales — Strongal Control" },
      { name: "description", content: "Planification et suivi des relances de devis Strongal, avec envoi toujours manuel." },
      { property: "og:title", content: "Relances commerciales — Strongal Control" },
      { property: "og:description", content: "Relances de devis planifiées, rédigées et envoyées manuellement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RelancesPage,
});

type Filtre = "Due" | "Planifiée" | "Envoyée" | "Toutes";

function RelancesPage() {
  const { dossiers, relanceConfig, setRelanceConfig, templates, setTemplates } = useStore();
  const [filtre, setFiltre] = useState<Filtre>("Due");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<{ d: Dossier; r: RelancePlanifiee } | null>(null);

  const rows = useMemo(
    () =>
      dossiers
        .flatMap((d) => planRelances(d, relanceConfig).map((r) => ({ d, r })))
        .sort((a, b) => a.r.dateDue.getTime() - b.r.dateDue.getTime()),
    [dossiers, relanceConfig],
  );
  const count = (s: Filtre) => rows.filter((x) => s === "Toutes" || x.r.statut === s || (s === "Envoyée" && x.r.statut === "Ignorée")).length;
  const vis = rows.filter(
    (x) =>
      (filtre === "Toutes" || x.r.statut === filtre || (filtre === "Envoyée" && x.r.statut === "Ignorée")) &&
      (x.d.client + x.d.ref).toLowerCase().includes(q.toLowerCase()),
  );
  const cfg = relanceConfig;
  const setCfg = (p: Partial<typeof cfg>) => setRelanceConfig({ ...cfg, ...p });

  return (
    <AppShell>
      <PageTransition>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Relances commerciales</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Le système planifie et vous rappelle les relances. L'envoi reste toujours manuel : ouvrir → rédiger → ENVOYER.
          </p>
        </div>
        <Tabs defaultValue="liste">
          <TabsList>
            <TabsTrigger value="liste">À traiter</TabsTrigger>
            <TabsTrigger value="parametres">Paramètres</TabsTrigger>
            <TabsTrigger value="modeles">Modèles de message</TabsTrigger>
          </TabsList>

          <TabsContent value="liste" className="mt-4">
            <Card className="glass p-5">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {(["Due", "Planifiée", "Envoyée", "Toutes"] as Filtre[]).map((f) => (
                  <Button key={f} size="sm" variant={filtre === f ? "default" : "outline"} onClick={() => setFiltre(f)}>
                    {f === "Due" ? "Dues" : f === "Planifiée" ? "Planifiées" : f === "Envoyée" ? "Traitées" : "Toutes"} ({count(f)})
                  </Button>
                ))}
                <div className="flex-1" />
                <Input className="w-64" placeholder="Rechercher client ou dossier…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dossier</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>N°</TableHead>
                    <TableHead>Date due</TableHead>
                    <TableHead>Envoyée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vis.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Aucune relance dans cette vue.</TableCell></TableRow>
                  )}
                  {vis.map(({ d, r }) => (
                    <TableRow key={d.ref + r.numero}>
                      <TableCell><Link to="/dossiers/$ref" params={{ ref: d.ref }} className="font-mono text-xs text-warm underline">{d.ref}</Link></TableCell>
                      <TableCell>{d.client}</TableCell>
                      <TableCell>{r.numero}/{cfg.max}</TableCell>
                      <TableCell>{fmtDate(r.dateDue)}</TableCell>
                      <TableCell className="text-xs">{r.envoi ? `${r.envoi.dateEnvoi} · ${r.envoi.auteur}` : "—"}</TableCell>
                      <TableCell><RelanceBadge statut={r.statut} /></TableCell>
                      <TableCell className="text-right">
                        {!r.envoi && <Button size="sm" variant={r.statut === "Due" ? "default" : "outline"} onClick={() => setOpen({ d, r })}>Ouvrir</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="parametres" className="mt-4">
            <Card className="glass grid gap-5 p-5 md:grid-cols-2">
              <label className="text-sm">Nombre maximum de relances
                <Input type="number" min={1} value={cfg.max} onChange={(e) => setCfg({ max: Math.max(1, Number(e.target.value) || 1) })} />
              </label>
              <label className="text-sm">Première relance : jours après l'envoi du devis
                <Input type="number" min={0} value={cfg.premierJours} onChange={(e) => setCfg({ premierJours: Number(e.target.value) || 0 })} />
              </label>
              <label className="text-sm">Intervalle entre relances (jours)
                <Input type="number" min={0} value={cfg.intervalleJours} onChange={(e) => setCfg({ intervalleJours: Number(e.target.value) || 0 })} />
              </label>
              <label className="text-sm">Intervalle complémentaire (heures)
                <Input type="number" min={0} value={cfg.intervalleHeures} onChange={(e) => setCfg({ intervalleHeures: Number(e.target.value) || 0 })} />
              </label>
              <label className="text-sm">Heure préférée
                <Input type="time" value={cfg.heure} onChange={(e) => setCfg({ heure: e.target.value })} />
              </label>
              <div className="text-sm">
                Jours autorisés
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 0].map((j) => (
                    <Button
                      key={j}
                      size="sm"
                      variant={cfg.jours.includes(j) ? "default" : "outline"}
                      onClick={() => setCfg({ jours: cfg.jours.includes(j) ? cfg.jours.filter((x) => x !== j) : [...cfg.jours, j] })}
                    >
                      {JOURS[j]}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground md:col-span-2">
                Les modifications sont enregistrées immédiatement et recalculent le planning de tous les dossiers. Si une date tombe un jour non autorisé, elle est reportée au prochain jour autorisé.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="modeles" className="mt-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              Variables : {"{{client_name}}"}, {"{{devis_number}}"}, {"{{montant_ttc}}"}, {"{{dossier_ref}}"}, {"{{user_name}}"}
            </p>
            {templates.map((t) => (
              <Card key={t.id} className="glass space-y-2 p-5">
                <div className="flex gap-2">
                  <Input value={t.nom} onChange={(e) => setTemplates(templates.map((x) => (x.id === t.id ? { ...x, nom: e.target.value } : x)))} />
                  <Button variant="ghost" size="icon" aria-label="Supprimer le modèle" onClick={() => setTemplates(templates.filter((x) => x.id !== t.id))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea rows={7} value={t.contenu} onChange={(e) => setTemplates(templates.map((x) => (x.id === t.id ? { ...x, contenu: e.target.value } : x)))} />
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                setTemplates([...templates, { id: uid(), nom: "Nouveau modèle", contenu: "Bonjour {{client_name}},\n\n\n\nCordialement,\n{{user_name}}" }]);
                toast.success("Modèle ajouté");
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Nouveau modèle
            </Button>
          </TabsContent>
        </Tabs>
        {open && <RelanceDialog dossier={open.d} relance={open.r} onClose={() => setOpen(null)} />}
      </PageTransition>
    </AppShell>
  );
}
