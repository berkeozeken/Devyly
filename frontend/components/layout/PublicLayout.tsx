"use client";

import { Menu, Rss, Search, UserCheck, Users, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const publicNavItems = [
  { label: "Feed",       href: "/feed",       icon: Rss       },
  { label: "Jobs",       href: "/jobs",       icon: Search    },
  { label: "Developers", href: "/developers", icon: Users     },
  { label: "Recruiters", href: "/recruiters", icon: UserCheck },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-40 h-18 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 flex items-center gap-2">

          {/* Logo */}
          <Link href="/feed" className="flex items-center gap-2 shrink-0 mr-4 group">
            <span className="font-semibold text-[17px] tracking-tight text-foreground group-hover:opacity-75 transition-opacity">
              Devyly
            </span>
            <span
              className="w-1.75 h-1.75 rounded-full shrink-0"
              style={{
                backgroundColor: "var(--brand)",
                boxShadow: "0 0 6px var(--brand)",
              }}
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1">
            {publicNavItems.map(({ label, href }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "inline-flex items-center h-9 px-4 rounded-full text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-card text-foreground border border-border shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/60",
                  ].join(" ")}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right */}
          <div className="hidden lg:flex items-center gap-2 ml-auto">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Giriş Yap
            </Link>
            <Link
              href="/register/developer"
              className="text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 px-5 py-2 rounded-full transition-all shadow-sm"
            >
              Kaydol
            </Link>
          </div>

          {/* Mobile Right */}
          <div className="flex lg:hidden items-center gap-1 ml-auto">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menü"
              className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-card/60 transition-all"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-b border-border bg-card/95 backdrop-blur-xl">
          <nav className="px-4 py-3 space-y-0.5 max-w-7xl mx-auto">
            {publicNavItems.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  ].join(" ")}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
            <div className="pt-2 mt-2 border-t border-border flex gap-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-sm font-medium px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
              >
                Giriş Yap
              </Link>
              <Link
                href="/register/developer"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 px-3 py-2.5 rounded-full transition-all"
              >
                Kaydol
              </Link>
            </div>
          </nav>
        </div>
      )}

      <main className="min-h-[calc(100vh-72px)]">{children}</main>
    </div>
  );
}
