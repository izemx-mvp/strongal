import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Plus, RotateCcw, Save, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/motion-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Accessoire, Config, Ouvrage, Profile, Vitrage } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/configuration")({
  head: () => ({
    meta: [
      { title: "Configuration — Strongal Control" },
      {
        name: "description",
        content:
          "Catalogue de profilés, vitrages, accessoires, ouvrages, débitage, barème de coûts et marges.",
      },
      { property: "og:title", content: "Configuration — Strongal Control" },
      {
        property: "og:description",
        content: "Catalogues, débitage, barèmes et marges utilisés par l'agent IA de chiffrage.",
      },
    ],
  }),
  component: ConfigurationPage,
});

const num = (v: string) => Number(v.replace(",", ".")) || 0;

function ConfigurationPage() {
  const { config, setConfig } = useStore();

  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const save = (label: string) => {
    setConfig((c) => ({ ...c, validated: true }));
    toast.success(`${label} enregistré — la configuration est active`);
  };

  return (
    <AppShell>
      <PageTransition>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Configuration</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Catalogues, débitage et barèmes utilisés par l'agent IA de chiffrage.
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

        <Tabs defaultValue="profiles">
          <TabsList className="flex-wrap">
            <TabsTrigger value="profiles">Profilés</TabsTrigger>
            <TabsTrigger value="vitrages">Vitrages</TabsTrigger>
            <TabsTrigger value="accessoires">Accessoires</TabsTrigger>
            <TabsTrigger value="ouvrages">Ouvrages</TabsTrigger>
            <TabsTrigger value="debitage">Débitage & seuils</TabsTrigger>
            <TabsTrigger value="bareme">Barème & marges</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="mt-4">
            <ProfilesTab config={config} set={set} save={save} />
          </TabsContent>
          <TabsContent value="vitrages" className="mt-4">
            <VitragesTab config={config} set={set} save={save} />
          </TabsContent>
          <TabsContent value="accessoires" className="mt-4">
            <AccessoiresTab config={config} set={set} save={save} />
          </TabsContent>
          <TabsContent value="ouvrages" className="mt-4">
            <OuvragesTab config={config} set={set} save={save} />
          </TabsContent>
          <TabsContent value="debitage" className="mt-4 space-y-4">
            <Card className="glass glass-hover space-y-4 p-5">
              <h2 className="text-lg font-semibold">Débitage & zone d'équilibrage</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <p className="text-xs text-muted-foreground">
                Les seuils de dimensions et le seuil de coût sont indépendants : un repère qui
                dépasse l'un ou l'autre entre en zone d'équilibrage.
              </p>
            </Card>
            <SaveRow onSave={() => save("Paramètres de débitage")} />
          </TabsContent>
          <TabsContent value="bareme" className="mt-4 space-y-4">
            <Card className="glass glass-hover space-y-4 p-5">
              <h2 className="text-lg font-semibold">Barème de coûts & marges</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Main d'œuvre (MAD / heure)" value={config.mainOeuvreHeure} onChange={(v) => set("mainOeuvreHeure", v)} />
                <Field label="Transport / déplacement (forfait)" value={config.transportForfait} onChange={(v) => set("transportForfait", v)} />
                <Field label="Marge gamme Standard (%)" value={config.margeStandard} onChange={(v) => set("margeStandard", v)} />
                <Field label="Marge gamme Haut de gamme (%)" value={config.margeHautDeGamme} onChange={(v) => set("margeHautDeGamme", v)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Le prix de l'aluminium est défini par barre dans le catalogue de profilés, le prix du
                vitrage au m² dans le catalogue de vitrages, et les accessoires à l'unité.
              </p>
            </Card>
            <SaveRow onSave={() => save("Barème de coûts et marges")} />
          </TabsContent>
        </Tabs>
      </PageTransition>
    </AppShell>
  );
}

type TabProps = {
  config: Config;
  set: <K extends keyof Config>(key: K, value: Config[K]) => void;
  save: (label: string) => void;
};

function SaveRow({ onSave }: { onSave: () => void }) {
  return (
    <div className="flex justify-end">
      <Button className="shine" size="lg" onClick={onSave}>
        <Save className="mr-1 h-4 w-4" /> Enregistrer la configuration
      </Button>
    </div>
  );
}

function Toolbar({
  q,
  setQ,
  placeholder,
  count,
  total,
  children,
  onReset,
}: {
  q: string;
  setQ: (v: string) => void;
  placeholder: string;
  count: number;
  total: number;
  children?: React.ReactNode;
  onReset: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative min-w-60 flex-1">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="bg-background/70 pl-9"
        />
      </div>
      {children}
      <Button
        variant="outline"
        onClick={() => {
          onReset();
          toast.success("Filtres réinitialisés");
        }}
      >
        <RotateCcw className="mr-1 h-4 w-4" /> Réinitialiser
      </Button>
      <span className="text-sm text-muted-foreground">
        {count} / {total} ligne{total > 1 ? "s" : ""}
      </span>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{label}</p>;
}

/* ---------------- Profilés ---------------- */
function ProfilesTab({ config, set, save }: TabProps) {
  const [q, setQ] = useState("");
  const [serie, setSerie] = useState("all");
  const [famille, setFamille] = useState("all");

  const series = useMemo(
    () => Array.from(new Set(config.profiles.map((p) => p.serie).filter(Boolean))),
    [config.profiles],
  );
  const familles = useMemo(
    () => Array.from(new Set(config.profiles.map((p) => p.famille).filter(Boolean))),
    [config.profiles],
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return config.profiles.filter(
      (p) =>
        (!t ||
          `${p.ref} ${p.serie} ${p.famille} ${p.finition}`.toLowerCase().includes(t)) &&
        (serie === "all" || p.serie === serie) &&
        (famille === "all" || p.famille === famille),
    );
  }, [config.profiles, q, serie, famille]);

  const patch = (id: string, p: Partial<Profile>) =>
    set(
      "profiles",
      config.profiles.map((x) => (x.id === id ? { ...x, ...p } : x)),
    );

  return (
    <div className="space-y-4">
      <Card className="glass glass-hover overflow-hidden p-5">
        <h2 className="mb-3 text-lg font-semibold">Catalogue de profilés aluminium</h2>
        <Toolbar
          q={q}
          setQ={setQ}
          placeholder="Rechercher une référence, une série, une famille…"
          count={filtered.length}
          total={config.profiles.length}
          onReset={() => {
            setQ("");
            setSerie("all");
            setFamille("all");
          }}
        >
          <Select value={serie} onValueChange={setSerie}>
            <SelectTrigger className="w-56 bg-background/70">
              <SelectValue placeholder="Série" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les séries</SelectItem>
              {series.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={famille} onValueChange={setFamille}>
            <SelectTrigger className="w-52 bg-background/70">
              <SelectValue placeholder="Famille" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les familles</SelectItem>
              {familles.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Toolbar>

        {filtered.length === 0 ? (
          <Empty label="Aucun résultat pour cette recherche" />
        ) : (
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
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    {(["ref", "serie", "famille", "finition"] as const).map((f) => (
                      <TableCell key={f}>
                        <Input
                          className="h-8 min-w-32"
                          value={p[f]}
                          onChange={(e) => patch(p.id, { [f]: e.target.value } as Partial<Profile>)}
                        />
                      </TableCell>
                    ))}
                    {(["ratio", "delai", "moq", "prixBarre"] as const).map((f) => (
                      <TableCell key={f}>
                        <Input
                          className="h-8 w-24"
                          value={String(p[f])}
                          onChange={(e) => patch(p.id, { [f]: num(e.target.value) } as Partial<Profile>)}
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Supprimer"
                        onClick={() => {
                          set("profiles", config.profiles.filter((x) => x.id !== p.id));
                          toast.success(`Profilé ${p.ref} supprimé`);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            setQ("");
            setSerie("all");
            setFamille("all");
            set("profiles", [
              ...config.profiles,
              {
                id: `p${Date.now()}`,
                ref: "STR-NEW",
                serie: "Schüco",
                famille: "Coulissant",
                finition: "RAL 9005",
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
      <SaveRow onSave={() => save("Catalogue de profilés")} />
    </div>
  );
}

/* ---------------- Vitrages ---------------- */
function VitragesTab({ config, set, save }: TabProps) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return config.vitrages.filter(
      (v) => !t || `${v.type} ${v.epaisseur} ${v.perf}`.toLowerCase().includes(t),
    );
  }, [config.vitrages, q]);

  const patch = (id: string, p: Partial<Vitrage>) =>
    set(
      "vitrages",
      config.vitrages.map((x) => (x.id === id ? { ...x, ...p } : x)),
    );

  return (
    <div className="space-y-4">
      <Card className="glass glass-hover p-5">
        <h2 className="mb-3 text-lg font-semibold">Catalogue de vitrages</h2>
        <Toolbar
          q={q}
          setQ={setQ}
          placeholder="Rechercher un type de vitrage, une épaisseur…"
          count={filtered.length}
          total={config.vitrages.length}
          onReset={() => setQ("")}
        />
        {filtered.length === 0 ? (
          <Empty label="Aucun résultat pour cette recherche" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {["Type", "Épaisseur", "Performance", "Prix /m²", ""].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id}>
                  {(["type", "epaisseur"] as const).map((f) => (
                    <TableCell key={f}>
                      <Input
                        className="h-8"
                        value={v[f]}
                        onChange={(e) => patch(v.id, { [f]: e.target.value } as Partial<Vitrage>)}
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
                      onChange={(e) => patch(v.id, { prixM2: num(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Supprimer"
                      onClick={() => {
                        set("vitrages", config.vitrages.filter((x) => x.id !== v.id));
                        toast.success(`Vitrage ${v.type} supprimé`);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            setQ("");
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
      <SaveRow onSave={() => save("Catalogue de vitrages")} />
    </div>
  );
}

/* ---------------- Accessoires ---------------- */
function AccessoiresTab({ config, set, save }: TabProps) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return config.accessoires.filter((a) => !t || a.nom.toLowerCase().includes(t));
  }, [config.accessoires, q]);

  const patch = (id: string, p: Partial<Accessoire>) =>
    set(
      "accessoires",
      config.accessoires.map((x) => (x.id === id ? { ...x, ...p } : x)),
    );

  return (
    <div className="space-y-4">
      <Card className="glass glass-hover p-5">
        <h2 className="mb-3 text-lg font-semibold">Catalogue d'accessoires</h2>
        <Toolbar
          q={q}
          setQ={setQ}
          placeholder="Rechercher un accessoire…"
          count={filtered.length}
          total={config.accessoires.length}
          onReset={() => setQ("")}
        />
        {filtered.length === 0 ? (
          <Empty label="Aucun résultat pour cette recherche" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {["Accessoire", "Unité", "Coût unitaire", "Qté standard / ouvrage", ""].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Input
                      className="h-8"
                      value={a.nom}
                      onChange={(e) => patch(a.id, { nom: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.unite}</TableCell>
                  {(["coutUnitaire", "qteStandard"] as const).map((f) => (
                    <TableCell key={f}>
                      <Input
                        className="h-8 w-24"
                        value={String(a[f])}
                        onChange={(e) => patch(a.id, { [f]: num(e.target.value) } as Partial<Accessoire>)}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Supprimer"
                      onClick={() => {
                        set("accessoires", config.accessoires.filter((x) => x.id !== a.id));
                        toast.success(`Accessoire ${a.nom} supprimé`);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            setQ("");
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
      <SaveRow onSave={() => save("Catalogue d'accessoires")} />
    </div>
  );
}

/* ---------------- Ouvrages ---------------- */
function OuvragesTab({ config, set, save }: TabProps) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return config.ouvrages.filter((o) => !t || o.nom.toLowerCase().includes(t));
  }, [config.ouvrages, q]);

  const patch = (id: string, p: Partial<Ouvrage>) =>
    set(
      "ouvrages",
      config.ouvrages.map((x) => (x.id === id ? { ...x, ...p } : x)),
    );

  return (
    <div className="space-y-4">
      <Card className="glass glass-hover p-5">
        <h2 className="mb-3 text-lg font-semibold">Types d'ouvrages de référence</h2>
        <Toolbar
          q={q}
          setQ={setQ}
          placeholder="Rechercher un type d'ouvrage…"
          count={filtered.length}
          total={config.ouvrages.length}
          onReset={() => setQ("")}
        />
        {filtered.length === 0 ? (
          <Empty label="Aucun résultat pour cette recherche" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {["Ouvrage", "Coefficient de complexité", "Délai de fabrication (j)"].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.nom}</TableCell>
                  {(["coefficient", "delaiFabrication"] as const).map((f) => (
                    <TableCell key={f}>
                      <Input
                        className="h-8 w-28"
                        value={String(o[f])}
                        onChange={(e) => patch(o.id, { [f]: num(e.target.value) } as Partial<Ouvrage>)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <SaveRow onSave={() => save("Ouvrages de référence")} />
    </div>
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
