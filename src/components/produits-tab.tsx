import { ChevronDown, Package, Plus, RotateCcw, Save, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ficheTechnique, fmt, fmtNum } from "@/lib/calc";
import { BASES_COMPOSANT, type ComposantProduit, type Config, type Produit } from "@/lib/data";
import { useStore } from "@/lib/store";

const num = (v: string) => Number(v.replace(",", ".")) || 0;

export function ProduitsTab() {
  const { config, setConfig } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [openId, setOpenId] = useState<string | null>(config.produits[0]?.id ?? null);

  const categories = useMemo(
    () => Array.from(new Set(config.produits.map((p) => p.categorie).filter(Boolean))),
    [config.produits],
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return config.produits.filter(
      (p) =>
        (!t || `${p.nom} ${p.categorie} ${p.description}`.toLowerCase().includes(t)) &&
        (cat === "all" || p.categorie === cat),
    );
  }, [config.produits, q, cat]);

  const setProduits = (produits: Produit[]) =>
    setConfig((c: Config) => ({ ...c, produits }));

  const patch = (id: string, p: Partial<Produit>) =>
    setProduits(config.produits.map((x) => (x.id === id ? { ...x, ...p } : x)));

  return (
    <div className="space-y-4">
      <Card className="glass glass-hover p-5">
        <h2 className="mb-1 text-lg font-semibold">Produits finis & fiches techniques</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Chaque produit décrit ce qu'il contient : profilés, accessoires et quantités calculées
          automatiquement à partir des dimensions du repère dans un dossier.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-60 flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit fini…"
              className="bg-background/70 pl-9"
            />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-52 bg-background/70">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setQ("");
              setCat("all");
              toast.success("Filtres réinitialisés");
            }}
          >
            <RotateCcw className="mr-1 h-4 w-4" /> Réinitialiser
          </Button>
          <span className="text-sm text-muted-foreground">
            {filtered.length} / {config.produits.length} produit
            {config.produits.length > 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun résultat pour cette recherche
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <ProduitCard
                key={p.id}
                produit={p}
                config={config}
                open={openId === p.id}
                onToggle={() => setOpenId(openId === p.id ? null : p.id)}
                patch={(v) => patch(p.id, v)}
                onDelete={() => {
                  setProduits(config.produits.filter((x) => x.id !== p.id));
                  toast.success(`Produit ${p.nom} supprimé du catalogue`);
                }}
              />
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            const id = `pr${Date.now()}`;
            setQ("");
            setCat("all");
            setProduits([
              ...config.produits,
              {
                id,
                nom: "Nouveau produit fini",
                categorie: "Coulissant",
                description: "Décrivez ce produit et son usage.",
                ouvrageId: config.ouvrages[0]?.id ?? "",
                profileId: config.profiles[0]?.id ?? "",
                vitrageId: config.vitrages[0]?.id ?? "",
                heuresM2: 1.6,
                composants: [
                  {
                    id: `c${Date.now()}`,
                    type: "profil",
                    refId: config.profiles[0]?.id ?? "",
                    base: "perimetre",
                    coef: 1,
                  },
                ],
              },
            ]);
            setOpenId(id);
            toast.success("Produit fini ajouté au catalogue");
          }}
        >
          <Plus className="mr-1 h-4 w-4" /> Ajouter un produit fini
        </Button>
      </Card>

      <div className="flex justify-end">
        <Button
          className="shine"
          size="lg"
          onClick={() => {
            setConfig((c: Config) => ({ ...c, validated: true }));
            toast.success("Catalogue de produits finis enregistré — la configuration est active");
          }}
        >
          <Save className="mr-1 h-4 w-4" /> Enregistrer la configuration
        </Button>
      </div>
    </div>
  );
}

