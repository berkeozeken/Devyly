"use client";

import {
  Briefcase,
  Building2,
  UserCircle,
  Search,
  FileText,
  Inbox,
  LogOut,
  Rss,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getUser, clearTokens } from "@/lib/auth";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const developerNavItems: NavItem[] = [
  { label: "Feed", href: "/feed", icon: Rss },
  { label: "Jobs", href: "/jobs", icon: Search },
  { label: "My Applications", href: "/my-applications", icon: FileText },
  { label: "Profile", href: "/profile", icon: UserCircle },
];

const recruiterNavItems: NavItem[] = [
  { label: "Feed", href: "/feed", icon: Rss },
  { label: "My Jobs", href: "/my-jobs", icon: Briefcase },
  { label: "Received Applications", href: "/received-applications", icon: Inbox },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Profile", href: "/profile", icon: UserCircle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const user = getUser();
    if (user) setUserRole(user.role);
  }, []);

  const visibleItems =
    userRole === "DEVELOPER"
      ? developerNavItems
      : userRole === "RECRUITER"
      ? recruiterNavItems
      : [];

  const handleLogout = () => {
    clearTokens();
    router.push("/feed");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r flex flex-col">
        <div className="px-6 py-5 border-b">
          <span className="text-lg font-bold text-gray-800">Devyly</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleItems.map(({ label, href, icon: Icon }) => {
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

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
