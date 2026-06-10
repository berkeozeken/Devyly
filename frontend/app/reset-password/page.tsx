"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import api from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!uid || !token) {
    return (
      <div className="text-center space-y-3 py-2">
        <p className="text-sm font-medium text-foreground">Geçersiz sıfırlama bağlantısı</p>
        <p className="text-sm text-muted-foreground">
          Bu bağlantı geçersiz veya eksik. Lütfen tekrar şifre sıfırlama talebinde bulunun.
        </p>
        <Link
          href="/password-reset"
          className="block text-sm font-medium text-foreground hover:underline mt-2"
        >
          Yeni sıfırlama bağlantısı iste →
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-3 py-2">
        <p className="text-sm font-medium text-foreground">Şifre güncellendi</p>
        <p className="text-sm text-muted-foreground">
          Şifreniz başarıyla sıfırlandı. Giriş ekranına yönlendiriliyorsunuz...
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Lütfen tüm alanları doldurun.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/password-reset/confirm/", {
        uid,
        token,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string; new_password?: string[] } } })
          ?.response?.data?.detail ||
        (err as { response?: { data?: { new_password?: string[] } } })
          ?.response?.data?.new_password?.[0] ||
        "Bir hata oluştu. Bağlantı geçersiz veya süresi dolmuş olabilir.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">Hesabın için yeni bir şifre belirle.</p>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="new-password" className="text-sm font-medium text-foreground">
          Yeni Şifre
        </label>
        <div className="relative">
          <input
            id="new-password"
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full h-10 px-3 pr-10 rounded-xl border border-input bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
          Şifre Tekrar
        </label>
        <div className="relative">
          <input
            id="confirm-password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full h-10 px-3 pr-10 rounded-xl border border-input bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? "Kaydediliyor..." : "Şifremi Güncelle"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains("dark");
    html.classList.remove("dark");
    return () => {
      if (hadDark) html.classList.add("dark");
    };
  }, []);

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
          <p className="text-sm text-muted-foreground">Yeni şifre belirle</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <Suspense fallback={<p className="text-sm text-muted-foreground text-center py-4">Yükleniyor...</p>}>
            <ResetPasswordForm />
          </Suspense>
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
