"use client";

import { Rss, Search, FileText, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const publicNavItems = [
  { label: "Feed", href: "/feed", icon: Rss },
  { label: "Jobs", href: "/jobs", icon: Search },
  { label: "My Applications", href: "/login?next=/my-applications", icon: FileText },
  { label: "Profile", href: "/login?next=/profile", icon: UserCircle },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 shrink-0 bg-white border-r flex flex-col">
        <div className="px-6 py-5 border-b">
          <Link href="/feed" className="text-lg font-bold text-gray-800">
            Devyly
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {publicNavItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={label}
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
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-end items-center gap-3 px-6 py-3 bg-white border-b">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            Giriş Yap
          </Link>
          <Link
            href="/register/developer"
            className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-700"
          >
            Kaydol
          </Link>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
