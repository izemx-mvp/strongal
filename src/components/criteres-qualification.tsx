import { Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";

const TYPES_PROJETS = [
  "Résidentiel standard",
  "Villa haut de gamme",
  "Commercial",
  "Promotion immobilière",
];
const INFOS_REQUISES = [
  "Dimensions approximatives connues",
  "Budget évoqué",
  "Zone confirmée",
  "Délai du projet connu",
];

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value.replace(",", ".")) || 0)}
        className="bg-background/70"
      />
    </div>
  );
}

export function CriteresQualification() {
  const { config, setConfig } = useStore();
  const [zoneInput, setZoneInput] = useState("");
  const q = config.qualification;
  const setQ = (patch: Partial<typeof q>) =>
    setConfig((c) => ({ ...c, qualification: { ...c.qualification, ...patch } }));

  return (
    <div className="space-y-4">
      <Card className="glass glass-hover space-y-5 p-5">
        <p className="text-sm text-muted-foreground">
          Ces critères sont utilisés par l'agent IA conversationnel (WhatsApp / email) qui échange
          avec le prospect avant son arrivée dans ce backoffice, pour décider s'il le transmet comme
          « Qualifié » ou « Non qualifié ».
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <NumField
            label="Budget minimum accepté (MAD)"
            value={q.budgetMin}
            onChange={(v) => setQ({ budgetMin: v })}
          />
          <NumField
            label="Délai de réponse cible (heures)"
            value={q.delaiReponse}
            onChange={(v) => setQ({ delaiReponse: v })}
          />
          <NumField
            label="Score de qualification minimum (%)"
            value={q.scoreMin}
            onChange={(v) => setQ({ scoreMin: v })}
          />
        </div>

        <div className="space-y-2">
          <Label>Zones géographiques couvertes</Label>
          <div className="flex flex-wrap gap-2">
            {q.zones.map((z) => (
              <span
                key={z}
                className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-sm"
              >
                {z}
                <button
                  aria-label={`Retirer ${z}`}
                  onClick={() => {
                    setQ({ zones: q.zones.filter((x) => x !== z) });
                    toast.success(`Zone « ${z} » retirée`);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={zoneInput}
              onChange={(e) => setZoneInput(e.target.value)}
              placeholder="Ajouter une zone…"
              className="max-w-xs"
            />
            <Button
              variant="outline"
              onClick={() => {
                if (!zoneInput.trim()) {
                  toast.error("Saisissez une zone");
                  return;
                }
                setQ({ zones: [...q.zones, zoneInput.trim()] });
                setZoneInput("");
                toast.success("Zone ajoutée");
              }}
            >
              Ajouter
            </Button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Types de projets acceptés</Label>
            {TYPES_PROJETS.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={q.typesProjets.includes(t)}
                  onCheckedChange={(c) =>
                    setQ({
                      typesProjets: c
                        ? [...q.typesProjets, t]
                        : q.typesProjets.filter((x) => x !== t),
                    })
                  }
                />
                {t}
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Informations minimales requises</Label>
            {INFOS_REQUISES.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={q.infosRequises.includes(t)}
                  onCheckedChange={(c) =>
                    setQ({
                      infosRequises: c
                        ? [...q.infosRequises, t]
                        : q.infosRequises.filter((x) => x !== t),
                    })
                  }
                />
                {t}
              </label>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          className="shine"
          size="lg"
          onClick={() => toast.success("Critères de qualification enregistrés")}
        >
          <Save className="mr-1 h-4 w-4" /> Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}
