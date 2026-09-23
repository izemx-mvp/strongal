import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Download,
  Eye,
  FileCheck2,
  Send,
  Sparkle,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import {
  DossierChiffrage,
  DossierDevis,
  DossierFactures,
  DossierOverview,
} from "@/components/erp/dossier-erp";
import { SuiviChantier } from "@/components/erp/suivi-chantier";
import { StatutBadge } from "@/components/badges";
import { PageTransition, ShimmerBlock } from "@/components/motion-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { computeDebitage, computeLignes, computeTotaux, fmt, fmtNum } from "@/lib/calc";
import { CHECKLIST_ITEMS, LOGO_URL, type DevisVersion, type Dossier, type StatutDossier } from "@/lib/data";
import { downloadTexte } from "@/lib/download";
import { getSuivi, PHASES } from "@/lib/erp";
import { nowStr, useStore } from "@/lib/store";

const ETAPES = [
  { nom: "Collecte", phrase: "Vérifiez les coordonnées, le chantier et tous les repères relevés.", tab: "synthese" },
  { nom: "Chiffrage", phrase: "Contrôlez les matières, le débitage et les zones d'équilibrage.", tab: "chiffrage" },
  { nom: "Validation", phrase: "Complétez la checklist de validation humaine.", tab: "validation" },
  { nom: "Devis", phrase: "Finalisez le devis et obtenez l'acceptation du client.", tab: "devis" },
  { nom: "Approvisionnement", phrase: "Suivez les commandes et la réception des matières.", tab: "suivi", phaseId: "appro" },
  { nom: "Fabrication", phrase: "Suivez l'avancement réel de la fabrication en atelier.", tab: "suivi", phaseId: "fabrication" },
  { nom: "Livraison", phrase: "Préparez et confirmez la livraison sur chantier.", tab: "suivi", phaseId: "livraison" },
  { nom: "Pose", phrase: "Pilotez l'équipe et l'avancement de l'installation.", tab: "suivi", phaseId: "pose" },
  { nom: "Réception", phrase: "Levez les réserves et confirmez la réception finale.", tab: "suivi", phaseId: "controle" },
  { nom: "Facturation", phrase: "Créez, validez et générez la facture du dossier.", tab: "factures" },
];

const STATUT_PAR_ETAPE: StatutDossier[] = [
  "Collecte terrain",
  "Chiffrage en cours",
  "À valider",
  "Validé",
  "Devis accepté",
  "Devis accepté",
  "Devis accepté",
  "Devis accepté",
  "Devis accepté",
  "Livré",
];

export const Route = createFileRoute("/dossiers/$ref")({
  head: () => ({
    meta: [
      { title: "Détail dossier — Strongal Control" },
      {
        name: "description",
        content:
          "Chiffrage matières, optimisation du débitage, validation humaine et devis technique du dossier.",
      },
      { property: "og:title", content: "Détail dossier — Strongal Control" },
      {
        property: "og:description",
        content: "Chiffrage matières, débitage optimisé, validation et devis technique.",
      },
    ],
  }),
  component: DossierDetail,
});

