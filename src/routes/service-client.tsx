import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Download,
  Eye,
  FileText,
  ImageIcon,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { CountUp, PageTransition } from "@/components/motion-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Faq, InfosPratiques } from "@/lib/data";
import { useStore } from "@/lib/store";
import { downloadTexte } from "@/lib/download";

export const Route = createFileRoute("/service-client")({
  head: () => ({
    meta: [
      { title: "Agent Service Client — Strongal Control" },
      {
        name: "description",
        content:
          "Configuration de l'agent service client Strongal : FAQ, documents partagés, infos pratiques et simulateur.",
      },
      { property: "og:title", content: "Agent Service Client — Strongal Control" },
      {
        property: "og:description",
        content: "FAQ, documents partagés, infos pratiques et simulateur de conversation.",
      },
    ],
  }),
  component: ServiceClientPage,
});

const CATEGORIES = ["Produits", "Délais", "Paiement", "SAV"] as const;

export function getServiceClientReply(
  question: string,
  ctx: { faq: Faq[]; infos: InfosPratiques },
): string {
  const q = question.toLowerCase();
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const nq = norm(q);

  if (/(horaire|ouvert|ferme|fermé|heure)/.test(nq)) {
    const ouverts = ctx.infos.horaires.filter((h) => h.ouvert);
    return `Nos horaires : ${ouverts.map((h) => `${h.jour} ${h.debut}–${h.fin}`).join(", ")}. Jours fermés : ${
      ctx.infos.horaires
        .filter((h) => !h.ouvert)
        .map((h) => h.jour)
        .join(", ") || "aucun"
    }.`;
  }
  if (/(adresse|ou etes|où êtes|localis|atelier|showroom)/.test(nq)) {
    return `Nous sommes situés au ${ctx.infos.adresse}. Téléphone : ${ctx.infos.telephone} — Email : ${ctx.infos.email}.`;
  }
  if (/(instagram|facebook|linkedin|reseau|réseau|social)/.test(nq)) {
    const actifs = ctx.infos.reseaux.filter((r) => r.actif);
    return actifs.length
      ? `Retrouvez-nous sur ${actifs.map((r) => `${r.nom} (${r.url})`).join(", ")}.`
      : "Nos réseaux sociaux ne sont pas actifs pour le moment.";
  }
  if (/(telephone|téléphone|appel|numero|numéro|email|mail|contact)/.test(nq)) {
    return `Vous pouvez nous joindre au ${ctx.infos.telephone} ou par email à ${ctx.infos.email}.`;
  }

  const actives = ctx.faq.filter((f) => f.actif);
  let best: { f: Faq; score: number } | null = null;
  for (const f of actives) {
    const mots = norm(f.question)
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const score = mots.filter((w) => nq.includes(w)).length;
    if (score > 0 && (!best || score > best.score)) best = { f, score };
  }
  if (best) return best.f.reponse;

  return "Je n'ai pas la réponse exacte à cette question. Laissez-moi vos coordonnées (nom et téléphone) et un conseiller Strongal vous rappelle sous 4 heures ouvrées.";
}

