import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/motion-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Config } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/configuration")({
  head: () => ({
    meta: [
      { title: "Configuration — Strongal Control" },
      {
        name: "description",
        content:
          "Catalogue de profilés, vitrages, accessoires, barème de coûts, marges et critères de qualification IA.",
      },
      { property: "og:title", content: "Configuration — Strongal Control" },
      {
        property: "og:description",
        content: "Catalogues, barèmes, marges et critères de qualification de l'agent IA.",
      },
    ],
  }),
  component: ConfigurationPage,
});

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

function ConfigurationPage() {
  const { config, setConfig } = useStore();
  const [zoneInput, setZoneInput] = useState("");

  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const num = (v: string) => Number(v.replace(",", ".")) || 0;

  const save = (label: string) => {
    setConfig((c) => ({ ...c, validated: true }));
    toast.success(`${label} enregistrée — la configuration est active`);
  };

  return (
    <AppShell>
      <PageTransition>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Configuration</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Catalogues, barèmes et critères utilisés par les agents IA de chiffrage et de
              qualification.
            </p>
          </div>
          {config.validated ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1.5 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" /> Configuration active
            </span>
          ) : (
            <span className="rounded-full bg-warm/15 px-3 py-1.5 text-sm font-semibold text-warm">
              Configuration non validée
            </span>
          )}
        </div>

        <Tabs defaultValue="chiffrage">
          <TabsList>
            <TabsTrigger value="chiffrage">Chiffrage</TabsTrigger>
            <TabsTrigger value="qualification">Critères de qualification (agent IA)</TabsTrigger>
          </TabsList>

          <TabsContent value="chiffrage" className="mt-4 space-y-4">
            {/* Profilés */}
            <Card className="glass glass-hover overflow-hidden p-5">
              <h2 className="mb-3 text-lg font-semibold">Catalogue de profilés aluminium</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {["Référence", "Série / fournisseur", "Famille", "Finition", "Ratio /ml", "Délai (j)", "MOQ (ml)", "Prix barre", ""].map(
                        (h) => (
                          <TableHead key={h}>{h}</TableHead>
                        ),
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {config.profiles.map((p, i) => (
                      <TableRow key={p.id}>
                        {(["ref", "serie", "famille", "finition"] as const).map((f) => (
                          <TableCell key={f}>
                            <Input
                              className="h-8 min-w-32"
                              value={p[f]}
                              onChange={(e) =>
                                set(
                                  "profiles",
                                  config.profiles.map((x, j) =>
                                    j === i ? { ...x, [f]: e.target.value } : x,
                                  ),
                                )
                              }
                            />
                          </TableCell>
                        ))}
                        {(["ratio", "delai", "moq", "prixBarre"] as const).map((f) => (
                          <TableCell key={f}>
                            <Input
                              className="h-8 w-24"
                              value={String(p[f])}
                              onChange={(e) =>
                                set(
                                  "profiles",
                                  config.profiles.map((x, j) =>
                                    j === i ? { ...x, [f]: num(e.target.value) } : x,
                                  ),
                                )
                              }
                            />
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              set(
                                "profiles",
                                config.profiles.filter((_, j) => j !== i),
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  set("profiles", [
                    ...config.profiles,
                    {
                      id: `p${Date.now()}`,
                      ref: "STR-NEW",
                      serie: "",
                      famille: "",
                      finition: "",
                      ratio: 1.1,
                      delai: 21,
                      moq: 50,
                      prixBarre: 900,
                    },
                  ]);
                  toast.success("Profilé ajouté au catalogue");
                }}
              >
                <Plus className="mr-1 h-4 w-4" /> Ajouter un profilé
              </Button>
            </Card>

            {/* Vitrages */}
            <Card className="glass glass-hover p-5">
              <h2 className="mb-3 text-lg font-semibold">Catalogue de vitrages</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Type", "Épaisseur", "Performance", "Prix /m²", ""].map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.vitrages.map((v, i) => (
                    <TableRow key={v.id}>
                      {(["type", "epaisseur"] as const).map((f) => (
                        <TableCell key={f}>
                          <Input
                            className="h-8"
                            value={v[f]}
                            onChange={(e) =>
                              set(
                                "vitrages",
                                config.vitrages.map((x, j) =>
                                  j === i ? { ...x, [f]: e.target.value } : x,
                                ),
                              )
                            }
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium">
                          {v.perf}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 w-24"
                          value={String(v.prixM2)}
                          onChange={(e) =>
                            set(
                              "vitrages",
                              config.vitrages.map((x, j) =>
                                j === i ? { ...x, prixM2: num(e.target.value) } : x,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => set("vitrages", config.vitrages.filter((_, j) => j !== i))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  set("vitrages", [
                    ...config.vitrages,
                    { id: `v${Date.now()}`, type: "Nouveau vitrage", epaisseur: "4/16/4", perf: "—", prixM2: 400 },
                  ]);
                  toast.success("Vitrage ajouté");
                }}
              >
                <Plus className="mr-1 h-4 w-4" /> Ajouter un vitrage
              </Button>
            </Card>

            {/* Accessoires */}
            <Card className="glass glass-hover p-5">
              <h2 className="mb-3 text-lg font-semibold">Catalogue d'accessoires</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Accessoire", "Unité", "Coût unitaire", "Qté standard / ouvrage", ""].map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.accessoires.map((a, i) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Input
                          className="h-8"
                          value={a.nom}
                          onChange={(e) =>
                            set(
                              "accessoires",
                              config.accessoires.map((x, j) =>
                                j === i ? { ...x, nom: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{a.unite}</TableCell>
                      {(["coutUnitaire", "qteStandard"] as const).map((f) => (
                        <TableCell key={f}>
                          <Input
                            className="h-8 w-24"
                            value={String(a[f])}
                            onChange={(e) =>
                              set(
                                "accessoires",
                                config.accessoires.map((x, j) =>
                                  j === i ? { ...x, [f]: num(e.target.value) } : x,
                                ),
                              )
                            }
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            set("accessoires", config.accessoires.filter((_, j) => j !== i))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  set("accessoires", [
                    ...config.accessoires,
                    { id: `a${Date.now()}`, nom: "Nouvel accessoire", unite: "u", coutUnitaire: 100, qteStandard: 1 },
                  ]);
                  toast.success("Accessoire ajouté");
                }}
              >
                <Plus className="mr-1 h-4 w-4" /> Ajouter un accessoire
              </Button>
            </Card>

            {/* Ouvrages */}
            <Card className="glass glass-hover p-5">
              <h2 className="mb-3 text-lg font-semibold">Types d'ouvrages de référence</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Ouvrage", "Coefficient de complexité", "Délai de fabrication (j)"].map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.ouvrages.map((o, i) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.nom}</TableCell>
                      {(["coefficient", "delaiFabrication"] as const).map((f) => (
                        <TableCell key={f}>
                          <Input
                            className="h-8 w-28"
                            value={String(o[f])}
                            onChange={(e) =>
                              set(
                                "ouvrages",
                                config.ouvrages.map((x, j) =>
                                  j === i ? { ...x, [f]: num(e.target.value) } : x,
                                ),
                              )
                            }
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Paramètres chiffrage */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="glass glass-hover space-y-4 p-5">
                <h2 className="text-lg font-semibold">Débitage & seuils</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Longueur standard de barre (m)" value={config.longueurBarre} onChange={(v) => set("longueurBarre", v)} />
                  <Field label="Longueur alternative (m)" value={config.longueurBarreAlt} onChange={(v) => set("longueurBarreAlt", v)} />
                  <Field label="Seuil largeur zone d'équilibrage (m)" value={config.seuilLargeur} onChange={(v) => set("seuilLargeur", v)} />
                  <Field label="Seuil hauteur zone d'équilibrage (m)" value={config.seuilHauteur} onChange={(v) => set("seuilHauteur", v)} />
                  <Field label="Seuil de coût (risque de perte, MAD)" value={config.seuilCout} onChange={(v) => set("seuilCout", v)} />
                  <div className="space-y-2">
                    <Label>Règle d'arrondi de débitage</Label>
                    <Select value={config.arrondi} onValueChange={(v) => set("arrondi", v as Config["arrondi"])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">Au centimètre supérieur</SelectItem>
                        <SelectItem value="mm">Au millimètre supérieur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              <Card className="glass glass-hover space-y-4 p-5">
                <h2 className="text-lg font-semibold">Barème de coûts & marges</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Main d'œuvre (MAD / heure)" value={config.mainOeuvreHeure} onChange={(v) => set("mainOeuvreHeure", v)} />
                  <Field label="Transport / déplacement (forfait)" value={config.transportForfait} onChange={(v) => set("transportForfait", v)} />
                  <Field label="Marge gamme Standard (%)" value={config.margeStandard} onChange={(v) => set("margeStandard", v)} />
                  <Field label="Marge gamme Haut de gamme (%)" value={config.margeHautDeGamme} onChange={(v) => set("margeHautDeGamme", v)} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Le prix de l'aluminium est défini par barre dans le catalogue de profilés, le prix
                  du vitrage au m² dans le catalogue de vitrages, et les accessoires à l'unité dans
                  le catalogue d'accessoires.
                </p>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button className="shine" size="lg" onClick={() => save("Configuration de chiffrage")}>
                <Save className="mr-1 h-4 w-4" /> Enregistrer la configuration
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="qualification" className="mt-4 space-y-4">
            <Card className="glass glass-hover space-y-5 p-5">
              <p className="text-sm text-muted-foreground">
                Ces critères sont utilisés par l'agent IA conversationnel (WhatsApp / email) qui
                échange avec le prospect avant son arrivée dans ce backoffice, pour décider s'il le
                transmet comme « Qualifié » ou « Non qualifié ».
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label="Budget minimum accepté (MAD)"
                  value={config.qualification.budgetMin}
                  onChange={(v) => set("qualification", { ...config.qualification, budgetMin: v })}
                />
                <Field
                  label="Délai de réponse cible (heures)"
                  value={config.qualification.delaiReponse}
                  onChange={(v) => set("qualification", { ...config.qualification, delaiReponse: v })}
                />
                <Field
                  label="Score de qualification minimum (%)"
                  value={config.qualification.scoreMin}
                  onChange={(v) => set("qualification", { ...config.qualification, scoreMin: v })}
                />
              </div>

              <div className="space-y-2">
                <Label>Zones géographiques couvertes</Label>
                <div className="flex flex-wrap gap-2">
                  {config.qualification.zones.map((z) => (
                    <span
                      key={z}
                      className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-sm"
                    >
                      {z}
                      <button
                        onClick={() =>
                          set("qualification", {
                            ...config.qualification,
                            zones: config.qualification.zones.filter((x) => x !== z),
                          })
                        }
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
                      if (!zoneInput.trim()) return;
                      set("qualification", {
                        ...config.qualification,
                        zones: [...config.qualification.zones, zoneInput.trim()],
                      });
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
                        checked={config.qualification.typesProjets.includes(t)}
                        onCheckedChange={(c) =>
                          set("qualification", {
                            ...config.qualification,
                            typesProjets: c
                              ? [...config.qualification.typesProjets, t]
                              : config.qualification.typesProjets.filter((x) => x !== t),
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
                        checked={config.qualification.infosRequises.includes(t)}
                        onCheckedChange={(c) =>
                          set("qualification", {
                            ...config.qualification,
                            infosRequises: c
                              ? [...config.qualification.infosRequises, t]
                              : config.qualification.infosRequises.filter((x) => x !== t),
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
              <Button className="shine" size="lg" onClick={() => save("Critères de qualification")}>
                <Save className="mr-1 h-4 w-4" /> Enregistrer la configuration
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </PageTransition>
    </AppShell>
  );
}

function Field({
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
