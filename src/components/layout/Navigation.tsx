import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  PiggyBank,
  Target,
  BarChart3,
  Sparkles,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/income", label: "Income", icon: Wallet },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/jars", label: "Jars", icon: PiggyBank },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/coach", label: "Coach", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const MOBILE_ITEMS = NAV_ITEMS.filter((item) =>
  ["/dashboard", "/income", "/expenses", "/goals", "/coach"].includes(item.to),
);

export function SideNav() {
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground hover:translate-x-0.5"
          activeProps={{
            className: "bg-lime-400 text-black shadow-sm hover:bg-lime-400 hover:translate-x-0",
          }}
        >
          <Icon
            className="h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110"
            aria-hidden="true"
          />
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {MOBILE_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <li key={to} className="relative">
              {active ? (
                <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-lime-400 transition-all duration-300" />
              ) : null}
              <Link
                to={to}
                className={cn(
                  "tap-scale flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-all duration-200",
                  active ? "text-lime-700" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("h-5 w-5 transition-transform duration-200", active && "-translate-y-0.5")}
                  aria-hidden="true"
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
