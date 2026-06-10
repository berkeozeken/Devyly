"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import api from "@/lib/api";

export default function PasswordResetPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains("dark");
    html.classList.remove("dark");
    return () => {
      if (hadDark) html.classList.add("dark");
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post("/auth/password-reset/request/", { email: email.trim() });
      setSent(true);
    } catch {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-1.5">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <span className="font-bold text-xl tracking-tight text-foreground">Devyly</span>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: "var(--brand)" }}
            />
          </Link>
          <p className="text-sm text-muted-foreground">Şifreni sıfırla</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {sent ? (
            <div className="text-center space-y-3 py-2">
              <p className="text-sm text-foreground font-medium">Email gönderildi</p>
              <p className="text-sm text-muted-foreground">
                Eğer bu email kayıtlıysa şifre sıfırlama bağlantısı gönderildi. Gelen kutunu kontrol et.
              </p>
              <Link
                href="/login"
                className="block text-sm font-medium text-foreground hover:underline mt-2"
              >
                Giriş ekranına dön →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Email adresini gir, sana sıfırlama bağlantısı gönderelim.
              </p>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Giriş ekranına dön
          </Link>
        </p>

      </div>
    </div>
  );
}
