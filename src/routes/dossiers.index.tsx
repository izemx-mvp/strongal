import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowUpDown, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/motion-bits";
import { StatutBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { budgetEstime, fmt } from "@/lib/calc";
import type { Dossier, StatutDossier } from "@/lib/data";
import { CHECKLIST_ITEMS } from "@/lib/data";
import { nowStr, useStore } from "@/lib/store";

const STATUTS: StatutDossier[] = [
  "Nouveau",
  "Collecte terrain",
  "Chiffrage en cours",
  "À valider",
  "Validé",
  "Devis envoyé",
  "Livré",
];
const TYPES = ["Résidentiel", "Villa", "Commercial", "Promotion"] as const;
const GAMMES = ["Standard", "Haut de gamme"] as const;

type SearchParams = { statut?: string };

export const Route = createFileRoute("/dossiers/")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    statut: typeof s.statut === "string" ? s.statut : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Dossiers & Chiffrage — Strongal Control" },
      {
        name: "description",
        content:
          "Suivi des dossiers Strongal : chiffrage matières, optimisation du débitage et devis techniques.",
      },
      { property: "og:title", content: "Dossiers & Chiffrage — Strongal Control" },
      {
        property: "og:description",
        content: "Chiffrage matières, optimisation du débitage et devis techniques.",
      },
    ],
  }),
  component: DossiersPage,
});

type SortKey = "ref" | "client" | "budget" | "date" | "statut";

function DossiersPage() {
  const { dossiers, setDossiers, config } = useStore();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [q, setQ] = useState("");
  const [statut, setStatut] = useState<string>(search.statut ?? "all");
  const [type, setType] = useState("all");
  const [gamme, setGamme] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "date", dir: -1 });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = dossiers.filter((d) => {
      const matchQ =
        !term ||
        d.ref.toLowerCase().includes(term) ||
        d.client.toLowerCase().includes(term) ||
        d.adresse.toLowerCase().includes(term) ||
        d.reperes.some((r) => r.designation.toLowerCase().includes(term));
      const matchS = statut === "all" || d.statut === statut;
      const matchT = type === "all" || d.typeProjet === type;
      const matchG = gamme === "all" || d.gamme === gamme;
      return matchQ && matchS && matchT && matchG;
    });
    const sorted = [...list].sort((a, b) => {
      const dir = sort.dir;
      switch (sort.key) {
        case "ref":
          return a.ref.localeCompare(b.ref) * dir;
        case "client":
          return a.client.localeCompare(b.client) * dir;
        case "budget":
          return (budgetEstime(a, config) - budgetEstime(b, config)) * dir;
        case "statut":
          return a.statut.localeCompare(b.statut) * dir;
        default:
          return a.date.localeCompare(b.date) * dir;
      }
    });
    return sorted;
  }, [dossiers, q, statut, type, gamme, sort, config]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * perPage, current * perPage);

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === -1 ? 1 : -1 }));

  const reset = () => {
    setQ("");
    setStatut("all");
    setType("all");
    setGamme("all");
    setPage(1);
    navigate({ to: "/dossiers", search: {} });
    toast.success("Filtres réinitialisés");
  };

  return (
    <AppShell>
      <PageTransition>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dossiers & Chiffrage</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} dossier{filtered.length > 1 ? "s" : ""} affiché
              {filtered.length > 1 ? "s" : ""} sur {dossiers.length}
            </p>
          </div>
          <NouveauDossierDialog
            trigger={
              <Button className="shine">
                <Plus className="mr-1 h-4 w-4" /> Nouveau dossier
              </Button>
            }
            onCreated={() => {
              setQ("");
              setStatut("all");
              setType("all");
              setGamme("all");
              setPage(1);
            }}
          />
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
                placeholder="Rechercher un client, une référence, un mot-clé…"
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
              <SelectTrigger className="w-52 bg-background/70">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {STATUTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48 bg-background/70">
                <SelectValue placeholder="Type de projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={gamme}
              onValueChange={(v) => {
                setGamme(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44 bg-background/70">
                <SelectValue placeholder="Gamme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les gammes</SelectItem>
                {GAMMES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={reset} className="shine">
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
                    ["ref", "Référence"],
                    ["client", "Client"],
                    ["budget", "Budget estimé"],
                    ["date", "Date"],
                    ["statut", "Statut"],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <TableHead key={key}>
                    <button
                      onClick={() => toggleSort(key)}
                      className="flex items-center gap-1 font-medium hover:text-warm"
                    >
                      {label} <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                ))}
                <TableHead>Type / Gamme</TableHead>
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
              {rows.map((d) => (
                <TableRow
                  key={d.ref}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/dossiers/$ref", params: { ref: d.ref } })}
                >
                  <TableCell className="font-mono text-xs font-semibold">{d.ref}</TableCell>
                  <TableCell className="font-medium">{d.client}</TableCell>
                  <TableCell>{fmt(budgetEstime(d, config))}</TableCell>
                  <TableCell className="text-muted-foreground">{d.date}</TableCell>
                  <TableCell>
                    <StatutBadge statut={d.statut} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {d.typeProjet} · {d.gamme}
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
