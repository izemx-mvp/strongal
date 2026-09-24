import { motion } from "framer-motion";
import { CheckCircle2, Circle, CircleDot, HardHat, Paperclip, Play, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ManuelBadge } from "@/components/erp/commercial-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import type { Dossier } from "@/lib/data";
import {
  avancementGlobal,
  EQUIPE,
  getSuivi,
  nomPhase,
  nowStr,
  phaseCourante,
  PHASES,
  type EtatPhase,
  type Phase,
  lienWhatsApp,
  MESSAGES_AVANCEMENT,
} from "@/lib/erp";
import { useStore } from "@/lib/store";

const ETATS: EtatPhase[] = ["À venir", "En cours", "Terminée", "Bloquée"];

export function EtatIcon({ etat, className = "h-5 w-5" }: { etat: EtatPhase; className?: string }) {
  if (etat === "Terminée") return <CheckCircle2 className={`${className} text-success`} />;
  if (etat === "En cours") return <CircleDot className={`${className} text-warm`} />;
  if (etat === "Bloquée") return <TriangleAlert className={`${className} text-destructive`} />;
  return <Circle className={`${className} text-muted-foreground`} />;
}

/** Carte compacte « où en est réellement le projet sur le terrain ». */
export function SuiviResume({ dossier }: { dossier: Dossier }) {
  const s = getSuivi(dossier);
  const cur = phaseCourante(s);
  return (
    <p className="flex items-center gap-2 text-sm font-semibold">
      <EtatIcon etat={cur.etat} className="h-4 w-4" /> {nomPhase(cur.id)} — {cur.progression} %
      <span className="text-xs font-normal text-muted-foreground">({cur.statut})</span>
    </p>
  );
}

