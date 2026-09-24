import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  defaultConfig,
  initialDossiers,
  type Config,
  type Dossier,
  type HistoEntry,
} from "./data";
import {
  defaultRelanceConfig,
  defaultTemplates,
  nowStr,
  type Facture,
  type RelanceConfig,
  type RelanceTemplate,
} from "./erp";

export type Notification = { id: string; label: string; time: string; lu: boolean };

type Store = {
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  dossiers: Dossier[];
  setDossiers: React.Dispatch<React.SetStateAction<Dossier[]>>;
  updateDossier: (
    ref: string,
    patch: Partial<Dossier>,
    histo?: Omit<HistoEntry, "date"> | Omit<HistoEntry, "date">[],
  ) => void;
  factures: Facture[];
  setFactures: React.Dispatch<React.SetStateAction<Facture[]>>;
  relanceConfig: RelanceConfig;
  setRelanceConfig: React.Dispatch<React.SetStateAction<RelanceConfig>>;
  templates: RelanceTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<RelanceTemplate[]>>;
  utilisateur: string;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  theme: "light" | "dark";
  toggleTheme: () => void;
  notifications: Notification[];
  markNotificationsRead: () => void;
};

const STORAGE_KEY = "strongal-erp-v2";

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [dossiers, setDossiers] = useState<Dossier[]>(initialDossiers);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [relanceConfig, setRelanceConfig] = useState<RelanceConfig>(defaultRelanceConfig);
  const [templates, setTemplates] = useState<RelanceTemplate[]>(defaultTemplates);
  const [hydrated, setHydrated] = useState(false);

  // Persistance locale : les modifications survivent au rechargement.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.config)
          setConfig({
            ...defaultConfig,
            ...s.config,
            profiles: (s.config.profiles ?? defaultConfig.profiles).map((p: Config["profiles"][number]) => ({
              ...(defaultConfig.profiles.find((x) => x.id === p.id) ?? {}),
              ...p,
            })),
            produits: (s.config.produits ?? defaultConfig.produits).map((p: Config["produits"][number]) => ({
              ...(defaultConfig.produits.find((x) => x.id === p.id) ?? {}),
              ...p,
            })),
          });
        if (s.dossiers) setDossiers(s.dossiers);
        if (s.factures) setFactures(s.factures);
        if (s.relanceConfig) setRelanceConfig(s.relanceConfig);
        if (s.templates) setTemplates(s.templates);
      }
    } catch {
      /* état corrompu : on repart des données initiales */
    }
    setHydrated(true);
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = window.localStorage.getItem("strongal-theme");
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("strongal-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ config, dossiers, factures, relanceConfig, templates }),
    );
  }, [hydrated, config, dossiers, factures, relanceConfig, templates]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "n1",
      label: "Fabrication portée à 65 % sur le siège Novatech Industries",
      time: "il y a 12 min",
      lu: false,
    },
    {
      id: "n2",
      label: "Livraison confirmée pour la Clinique Horizon Santé",
      time: "il y a 40 min",
      lu: false,
    },
    {
      id: "n3",
      label: "2 relances commerciales à envoyer aujourd'hui",
      time: "il y a 2 h",
      lu: false,
    },
    {
      id: "n4",
      label: "Validation humaine requise sur le dossier Atelier Atlas Mobilité",
      time: "il y a 3 h",
      lu: false,
    },
    {
      id: "n5",
      label: "Devis technique envoyé pour la Résidence Yasmine",
      time: "il y a 5 h",
      lu: true,
    },
    {
      id: "n6",
      label: "Réception finale enregistrée pour le showroom Mobilia Design",
      time: "hier",
      lu: true,
    },
  ]);

  const updateDossier: Store["updateDossier"] = (ref, patch, histo) => {
    setDossiers((prev) =>
      prev.map((d) =>
        d.ref === ref
          ? {
              ...d,
              ...patch,
              historique: histo
                ? [
                    ...d.historique,
                    ...(Array.isArray(histo) ? histo : [histo]).map((h) => ({ date: nowStr(), ...h })),
                  ]
                : d.historique,
            }
          : d,
      ),
    );
  };

  const markNotificationsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));

  const value = useMemo(
    () => ({
      config,
      setConfig,
      dossiers,
      setDossiers,
      updateDossier,
      factures,
      setFactures,
      relanceConfig,
      setRelanceConfig,
      templates,
      setTemplates,
      utilisateur: "M. Aboulssaad",
      sidebarOpen,
      setSidebarOpen,
      theme,
      toggleTheme,
      notifications,
      markNotificationsRead,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, dossiers, factures, relanceConfig, templates, sidebarOpen, theme, notifications],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore doit être utilisé dans StoreProvider");
  return ctx;
}
