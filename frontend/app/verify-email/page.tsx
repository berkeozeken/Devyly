"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import api from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error" | "invalid">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!uid || !token) {
      setStatus("invalid");
      return;
    }

    api
      .post("/auth/email-verification/verify/", { uid, token })
      .then((res) => {
        const detail: string = (res.data as { detail?: string })?.detail ?? "";
        if (detail.includes("zaten")) {
          setStatus("success");
          setMessage("Email adresiniz zaten doğrulanmış.");
        } else {
          setStatus("success");
          setMessage("Email adresiniz başarıyla doğrulandı.");
        }
      })
      .catch((err: unknown) => {
        const detail =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Doğrulama linki geçersiz veya süresi dolmuş.";
        setStatus("error");
        setMessage(detail);
      });
  }, [uid, token]);

  if (status === "loading") {
    return (
      <div className="text-center space-y-2 py-4">
        <p className="text-sm text-muted-foreground">Doğrulanıyor...</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="text-center space-y-3 py-2">
        <p className="text-sm font-medium text-foreground">Geçersiz bağlantı</p>
        <p className="text-sm text-muted-foreground">
          Bu doğrulama bağlantısı eksik veya hatalı.
        </p>
        <Link
          href="/resend-verification"
          className="block text-sm font-medium text-foreground hover:underline mt-2"
        >
          Yeni doğrulama emaili iste →
        </Link>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-3 py-2">
        <p className="text-sm font-medium text-foreground">Doğrulama başarılı</p>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Link
          href="/login"
          className="block text-sm font-medium text-foreground hover:underline mt-2"
        >
          Giriş yap →
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center space-y-3 py-2">
      <p className="text-sm font-medium text-foreground">Doğrulama başarısız</p>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link
        href="/resend-verification"
        className="block text-sm font-medium text-foreground hover:underline mt-2"
      >
        Yeni doğrulama emaili iste →
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
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
          <p className="text-sm text-muted-foreground">Email doğrulama</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <Suspense fallback={<p className="text-sm text-muted-foreground text-center py-4">Yükleniyor...</p>}>
            <VerifyEmailContent />
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
