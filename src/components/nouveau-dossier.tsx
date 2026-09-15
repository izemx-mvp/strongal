import { Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CHECKLIST_ITEMS, type Dossier } from "@/lib/data";
import { nowStr, useStore } from "@/lib/store";

export const TYPES_DOSSIER = ["Résidentiel", "Villa", "Commercial", "Promotion"] as const;
export const GAMMES_DOSSIER = ["Standard", "Haut de gamme"] as const;
const TECHNICIENS = [
  "Non assigné",
  "Youssef El Amrani",
  "Hicham Ouazzani",
  "Nabil Fassi",
  "Rachid Berrada",
];

export type DossierPrefill = {
  client?: string;
  contact?: string;
  typeProjet?: Dossier["typeProjet"];
  gamme?: Dossier["gamme"];
  adresse?: string;
  origine?: string;
};

type RepereDraft = {
  designation: string;
  produitId: string;
  ouvrageId: string;
  profileId: string;
  vitrageId: string;
  largeur: string;
  hauteur: string;
  quantite: string;
  contraintes: string;
};

export function NouveauDossierDialog({
  prefill,
  trigger,
  onCreated,
}: {
  prefill?: DossierPrefill;
  trigger: ReactNode;
  onCreated?: (ref: string) => void;
}) {
  const { config, setDossiers, dossiers } = useStore();
  const [open, setOpen] = useState(false);

  const premierProduit = config.produits[0];

  const emptyRepere = (): RepereDraft => ({
    designation: "",
    produitId: premierProduit?.id ?? "",
    ouvrageId: premierProduit?.ouvrageId ?? config.ouvrages[0]?.id ?? "",
    profileId: premierProduit?.profileId ?? config.profiles[0]?.id ?? "",
    vitrageId:
      premierProduit?.vitrageId ?? config.vitrages[1]?.id ?? config.vitrages[0]?.id ?? "",
    largeur: "2.40",
    hauteur: "2.20",
    quantite: "1",
    contraintes: "",
  });

  const [client, setClient] = useState(prefill?.client ?? "");
  const [contact, setContact] = useState(prefill?.contact ?? "");
  const [typeProjet, setTypeProjet] = useState<Dossier["typeProjet"]>(
    prefill?.typeProjet ?? "Résidentiel",
  );
  const [gamme, setGamme] = useState<Dossier["gamme"]>(prefill?.gamme ?? "Standard");
  const [adresse, setAdresse] = useState(prefill?.adresse ?? "");
  const [technicien, setTechnicien] = useState(TECHNICIENS[0]);
  const [dateCollecte, setDateCollecte] = useState("");
  const [notes, setNotes] = useState("");
  const [reperes, setReperes] = useState<RepereDraft[]>([emptyRepere()]);

  const reset = () => {
    setClient(prefill?.client ?? "");
    setContact(prefill?.contact ?? "");
    setTypeProjet(prefill?.typeProjet ?? "Résidentiel");
    setGamme(prefill?.gamme ?? "Standard");
    setAdresse(prefill?.adresse ?? "");
    setTechnicien(TECHNICIENS[0]);
    setDateCollecte("");
    setNotes("");
    setReperes([emptyRepere()]);
  };

  const submit = () => {
    if (!client.trim()) {
      toast.error("Renseignez le nom du client");
      return;
    }
    if (!contact.trim()) {
      toast.error("Renseignez le téléphone ou l'email du contact");
      return;
    }
    if (!adresse.trim()) {
      toast.error("Renseignez l'adresse du chantier");
      return;
    }
    const valides = reperes.filter((r) => r.designation.trim());
    if (valides.length === 0) {
      toast.error("Ajoutez au moins un repère avec une désignation");
      return;
    }

    const nums = dossiers
      .map((d) => Number(d.ref.split("-").at(-1)))
      .filter((n) => Number.isFinite(n)) as number[];
    const ref = `STR-2026-${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`;

    const dossier: Dossier = {
      ref,
      client: client.trim(),
      contact: contact.trim(),
      typeProjet,
      gamme,
      adresse: adresse.trim(),
      technicien,
      dateCollecte: dateCollecte || "À planifier",
      date: nowStr().slice(0, 10),
      statut: "Nouveau",
      etape: 0,
      reperes: valides.map((r, j) => ({
        id: `${ref}-R${j + 1}`,
        designation: r.designation.trim(),
        largeur: Number(r.largeur.replace(",", ".")) || 1,
        hauteur: Number(r.hauteur.replace(",", ".")) || 1,
        quantite: Number(r.quantite) || 1,
        ouvrageId: r.ouvrageId,
        profileId: r.profileId,
        vitrageId: r.vitrageId,
        contraintes: r.contraintes
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      })),
      notes: notes.trim(),
      checklist: Object.fromEntries(CHECKLIST_ITEMS.map((c) => [c, false])),
      devis: [],
      historique: [
        {
          date: nowStr(),
          auteur: "M. Aboulssaad",
          label: prefill?.origine
            ? `Dossier créé depuis ${prefill.origine}`
            : "Dossier créé manuellement",
        },
      ],
      resume: [
        `${valides.length} repère(s) saisis à la création, gamme ${gamme}.`,
        `Chantier : ${adresse.trim()}.`,
        dateCollecte
          ? `Collecte terrain planifiée le ${dateCollecte} avec ${technicien}.`
          : "Collecte terrain à planifier.",
      ],
      isNew: true,
    };

    setDossiers((prev) => [dossier, ...prev]);
    toast.success(`Dossier ${ref} créé pour ${client.trim()}`);
    setOpen(false);
    reset();
    onCreated?.(ref);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nouveau dossier</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nom du client *</Label>
              <Input
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Ex. : M. Karim Benjelloun"
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone ou email du contact *</Label>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Ex. : +212 661-234567"
              />
            </div>
            <div className="space-y-2">
              <Label>Type de projet</Label>
              <Select value={typeProjet} onValueChange={(v) => setTypeProjet(v as Dossier["typeProjet"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_DOSSIER.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gamme</Label>
              <Select value={gamme} onValueChange={(v) => setGamme(v as Dossier["gamme"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GAMMES_DOSSIER.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Adresse du chantier *</Label>
              <Input
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Ex. : Résidence Al Andalous, Anfa, Casablanca"
              />
            </div>
            <div className="space-y-2">
              <Label>Technicien en charge de la collecte</Label>
              <Select value={technicien} onValueChange={setTechnicien}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TECHNICIENS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date de collecte terrain</Label>
              <Input
                type="date"
                value={dateCollecte}
                onChange={(e) => setDateCollecte(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Repères à chiffrer *</Label>
            {reperes.map((r, i) => (
              <div key={i} className="space-y-3 rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Désignation (ex. : Baie coulissante salon 3 vantaux)"
                    value={r.designation}
                    onChange={(e) =>
                      setReperes((p) =>
                        p.map((x, j) => (j === i ? { ...x, designation: e.target.value } : x)),
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Supprimer ce repère"
                    onClick={() => setReperes((p) => p.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type d'ouvrage</Label>
                    <Select
                      value={r.ouvrageId}
                      onValueChange={(v) =>
                        setReperes((p) => p.map((x, j) => (j === i ? { ...x, ouvrageId: v } : x)))
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {config.ouvrages.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Profilé</Label>
                    <Select
                      value={r.profileId}
                      onValueChange={(v) =>
                        setReperes((p) => p.map((x, j) => (j === i ? { ...x, profileId: v } : x)))
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {config.profiles.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.ref} — {o.serie}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vitrage</Label>
                    <Select
                      value={r.vitrageId}
                      onValueChange={(v) =>
                        setReperes((p) => p.map((x, j) => (j === i ? { ...x, vitrageId: v } : x)))
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {config.vitrages.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.type} {o.epaisseur}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Largeur (m)</Label>
                    <Input
                      className="h-9"
                      value={r.largeur}
                      onChange={(e) =>
                        setReperes((p) => p.map((x, j) => (j === i ? { ...x, largeur: e.target.value } : x)))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Hauteur (m)</Label>
                    <Input
                      className="h-9"
                      value={r.hauteur}
                      onChange={(e) =>
                        setReperes((p) => p.map((x, j) => (j === i ? { ...x, hauteur: e.target.value } : x)))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quantité</Label>
                    <Input
                      className="h-9"
                      value={r.quantite}
                      onChange={(e) =>
                        setReperes((p) => p.map((x, j) => (j === i ? { ...x, quantite: e.target.value } : x)))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Contraintes (séparées par des virgules)</Label>
                    <Input
                      className="h-9"
                      placeholder="Ex. : exposition mer, seuil PMR"
                      value={r.contraintes}
                      onChange={(e) =>
                        setReperes((p) =>
                          p.map((x, j) => (j === i ? { ...x, contraintes: e.target.value } : x)),
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setReperes((p) => [...p, emptyRepere()])}>
              <Plus className="mr-1 h-4 w-4" /> Ajouter un repère
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Notes internes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contexte client, contraintes de chantier, délais annoncés…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={submit} className="shine">
            Créer le dossier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
