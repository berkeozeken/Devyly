"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Code2,
  FileText,
  MessageSquare,
  Rss,
  Search,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { isAuthenticated } from "@/lib/auth";

/* ── Feature data ────────────────────────────────────────────── */

const DEV_FEATURES = [
  { icon: Code2,         text: "Güçlü geliştirici profili oluştur" },
  { icon: FileText,      text: "CV Builder ile profesyonel CV hazırla" },
  { icon: Search,        text: "İş ilanlarına tek tıkla başvur" },
  { icon: Rss,           text: "Feed'de görünür ol, toplulukla bağlan" },
  { icon: MessageSquare, text: "Recruiter'larla doğrudan mesajlaş" },
];

const REC_FEATURES = [
  { icon: Building2,     text: "Şirket profili ve marka sayfası oluştur" },
  { icon: Briefcase,     text: "İş ilanı yayınla, geniş kitleye ulaş" },
  { icon: Users,         text: "Yetkinliğe göre developer keşfet" },
  { icon: CheckCircle2,  text: "Başvuruları verimli şekilde yönet" },
  { icon: MessageSquare, text: "Adaylarla hızlı iletişim kur" },
];

const PLATFORM_FEATURES = [
  {
    icon: Code2,
    title: "Geliştirici Profili",
    desc: "Deneyimini, projelerini ve becerilerini öne çıkar. İşverenlere kalıcı bir izlenim bırak.",
  },
  {
    icon: FileText,
    title: "CV Builder",
    desc: "Birden fazla CV, dil desteği ve tek tıkla PDF çıktısı. Başvuruya özel uyarla.",
  },
  {
    icon: Search,
    title: "Akıllı İş Başvuruları",
    desc: "İş ilanlarını keşfet, başvuru durumunu takip et ve teklif sürecini yönet.",
  },
  {
    icon: Users,
    title: "Developer Keşfi",
    desc: "Recruiter'lar için yetkinliğe göre filtreli developer havuzu. Doğru adayı hızla bul.",
  },
  {
    icon: MessageSquare,
    title: "Dahili Mesajlaşma",
    desc: "Developer ve recruiter'lar platformdan çıkmadan direkt iletişim kuruyor.",
  },
  {
    icon: Zap,
    title: "Anlık Bildirimler",
    desc: "Başvuru güncellemeleri, mesajlar ve fırsatlar için anlık uyarılar.",
  },
];

/* ── Landing Navbar ──────────────────────────────────────────── */

