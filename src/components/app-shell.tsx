import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  Bell,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Moon,
  Receipt,
  Search,
  Settings2,
  Sun,
  User,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LOGO_URL } from "@/lib/data";
import { planRelances, statutFactureEffectif } from "@/lib/erp";
import { useStore } from "@/lib/store";

/** Navigation principale : les 3 interfaces, dans le header. */
const NAV = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/dossiers", label: "Dossiers & Chiffrage", icon: FolderKanban },
  { to: "/configuration", label: "Configuration", icon: Settings2 },
] as const;

/** Modules secondaires dans la barre latérale. */
const SECONDARY = [
  { to: "/relances", label: "Relances commerciales", icon: BellRing },
  { to: "/factures", label: "Facturation", icon: Receipt },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const {
    sidebarOpen,
    setSidebarOpen,
    notifications,
    markNotificationsRead,
    dossiers,
    factures,
    relanceConfig,
    theme,
    toggleTheme,
  } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [quick, setQuick] = useState("");
  const unread = notifications.filter((n) => !n.lu).length;

  const compteurs = useMemo(() => {
    const dues = dossiers.flatMap((d) => planRelances(d, relanceConfig)).filter((r) => r.statut === "Due").length;
    const retard = factures.filter((f) => statutFactureEffectif(f) === "En retard").length;
    return { "/relances": dues, "/factures": retard } as Record<string, number>;
  }, [dossiers, factures, relanceConfig]);

  const go = () => {
    const q = quick.trim().toLowerCase();
    if (!q) return;
    const d = dossiers.find(
      (x) => x.ref.toLowerCase().includes(q) || x.client.toLowerCase().includes(q),
    );
    if (d) {
      navigate({ to: "/dossiers/$ref", params: { ref: d.ref } });
      setQuick("");
      return;
    }
    toast.error("Aucun dossier pour cette recherche");
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="min-h-screen">
        <motion.aside
          animate={{ width: sidebarOpen ? 240 : 64 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="glass fixed inset-y-0 left-0 z-40 hidden flex-col rounded-none border-y-0 border-l-0 md:flex"
        >
          <div className={`flex items-center px-3 pt-6 pb-4 ${sidebarOpen ? "" : "justify-center"}`}>
            <div
              className={`glass flex items-center justify-center rounded-xl bg-accent-soft/70 ${
                sidebarOpen ? "h-20 w-full" : "h-11 w-11"
              }`}
            >
              <img
                src={LOGO_URL}
                alt="Strongal"
                className={`rounded-lg object-contain dark:bg-white dark:p-1 ${sidebarOpen ? "h-12" : "h-8 w-8"}`}
              />
            </div>
          </div>

          {sidebarOpen && (
            <p className="px-5 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Suivi commercial
            </p>
          )}
          <nav className="flex flex-1 flex-col gap-1 px-2">
            {SECONDARY.map((item) => {
              const active = pathname.startsWith(item.to);
              const count = compteurs[item.to] ?? 0;
              const link = (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-accent-soft font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-accent-soft/60 hover:text-foreground"
                  } ${sidebarOpen ? "" : "justify-center px-0"}`}
                >
                  {active && (
                    <motion.span
                      layoutId="side-active"
                      className="absolute top-1.5 bottom-1.5 left-0 w-1 rounded-full bg-warm"
                    />
                  )}
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {sidebarOpen && <span className="flex-1 truncate">{item.label}</span>}
                  {count > 0 && (
                    <span
                      className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-warm px-1 text-[10px] font-semibold text-warm-foreground ${
                        sidebarOpen ? "" : "absolute top-0.5 right-1"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
              return sidebarOpen ? (
                link
              ) : (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          <div className="p-2">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent-soft hover:text-foreground ${
                sidebarOpen ? "" : "justify-center px-0"
              }`}
            >
              {sidebarOpen ? (
                <>
                  <ChevronLeft className="h-[18px] w-[18px]" /> Réduire
                </>
              ) : (
                <ChevronRight className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </motion.aside>

        <div className={`transition-[margin] duration-200 ${sidebarOpen ? "md:ml-[240px]" : "md:ml-16"}`}>
          <header className="glass sticky top-0 z-30 rounded-none border-x-0 border-t-0">
            <div className="flex items-center gap-3 px-4 py-2.5">
              <nav className="scroll-slim flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                {[...NAV, ...SECONDARY.map((s) => ({ ...s, mobile: true }))].map((item) => {
                  const active = pathname.startsWith(item.to);
                  const mobileOnly = "mobile" in item;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                        mobileOnly ? "md:hidden" : ""
                      } ${
                        active
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground hover:bg-accent-soft/60 hover:text-foreground"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="header-active"
                          className="absolute inset-0 -z-10 rounded-lg bg-accent-soft"
                        />
                      )}
                      <item.icon className={`h-4 w-4 ${active ? "text-warm" : ""}`} />
                      <span className="hidden sm:inline">{item.label}</span>
                      {active && (
                        <motion.span
                          layoutId="header-underline"
                          className="absolute right-3 -bottom-[11px] left-3 h-0.5 rounded-full bg-warm"
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="relative hidden w-64 lg:block">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={quick}
                  onChange={(e) => setQuick(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && go()}
                  placeholder="Dossier ou client…"
                  className="bg-background/70 pl-9"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Basculer le mode nuit"
                onClick={() => {
                  toggleTheme();
                  toast.success(theme === "dark" ? "Mode jour activé" : "Mode nuit activé");
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={theme}
                    initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                    transition={{ duration: 0.2 }}
                    className="flex"
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </motion.span>
                </AnimatePresence>
              </Button>

              <Popover onOpenChange={(o) => o && markNotificationsRead()}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unread > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-warm px-1 text-[10px] font-semibold text-warm-foreground">
                        {unread}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-96 p-0">
                  <div className="border-b px-4 py-3 text-sm font-semibold">Activité récente</div>
                  <div className="scroll-slim max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="border-b px-4 py-3 last:border-0">
                        <p className="text-sm">{n.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent-soft">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      MA
                    </span>
                    <span className="hidden text-left xl:block">
                      <span className="block text-sm leading-tight font-medium">M. Aboulssaad</span>
                      <span className="block text-xs text-muted-foreground">Strongal</span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => toast.success("Profil de M. Aboulssaad")}>
                    <User className="mr-2 h-4 w-4" /> Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/" })}>
                    <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