function ServiceClientPage() {
  const {
    faq,
    setFaq,
    documents,
    setDocuments,
    infos,
    setInfos,
    agentActif,
    setAgentActif,
  } = useStore();

  const [faqSearch, setFaqSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ question: "", reponse: "", categorie: "Produits" as Faq["categorie"] });
  const [uploading, setUploading] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ from: "user" | "agent"; text: string }[]>([
    { from: "agent", text: "Bonjour 👋 Je suis l'assistant Strongal. Comment puis-je vous aider ?" },
  ]);
  const [input, setInput] = useState("");
  const chatEnd = useRef<HTMLDivElement>(null);

  const faqFiltered = useMemo(() => {
    const t = faqSearch.trim().toLowerCase();
    if (!t) return faq;
    return faq.filter(
      (f) =>
        f.question.toLowerCase().includes(t) ||
        f.reponse.toLowerCase().includes(t) ||
        f.categorie.toLowerCase().includes(t),
    );
  }, [faq, faqSearch]);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setMessages((m) => [...m, { from: "user", text: q }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { from: "agent", text: getServiceClientReply(q, { faq, infos }) }]);
      chatEnd.current?.scrollIntoView({ behavior: "smooth" });
    }, 700);
  };

  const simulateUpload = () => {
    setUploading(1);
    const start = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / 1500) * 100);
      setUploading(p);
      if (p >= 100) {
        clearInterval(iv);
        setUploading(0);
        setDocuments((d) => [
          {
            id: `d${Date.now()}`,
            nom: `Nouveau document ${d.length + 1}.pdf`,
            type: "pdf",
            taille: "2.4 Mo",
            date: new Date().toISOString().slice(0, 10),
          },
          ...d,
        ]);
        toast.success("Document ajouté à la bibliothèque");
      }
    }, 80);
  };

  return (
    <AppShell>
      <PageTransition>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Agent Service Client</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configurez ce que l'agent IA répond à vos clients sur WhatsApp et par email.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
              WhatsApp ✅
            </span>
            <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
              Email ✅
            </span>
            <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5">
              <Switch
                checked={agentActif}
                onCheckedChange={(v) => {
                  setAgentActif(v);
                  toast.success(v ? "Agent activé" : "Agent désactivé");
                }}
              />
              <span
                className={`text-xs font-semibold ${agentActif ? "text-success" : "text-muted-foreground"}`}
              >
                {agentActif ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass glass-hover p-5">
            <p className="text-3xl font-bold">
              <CountUp value={348} />
            </p>
            <p className="text-xs text-muted-foreground">Questions répondues ce mois</p>
          </Card>
          <Card className="glass glass-hover p-5">
            <p className="text-3xl font-bold">
              <CountUp value={87.4} decimals={1} suffix=" %" />
            </p>
            <p className="text-xs text-muted-foreground">Taux de résolution automatique</p>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Tabs defaultValue="faq">
              <TabsList>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="infos">Infos pratiques</TabsTrigger>
              </TabsList>

              {/* FAQ */}
              <TabsContent value="faq" className="mt-4 space-y-4">
                <Card className="glass glass-hover p-5">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="relative min-w-52 flex-1">
                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={faqSearch}
                        onChange={(e) => setFaqSearch(e.target.value)}
                        placeholder="Rechercher une question…"
                        className="bg-background/70 pl-9"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {faqFiltered.length} question{faqFiltered.length > 1 ? "s" : ""}
                    </span>
                    <Button className="shine" onClick={() => setAddOpen(true)}>
                      <Plus className="mr-1 h-4 w-4" /> Ajouter une question
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {faqFiltered.length === 0 && (
                      <p className="py-10 text-center text-muted-foreground">
                        Aucun résultat pour cette recherche
                      </p>
                    )}
                    {faqFiltered.map((f) => (
                      <div key={f.id} className="rounded-xl border p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            className="h-8 min-w-60 flex-1 font-medium"
                            value={f.question}
                            onChange={(e) =>
                              setFaq((p) =>
                                p.map((x) => (x.id === f.id ? { ...x, question: e.target.value } : x)),
                              )
                            }
                          />
                          <Select
                            value={f.categorie}
                            onValueChange={(v) =>
                              setFaq((p) =>
                                p.map((x) =>
                                  x.id === f.id ? { ...x, categorie: v as Faq["categorie"] } : x,
                                ),
                              )
                            }
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Switch
                            checked={f.actif}
                            onCheckedChange={(v) =>
                              setFaq((p) => p.map((x) => (x.id === f.id ? { ...x, actif: v } : x)))
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Supprimer « ${f.question} » ?`)) {
                                setFaq((p) => p.filter((x) => x.id !== f.id));
                                toast.success("Question supprimée");
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          className="mt-2 text-sm"
                          value={f.reponse}
                          onChange={(e) =>
                            setFaq((p) =>
                              p.map((x) => (x.id === f.id ? { ...x, reponse: e.target.value } : x)),
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button className="shine" onClick={() => toast.success("FAQ enregistrée")}>
                      <Save className="mr-1 h-4 w-4" /> Enregistrer les modifications
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Documents */}
              <TabsContent value="documents" className="mt-4 space-y-4">
                <Card className="glass glass-hover p-5">
                  <button
                    onClick={simulateUpload}
                    className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-warm/40 bg-warm/5 py-10 transition-colors hover:bg-warm/10"
                  >
                    <UploadCloud className="h-8 w-8 text-warm" />
                    <p className="mt-2 text-sm font-medium">
                      Glissez un document ici ou cliquez pour l'ajouter
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, images — 20 Mo max</p>
                  </button>
                  {uploading > 0 && (
                    <div className="mt-4">
                      <Progress value={uploading} />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Téléversement… {Math.round(uploading)} %
                      </p>
                    </div>
                  )}

                  <div className="mt-5 space-y-2">
                    {documents.map((d) => (
                      <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
                        {d.type === "pdf" ? (
                          <FileText className="h-5 w-5 text-warm" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-warm" />
                        )}
                        <div className="min-w-40 flex-1">
                          <p className="text-sm font-medium">{d.nom}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.taille} · ajouté le {d.date}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setPreview(d.nom)}>
                          <Eye className="mr-1 h-4 w-4" /> Aperçu
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            downloadTexte(
                              d.nom.replace(/\.[a-z]+$/, ".txt"),
                              `Strongal — ${d.nom}\nDocument de démonstration partagé par l'agent service client.\nTaille : ${d.taille}\nAjouté le : ${d.date}`,
                            );
                            toast.success("Téléchargement lancé");
                          }}
                        >
                          <Download className="mr-1 h-4 w-4" /> Télécharger
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDocuments((p) => p.filter((x) => x.id !== d.id));
                            toast.success("Document supprimé");
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button className="shine" onClick={() => toast.success("Bibliothèque enregistrée")}>
                      <Save className="mr-1 h-4 w-4" /> Enregistrer les modifications
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Infos pratiques */}
              <TabsContent value="infos" className="mt-4 space-y-4">
                <Card className="glass glass-hover space-y-5 p-5">
                  <div className="space-y-3">
                    <Label>Réseaux sociaux</Label>
                    {infos.reseaux.map((r) => (
                      <div key={r.id} className="flex items-center gap-3">
                        <span className="w-24 text-sm">{r.nom}</span>
                        <Input
                          value={r.url}
                          onChange={(e) =>
                            setInfos((p) => ({
                              ...p,
                              reseaux: p.reseaux.map((x) =>
                                x.id === r.id ? { ...x, url: e.target.value } : x,
                              ),
                            }))
                          }
                          className="bg-background/70"
                        />
                        <Switch
                          checked={r.actif}
                          onCheckedChange={(v) =>
                            setInfos((p) => ({
                              ...p,
                              reseaux: p.reseaux.map((x) => (x.id === r.id ? { ...x, actif: v } : x)),
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2 sm:col-span-3">
                      <Label>Adresse</Label>
                      <Input
                        value={infos.adresse}
                        onChange={(e) => setInfos((p) => ({ ...p, adresse: e.target.value }))}
                        className="bg-background/70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input
                        value={infos.telephone}
                        onChange={(e) => setInfos((p) => ({ ...p, telephone: e.target.value }))}
                        className="bg-background/70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={infos.email}
                        onChange={(e) => setInfos((p) => ({ ...p, email: e.target.value }))}
                        className="bg-background/70"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Horaires d'ouverture</Label>
                    <Table className="mt-2">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Jour</TableHead>
                          <TableHead>Ouvert</TableHead>
                          <TableHead>Début</TableHead>
                          <TableHead>Fin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {infos.horaires.map((h) => (
                          <TableRow key={h.jour}>
                            <TableCell className="font-medium">{h.jour}</TableCell>
                            <TableCell>
                              <Switch
                                checked={h.ouvert}
                                onCheckedChange={(v) =>
                                  setInfos((p) => ({
                                    ...p,
                                    horaires: p.horaires.map((x) =>
                                      x.jour === h.jour
                                        ? {
                                            ...x,
                                            ouvert: v,
                                            debut: v && x.debut === "—" ? "09:00" : x.debut,
                                            fin: v && x.fin === "—" ? "18:00" : x.fin,
                                          }
                                        : x,
                                    ),
                                  }))
                                }
                              />
                            </TableCell>
                            {(["debut", "fin"] as const).map((f) => (
                              <TableCell key={f}>
                                <Input
                                  disabled={!h.ouvert}
                                  className="h-8 w-28"
                                  value={h[f]}
                                  onChange={(e) =>
                                    setInfos((p) => ({
                                      ...p,
                                      horaires: p.horaires.map((x) =>
                                        x.jour === h.jour ? { ...x, [f]: e.target.value } : x,
                                      ),
                                    }))
                                  }
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end">
                    <Button className="shine" onClick={() => toast.success("Infos pratiques enregistrées")}>
                      <Save className="mr-1 h-4 w-4" /> Enregistrer les modifications
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Simulateur */}
          <Card className="glass glass-hover flex h-[640px] flex-col p-0">
            <div className="border-b px-4 py-3">
              <p className="font-semibold">Simulateur de conversation</p>
              <p className="text-xs text-muted-foreground">
                Reflète immédiatement vos modifications des 3 onglets.
              </p>
            </div>
            <div className="scroll-slim flex-1 space-y-3 overflow-y-auto bg-accent-soft/40 p-4">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <span
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.from === "user"
                        ? "bg-success/25 text-foreground"
                        : "bg-card text-card-foreground shadow-sm"
                    }`}
                  >
                    {m.text}
                  </span>
                </motion.div>
              ))}
              <div ref={chatEnd} />
            </div>
            <div className="flex gap-2 border-t p-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Tester une question…"
                className="bg-background/70"
              />
              <Button size="icon" onClick={send} className="shine">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Ajout FAQ */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Question</Label>
                <Input
                  value={draft.question}
                  onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Réponse</Label>
                <Textarea
                  value={draft.reponse}
                  onChange={(e) => setDraft((d) => ({ ...d, reponse: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={draft.categorie}
                  onValueChange={(v) => setDraft((d) => ({ ...d, categorie: v as Faq["categorie"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                className="shine"
                onClick={() => {
                  if (!draft.question.trim() || !draft.reponse.trim()) {
                    toast.error("Renseignez la question et la réponse");
                    return;
                  }
                  setFaq((p) => [{ id: `f${Date.now()}`, ...draft, actif: true }, ...p]);
                  setDraft({ question: "", reponse: "", categorie: "Produits" });
                  setAddOpen(false);
                  toast.success("Question ajoutée à la FAQ");
                }}
              >
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aperçu — {preview}</DialogTitle>
            </DialogHeader>
            <div className="rounded-xl border bg-card p-6 text-sm">
              <p className="font-display text-lg font-bold">Strongal</p>
              <p className="mt-2 text-muted-foreground">
                Aperçu de démonstration du document « {preview} ». Ce document peut être partagé
                automatiquement par l'agent service client lors d'une conversation WhatsApp ou email.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </PageTransition>
    </AppShell>
  );
}
