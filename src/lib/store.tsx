import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  defaultConfig,
  initialDocuments,
  initialDossiers,
  initialFaq,
  initialInfos,
  initialProspects,
  type Config,
  type DocItem,
  type Dossier,
  type Faq,
  type HistoEntry,
  type InfosPratiques,
  type Prospect,
} from "./data";

export type Notification = { id: string; label: string; time: string; lu: boolean };

type Store = {
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  dossiers: Dossier[];
  setDossiers: React.Dispatch<React.SetStateAction<Dossier[]>>;
  updateDossier: (ref: string, patch: Partial<Dossier>, histo?: Omit<HistoEntry, "date">) => void;
  prospects: Prospect[];
  setProspects: React.Dispatch<React.SetStateAction<Prospect[]>>;
  faq: Faq[];
  setFaq: React.Dispatch<React.SetStateAction<Faq[]>>;
  documents: DocItem[];
  setDocuments: React.Dispatch<React.SetStateAction<DocItem[]>>;
  infos: InfosPratiques;
  setInfos: React.Dispatch<React.SetStateAction<InfosPratiques>>;
  agentActif: boolean;
  setAgentActif: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  notifications: Notification[];
  markNotificationsRead: () => void;
};

const StoreContext = createContext<Store | null>(null);

export const nowStr = () => new Date().toISOString().slice(0, 16).replace("T", " ");

export function StoreProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [dossiers, setDossiers] = useState<Dossier[]>(initialDossiers);
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [faq, setFaq] = useState<Faq[]>(initialFaq);
  const [documents, setDocuments] = useState<DocItem[]>(initialDocuments);
  const [infos, setInfos] = useState<InfosPratiques>(initialInfos);
  const [agentActif, setAgentActif] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "n1",
      label: "Agent Chiffrage a calculé les matières premières du dossier STR-2026-014",
      time: "il y a 12 min",
      lu: false,
    },
    {
      id: "n2",
      label: "Agent Service Client a répondu à 3 questions via WhatsApp",
      time: "il y a 40 min",
      lu: false,
    },
    {
      id: "n3",
      label: "Agent Qualification a qualifié un nouveau prospect (Reda Chraibi)",
      time: "il y a 2 h",
      lu: false,
    },
    {
      id: "n4",
      label: "Zone d'équilibrage détectée sur STR-2026-011, validation humaine requise",
      time: "il y a 3 h",
      lu: false,
    },
    {
      id: "n5",
      label: "Devis technique v1 envoyé au client Mme Salma Bennani",
      time: "il y a 5 h",
      lu: true,
    },
    {
      id: "n6",
      label: "Agent Chiffrage : taux de chute optimisé à 8,4 % sur STR-2026-003",
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
              historique: histo ? [...d.historique, { date: nowStr(), ...histo }] : d.historique,
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
      prospects,
      setProspects,
      faq,
      setFaq,
      documents,
      setDocuments,
      infos,
      setInfos,
      agentActif,
      setAgentActif,
      sidebarOpen,
      setSidebarOpen,
      notifications,
      markNotificationsRead,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, dossiers, prospects, faq, documents, infos, agentActif, sidebarOpen, notifications],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore doit être utilisé dans StoreProvider");
  return ctx;
}
