"use client";

import {
  LayoutDashboard,
  Briefcase,
  Columns3,
  Building2,
  CalendarDays,
  StickyNote,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { clearTokens } from "@/lib/auth";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Kanban", href: "/kanban", icon: Columns3 },
  { label: "Applications", href: "/applications", icon: Briefcase },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Interviews", href: "/interviews", icon: CalendarDays },
  { label: "Notes", href: "/notes", icon: StickyNote },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearTokens();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b">
          <span className="text-lg font-bold text-gray-800">Devyly</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-gray-500 hover:text-red-500"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Çıkış Yap
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
