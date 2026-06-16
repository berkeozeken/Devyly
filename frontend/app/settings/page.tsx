"use client";

import { CheckCircle2, ChevronDown, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import api from "@/lib/api";
import { setUser as persistUser } from "@/lib/auth";
import { PHONE_VERIFICATION_UI_ENABLED } from "@/lib/featureFlags";
import type { User } from "@/types";

// ─── Country data ─────────────────────────────────────────────────────────────

interface Country {
  flag: string;
  name: string;
  code: string;
  placeholder: string;
}

const COUNTRIES: Country[] = [
  { flag: "🇹🇷", name: "Türkiye",        code: "+90",  placeholder: "5XX XXX XX XX" },
  { flag: "🇺🇸", name: "United States",  code: "+1",   placeholder: "XXX XXX XXXX" },
  { flag: "🇬🇧", name: "United Kingdom", code: "+44",  placeholder: "7XXX XXXXXX"  },
  { flag: "🇩🇪", name: "Germany",        code: "+49",  placeholder: "XXX XXXXXXX"  },
  { flag: "🇫🇷", name: "France",         code: "+33",  placeholder: "X XX XX XX XX"},
  { flag: "🇳🇱", name: "Netherlands",    code: "+31",  placeholder: "X XXXX XXXX"  },
  { flag: "🇧🇪", name: "Belgium",        code: "+32",  placeholder: "XXX XX XX XX" },
  { flag: "🇨🇭", name: "Switzerland",    code: "+41",  placeholder: "XX XXX XX XX" },
  { flag: "🇦🇹", name: "Austria",        code: "+43",  placeholder: "XXX XXXXXXX"  },
  { flag: "🇸🇪", name: "Sweden",         code: "+46",  placeholder: "XX XXX XXXX"  },
  { flag: "🇳🇴", name: "Norway",         code: "+47",  placeholder: "XXX XX XXX"   },
  { flag: "🇩🇰", name: "Denmark",        code: "+45",  placeholder: "XX XX XX XX"  },
  { flag: "🇫🇮", name: "Finland",        code: "+358", placeholder: "XX XXX XXXX"  },
  { flag: "🇵🇱", name: "Poland",         code: "+48",  placeholder: "XXX XXX XXX"  },
  { flag: "🇷🇴", name: "Romania",        code: "+40",  placeholder: "XXX XXX XXX"  },
  { flag: "🇨🇿", name: "Czechia",        code: "+420", placeholder: "XXX XXX XXX"  },
  { flag: "🇭🇺", name: "Hungary",        code: "+36",  placeholder: "XX XXX XXXX"  },
  { flag: "🇬🇷", name: "Greece",         code: "+30",  placeholder: "XXX XXX XXXX" },
  { flag: "🇵🇹", name: "Portugal",       code: "+351", placeholder: "XXX XXX XXX"  },
  { flag: "🇪🇸", name: "Spain",          code: "+34",  placeholder: "XXX XXX XXX"  },
  { flag: "🇮🇹", name: "Italy",          code: "+39",  placeholder: "XXX XXX XXXX" },
  { flag: "🇷🇺", name: "Russia",         code: "+7",   placeholder: "XXX XXX XX XX"},
  { flag: "🇺🇦", name: "Ukraine",        code: "+380", placeholder: "XX XXX XXXX"  },
  { flag: "🇦🇿", name: "Azerbaijan",     code: "+994", placeholder: "XX XXX XXXX"  },
  { flag: "🇰🇿", name: "Kazakhstan",     code: "+7",   placeholder: "XXX XXX XXXX" },
  { flag: "🇸🇦", name: "Saudi Arabia",   code: "+966", placeholder: "5X XXX XXXX"  },
  { flag: "🇦🇪", name: "UAE",            code: "+971", placeholder: "5X XXX XXXX"  },
  { flag: "🇮🇷", name: "Iran",           code: "+98",  placeholder: "9XX XXX XXXX" },
  { flag: "🇮🇱", name: "Israel",         code: "+972", placeholder: "5X XXX XXXX"  },
  { flag: "🇮🇳", name: "India",          code: "+91",  placeholder: "XXXXX XXXXX"  },
  { flag: "🇨🇳", name: "China",          code: "+86",  placeholder: "XXX XXXX XXXX"},
  { flag: "🇯🇵", name: "Japan",          code: "+81",  placeholder: "XX XXXX XXXX" },
  { flag: "🇰🇷", name: "South Korea",    code: "+82",  placeholder: "XX XXXX XXXX" },
  { flag: "🇨🇦", name: "Canada",         code: "+1",   placeholder: "XXX XXX XXXX" },
  { flag: "🇧🇷", name: "Brazil",         code: "+55",  placeholder: "XX XXXXX XXXX"},
  { flag: "🇦🇺", name: "Australia",      code: "+61",  placeholder: "XXX XXX XXX"  },
];

// ─── Country Dropdown ─────────────────────────────────────────────────────────

interface CountryDropdownProps {
  selected: Country;
  onChange: (c: Country) => void;
  disabled?: boolean;
}

function CountryDropdown({ selected, onChange, disabled }: CountryDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-input bg-muted/40 text-sm text-foreground hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="font-medium tabular-nums">{selected.code}</span>
        <ChevronDown size={13} className={`text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 max-h-64 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
          {COUNTRIES.map((c) => (
            <button
              key={`${c.code}-${c.name}`}
              type="button"
              onClick={() => { onChange(c); setOpen(false); }}
              className={[
                "w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors",
                selected.name === c.name && selected.code === c.code
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground",
              ].join(" ")}
            >
              <span className="text-base leading-none w-6 text-center shrink-0">{c.flag}</span>
              <span className="flex-1 truncate">{c.name}</span>
              <span className="tabular-nums text-muted-foreground shrink-0">{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Phone Verification Card ─────────────────────────────────────────────────

function PhoneVerificationCard() {
  const [user, setUser] = useState<User | null>(null);
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [localNumber, setLocalNumber] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"idle" | "otp_sent">("idle");
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const fullPhone = `${country.code}${localNumber.replace(/\s/g, "")}`;

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => {
      setUser(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleRequest = async () => {
    if (!localNumber.trim()) { toast.error("Telefon numarası girin."); return; }
    setRequesting(true);
    try {
      await api.post("/auth/phone-verification/request/", { phone_number: fullPhone });
      setStep("otp_sent");
      setCooldown(60);
      toast.success("Doğrulama kodu gönderildi. Terminali kontrol edin.");
    } catch (err: unknown) {
      const httpStatus = (err as { response?: { status?: number } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (httpStatus === 429) {
        toast.error(detail || "Lütfen 60 saniye bekleyin.");
      } else {
        toast.error(detail || "Kod gönderilemedi.");
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) { toast.error("Doğrulama kodunu girin."); return; }
    setVerifying(true);
    try {
      await api.post("/auth/phone-verification/verify/", {
        phone_number: fullPhone,
        code: code.trim(),
      });
      const updatedUser = user ? { ...user, phone_number: fullPhone, is_phone_verified: true } : null;
      setUser(updatedUser as User);
      if (updatedUser) persistUser(updatedUser);
      setStep("idle");
      setCode("");
      toast.success("Telefon numaranız doğrulandı!");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "Doğrulama başarısız.");
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = () => {
    setStep("idle");
    setCode("");
  };

  if (!user) return null;

  if (user.is_phone_verified) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Telefon Doğrulama</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Hesabınıza bağlı telefon numaranız.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={16} />
          <span className="font-medium">Doğrulandı</span>
          {user.phone_number && (
            <span className="text-muted-foreground font-normal ml-1">{user.phone_number}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Telefon Doğrulama</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Telefon numaranızı doğrulayarak hesabınıza güven katmanı ekleyin.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Telefon Numarası</label>
          <div className="flex gap-2">
            <CountryDropdown
              selected={country}
              onChange={(c) => { setCountry(c); setLocalNumber(""); }}
              disabled={step === "otp_sent"}
            />
            <input
              type="tel"
              placeholder={country.placeholder}
              value={localNumber}
              onChange={(e) => setLocalNumber(e.target.value)}
              disabled={step === "otp_sent"}
              className="flex-1 min-w-0 h-10 px-3 rounded-xl border border-input bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              onClick={step === "otp_sent" ? handleReset : handleRequest}
              disabled={requesting || (step === "idle" && cooldown > 0)}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap shrink-0"
            >
              {step === "otp_sent"
                ? "Değiştir"
                : requesting
                  ? "Gönderiliyor..."
                  : cooldown > 0
                    ? `Tekrar (${cooldown}s)`
                    : "Kod Gönder"}
            </button>
          </div>
        </div>

        {step === "otp_sent" && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Doğrulama Kodu</label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="6 haneli kod"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="flex-1 h-10 px-3 rounded-xl border border-input bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all tracking-widest"
              />
              <button
                onClick={handleVerify}
                disabled={verifying || code.length !== 6}
                className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
              >
                {verifying ? "Doğrulanıyor..." : "Kodu Doğrula"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Kod terminalde görünmektedir. Kod 10 dakika geçerlidir.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

function SettingsContent() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const applyTheme = (t: "light" | "dark") => {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("theme", t);
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ayarlar</h1>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Görünüm</h2>
            <p className="text-sm text-muted-foreground mt-1">Uygulama temasını buradan değiştirebilirsiniz.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => applyTheme("light")}
              className={[
                "flex-1 flex items-center justify-center gap-2.5 h-11 px-4 rounded-xl text-sm font-medium border transition-all duration-150",
                theme === "light"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-border-strong hover:text-foreground",
              ].join(" ")}
            >
              <Sun size={15} />
              Açık Tema
            </button>
            <button
              onClick={() => applyTheme("dark")}
              className={[
                "flex-1 flex items-center justify-center gap-2.5 h-11 px-4 rounded-xl text-sm font-medium border transition-all duration-150",
                theme === "dark"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-border-strong hover:text-foreground",
              ].join(" ")}
            >
              <Moon size={15} />
              Koyu Tema
            </button>
          </div>
        </div>

        {PHONE_VERIFICATION_UI_ENABLED && <PhoneVerificationCard />}

      </div>
    </AppLayout>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