function DossierDetail() {
  const { ref } = Route.useParams();
  const { dossiers, updateDossier, config, factures, utilisateur } = useStore();
  const navigate = useNavigate();
  const dossier = dossiers.find((d) => d.ref === ref);

  const [viewStep, setViewStep] = useState(dossier?.etape ?? 0);
  const [loading, setLoading] = useState(true);
  const [adjust, setAdjust] = useState<string | null>(null);
  const [zone, setZone] = useState<string | null>(null);
  const [notes, setNotes] = useState(dossier?.notes ?? "");
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, [ref]);

  useEffect(() => setViewStep(dossier?.etape ?? 0), [dossier?.etape, ref]);

  const lignes = useMemo(() => (dossier ? computeLignes(dossier, config) : []), [dossier, config]);
  const plans = useMemo(() => (dossier ? computeDebitage(dossier, config) : []), [dossier, config]);
  const totaux = useMemo(
    () => (dossier ? computeTotaux(dossier, config) : null),
    [dossier, config],
  );

  if (!dossier || !totaux) {
    return (
      <AppShell>
        <PageTransition>
          <Card className="glass p-10 text-center">
            <p>Dossier introuvable.</p>
            <Button className="mt-4" onClick={() => navigate({ to: "/dossiers" })}>
              Retour aux dossiers
            </Button>
          </Card>
        </PageTransition>
      </AppShell>
    );
  }

  const zonesNonValidees = lignes.filter((l) => l.zoneEquilibrage && !l.repere.valideManuellement);
  const checklistOk = CHECKLIST_ITEMS.every((c) => dossier.checklist[c]);

  const nextStep = () => {
    if (dossier.etape === 0) {
      const collecteComplete = dossier.client.trim() && dossier.contact.trim() && dossier.adresse.trim() && dossier.reperes.length > 0 && dossier.reperes.every((r) => r.largeur > 0 && r.hauteur > 0 && r.quantite > 0);
      if (!collecteComplete) {
        toast.error("Complétez le client, le chantier et tous les repères avant de continuer");
        return;
      }
    }
    if (dossier.etape === 1 && zonesNonValidees.length > 0) {
      toast.error(
        `${zonesNonValidees.length} repère(s) en zone d'équilibrage doivent être validés manuellement`,
      );
      return;
    }
    if (dossier.etape === 2 && !checklistOk) {
      toast.error("La checklist de validation doit être entièrement complétée");
      return;
    }
    if (dossier.etape === 3 && dossier.devis.at(-1)?.statut !== "Accepté") {
      toast.error("Le dernier devis doit être généré puis accepté avant l'approvisionnement");
      setViewStep(3);
      return;
    }
    if (dossier.etape === 9) {
      const factureGeneree = factures.some((f) => f.dossierRef === dossier.ref && f.statut !== "Brouillon");
      if (!factureGeneree) {
        toast.error("Générez au moins une facture avant de clôturer le dossier");
        return;
      }
      toast.success("Cycle opérationnel du dossier terminé");
      return;
    }

    const currentDefinition = ETAPES[dossier.etape];
    let suiviPatch: Dossier["suivi"] | undefined;
    if (currentDefinition.phaseId) {
      const suivi = getSuivi(dossier);
      const phase = suivi.phases.find((p) => p.id === currentDefinition.phaseId);
      const def = PHASES.find((p) => p.id === currentDefinition.phaseId);
      if (!phase?.responsable) {
        toast.error("Affectez un responsable à cette phase avant de la terminer");
        setViewStep(dossier.etape);
        return;
      }
      if (def && def.points.some((point) => !phase.points[point])) {
        toast.error("Complétez tous les points de contrôle de cette phase");
        setViewStep(dossier.etape);
        return;
      }
      const nextDefinition = ETAPES[dossier.etape + 1];
      const date = nowStr();
      suiviPatch = {
        phases: suivi.phases.map((p) => {
          if (p.id === currentDefinition.phaseId) return { ...p, etat: "Terminée" as const, progression: 100, statut: def?.statuts.at(-1) ?? p.statut, dateMaj: date };
          if (nextDefinition?.phaseId && p.id === nextDefinition.phaseId) return { ...p, etat: "En cours" as const, progression: Math.max(5, p.progression), responsable: p.responsable || phase.responsable, dateDebut: p.dateDebut || date.slice(0, 10), dateMaj: date };
          return p;
        }),
        historique: [...suivi.historique, { date, phaseId: currentDefinition.phaseId, auteur: utilisateur, label: `${currentDefinition.nom} terminée — passage à l'étape suivante` }],
      };
    }
    const etape = dossier.etape + 1;
    updateDossier(
      dossier.ref,
      { etape, statut: STATUT_PAR_ETAPE[etape], ...(suiviPatch ? { suivi: suiviPatch } : {}) },
      { auteur: utilisateur, label: `Étape « ${currentDefinition.nom} » complétée — passage à « ${ETAPES[etape].nom} »` },
    );
    setViewStep(etape);
    toast.success(`Étape suivante : ${ETAPES[etape].nom}`);
  };

  const genererDevis = () => {
    setViewStep(3);
    toast.info("Vérifiez le devis puis cliquez sur « Générer le devis »");
  };

  return (
    <AppShell>
      <PageTransition>
        <Link
          to="/dossiers"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux dossiers
        </Link>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{dossier.client}</h1>
          <span className="font-mono text-sm text-muted-foreground">{dossier.ref}</span>
          <StatutBadge statut={dossier.statut} />
          {dossier.devis.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              Devis v{dossier.devis.at(-1)!.version} · {dossier.devis.at(-1)!.statut}
            </span>
          )}
        </div>

        <DossierOverview dossier={dossier} onTab={(target) => {
          const index = ETAPES[dossier.etape].tab === target ? dossier.etape : ETAPES.findIndex((e) => e.tab === target);
          if (index >= 0 && index <= dossier.etape) setViewStep(index);
        }} />

        {/* Workflow administratif / commercial (distinct du suivi chantier) */}
        <Card className="glass glass-hover mb-4 p-5">
          <p className="mb-4 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Statut administratif / commercial du dossier
          </p>
           <div className="scroll-slim relative flex justify-between gap-2 overflow-x-auto pb-2">
            <div className="absolute top-4 right-4 left-4 h-1 rounded-full bg-muted" />
            <motion.div
              className="absolute top-4 left-4 h-1 rounded-full bg-gradient-to-r from-primary to-warm"
              initial={{ width: 0 }}
              animate={{ width: `${(dossier.etape / (ETAPES.length - 1)) * 92}%` }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
            {ETAPES.map((e, i) => (
              <button key={e.nom} type="button" disabled={i > dossier.etape} onClick={() => setViewStep(i)} className="relative z-10 flex min-w-24 flex-1 flex-col items-center text-center disabled:cursor-not-allowed">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    i < dossier.etape
                      ? "border-warm bg-warm text-warm-foreground"
                      : i === viewStep
                        ? "pulse-dot border-warm bg-background text-warm"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="mt-2 text-xs font-medium">{e.nom}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
             <p className="text-sm text-muted-foreground">{ETAPES[viewStep].phrase}</p>
             <Button className="shine" onClick={viewStep === dossier.etape ? nextStep : () => setViewStep(dossier.etape)}>
               {viewStep !== dossier.etape ? "Revenir à l'étape actuelle" : dossier.etape === 9 ? "Terminer le cycle" : "Terminer et passer à l'étape suivante"} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Tabs value={ETAPES[viewStep].tab}>

          <TabsContent value="suivi" className="mt-4">
            <SuiviChantier key={`${dossier.ref}-${viewStep}`} dossier={dossier} />
          </TabsContent>
          <TabsContent value="factures" className="mt-4">
            <DossierFactures dossier={dossier} />
          </TabsContent>

          {/* Synthèse */}
          <TabsContent value="synthese" className="mt-4 space-y-4">
            <Card className="glass glass-hover grid gap-4 p-5 sm:grid-cols-3">
              <Info label="Client" value={dossier.client} />
              <Info label="Contact" value={dossier.contact} />
              <Info label="Type de projet" value={dossier.typeProjet} />
              <Info label="Gamme" value={dossier.gamme} />
              <Info label="Adresse du chantier" value={dossier.adresse} />
              <Info label="Technicien collecte" value={dossier.technicien} />
              <Info label="Date de collecte" value={dossier.dateCollecte} />
              <Info label="Créé le" value={dossier.date} />
              <Info label="Budget estimé TTC" value={fmt(totaux.totalTTC)} />
            </Card>

            <Card className="glass glass-hover p-5">
              <h2 className="mb-3 text-lg font-semibold">Repères relevés sur site</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {dossier.reperes.map((r) => (
                  <div key={r.id} className="rounded-xl border p-4">
                    <p className="font-medium">{r.designation}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.largeur} × {r.hauteur} m · quantité {r.quantite}
                    </p>
                    {r.contraintes.map((c) => (
                      <span
                        key={c}
                        className="mt-2 mr-1 inline-block rounded-full bg-warm/10 px-2 py-0.5 text-xs text-warm"
                      >
                        {c}
                      </span>
                    ))}
                    <div className="mt-3 flex gap-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-14 w-20 rounded-lg bg-gradient-to-br from-accent-glow/70 to-accent-soft"
                          title={`Photo ${i + 1} du repère`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="glass glass-hover p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Sparkle className="h-4 w-4 text-warm" /> Résumé généré par l'IA
              </h2>
              <ul className="space-y-1.5 text-sm">
                {dossier.resume.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warm" />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          {/* Chiffrage */}
          <TabsContent value="chiffrage" className="mt-4 space-y-4">
            {zonesNonValidees.length > 0 && (
              <Card className="glass border-destructive/50 bg-destructive/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <span className="pulse-dot flex h-6 items-center rounded-full bg-destructive px-2 text-xs text-destructive-foreground">
                    Zone d'équilibrage
                  </span>
                  {zonesNonValidees.length} repère(s) dépassent vos seuils — validation humaine requise
                  avant l'étape « Validation ».
                </p>
              </Card>
            )}

            {loading ? (
              <ShimmerBlock className="h-64" />
            ) : (
              lignes.map((l) => (
                <Card key={l.repere.id} className="glass glass-hover p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{l.repere.designation}</h3>
                    <span className="text-xs text-muted-foreground">
                      {l.repere.largeur} × {l.repere.hauteur} m · ×{l.repere.quantite} · {l.ouvrageNom}
                    </span>
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold">
                      {l.produitNom}
                    </span>
                    {l.repere.modifieManuellement && (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold">
                        Modifié manuellement
                      </span>
                    )}
                    {l.zoneEquilibrage && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          l.repere.valideManuellement
                            ? "bg-success/15 text-success"
                            : "pulse-dot bg-destructive text-destructive-foreground"
                        }`}
                      >
                        {l.repere.valideManuellement
                          ? "Zone d'équilibrage validée"
                          : "Zone d'équilibrage — validation requise"}
                      </span>
                    )}
                    <div className="flex-1" />
                    <Button variant="outline" size="sm" onClick={() => setAdjust(l.repere.id)}>
                      Ajuster / Recalculer
                    </Button>
                    {l.zoneEquilibrage && !l.repere.valideManuellement && (
                      <Button size="sm" onClick={() => setZone(l.repere.id)} className="shine">
                        Valider manuellement ce repère
                      </Button>
                    )}
                  </div>

                  {l.zoneEquilibrage && (
                    <p className="mb-3 flex items-center gap-2 text-xs text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" /> {l.motifsZone.join(" · ")}
                    </p>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Poste</TableHead>
                        <TableHead>Détail</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {l.profils.map((p, pi) => (
                        <TableRow key={`${p.profileId}-${pi}`}>
                          <TableCell className="font-medium">
                            {pi === 0 ? "Profilé aluminium" : ""}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {p.ref} — {p.serie} · {p.detail} · {fmtNum(p.ml)} ml
                          </TableCell>
                          <TableCell className="text-right">{fmt(p.cout)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-medium">Vitrage</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {l.vitrageType} · {fmtNum(l.surface)} m²
                        </TableCell>
                        <TableCell className="text-right">{fmt(l.coutVitrage)}</TableCell>
                      </TableRow>
                      {l.accessoires.map((a) => (
                        <TableRow key={a.nom}>
                          <TableCell className="text-sm">{a.nom}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {fmtNum(a.qte, 1)} {a.unite} × {fmt(a.coutUnitaire)}
                          </TableCell>
                          <TableCell className="text-right">{fmt(a.total)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-medium">Main d'œuvre</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fmtNum(l.heures, 1)} h × {fmt(config.mainOeuvreHeure)}
                        </TableCell>
                        <TableCell className="text-right">{fmt(l.coutMainOeuvre)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2} className="font-semibold">
                          Sous-total repère
                        </TableCell>
                        <TableCell className="text-right font-semibold">{fmt(l.sousTotal)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Card>
              ))
            )}

            {/* Débitage */}
            <Card className="glass glass-hover p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">
                  Optimisation du débitage — barres de {fmtNum(config.longueurBarre)} m
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${chuteColor(totaux.tauxChuteGlobal)}`}
                >
                  Taux de chute global : {fmtNum(totaux.tauxChuteGlobal, 1)} %
                </span>
              </div>
              <div className="space-y-5">
                {plans.map((p) => (
                  <div key={p.profileId}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-mono text-sm font-semibold">{p.profileRef}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${chuteColor(p.tauxChute)}`}>
                        {p.barres.length} barre(s) · chute {fmtNum(p.tauxChute, 1)} %
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {p.barres.map((b, i) => {
                        const chute = ((p.longueurBarre - b.utilise) / p.longueurBarre) * 100;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-14 text-xs text-muted-foreground">#{i + 1}</span>
                            <div className="flex h-6 flex-1 overflow-hidden rounded-md bg-muted">
                              {b.segments.map((s, j) => (
                                <motion.div
                                  key={j}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(s.longueur / p.longueurBarre) * 100}%` }}
                                  transition={{ duration: 0.5, delay: j * 0.03 }}
                                  title={`${s.label} — ${fmtNum(s.longueur)} m`}
                                  className="h-full border-r border-background bg-gradient-to-r from-primary to-primary-glow"
                                />
                              ))}
                            </div>
                            <span className={`w-20 text-right text-xs font-semibold ${chuteTexte(chute)}`}>
                              {fmtNum(chute, 1)} %
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Totaux */}
            <Card className="glass glass-hover p-5">
              <h2 className="mb-3 text-lg font-semibold">Totaux</h2>
              <div className="space-y-1.5 text-sm">
                <Ligne label="Total matière" value={fmt(totaux.matiere)} />
                <Ligne label="Total main d'œuvre" value={fmt(totaux.mainOeuvre)} />
                <Ligne label="Transport / déplacement" value={fmt(totaux.transport)} />
                <Ligne label={`Marge appliquée (${totaux.margeTaux} % — ${dossier.gamme})`} value={fmt(totaux.marge)} />
                <Ligne label="Total HT" value={fmt(totaux.totalHT)} bold />
                <Ligne label="TVA 20 %" value={fmt(totaux.tva)} />
                <Ligne label="Total TTC" value={fmt(totaux.totalTTC)} bold />
              </div>
            </Card>

            <DossierChiffrage dossier={dossier} />
          </TabsContent>

          {/* Validation */}
          <TabsContent value="validation" className="mt-4 space-y-4">
            <Card className="glass glass-hover space-y-4 p-5">
              <h2 className="text-lg font-semibold">Checklist de validation humaine</h2>
              {CHECKLIST_ITEMS.map((item) => {
                const blockedZones = item.includes("zone d'équilibrage") && zonesNonValidees.length > 0;
                return (
                  <label key={item} className="flex items-start gap-3 text-sm">
                    <Checkbox
                      checked={!!dossier.checklist[item] && !blockedZones}
                      disabled={blockedZones}
                      onCheckedChange={(c) =>
                        updateDossier(dossier.ref, {
                          checklist: { ...dossier.checklist, [item]: !!c },
                        })
                      }
                    />
                    <span className={blockedZones ? "text-destructive" : ""}>
                      {item}
                      {blockedZones && " — repère(s) en zone d'équilibrage non validés"}
                    </span>
                  </label>
                );
              })}

              <div className="space-y-2">
                <Label>Notes internes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-background/70"
                  placeholder="Notes internes sur ce chiffrage…"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    updateDossier(dossier.ref, { notes });
                    toast.success("Notes enregistrées");
                  }}
                >
                  Enregistrer les notes
                </Button>
              </div>

              {checklistOk && zonesNonValidees.length === 0 ? (
                <p className="font-semibold text-success">Checklist 100 % complète</p>
              ) : (
                <div className="text-sm text-destructive">
                  <p className="font-semibold">Il reste à traiter :</p>
                  <ul className="list-inside list-disc">
                    {CHECKLIST_ITEMS.filter((c) => !dossier.checklist[c]).map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                    {zonesNonValidees.map((z) => (
                      <li key={z.repere.id}>Valider le repère « {z.repere.designation} »</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                className="shine"
                size="lg"
                disabled={!checklistOk || zonesNonValidees.length > 0}
                onClick={genererDevis}
              >
                <FileCheck2 className="mr-1 h-4 w-4" /> Ouvrir la préparation du devis
              </Button>
            </Card>
          </TabsContent>

          {/* Devis */}
          <TabsContent value="devis" className="mt-4">
            <DossierDevis dossier={dossier} />
          </TabsContent>

          {/* Historique */}
          <TabsContent value="historique" className="mt-4">
            <Card className="glass glass-hover p-5">
              <h2 className="mb-4 text-lg font-semibold">Historique du dossier</h2>
              <div className="relative space-y-4 pl-6">
                <span className="absolute top-1 bottom-1 left-[7px] w-px bg-border" />
                {[...dossier.historique].reverse().map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative"
                  >
                    <span className="absolute top-1.5 -left-6 h-3.5 w-3.5 rounded-full border-2 border-background bg-warm" />
                    <p className="text-sm font-medium">
                      {h.action && (
                        <span className="mr-2 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold">
                          {h.action}
                        </span>
                      )}
                      {h.label}
                    </p>
                    {(h.avant || h.apres) && (
                      <p className="text-xs">
                        <span className="text-muted-foreground line-through">{h.avant}</span>
                        {" → "}
                        <span className="font-semibold text-warm">{h.apres}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {h.date} · {h.auteur}
                    </p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <AjustementModal
          dossier={dossier}
          repereId={adjust}
          onClose={() => setAdjust(null)}
          onApply={(repereId, profileId, quantite, raison) => {
            updateDossier(
              dossier.ref,
              {
                reperes: dossier.reperes.map((r) =>
                  r.id === repereId
                    ? { ...r, profileId, quantite, modifieManuellement: true, raisonModif: raison }
                    : r,
                ),
              },
              { auteur: "M. Aboulssaad", label: `Ajustement manuel du repère ${repereId} — ${raison}` },
            );
            toast.success("Chiffrage recalculé avec l'ajustement manuel");
            setAdjust(null);
          }}
        />

        <ZoneModal
          repereId={zone}
          onClose={() => setZone(null)}
          onValidate={(repereId, justification) => {
            updateDossier(
              dossier.ref,
              {
                reperes: dossier.reperes.map((r) =>
                  r.id === repereId ? { ...r, valideManuellement: true } : r,
                ),
              },
              {
                auteur: "M. Aboulssaad",
                label: `Zone d'équilibrage validée manuellement (${repereId}) — ${justification}`,
              },
            );
            toast.success("Repère validé manuellement");
            setZone(null);
          }}
        />

        <AssistantPanel dossier={dossier} open={chatOpen} setOpen={setChatOpen} />
      </PageTransition>
    </AppShell>
  );
}

/* ------------------------------- Sous-composants ------------------------------- */

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Ligne({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "border-t pt-1.5 font-semibold" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const chuteColor = (v: number) =>
  v < 10 ? "bg-success/15 text-success" : v < 20 ? "bg-warning/20 text-warm" : "bg-destructive/15 text-destructive";
const chuteTexte = (v: number) =>
  v < 10 ? "text-success" : v < 20 ? "text-warm" : "text-destructive";

function AjustementModal({
  dossier,
  repereId,
  onClose,
  onApply,
}: {
  dossier: Dossier;
  repereId: string | null;
  onClose: () => void;
  onApply: (repereId: string, profileId: string, quantite: number, raison: string) => void;
}) {
  const { config } = useStore();
  const repere = dossier.reperes.find((r) => r.id === repereId);
  const [profileId, setProfileId] = useState("");
  const [quantite, setQuantite] = useState("1");
  const [raison, setRaison] = useState("");

  useEffect(() => {
    if (repere) {
      setProfileId(repere.profileId);
      setQuantite(String(repere.quantite));
      setRaison("");
    }
  }, [repere]);

  if (!repere) return null;

  return (
    <Dialog open={!!repereId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustement manuel — {repere.designation}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Profilé</Label>
            <Select value={profileId} onValueChange={setProfileId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.ref} — {p.serie}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantité</Label>
            <Input value={quantite} onChange={(e) => setQuantite(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Raison de l'ajustement</Label>
            <Textarea value={raison} onChange={(e) => setRaison(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="shine"
            onClick={() => {
              if (!raison.trim()) {
                toast.error("Indiquez la raison de l'ajustement");
                return;
              }
              onApply(repere.id, profileId, Number(quantite) || 1, raison.trim());
            }}
          >
            Recalculer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ZoneModal({
  repereId,
  onClose,
  onValidate,
}: {
  repereId: string | null;
  onClose: () => void;
  onValidate: (repereId: string, justification: string) => void;
}) {
  const [text, setText] = useState("");
  useEffect(() => setText(""), [repereId]);
  if (!repereId) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Valider manuellement ce repère</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Justification (obligatoire)</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex. : dimensions confirmées avec l'atelier, renfort structurel prévu…"
          />
        </div>
        <DialogFooter>
          <Button
            className="shine"
            onClick={() => {
              if (!text.trim()) {
                toast.error("La justification est obligatoire");
                return;
              }
              onValidate(repereId, text.trim());
            }}
          >
            Valider le repère
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const SUGGESTIONS = [
  "Quel est le total matière de ce dossier ?",
  "Y a-t-il une zone d'équilibrage à valider ?",
  "Quel est le taux de chute sur ce dossier ?",
  "Quand ce dossier a-t-il été créé ?",
  "Résume ce dossier en 3 points",
];

export function getAssistantReply(question: string, dossier: Dossier, config: ReturnType<typeof useStore>["config"]) {
  const q = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const totaux = computeTotaux(dossier, config);
  const lignes = computeLignes(dossier, config);
  const zones = lignes.filter((l) => l.zoneEquilibrage);

  if (/(matiere|materiaux|matieres)/.test(q))
    return `Le total matière de ${dossier.ref} est de ${fmt(totaux.matiere)} (aluminium, vitrage et accessoires), pour un Total TTC de ${fmt(totaux.totalTTC)}.`;
  if (/(equilibrage|alerte|bloqu)/.test(q))
    return zones.length
      ? `${zones.length} repère(s) sont en zone d'équilibrage : ${zones.map((z) => z.repere.designation).join(", ")}. ${
          zones.every((z) => z.repere.valideManuellement)
            ? "Tous ont été validés manuellement."
            : "Une validation manuelle est encore requise avant l'étape Validation."
        }`
      : "Aucun repère de ce dossier ne dépasse vos seuils de zone d'équilibrage.";
  if (/(chute|debitage|barre)/.test(q))
    return `Le taux de chute global est de ${fmtNum(totaux.tauxChuteGlobal, 1)} % sur des barres de ${fmtNum(config.longueurBarre)} m.`;
  if (/(cree|creation|date|quand)/.test(q))
    return `Le dossier ${dossier.ref} a été créé le ${dossier.date}, avec une collecte terrain le ${dossier.dateCollecte} par ${dossier.technicien}.`;
  if (/(resume|3 points|synthese)/.test(q)) return dossier.resume.slice(0, 3).join(" ");
  if (/(budget|prix|total|ttc|cout)/.test(q))
    return `Total HT : ${fmt(totaux.totalHT)}, TVA 20 % : ${fmt(totaux.tva)}, Total TTC : ${fmt(totaux.totalTTC)} (marge ${totaux.margeTaux} % — gamme ${dossier.gamme}).`;
  if (/(etape|statut|avancement)/.test(q))
    return `Le dossier est à l'étape « ${ETAPES[dossier.etape].nom} », statut « ${dossier.statut} ».`;
  if (/(main d|heure|mo )/.test(q))
    return `La main d'œuvre estimée représente ${fmt(totaux.mainOeuvre)} au tarif de ${fmt(config.mainOeuvreHeure)} / heure.`;
  if (/(client|contact|adresse|chantier)/.test(q))
    return `Client : ${dossier.client} (${dossier.contact}). Chantier : ${dossier.adresse}.`;

  return `Je peux vous renseigner sur le chiffrage de ${dossier.ref} : total matière, main d'œuvre, taux de chute, zone d'équilibrage, étape en cours ou résumé du dossier.`;
}

function AssistantPanel({
  dossier,
  open,
  setOpen,
}: {
  dossier: Dossier;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { config } = useStore();
  const [messages, setMessages] = useState<{ from: "user" | "ia"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        from: "ia",
        text: `Bonjour, je suis l'assistant du dossier ${dossier.ref}. Posez-moi une question sur son chiffrage.`,
      },
    ]);
  }, [dossier.ref]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const ask = (q: string) => {
    if (!q.trim()) return;
    setMessages((m) => [...m, { from: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(
      () => {
        setTyping(false);
        setMessages((m) => [...m, { from: "ia", text: getAssistantReply(q, dossier, config) }]);
      },
      800 + Math.random() * 400,
    );
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="glow-float shine fixed right-6 bottom-6 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        <Bot className="h-4 w-4" /> Demander à l'assistant IA
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-primary/20 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="glass fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col rounded-none"
            >
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </span>
                <p className="flex-1 text-sm font-semibold">Assistant — {dossier.ref}</p>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="scroll-slim flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${m.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {m.from === "ia" && (
                      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                        <Bot className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <span
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        m.from === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent-soft text-foreground"
                      }`}
                    >
                      {m.text}
                    </span>
                  </motion.div>
                ))}
                {typing && (
                  <p className="text-xs text-muted-foreground">L'assistant écrit…</p>
                )}
                {messages.length <= 1 && (
                  <div className="space-y-2 pt-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => ask(s)}
                        className="block w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors hover:bg-accent-soft"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <div className="flex gap-2 border-t p-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && ask(input)}
                  placeholder="Poser une question…"
                  className="bg-background/70"
                />
                <Button size="icon" className="shine" onClick={() => ask(input)}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
