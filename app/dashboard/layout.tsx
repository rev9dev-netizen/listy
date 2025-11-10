"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SparklesIcon,
  LayoutDashboardIcon,
  KeyIcon,
  FileTextIcon,
  FolderIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { name: "Projects", href: "/dashboard/projects", icon: FolderIcon },
  { name: "Keywords", href: "/dashboard/keywords", icon: KeyIcon },
  { name: "Listing Builder", href: "/dashboard/listing", icon: FileTextIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top Navbar */}
      <header className="flex h-16 items-center justify-between border-b bg-background px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Listy</span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("gap-2", isActive && "bg-secondary")}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1800px] p-6">{children}</div>
      </main>
    </div>
  );
}
