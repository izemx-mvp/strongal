import { Building2, Lightbulb, Phone, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmt } from "@/lib/calc";
import { CONDITIONS_SITE, type ConditionSite, type Dossier } from "@/lib/data";
import { getCommercial, nowStr, uid } from "@/lib/erp";
import { useStore } from "@/lib/store";

/** Contexte chantier : étage, conditions du site, recommandations du savoir-faire, premier appel. */
export function ContexteChantier({ dossier }: { dossier: Dossier }) {
  const { config, updateDossier, utilisateur } = useStore();
  const com = getCommercial(dossier, config);
  const etage = dossier.etage ?? 0;
  const conds = dossier.conditionsSite ?? [];
  const regles = config.reglesSavoirFaire ?? [];
  const recos = regles.filter((r) => r.condition === "general" || conds.includes(r.condition as ConditionSite));
  const pct = config.surchargeEtagePct ?? 0;
  const poseBase = com.frais.filter((f) => f.type === "pose" && !f.id.startsWith("etage")).reduce((s, f) => s + f.montant, 0);
  const majoration = Math.round((poseBase * pct * etage) / 100);

  const appliquerEtage = () => {
    const autres = com.frais.filter((f) => !f.id.startsWith("etage"));
    const frais = etage > 0
      ? [...autres, { id: "etage", type: "pose" as const, libelle: `Majoration pose étage ${etage}`, description: `${pct} % × ${etage} étage(s) sur la pose`, montant: majoration }]
      : autres;
    updateDossier(dossier.ref, { commercial: { ...com, frais } }, { auteur: utilisateur, action: "Frais modifié", label: `Majoration étage ${etage} appliquée`, avant: "—", apres: fmt(majoration) });
    toast.success("Majoration d'étage appliquée au chiffrage");
  };

  const ajouterReco = (id: string) => {
    const r = regles.find((x) => x.id === id);
    if (!r) return;
    updateDossier(
      dossier.ref,
      { commercial: { ...com, lignes: [...com.lignes, { id: uid(), designation: r.titre, description: r.conseil, qte: 1, unite: r.unite || "forfait", achatU: Math.round(r.prixSuggere * 0.7), venteU: r.prixSuggere, achatManuel: true, venteManuel: true, speciale: true }] } },
      { auteur: utilisateur, action: "Ligne ajoutée", label: `Recommandation ajoutée — ${r.titre}`, avant: "—", apres: fmt(r.prixSuggere) },
    );
    toast.success(`« ${r.titre} » ajouté au chiffrage`);
  };

  const toggle = (c: ConditionSite) =>
    updateDossier(dossier.ref, { conditionsSite: conds.includes(c) ? conds.filter((x) => x !== c) : [...conds, c] });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="glass space-y-3 p-5">
        <h3 className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4" /> Chantier</h3>
        <label className="block text-xs">Étage de pose
          <Select value={String(etage)} onValueChange={(v) => updateDossier(dossier.ref, { etage: Number(v) })}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 11 }, (_, i) => <SelectItem key={i} value={String(i)}>{i === 0 ? "Rez-de-chaussée" : `${i}ᵉ étage`}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>
        <p className="text-xs text-muted-foreground">Majoration : {pct} % de la pose par étage → {fmt(majoration)}</p>
        <Button size="sm" variant="outline" onClick={appliquerEtage}>Appliquer au chiffrage</Button>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {CONDITIONS_SITE.map((c) => (
            <button key={c.value} onClick={() => toggle(c.value)} className={`rounded-full border px-2.5 py-1 text-xs ${conds.includes(c.value) ? "border-warm bg-warm/15 font-semibold text-warm" : "text-muted-foreground"}`}>
              {c.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="glass space-y-2 p-5">
        <h3 className="flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4 text-warm" /> Recommandations (savoir-faire)</h3>
        {recos.length === 0 && <p className="text-xs text-muted-foreground">Cochez les conditions du site pour obtenir des recommandations.</p>}
        {recos.map((r) => (
          <div key={r.id} className="rounded-lg border p-2 text-xs">
            <p className="font-semibold">{r.titre}</p>
            <p className="text-muted-foreground">{r.conseil}</p>
            {r.prixSuggere > 0 && (
              <Button size="sm" variant="ghost" className="mt-1 h-7 px-2 text-xs" onClick={() => ajouterReco(r.id)}>
                <Plus className="mr-1 h-3 w-3" /> Ajouter ({fmt(r.prixSuggere)} / {r.unite})
              </Button>
            )}
          </div>
        ))}
      </Card>

      <Card className="glass space-y-3 p-5">
        <h3 className="flex items-center gap-2 font-semibold"><Phone className="h-4 w-4" /> Premier appel client</h3>
        <label className="block text-xs">Téléphone / WhatsApp
          <Input className="h-8" placeholder="06 00 00 00 00" value={dossier.telephone ?? ""} onChange={(e) => updateDossier(dossier.ref, { telephone: e.target.value })} />
        </label>
        <Input className="h-8" placeholder="Note d'appel" value={dossier.premierAppel?.note ?? ""} onChange={(e) => updateDossier(dossier.ref, { premierAppel: { fait: !!dossier.premierAppel?.fait, date: dossier.premierAppel?.date, note: e.target.value } })} />
        {dossier.premierAppel?.fait ? (
          <p className="text-xs font-semibold text-success">Appel effectué le {dossier.premierAppel.date}</p>
        ) : (
          <Button size="sm" onClick={() => updateDossier(dossier.ref, { premierAppel: { ...dossier.premierAppel, fait: true, date: nowStr() } }, { auteur: utilisateur, action: "Appel client", label: "Premier appel client effectué" })}>
            Marquer l'appel comme fait
          </Button>
        )}
        {dossier.telephone && <a className="block text-xs text-warm underline" href={`tel:${dossier.telephone}`}>Appeler maintenant</a>}
      </Card>
    </div>
  );
}
