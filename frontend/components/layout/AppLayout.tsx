"use client";

import {
  Bell,
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
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getUser, clearTokens } from "@/lib/auth";
import api from "@/lib/api";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  showBadge?: boolean;
}

const developerNavItems: NavItem[] = [
  { label: "Feed",            href: "/feed",             icon: Rss      },
  { label: "Jobs",            href: "/jobs",             icon: Search   },
  { label: "My Applications", href: "/my-applications",  icon: FileText },
  { label: "Notifications",   href: "/notifications",    icon: Bell, showBadge: true },
  { label: "Profile",         href: "/profile",          icon: UserCircle },
];

const recruiterNavItems: NavItem[] = [
  { label: "Feed",                  href: "/feed",                  icon: Rss      },
  { label: "My Jobs",               href: "/my-jobs",               icon: Briefcase },
  { label: "Received Applications", href: "/received-applications", icon: Inbox    },
  { label: "Companies",             href: "/companies",             icon: Building2 },
  { label: "Notifications",         href: "/notifications",         icon: Bell, showBadge: true },
  { label: "Profile",               href: "/profile",               icon: UserCircle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = getUser();
    if (user) {
      setUserRole(user.role);
      api
        .get<{ unread_count: number }>("/notifications/unread-count/")
        .then((res) => setUnreadCount(res.data.unread_count))
        .catch(() => {});
    }
  }, []);

  const visibleItems =
    userRole === "DEVELOPER"
      ? developerNavItems
      : userRole === "RECRUITER"
      ? recruiterNavItems
      : [];

  const handleLogout = () => {
    clearTokens();
    window.location.replace("/feed");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r flex flex-col">
        <div className="px-6 py-5 border-b">
          <span className="text-lg font-bold text-gray-800">Devyly</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleItems.map(({ label, href, icon: Icon, showBadge }) => {
            const active = pathname === href;
            const badge = showBadge ? unreadCount : 0;
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
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span className="text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5 min-w-5 text-center leading-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
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
