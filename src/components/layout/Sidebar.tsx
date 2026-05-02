"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Coins, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { CurrencyToggle } from "./CurrencyToggle";
import { BalanceVisibilityToggle } from "./BalanceVisibilityToggle";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/monthly", label: "Monthly", icon: CalendarDays },
  { href: "/crypto", label: "Crypto", icon: Coins },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-background">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-lg font-semibold">Portfolio</h1>
        <ThemeToggle />
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3 space-y-3">
        <BalanceVisibilityToggle />
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Display currency</p>
          <CurrencyToggle />
        </div>
      </div>
    </aside>
  );
}
