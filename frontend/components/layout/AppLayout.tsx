"use client";

import {
  Bell,
  Briefcase,
  Building2,
  FileText,
  Inbox,
  LogOut,
  Menu,
  Rss,
  Search,
  Settings,
  UserCheck,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import ChatWidget from "@/components/messages/ChatWidget";
import { getUser, setUser as storeUser, clearTokens } from "@/lib/auth";
import api from "@/lib/api";
import type { User, UserRole } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
const MEDIA_BASE = API_URL.replace(/\/api\/?$/, "");

function getPhotoUrl(photo: string | null | undefined): string | null {
  if (!photo) return null;
  if (photo.startsWith("http")) return photo;
  return `${MEDIA_BASE}${photo}`;
}

function getGenderAvatarClass(gender?: string | null): string {
  const g = gender?.toUpperCase();
  if (g === "MALE") return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
  if (g === "FEMALE") return "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300";
  return "bg-muted text-foreground";
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const developerNavItems: NavItem[] = [
  { label: "Feed",            href: "/feed",            icon: Rss         },
  { label: "Jobs",            href: "/jobs",            icon: Search      },
  { label: "Developers",      href: "/developers",      icon: Users       },
  { label: "Recruiters",      href: "/recruiters",      icon: UserCheck   },
  { label: "My Applications", href: "/my-applications", icon: FileText    },
];

const recruiterNavItems: NavItem[] = [
  { label: "Feed",         href: "/feed",                  icon: Rss       },
  { label: "Jobs",         href: "/jobs",                  icon: Search    },
  { label: "Developers",   href: "/developers",            icon: Users     },
  { label: "Recruiters",   href: "/recruiters",            icon: UserCheck },
  { label: "My Jobs",      href: "/my-jobs",               icon: Briefcase },
  { label: "Applications", href: "/received-applications", icon: Inbox     },
  { label: "Companies",    href: "/companies",             icon: Building2 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifUnread, setNotifUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Restore theme preference when entering app from public pages
    const savedTheme = localStorage.getItem("theme");
    const html = document.documentElement;
    if (savedTheme === "dark") {
      html.classList.add("dark");
    } else if (savedTheme === null && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      html.classList.add("dark");
    }

    const user = getUser();
    if (user) {
      setUserRole(user.role);
      setCurrentUser(user);
      // Fetch fresh user data to get absolute profile_photo URL
      api.get<User>("/auth/me/").then((res) => {
        setCurrentUser(res.data);
        const rememberMe = !!localStorage.getItem("access_token");
        storeUser(res.data, rememberMe);
      }).catch(() => {});
      api
        .get<{ unread_count: number }>("/notifications/unread-count/")
        .then((res) => setNotifUnread(res.data.unread_count))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleUserUpdated = (e: Event) => {
      const user = (e as CustomEvent<User | null>).detail;
      if (user) setCurrentUser(user);
    };
    window.addEventListener("devyly:user-updated", handleUserUpdated);
    return () => window.removeEventListener("devyly:user-updated", handleUserUpdated);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = currentUser?.first_name?.[0]?.toUpperCase() ?? null;
  const photoUrl = getPhotoUrl(currentUser?.profile_photo);
  const fullName = currentUser
    ? `${currentUser.first_name ?? ""} ${currentUser.last_name ?? ""}`.trim()
    : "";
  const roleLabel = currentUser?.role === "DEVELOPER" ? "Geliştirici" : "İşveren";

  const navItems =
    userRole === "DEVELOPER" ? developerNavItems
    : userRole === "RECRUITER" ? recruiterNavItems
    : [];

  const handleLogout = () => {
    clearTokens();
    window.location.replace("/");
  };

  return (
    <div className="min-h-screen text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-40 h-18 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 flex items-center gap-2">

          {/* Logo */}
          <Link href="/feed" className="flex items-center shrink-0 mr-4 group">
            <img
              src="/brand/devyly-logo-light-theme.png"
              alt="Devyly"
              className="block dark:hidden h-8 w-auto group-hover:opacity-75 transition-opacity"
            />
            <img
              src="/brand/devyly-logo-dark-theme.png"
              alt="Devyly"
              className="hidden dark:block h-8 w-auto group-hover:opacity-75 transition-opacity"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1">
            {navItems.map(({ label, href }) => {
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
          <div className="hidden lg:flex items-center gap-1 ml-auto">
            <Link
              href="/notifications"
              aria-label="Bildirimler"
              className="relative flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-card/60 transition-all"
            >
              <Bell size={17} />
              {notifUnread > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: "var(--brand)",
                    boxShadow: "0 0 4px var(--brand)",
                  }}
                />
              )}
            </Link>
            {/* Profile dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                aria-label="Profil menüsü"
                className={[
                  "flex items-center justify-center w-9 h-9 rounded-full border overflow-hidden text-sm font-semibold transition-all",
                  photoUrl
                    ? "bg-muted/60 hover:bg-muted border-transparent hover:border-border"
                    : `${getGenderAvatarClass(currentUser?.gender)} border-transparent hover:opacity-90`,
                ].join(" ")}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={initials ?? ""}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  initials ?? <UserCircle size={18} className="text-muted-foreground" />
                )}
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3.5 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className={[
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden",
                        photoUrl ? "bg-muted" : getGenderAvatarClass(currentUser?.gender),
                      ].join(" ")}>
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={initials ?? ""}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          initials ?? <UserCircle size={16} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{fullName || "Kullanıcı"}</p>
                        <p className="text-xs text-muted-foreground">{roleLabel}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 h-10 rounded-xl text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <UserCircle size={15} className="text-muted-foreground shrink-0" />
                      Profilim
                    </Link>
                    {userRole === "DEVELOPER" && (
                      <Link
                        href="/cv-builder"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 h-10 rounded-xl text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <FileText size={15} className="text-muted-foreground shrink-0" />
                        CV Builder
                      </Link>
                    )}
                    <Link
                      href="/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 h-10 rounded-xl text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Settings size={15} className="text-muted-foreground shrink-0" />
                      Ayarlar
                    </Link>
                    <Link
                      href="/notifications"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 h-10 rounded-xl text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Bell size={15} className="text-muted-foreground shrink-0" />
                      Bildirimler
                    </Link>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={() => { setProfileMenuOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut size={15} className="shrink-0" />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right */}
          <div className="flex lg:hidden items-center gap-1 ml-auto">
            <Link
              href="/notifications"
              aria-label="Bildirimler"
              className="relative flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-card/60 transition-all"
            >
              <Bell size={17} />
              {notifUnread > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: "var(--brand)",
                    boxShadow: "0 0 4px var(--brand)",
                  }}
                />
              )}
            </Link>
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
            {navItems.map(({ label, href, icon: Icon }) => {
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
            <div className="pt-2 mt-2 border-t border-border space-y-0.5">
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
              >
                <UserCircle size={15} />
                Profil
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-muted/60 transition-all"
              >
                <LogOut size={15} />
                Çıkış Yap
              </button>
            </div>
          </nav>
        </div>
      )}

      <main className="min-h-[calc(100vh-72px)]">{children}</main>

      {userRole && !pathname?.startsWith("/messages") && <ChatWidget />}
    </div>
  );
}
