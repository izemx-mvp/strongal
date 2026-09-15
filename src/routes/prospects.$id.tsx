import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Bot, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { ProspectBadge } from "@/components/badges";
import { PageTransition } from "@/components/motion-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fmt } from "@/lib/calc";
import type { StatutProspect } from "@/lib/data";
import { nowStr, useStore } from "@/lib/store";
import { STATUTS_PROSPECT } from "./prospects.index";

export const Route = createFileRoute("/prospects/$id")({
  head: () => ({
    meta: [
      { title: "Fiche prospect — Strongal Control" },
      {
        name: "description",
        content: "Besoin capté par l'IA, justification de qualification et pilotage manuel du statut.",
      },
      { property: "og:title", content: "Fiche prospect — Strongal Control" },
      {
        property: "og:description",
        content: "Besoin capté par l'IA et pilotage manuel du statut commercial.",
      },
    ],
  }),
  component: ProspectDetail,
});

function ProspectDetail() {
  const { id } = Route.useParams();
  const { prospects, setProspects } = useStore();
  const navigate = useNavigate();
  const prospect = prospects.find((p) => p.id === id);
  const [notes, setNotes] = useState(prospect?.notes ?? "");

  if (!prospect) {
    return (
      <AppShell>
        <PageTransition>
          <Card className="glass p-10 text-center">
            <p>Prospect introuvable.</p>
            <Button className="mt-4" onClick={() => navigate({ to: "/prospects" })}>
              Retour à la liste
            </Button>
          </Card>
        </PageTransition>
      </AppShell>
    );
  }

  const changeStatut = (value: StatutProspect) => {
    setProspects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              statut: value,
              corrigeManuellement: ["Qualifié IA", "Non qualifié IA", "Informations incomplètes"].includes(
                value,
              )
                ? value !== p.statutIA
                : p.corrigeManuellement,
              historique: [
                ...p.historique,
                { date: nowStr(), auteur: "M. Aboulssaad", label: `Statut passé à « ${value} »` },
              ],
            }
          : p,
      ),
    );
    toast.success(`Statut mis à jour : ${value}`);
  };

  return (
    <AppShell>
      <PageTransition>
        <Link to="/prospects" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour aux prospects
        </Link>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{prospect.nom}</h1>
          <ProspectBadge statut={prospect.statut} />
          {prospect.corrigeManuellement && (
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold">
              Corrigé manuellement
            </span>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="glass glass-hover space-y-4 p-5 lg:col-span-2">
            <h2 className="text-lg font-semibold">Besoin exprimé (capté par l'agent IA)</h2>
            <p className="rounded-xl bg-accent-soft/70 p-4 text-sm italic">« {prospect.besoin} »</p>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <Info label="Contact" value={prospect.contact} />
              <Info label="Canal d'entrée" value={prospect.source} />
              <Info label="Budget estimé" value={prospect.budget ? fmt(prospect.budget) : "Non communiqué"} />
              <Info label="Type de projet" value={prospect.typeProjet} />
              <Info label="Zone géographique" value={prospect.zone} />
              <Info label="Score de qualification IA" value={`${prospect.score} %`} />
            </div>
            <div className="rounded-xl border border-warm/40 bg-warm/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Bot className="h-4 w-4 text-warm" /> Justification de l'agent IA — statut initial :{" "}
                {prospect.statutIA}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{prospect.justification}</p>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="glass glass-hover space-y-3 p-5">
              <h2 className="text-lg font-semibold">Pilotage du statut</h2>
              <Select value={prospect.statut} onValueChange={(v) => changeStatut(v as StatutProspect)}>
                <SelectTrigger className="bg-background/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUTS_PROSPECT.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1.5">
                {(["Contacté", "Devis envoyé", "En négociation", "Client signé", "Perdu"] as StatutProspect[]).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => changeStatut(s)}
                      className={`shine rounded-full border px-3 py-1 text-xs transition-colors ${
                        prospect.statut === s
                          ? "border-warm bg-warm/15 font-semibold text-warm"
                          : "hover:bg-accent-soft"
                      }`}
                    >
                      {s}
                    </button>
                  ),
                )}
              </div>
            </Card>

            <Card className="glass glass-hover space-y-3 p-5">
              <h2 className="text-lg font-semibold">Notes internes</h2>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajouter une note interne…"
                className="bg-background/70"
              />
              <Button
                className="shine w-full"
                onClick={() => {
                  setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, notes } : p)));
                  toast.success("Notes enregistrées");
                }}
              >
                <Save className="mr-1 h-4 w-4" /> Enregistrer les notes
              </Button>
            </Card>
          </div>
        </div>

        <Card className="glass glass-hover mt-4 p-5">
          <h2 className="mb-4 text-lg font-semibold">Historique</h2>
          <div className="relative space-y-4 pl-6">
            <span className="absolute top-1 bottom-1 left-[7px] w-px bg-border" />
            {prospect.historique.map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative"
              >
                <span className="absolute top-1.5 -left-6 h-3.5 w-3.5 rounded-full border-2 border-background bg-warm" />
                <p className="text-sm font-medium">{h.label}</p>
                <p className="text-xs text-muted-foreground">
                  {h.date} · {h.auteur}
                </p>
              </motion.div>
            ))}
          </div>
        </Card>
      </PageTransition>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