function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b" style={{ borderColor: "#e2e8f0", backgroundColor: "rgba(248,250,252,0.85)", backdropFilter: "blur(16px)" }}>
      <div className="mx-auto max-w-6xl h-16 px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/brand/devyly-logo-light-theme.png" alt="Devyly" className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="h-9 px-4 rounded-xl text-sm font-medium transition-colors flex items-center"
            style={{ color: "#64748b" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#0f172a"; (e.currentTarget as HTMLElement).style.backgroundColor = "#f1f5f9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#64748b"; (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="h-9 px-4 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-opacity"
            style={{ backgroundColor: "#0f172a", color: "#ffffff" }}
          >
            Üye Ol <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ── Landing ─────────────────────────────────────────────────── */

function Landing() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", color: "#0f172a" }}>
      <LandingNav />
      <main>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium mb-6"
            style={{
              backgroundColor: "rgba(8,145,178,0.08)",
              borderColor: "rgba(8,145,178,0.25)",
              color: "#0891b2",
            }}
          >
            <Sparkles size={11} />
            Developer odaklı kariyer platformu
          </div>

          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-5 leading-tight"
            style={{ color: "#0f172a" }}
          >
            Yazılımcıların daha iyi iş
            <br />
            <span style={{ color: "#0891b2" }}>bulmasına yardımcı oluyoruz</span>
          </h1>

          <p
            className="text-lg max-w-2xl mx-auto mb-9 leading-relaxed"
            style={{ color: "#475569" }}
          >
            Devyly; profil oluşturmaktan CV hazırlamaya, iş başvurularından recruiter
            iletişimine kadar yazılımcıların tüm kariyer sürecini tek platformda buluşturuyor.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/login"
              className="h-11 px-6 rounded-xl text-sm font-medium flex items-center transition-colors"
              style={{ border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#0f172a" }}
            >
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="h-11 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#0891b2", color: "#ffffff" }}
            >
              Ücretsiz Başla <ArrowRight size={15} />
            </Link>
          </div>

          {/* Social proof hint */}
          <p className="mt-6 text-xs" style={{ color: "#94a3b8" }}>
            Ücretsiz &middot; Kredi kartı gerekmez &middot; Dakikalar içinde başla
          </p>
        </section>

        {/* Persona split */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <p className="text-center text-sm font-medium mb-4" style={{ color: "#64748b" }}>
            Kim olduğunu seç, sana özel yolculuğa başla
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Developer card */}
            <div
              className="rounded-2xl p-6 space-y-4"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "rgba(59,130,246,0.10)" }}
                    >
                      <Code2 size={15} style={{ color: "#3b82f6" }} />
                    </div>
                    <h2 className="text-sm font-bold" style={{ color: "#0f172a" }}>Yazılımcıysan, doğru yerdesin</h2>
                  </div>
                  <p className="text-xs ml-10.5" style={{ color: "#64748b" }}>
                    Görünürlüğünü artır, doğru fırsatları yakala.
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {DEV_FEATURES.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm" style={{ color: "#475569" }}>
                    <Icon size={13} style={{ color: "#3b82f6", flexShrink: 0 }} />
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?role=developer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                style={{ color: "#3b82f6" }}
              >
                Developer olarak ücretsiz kaydol <ArrowRight size={13} />
              </Link>
            </div>

            {/* Recruiter card */}
            <div
              className="rounded-2xl p-6 space-y-4"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "rgba(139,92,246,0.10)" }}
                    >
                      <Building2 size={15} style={{ color: "#8b5cf6" }} />
                    </div>
                    <h2 className="text-sm font-bold" style={{ color: "#0f172a" }}>Doğru developer&apos;ı daha hızlı bul</h2>
                  </div>
                  <p className="text-xs" style={{ color: "#64748b", marginLeft: "2.625rem" }}>
                    Geliştiricileri yetkinliğe göre keşfet, hızla iletişim kur.
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {REC_FEATURES.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm" style={{ color: "#475569" }}>
                    <Icon size={13} style={{ color: "#8b5cf6", flexShrink: 0 }} />
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?role=recruiter"
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                style={{ color: "#8b5cf6" }}
              >
                Recruiter / HR olarak ücretsiz kaydol <ArrowRight size={13} />
              </Link>
            </div>

          </div>
        </section>

        {/* Platform features */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold mb-2" style={{ color: "#0f172a" }}>
              Neden Devyly?
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: "#64748b" }}>
              Sadece bir iş listesi değil — developer ve recruiter arasında daha akıllı bir köprü.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLATFORM_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-5 space-y-2.5"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#f1f5f9" }}
                >
                  <Icon size={14} style={{ color: "#64748b" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div
            className="rounded-2xl px-6 py-12 text-center space-y-5"
            style={{
              background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
            }}
          >
            <h2 className="text-xl font-bold" style={{ color: "#ffffff" }}>
              Kariyerine farklı bir başlangıç yap
            </h2>
            <p className="text-sm max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.80)" }}>
              Ücretsiz hesap oluştur. Profilini oluştur, CV&apos;ni hazırla,
              fırsatları yakala.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/register?role=developer"
                className="h-10 px-5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#ffffff", color: "#0891b2" }}
              >
                <Code2 size={14} /> Developer Olarak Başla
              </Link>
              <Link
                href="/register?role=recruiter"
                className="h-10 px-5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-90"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.30)" }}
              >
                <Building2 size={14} /> Recruiter Olarak Başla
              </Link>
            </div>
          </div>
        </section>

      </main>

      <footer style={{ borderTop: "1px solid #e2e8f0", padding: "1.5rem 1rem" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs" style={{ color: "#94a3b8" }}>
          <span>© 2025 Devyly</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-slate-600 transition-colors">Giriş Yap</Link>
            <Link href="/register" className="hover:text-slate-600 transition-colors">Üye Ol</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Root page — auth gate + always-light ───────────────────── */

export default function RootPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains("dark");
    html.classList.remove("dark");

    if (isAuthenticated()) {
      if (hadDark) html.classList.add("dark");
      router.replace("/feed");
    } else {
      setReady(true);
    }

    return () => {
      if (hadDark) html.classList.add("dark");
    };
  }, [router]);

  if (!ready) return null;
  return <Landing />;
}
