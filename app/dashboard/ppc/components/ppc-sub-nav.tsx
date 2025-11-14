"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Megaphone,
  Key,
  Zap,
  BarChart3,
  Settings,
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard/ppc",
    icon: LayoutDashboard,
  },
  {
    title: "Campaigns",
    href: "/dashboard/ppc/campaigns",
    icon: Megaphone,
  },
  {
    title: "Keywords",
    href: "/dashboard/ppc/keywords",
    icon: Key,
  },
  {
    title: "Automation",
    href: "/dashboard/ppc/automation",
    icon: Zap,
  },
  {
    title: "Reports",
    href: "/dashboard/ppc/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/dashboard/ppc/settings",
    icon: Settings,
  },
];

export function PpcSubNav() {
  const pathname = usePathname();

  return (
    <div className="border-b bg-background">
      <div className="container mx-auto">
        <nav className="flex space-x-1 overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
