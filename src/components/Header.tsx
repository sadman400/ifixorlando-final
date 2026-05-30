import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  CalendarClock,
  LayoutDashboard,
  LogOut,
  Package,
  RefreshCw,
  Tags,
  Users,
  Wrench,
} from "lucide-react";

const navItems = [
  { to: "/" as const, label: "Dashboard", icon: LayoutDashboard },
  { to: "/appointments" as const, label: "Appointments", icon: CalendarClock },
  { to: "/clients" as const, label: "Clients", icon: Users },
  { to: "/stocks" as const, label: "Inventory", icon: Package },
  { to: "/pricing" as const, label: "Pricing", icon: Tags },
];

export function Header() {
  const location = useLocation();

  const isItemActive = (to: string) =>
    location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  };

  const refresh = () => {
    window.location.reload();
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary sm:h-9 sm:w-9">
              <Wrench className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              iFixOrlando
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = isItemActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  <item.icon
                    className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span className={isActive ? "text-foreground" : "text-muted-foreground"}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-accent"
                      style={{ zIndex: -1 }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={refresh}
              aria-label="Refresh page"
              title="Refresh"
              className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg border border-sky-400/20 bg-sky-500/10 text-sky-400 transition-colors hover:border-sky-400/40 hover:bg-sky-500/15 hover:text-sky-300"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={logout}
              className="ml-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </header>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-6">
          {navItems.map((item) => {
            const isActive = isItemActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium"
              >
                <item.icon
                  className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className={isActive ? "text-foreground" : "text-muted-foreground"}>
                  {item.label}
                </span>
              </Link>
              );
            })}
          <button
            type="button"
            onClick={refresh}
            className="flex flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium text-sky-400"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium text-muted-foreground"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
