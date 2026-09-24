import { Link } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { fmt } from "@/lib/calc";
import type { Dossier } from "@/lib/data";
import {
  fmtDate,
  getDevisInfo,
  lienWhatsApp,
  nowStr,
  planRelances,
  remplirTemplate,
  totalDossier,
  type RelanceEnvoyee,
  type RelancePlanifiee,
} from "@/lib/erp";
import { useStore } from "@/lib/store";

export const relanceColors: Record<RelancePlanifiee["statut"], string> = {
  Planifiée: "bg-accent-soft text-foreground",
  Due: "bg-warm/20 text-warm",
  Envoyée: "bg-success/15 text-success",
  Ignorée: "bg-muted text-muted-foreground",
};

export function RelanceBadge({ statut }: { statut: RelancePlanifiee["statut"] }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${relanceColors[statut]}`}>{statut}</span>;
}

/** Ouverture d'une relance : l'utilisateur rédige puis clique ENVOYER. Jamais d'envoi automatique. */
export function RelanceDialog({
  dossier,
  relance,
  onClose,
}: {
  dossier: Dossier;
  relance: RelancePlanifiee | null;
  onClose: () => void;
}) {
  const { templates, updateDossier, utilisateur, config } = useStore();
  const [tpl, setTpl] = useState(templates[0]?.id ?? "");
  const [canal, setCanal] = useState<RelanceEnvoyee["canal"]>("WhatsApp");
  const [msg, setMsg] = useState("");

  const vars = {
    client_name: dossier.client,
    devis_number: `${getDevisInfo(dossier).numero} v${dossier.devis.at(-1)?.version ?? 1}`,
    montant_ttc: fmt(totalDossier(dossier, config).totalTTC),
    user_name: utilisateur,
    dossier_ref: dossier.ref,
  };

  useEffect(() => {
    if (!relance) return;
    const t = templates.find((x) => x.id === tpl) ?? templates[0];
    setMsg(t ? remplirTemplate(t.contenu, vars) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relance, tpl]);

  if (!relance) return null;
  const record = (statut: RelanceEnvoyee["statut"]) => {
    const r: RelanceEnvoyee = {
      numero: relance.numero,
      dateDue: fmtDate(relance.dateDue),
      dateEnvoi: nowStr(),
      auteur: utilisateur,
      canal,
      message: msg,
      statut,
    };
    updateDossier(
      dossier.ref,
      { relances: [...(dossier.relances ?? []).filter((x) => x.numero !== relance.numero), r] },
      { auteur: utilisateur, action: statut === "Envoyée" ? "Relance envoyée" : "Relance ignorée", label: `Relance n°${relance.numero} ${statut === "Envoyée" ? `envoyée par ${canal}` : "ignorée"}`, avant: "Due", apres: statut },
    );
    toast.success(statut === "Envoyée" ? `Relance n°${relance.numero} envoyée` : "Relance ignorée");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Relance n°{relance.numero} — {dossier.client}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Échéance : {fmtDate(relance.dateDue)}. Rien n'est envoyé automatiquement : vérifiez et modifiez le message avant de cliquer sur Envoyer.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Select value={tpl} onValueChange={setTpl}>
            <SelectTrigger><SelectValue placeholder="Modèle" /></SelectTrigger>
            <SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.nom}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={canal} onValueChange={(v) => setCanal(v as RelanceEnvoyee["canal"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["WhatsApp", "Téléphone", "Email"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Textarea rows={10} value={msg} onChange={(e) => setMsg(e.target.value)} />
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => record("Ignorée")}>Ignorer cette relance</Button>
          {canal === "WhatsApp" && (
            <Button variant="outline" disabled={!msg.trim()} onClick={() => window.open(lienWhatsApp(dossier.telephone, msg), "_blank")}>
              Ouvrir dans WhatsApp
            </Button>
          )}
          <Button className="shine" disabled={!msg.trim()} onClick={() => record("Envoyée")}>
            <Send className="mr-1 h-4 w-4" /> ENVOYER
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RelancesDossier({ dossier }: { dossier: Dossier }) {
  const { relanceConfig } = useStore();
  const plan = planRelances(dossier, relanceConfig);
  const [open, setOpen] = useState<RelancePlanifiee | null>(null);
  return (
    <Card className="glass p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Relances commerciales</h3>
          <p className="text-xs text-muted-foreground">
            Planifiées à partir de l'envoi du devis · max {relanceConfig.max} · envoi toujours manuel.{" "}
            <Link to="/relances" className="text-warm underline">Paramétrer</Link>
          </p>
        </div>
      </div>
      {plan.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {dossier.devis.length === 0 ? "Aucun devis envoyé : pas de relance planifiée." : "Devis clôturé (accepté ou refusé) : relances arrêtées."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Date due</TableHead>
              <TableHead>Envoyée le</TableHead>
              <TableHead>Par</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plan.map((r) => (
              <TableRow key={r.numero}>
                <TableCell className="font-semibold">{r.numero}</TableCell>
                <TableCell>{fmtDate(r.dateDue)}</TableCell>
                <TableCell>{r.envoi?.dateEnvoi ?? "—"}{r.envoi && ` · ${r.envoi.canal}`}</TableCell>
                <TableCell>{r.envoi?.auteur ?? "—"}</TableCell>
                <TableCell><RelanceBadge statut={r.statut} /></TableCell>
                <TableCell className="text-right">
                  {!r.envoi ? (
                    <Button size="sm" variant={r.statut === "Due" ? "default" : "outline"} onClick={() => setOpen(r)}>Ouvrir</Button>
                  ) : (
                    <span title={r.envoi.message} className="cursor-help text-xs text-muted-foreground underline">message</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <RelanceDialog dossier={dossier} relance={open} onClose={() => setOpen(null)} />
    </Card>
  );
}
