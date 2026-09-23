import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FolderKanban,
  BellRing,
  HardHat,
  Receipt,
  Scissors,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/app-shell";
import { CountUp, PageTransition, ShimmerBlock } from "@/components/motion-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { computeTotaux } from "@/lib/calc";
import { calcCommercial, getSuivi, phaseCourante, planRelances, statutFactureEffectif } from "@/lib/erp";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Strongal Control" },
      {
        name: "description",
        content: "Vue d'ensemble des dossiers, chiffrages, chantiers, relances et factures de Strongal.",
      },
      { property: "og:title", content: "Tableau de bord — Strongal Control" },
      {
        property: "og:description",
        content: "Vue d'ensemble des dossiers, chiffrages et agents IA de Strongal.",
      },
    ],
  }),
  component: Dashboard,
});

const ACTIVITES = [
  { t: "il y a 12 min", l: "Agent Chiffrage a calculé les matières premières du dossier STR-2026-014" },
  { t: "il y a 40 min", l: "Fabrication démarrée sur STR-2026-004 — Mohamed" },
  { t: "il y a 3 h", l: "Zone d'équilibrage détectée sur STR-2026-011, validation humaine requise" },
  { t: "il y a 5 h", l: "Devis technique v1 envoyé à Mme Salma Bennani (STR-2026-004)" },
  { t: "hier", l: "Agent Chiffrage : taux de chute optimisé à 8,4 % sur STR-2026-003" },
];

function Dashboard() {
  const { dossiers, config, factures, relanceConfig } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 750);
    return () => clearTimeout(t);
  }, []);

  const enCours = dossiers.filter((d) => d.statut !== "Livré").length;
  const aValider = dossiers.filter((d) => d.statut === "À valider").length;
  const chantiers = dossiers.filter((d) => {
    const p = phaseCourante(getSuivi(d));
    return ["fabrication", "livraison", "prepa", "pose"].includes(p.id) && p.etat !== "À venir";
  }).length;
  const relancesDues = dossiers
    .flatMap((d) => planRelances(d, relanceConfig))
    .filter((r) => r.statut === "Due").length;
  const aEncaisser = factures
    .filter((f) => ["Générée", "Envoyée", "En retard"].includes(statutFactureEffectif(f)))
    .reduce((s, f) => s + calcCommercial(f.commercial).totalTTC, 0);
  const chute = useMemo(() => {
    const vals = dossiers.map((d) => computeTotaux(d, config).tauxChuteGlobal);
    return vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
  }, [dossiers, config]);

  const kpis = [
    { label: "Dossiers en cours", value: enCours, icon: FolderKanban, to: "/dossiers", search: {} },
    {
      label: "Chiffrages en attente de validation",
      value: aValider,
      icon: CheckCircle2,
      to: "/dossiers",
      search: { statut: "À valider" },
    },
    { label: "Chantiers en fabrication, livraison ou pose", value: chantiers, icon: HardHat, to: "/dossiers", search: {} },
    { label: "Taux de chute moyen sur débitage", value: chute, icon: Scissors, to: "/dossiers", search: {}, suffix: " %", decimals: 1 },
    { label: "Relances à envoyer (manuellement)", value: relancesDues, icon: BellRing, to: "/relances", search: {} },
    { label: "Factures à encaisser (MAD TTC)", value: aEncaisser, icon: Receipt, to: "/dossiers", search: {} },
  ] as const;

  const chart = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        jour: `J-${29 - i}`,
        créés: Math.max(0, Math.round(2 + Math.sin(i / 2.4) * 2 + (i % 4 === 0 ? 2 : 0))),
        validés: Math.max(0, Math.round(1 + Math.cos(i / 3) * 1.6 + (i % 5 === 0 ? 1 : 0))),
      })),
    [],
  );

  return (
    <AppShell>
      <PageTransition>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue d'ensemble : chiffrage, chantiers, relances et facturation.
          </p>
        </div>

        {!config.validated && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass mb-6 flex flex-wrap items-center gap-4 rounded-xl border-warm/50 bg-warm/5 p-4"
          >
            <AlertTriangle className="h-5 w-5 text-warm" />
            <p className="flex-1 text-sm">
              Configurez votre catalogue de profilés et vos seuils de chiffrage avant de lancer un
              dossier.
            </p>
            <Button className="shine" onClick={() => navigate({ to: "/configuration" })}>
              Configurer
            </Button>
          </motion.div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {kpis.map((k, i) =>
            loading ? (
              <ShimmerBlock key={k.label} className="h-32" />
            ) : (
              <motion.button
                key={k.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => navigate({ to: k.to, search: k.search as never })}
                className="glass glass-hover rounded-xl p-5 text-left"
              >
                <k.icon className="h-5 w-5 text-warm" />
                <p className="mt-4 text-3xl font-bold">
                  <CountUp
                    value={k.value}
                    decimals={"decimals" in k ? (k.decimals as number) : 0}
                    suffix={"suffix" in k ? (k.suffix as string) : ""}
                  />
                </p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">{k.label}</p>
              </motion.button>
            ),
          )}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="glass glass-hover col-span-1 p-5 lg:col-span-2">
            <h2 className="text-lg font-semibold">Activité des 30 derniers jours</h2>
            <p className="mb-4 text-xs text-muted-foreground">Dossiers créés vs chiffrages validés</p>
            {loading ? (
              <ShimmerBlock className="h-72" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="jour" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="créés" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="validés" fill="var(--warm)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="glass glass-hover p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Bot className="h-5 w-5 text-warm" /> Activité récente
            </h2>
            <div className="scroll-slim max-h-72 space-y-4 overflow-y-auto pr-2">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <ShimmerBlock key={i} className="h-10" />)
                : ACTIVITES.map((a, i) => (
                    <motion.div
                      key={a.l}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-3"
                    >
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warm" />
                      <div>
                        <p className="text-sm leading-snug">{a.l}</p>
                        <p className="text-xs text-muted-foreground">{a.t}</p>
                      </div>
                    </motion.div>
                  ))}
            </div>
          </Card>
        </div>
      </PageTransition>
    </AppShell>
  );
}
