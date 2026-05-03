"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Coins, Settings, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import { CurrencyToggle } from "./CurrencyToggle";
import { BalanceVisibilityToggle } from "./BalanceVisibilityToggle";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/monthly", label: "Monthly", icon: CalendarDays },
  { href: "/crypto", label: "Crypto", icon: Coins },
  { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
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
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors",
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
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex h-screen sticky top-0 w-56 flex-col border-r bg-background">
      <SidebarContent />
    </aside>
  );
}

export function MobileTopBar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="flex md:hidden items-center justify-between border-b bg-background/80 backdrop-blur px-3 py-2 sticky top-0 z-40">
        <Button
          variant="ghost"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="h-11 w-11 p-0"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-base font-semibold">Portfolio</h1>
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
