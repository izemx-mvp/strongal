import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, Sparkle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import facade from "@/assets/login-facade.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOGO_URL } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Connexion — Strongal Control" },
      {
        name: "description",
        content:
          "Accès au backoffice Strongal : chiffrage aluminium assisté par IA, prospects et service client.",
      },
      { property: "og:title", content: "Connexion — Strongal Control" },
      {
        property: "og:description",
        content: "Pilotez vos chiffrages, vos prospects et votre service client.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("contact@strongal.ma");
  const [password, setPassword] = useState("Strongal@2026");

  const enter = () => {
    toast.success("Bienvenue sur Strongal Control");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass w-full max-w-md rounded-2xl p-8"
        >
          <img src={LOGO_URL} alt="Strongal" className="h-14 object-contain object-left" />
          <h1 className="mt-8 text-3xl font-bold">Connexion</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Accédez à votre backoffice de chiffrage et de pilotage commercial.
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              enter();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/70 pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/70 pl-9"
                />
              </div>
            </div>
            <Button type="submit" className="shine w-full" size="lg">
              Se connecter <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-warm/40 bg-warm/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Sparkle className="h-4 w-4 text-warm" /> Accès démonstration
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Explorez l'ensemble du backoffice avec des données de démonstration.
            </p>
            <Button
              variant="outline"
              className="shine mt-3 w-full border-warm/50"
              onClick={enter}
              type="button"
            >
              Connexion instantanée (démo)
            </Button>
          </div>
        </motion.div>
      </div>

      <div className="relative hidden lg:block">
        <img
          src={facade}
          alt="Baie coulissante et mur rideau aluminium Strongal"
          width={1024}
          height={1536}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.198_0.008_264/0.95)] via-[oklch(0.198_0.008_264/0.55)] to-[oklch(0.198_0.008_264/0.25)]" />
        <div className="absolute right-10 bottom-14 left-10 text-primary-foreground">
          <h2 className="text-4xl font-bold">Strongal Control</h2>
          <p className="mt-3 max-w-md text-base opacity-85">
            Pilotez vos chiffrages, vos prospects et votre service client, du terrain au dossier
            signé.
          </p>
        </div>
      </div>
    </div>
  );
}
