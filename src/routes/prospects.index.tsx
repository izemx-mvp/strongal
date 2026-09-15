import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowUpDown, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { ProspectBadge } from "@/components/badges";
import { PageTransition } from "@/components/motion-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmt } from "@/lib/calc";
import type { StatutProspect } from "@/lib/data";
import { nowStr, useStore } from "@/lib/store";

export const STATUTS_PROSPECT: StatutProspect[] = [
  "Qualifié IA",
  "Non qualifié IA",
  "Informations incomplètes",
  "Contacté",
  "Devis envoyé",
  "En négociation",
  "Client signé",
  "Perdu",
];
const SOURCES = ["WhatsApp", "Email", "Site web", "Téléphone"];

export const Route = createFileRoute("/prospects/")({
  head: () => ({
    meta: [
      { title: "Prospects & Qualification — Strongal Control" },
      {
        name: "description",
        content:
          "Prospects Strongal qualifiés en amont par l'agent IA conversationnel, pilotés jusqu'à la signature.",
      },
      { property: "og:title", content: "Prospects & Qualification — Strongal Control" },
      {
        property: "og:description",
        content: "Pilotez chaque prospect qualifié par l'IA jusqu'à la signature.",
      },
    ],
  }),
  component: ProspectsPage,
});

type SortKey = "nom" | "budget" | "date" | "statut" | "source";

function ProspectsPage() {
  const { prospects, setProspects } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState("all");
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "date", dir: -1 });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = prospects.filter((p) => {
      const matchQ =
        !term ||
        p.nom.toLowerCase().includes(term) ||
        p.contact.toLowerCase().includes(term) ||
        p.besoin.toLowerCase().includes(term) ||
        p.zone.toLowerCase().includes(term);
      return (
        matchQ && (statut === "all" || p.statut === statut) && (source === "all" || p.source === source)
      );
    });
    return [...list].sort((a, b) => {
      const d = sort.dir;
      switch (sort.key) {
        case "nom":
          return a.nom.localeCompare(b.nom) * d;
        case "budget":
          return (a.budget - b.budget) * d;
        case "statut":
          return a.statut.localeCompare(b.statut) * d;
        case "source":
          return a.source.localeCompare(b.source) * d;
        default:
          return a.date.localeCompare(b.date) * d;
      }
    });
  }, [prospects, q, statut, source, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * perPage, current * perPage);

  const changeStatut = (id: string, value: StatutProspect) => {
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Prospects & Qualification</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} prospect{filtered.length > 1 ? "s" : ""} affiché
            {filtered.length > 1 ? "s" : ""} sur {prospects.length} — qualification réalisée en amont
            par l'agent IA conversationnel.
          </p>
        </div>

        <Card className="glass glass-hover mb-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-60 flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Rechercher un nom, un contact, un mot-clé du besoin…"
                className="bg-background/70 pl-9"
              />
            </div>
            <Select
              value={statut}
              onValueChange={(v) => {
                setStatut(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-56 bg-background/70">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {STATUTS_PROSPECT.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={source}
              onValueChange={(v) => {
                setSource(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44 bg-background/70">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sources</SelectItem>
                {SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="shine"
              onClick={() => {
                setQ("");
                setStatut("all");
                setSource("all");
                setPage(1);
                toast.success("Filtres réinitialisés");
              }}
            >
              <RotateCcw className="mr-1 h-4 w-4" /> Réinitialiser les filtres
            </Button>
          </div>
        </Card>

        <Card className="glass overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {(
                  [
                    ["nom", "Prospect"],
                    ["source", "Canal"],
                    ["budget", "Budget"],
                    ["date", "Date"],
                    ["statut", "Statut"],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <TableHead key={key}>
                    <button
                      onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === -1 ? 1 : -1 }))}
                      className="flex items-center gap-1 font-medium hover:text-warm"
                    >
                      {label} <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                ))}
                <TableHead>Changer le statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                    Aucun résultat pour cette recherche
                  </TableCell>
                </TableRow>
              )}
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => navigate({ to: "/prospects/$id", params: { id: p.id } })}
                  >
                    <p className="font-medium">{p.nom}</p>
                    <p className="max-w-xs truncate text-xs text-muted-foreground">{p.besoin}</p>
                  </TableCell>
                  <TableCell className="text-sm">{p.source}</TableCell>
                  <TableCell className="text-sm">{p.budget ? fmt(p.budget) : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.date}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <ProspectBadge statut={p.statut} />
                      {p.corrigeManuellement && (
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold">
                          Corrigé manuellement
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={p.statut} onValueChange={(v) => changeStatut(p.id, v as StatutProspect)}>
                      <SelectTrigger className="h-8 w-48 bg-background/70">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Lignes par page
            <Select
              value={String(perPage)}
              onValueChange={(v) => {
                setPerPage(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-20 bg-background/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
              Précédent
            </Button>
            <span className="text-sm">
              Page {current} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={current >= totalPages}
              onClick={() => setPage(current + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