function ProduitCard({
  produit,
  config,
  open,
  onToggle,
  patch,
  onDelete,
}: {
  produit: Produit;
  config: Config;
  open: boolean;
  onToggle: () => void;
  patch: (p: Partial<Produit>) => void;
  onDelete: () => void;
}) {
  const [largeur, setLargeur] = useState("2.40");
  const [hauteur, setHauteur] = useState("2.20");

  const L = num(largeur) || 1;
  const H = num(hauteur) || 1;
  const fiche = ficheTechnique(produit, config, L, H, 1);
  const totalFiche =
    fiche.profils.reduce((s, x) => s + x.cout, 0) + fiche.accessoires.reduce((s, x) => s + x.total, 0);

  const patchComposant = (id: string, p: Partial<ComposantProduit>) =>
    patch({ composants: produit.composants.map((c) => (c.id === id ? { ...c, ...p } : c)) });

  return (
    <div className="rounded-xl border bg-background/40">
      <div className="flex flex-wrap items-center gap-3 p-3">
        <Package className="h-4 w-4 text-warm" />
        <Input
          className="h-9 min-w-56 flex-1"
          value={produit.nom}
          onChange={(e) => patch({ nom: e.target.value })}
        />
        <Input
          className="h-9 w-40"
          value={produit.categorie}
          onChange={(e) => patch({ categorie: e.target.value })}
        />
        <span className="text-xs text-muted-foreground">
          {produit.composants.length} composant(s)
        </span>
        <Button variant="ghost" size="icon" aria-label="Supprimer le produit" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToggle}>
          <ChevronDown className={`mr-1 h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          Fiche technique
        </Button>
      </div>

      {open && (
        <div className="space-y-4 border-t p-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={produit.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Type d'ouvrage</Label>
              <Select value={produit.ouvrageId} onValueChange={(v) => patch({ ouvrageId: v })}>
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
              <Label className="text-xs">Profilé principal</Label>
              <Select value={produit.profileId} onValueChange={(v) => patch({ profileId: v })}>
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
              <Label className="text-xs">Vitrage par défaut</Label>
              <Select value={produit.vitrageId} onValueChange={(v) => patch({ vitrageId: v })}>
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
            <div className="space-y-1.5">
              <Label className="text-xs">Main d'œuvre (h / m²)</Label>
              <Input
                className="h-9"
                value={String(produit.heuresM2)}
                onChange={(e) => patch({ heuresM2: num(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Composition du produit</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  {["Type", "Référence", "Base de calcul", "Coefficient", ""].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {produit.composants.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Select
                        value={c.type}
                        onValueChange={(v) =>
                          patchComposant(c.id, {
                            type: v as ComposantProduit["type"],
                            refId:
                              v === "profil"
                                ? (config.profiles[0]?.id ?? "")
                                : (config.accessoires[0]?.id ?? ""),
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="profil">Profilé</SelectItem>
                          <SelectItem value="accessoire">Accessoire</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={c.refId} onValueChange={(v) => patchComposant(c.id, { refId: v })}>
                        <SelectTrigger className="h-8 w-56">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(c.type === "profil" ? config.profiles : config.accessoires).map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {"ref" in o ? `${o.ref} — ${o.serie}` : o.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={c.base}
                        onValueChange={(v) =>
                          patchComposant(c.id, { base: v as ComposantProduit["base"] })
                        }
                      >
                        <SelectTrigger className="h-8 w-52">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BASES_COMPOSANT.map((b) => (
                            <SelectItem key={b.value} value={b.value}>
                              {b.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-24"
                        value={String(c.coef)}
                        onChange={(e) => patchComposant(c.id, { coef: num(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Supprimer le composant"
                        onClick={() => {
                          patch({ composants: produit.composants.filter((x) => x.id !== c.id) });
                          toast.success("Composant retiré du produit");
                        }}
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
              className="mt-2"
              onClick={() => {
                patch({
                  composants: [
                    ...produit.composants,
                    {
                      id: `c${Date.now()}`,
                      type: "accessoire",
                      refId: config.accessoires[0]?.id ?? "",
                      base: "unite",
                      coef: 1,
                    },
                  ],
                });
                toast.success("Composant ajouté au produit");
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Ajouter un composant
            </Button>
          </div>

          <div className="rounded-xl bg-accent-soft/60 p-4">
            <div className="mb-3 flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Simuler une largeur (m)</Label>
                <Input
                  className="h-8 w-28"
                  value={largeur}
                  onChange={(e) => setLargeur(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Simuler une hauteur (m)</Label>
                <Input
                  className="h-8 w-28"
                  value={hauteur}
                  onChange={(e) => setHauteur(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Ce que contient une unité de ce produit pour ces dimensions.
              </p>
            </div>
            <ul className="space-y-1 text-sm">
              {fiche.profils.map((p, i) => (
                <li key={`p${i}`} className="flex justify-between gap-3">
                  <span>
                    {p.ref} — {p.serie} · {p.pieces} barre(s) de {fmtNum(p.longueurPiece)} m ·{" "}
                    {fmtNum(p.ml)} ml
                  </span>
                  <span className="text-muted-foreground">{fmt(p.cout)}</span>
                </li>
              ))}
              {fiche.accessoires.map((a, i) => (
                <li key={`a${i}`} className="flex justify-between gap-3">
                  <span>
                    {a.nom} · {fmtNum(a.qte, 1)} {a.unite}
                  </span>
                  <span className="text-muted-foreground">{fmt(a.total)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm font-semibold">
              Coût matière de l'unité simulée : {fmt(totalFiche)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