export function SuiviChantier({ dossier, phaseId, compact }: { dossier: Dossier; phaseId?: string; compact?: boolean }) {
  const { updateDossier, utilisateur } = useStore();
  const suivi = getSuivi(dossier);
  const sel = phaseId ?? phaseCourante(suivi).id;
  const cur = suivi.phases.find((p) => p.id === sel)!;
  const phase = suivi.phases.find((p) => p.id === sel)!;
  const def = PHASES.find((p) => p.id === sel)!;
  const [draft, setDraft] = useState<Phase>(phase);
  const [note, setNote] = useState("");


  const save = (next: Phase, forceLabel?: string) => {
    const avant = phase;
    const labels: string[] = [];
    if (forceLabel) labels.push(forceLabel);
    else {
      if (avant.etat !== next.etat) labels.push(`${def.nom} : ${avant.etat} → ${next.etat}`);
      if (avant.statut !== next.statut) labels.push(`${def.nom} : statut « ${next.statut} »`);
      if (avant.progression !== next.progression) labels.push(`${def.nom} : ${next.progression} %`);
      if (avant.responsable !== next.responsable) labels.push(`${def.nom} : responsable ${next.responsable}`);
      if (avant.dateFinPrevue !== next.dateFinPrevue) labels.push(`${def.nom} : fin prévue ${next.dateFinPrevue}`);
      if (JSON.stringify(avant.points) !== JSON.stringify(next.points)) labels.push(`${def.nom} : points de contrôle mis à jour`);
      if (avant.documents.length !== next.documents.length) labels.push(`${def.nom} : document ajouté`);
    }
    if (note.trim()) labels.push(`${def.nom} : ${note.trim()}`);
    if (!labels.length) {
      toast.info("Aucune modification");
      return;
    }
    const auteur = next.responsable || utilisateur;
    const n = { ...next, dateMaj: nowStr(), commentaire: note.trim() || next.commentaire };
    updateDossier(
      dossier.ref,
      {
        suivi: {
          phases: suivi.phases.map((p) => (p.id === sel ? n : p)),
          historique: [...suivi.historique, ...labels.map((label) => ({ date: nowStr(), phaseId: sel, auteur, label }))],
        },
      },
      labels.map((label) => ({
        auteur,
        action: "Suivi chantier",
        label,
        avant: `${avant.etat} · ${avant.progression} %`,
        apres: `${n.etat} · ${n.progression} %`,
      })),
    );
    setDraft(n);
    setNote("");
    toast.success("Avancement terrain enregistré");
  };

  const demarrer = () =>
    save(
      { ...draft, etat: "En cours", statut: def.statuts[Math.min(2, def.statuts.length - 1)] ?? def.statuts[0], progression: Math.max(draft.progression, 5), dateDebut: draft.dateDebut || nowStr().slice(0, 10), responsable: draft.responsable || "Mohamed" },
      `${def.nom} démarrée`,
    );
  const terminer = () =>
    save(
      { ...draft, etat: "Terminée", statut: def.statuts.at(-1)!, progression: 100, points: Object.fromEntries(def.points.map((p) => [p, true])) },
      `${def.nom} terminée`,
    );

  return (
    <div className="space-y-4">
      <Card className="glass overflow-hidden border-l-4 border-l-warm p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-warm/5 p-5">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-warm uppercase">
              <HardHat className="h-4 w-4" /> Suivi chantier — avancement réel sur le terrain
            </p>
            <p className="mt-1 text-2xl font-bold">
              {nomPhase(cur.id)} — {cur.progression} %
            </p>
            <p className="text-sm text-muted-foreground">
              {cur.statut} · Dernière mise à jour : {cur.dateMaj || "—"} · Responsable : {cur.responsable || "non affecté"}
              {cur.dateFinPrevue && ` · Fin prévue : ${cur.dateFinPrevue}`}
            </p>
          </div>
          <div className="w-48">
            <p className="mb-1 text-right text-xs text-muted-foreground">Avancement global chantier</p>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div className="h-full bg-gradient-to-r from-primary to-warm" initial={{ width: 0 }} animate={{ width: `${avancementGlobal(suivi)}%` }} />
            </div>
            <p className="mt-1 text-right text-sm font-semibold">{Math.round(avancementGlobal(suivi))} %</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="glass space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">{def.nom}</h3>
            <div className="flex gap-2">
              {draft.etat === "À venir" && (
                <Button size="sm" onClick={demarrer}><Play className="mr-1 h-4 w-4" /> Démarrer la phase</Button>
              )}
              {draft.etat !== "Terminée" && (
                <Button size="sm" variant="outline" onClick={terminer}><CheckCircle2 className="mr-1 h-4 w-4" /> Marquer terminée</Button>
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs">État
              <Select value={draft.etat} onValueChange={(v) => setDraft({ ...draft, etat: v as EtatPhase })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ETATS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="text-xs">Statut terrain
              <Select value={draft.statut} onValueChange={(v) => setDraft({ ...draft, statut: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{def.statuts.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="text-xs">Responsable
              <Select value={draft.responsable || undefined} onValueChange={(v) => setDraft({ ...draft, responsable: v })}>
                <SelectTrigger><SelectValue placeholder="Affecter…" /></SelectTrigger>
                <SelectContent>{EQUIPE.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">Début
                <Input type="date" value={draft.dateDebut} onChange={(e) => setDraft({ ...draft, dateDebut: e.target.value })} />
              </label>
              <label className="text-xs">Fin prévue
                <Input type="date" value={draft.dateFinPrevue} onChange={(e) => setDraft({ ...draft, dateFinPrevue: e.target.value })} />
              </label>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs">Avancement : <b>{draft.progression} %</b></p>
            <Slider value={[draft.progression]} max={100} step={5} onValueChange={([v]) => setDraft({ ...draft, progression: v })} />
          </div>
          {def.points.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {def.points.map((pt) => (
                <label key={pt} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <Checkbox checked={!!draft.points[pt]} onCheckedChange={(c) => setDraft({ ...draft, points: { ...draft.points, [pt]: !!c } })} />
                  {pt}
                </label>
              ))}
            </div>
          )}
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Commentaire terrain (ex. 40 % des châssis assemblés, vitrage attendu jeudi)" />
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent-soft">
              <Paperclip className="h-4 w-4" /> Photos / documents
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const noms = [...(e.target.files ?? [])].map((f) => f.name);
                  if (noms.length) setDraft({ ...draft, documents: [...draft.documents, ...noms] });
                }}
              />
            </label>
            {draft.documents.map((d) => <span key={d} className="rounded-full bg-accent-soft px-2 py-1 text-xs">{d}</span>)}
            <div className="flex-1" />
            <Button className="shine" onClick={() => save(draft)}>Enregistrer la mise à jour</Button>
          </div>
        </Card>

        <Card className="glass p-5">
          <h3 className="mb-3 font-semibold">Journal terrain</h3>
          <div className="scroll-slim max-h-[480px] space-y-3 overflow-y-auto pr-1">
            {suivi.historique.length === 0 && <p className="text-sm text-muted-foreground">Aucune mise à jour terrain pour l'instant.</p>}
            {[...suivi.historique].reverse().map((h, i) => (
              <div key={i} className="border-l-2 border-warm/50 pl-3">
                <p className="text-sm">{h.label}</p>
                <p className="text-xs text-muted-foreground">{h.date} · {h.auteur} <ManuelBadge>{nomPhase(h.phaseId)}</ManuelBadge></p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {!compact && <InformerClient dossier={dossier} />}
    </div>
  );
}

/** Messages d'avancement pré-remplis, envoyés manuellement au client via WhatsApp. */
function InformerClient({ dossier }: { dossier: Dossier }) {
  const { updateDossier, utilisateur } = useStore();
  const [msg, setMsg] = useState(MESSAGES_AVANCEMENT[0].replace("{client}", dossier.client));
  return (
    <Card className="glass space-y-2 p-3">
      <p className="text-sm font-semibold">Informer le client de l'avancement (WhatsApp)</p>
      <div className="flex flex-wrap gap-1.5">
        {MESSAGES_AVANCEMENT.map((m, i) => (
          <button key={i} className="rounded-full border px-2.5 py-1 text-xs hover:bg-accent" onClick={() => setMsg(m.replace("{client}", dossier.client))}>
            {["Commande passée", "Production", "Livrée", "Pose niveau 1", "Pose niveau 2", "Terminé"][i]}
          </button>
        ))}
      </div>
      <Textarea rows={2} value={msg} onChange={(e) => setMsg(e.target.value)} />
      <Button
        size="sm"
        disabled={!msg.trim()}
        onClick={() => {
          window.open(lienWhatsApp(dossier.telephone, msg), "_blank");
          updateDossier(dossier.ref, {}, { auteur: utilisateur, action: "Message client", label: `WhatsApp avancement : ${msg.slice(0, 60)}…` });
          toast.success("WhatsApp ouvert — envoyez le message depuis WhatsApp");
        }}
      >
        Ouvrir dans WhatsApp
      </Button>
      {!dossier.telephone && <p className="text-xs text-muted-foreground">Ajoutez le numéro du client dans l'étape Chiffrage (Premier appel).</p>}
    </Card>
  );
}
