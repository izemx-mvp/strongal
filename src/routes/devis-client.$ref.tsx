import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DevisDocument } from "@/components/erp/dossier-erp";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LOGO_URL } from "@/lib/data";
import { getCommercial, getDevisInfo, nowStr, uid, type DevisSnapshot, type ModifClient } from "@/lib/erp";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/devis-client/$ref")({
  head: () => ({
    meta: [
      { title: "Votre devis Strongal" },
      { name: "description", content: "Consultez votre devis Strongal, commentez-le et demandez des modifications." },
      { property: "og:title", content: "Votre devis Strongal" },
      { property: "og:description", content: "Espace client : consultation et demande de modification de devis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DevisClient,
});

function DevisClient() {
  const { ref } = Route.useParams();
  const { dossiers, config, updateDossier } = useStore();
  const d = dossiers.find((x) => x.ref === ref);
  const dv = d?.devis.at(-1);
  const base: DevisSnapshot | null = d ? dv?.snapshot ?? { commercial: getCommercial(d, config), info: getDevisInfo(d) } : null;
  const [prop, setProp] = useState<DevisSnapshot | null>(base);
  const [coms, setComs] = useState<Record<string, string>>({});
  const [commentaire, setCommentaire] = useState("");
  const [envoye, setEnvoye] = useState(false);
  useEffect(() => setProp(base), [d?.ref, dv?.version]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!d || !base || !prop) return <div className="p-10 text-center">Devis introuvable.</div>;
  const perm = base.info.champsClient;

  const submit = () => {
    const modifs: ModifClient[] = [];
    prop.commercial.lignes.forEach((l) => {
      const o = base.commercial.lignes.find((x) => x.id === l.id);
      if (o && o.qte !== l.qte) modifs.push({ champ: `Quantité — ${l.designation}`, avant: String(o.qte), apres: String(l.qte) });
    });
    prop.commercial.frais.forEach((f) => {
      const o = base.commercial.frais.find((x) => x.id === f.id);
      if (o && o.description !== f.description) modifs.push({ champ: `${f.libelle} — description`, avant: o.description, apres: f.description });
    });
    const cl = Object.fromEntries(Object.entries(coms).filter(([, v]) => v.trim()));
    if (!modifs.length && !commentaire.trim() && !Object.keys(cl).length) {
      toast.error("Aucune modification ni commentaire");
      return;
    }
    updateDossier(
      d.ref,
      {
        demandesClient: [...(d.demandesClient ?? []), { id: uid(), date: nowStr(), version: dv?.version ?? 0, modifs, commentaire, commentairesLignes: cl, proposition: prop, statut: "En attente" }],
        devis: d.devis.map((x) => (x.version === dv?.version ? { ...x, statut: "Modification demandée" } : x)),
      },
      { auteur: `Client — ${d.client}`, action: "Modification client", label: `Le client a demandé ${modifs.length} modification(s)`, avant: dv?.statut ?? "—", apres: "Modification demandée" },
    );
    setEnvoye(true);
    toast.success("Votre demande a été transmise à Strongal");
  };

  if (envoye)
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="glass max-w-md p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-4 text-xl font-bold">Demande envoyée</h1>
          <p className="mt-2 text-sm text-muted-foreground">L'équipe Strongal étudie vos modifications et reviendra vers vous avec un devis mis à jour.</p>
        </Card>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <div className="flex items-center gap-3">
        <img src={LOGO_URL} alt="Strongal" className="h-10 rounded bg-white p-1" />
        <div>
          <h1 className="text-2xl font-bold">Votre devis</h1>
          <p className="text-sm text-muted-foreground">Bonjour {base.info.client}, vous pouvez consulter ce devis et demander des ajustements.</p>
        </div>
      </div>
      <DevisDocument info={prop.info} c={prop.commercial} version={dv?.version} />
      <Card className="glass space-y-3 p-5">
        <h2 className="font-semibold">Demander des modifications</h2>
        {prop.commercial.lignes.map((l) => (
          <div key={l.id} className="grid items-center gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_100px_1.2fr]">
            <span className="text-sm font-medium">{l.designation}</span>
            <Input
              type="number"
              min={0}
              disabled={!perm.quantites}
              value={l.qte}
              onChange={(e) => setProp({ ...prop, commercial: { ...prop.commercial, lignes: prop.commercial.lignes.map((x) => (x.id === l.id ? { ...x, qte: Number(e.target.value) || 0, venteTotalManuel: undefined } : x)) } })}
            />
            {perm.notes && <Input placeholder="Commentaire sur cette ligne" value={coms[l.designation] ?? ""} onChange={(e) => setComs({ ...coms, [l.designation]: e.target.value })} />}
          </div>
        ))}
        {perm.livraison &&
          prop.commercial.frais.filter((f) => f.type === "livraison").map((f) => (
            <label key={f.id} className="block text-sm">Livraison — précisions (adresse, créneau…)
              <Input value={f.description} onChange={(e) => setProp({ ...prop, commercial: { ...prop.commercial, frais: prop.commercial.frais.map((x) => (x.id === f.id ? { ...x, description: e.target.value } : x)) } })} />
            </label>
          ))}
        {perm.notes && <Textarea placeholder="Commentaire général" value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />}
        <Button className="shine" onClick={submit}><Send className="mr-1 h-4 w-4" /> Envoyer ma version à Strongal</Button>
      </Card>
    </div>
  );
}
