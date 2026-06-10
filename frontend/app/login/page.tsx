"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import api from "@/lib/api";
import { setTokens, setUser } from "@/lib/auth";
import type { AuthTokens, UserRole } from "@/types";

const DEVELOPER_ROUTES = ["/my-applications"];
const RECRUITER_ROUTES = ["/my-jobs", "/received-applications", "/companies"];

function isRouteAccessible(path: string, role: UserRole): boolean {
  if (DEVELOPER_ROUTES.some((r) => path.startsWith(r))) return role === "DEVELOPER";
  if (RECRUITER_ROUTES.some((r) => path.startsWith(r))) return role === "RECRUITER";
  return true;
}

const loginSchema = z.object({
  email: z.string().email("Geçerli bir email adresi girin"),
  password: z.string().min(1, "Şifre zorunludur"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const justRegistered = searchParams?.get("registered") === "true";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setEmailNotVerified(false);
    try {
      const res = await api.post<AuthTokens>("/auth/login/", data);
      setTokens(res.data.access, res.data.refresh, rememberMe);
      setUser(res.data.user, rememberMe);
      toast.success("Giriş başarılı!");
      const next = searchParams?.get("next") || "";
      const role = res.data.user.role;
      if (next && isRouteAccessible(next, role)) {
        router.push(next);
      } else {
        router.push("/feed");
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string; non_field_errors?: string[] } } })
          ?.response?.data?.detail ||
        (err as { response?: { data?: { non_field_errors?: string[] } } })
          ?.response?.data?.non_field_errors?.[0] ||
        "Giriş başarısız. Email veya şifre hatalı.";
      if (message.includes("doğrulamadan giriş")) {
        setEmailNotVerified(true);
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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
        <p className="text-sm text-muted-foreground">Hesabınıza giriş yapın</p>
      </div>

      {justRegistered && !emailNotVerified && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 space-y-1">
          <p className="text-sm font-medium text-blue-800">Hesabınız oluşturuldu</p>
          <p className="text-xs text-blue-700">
            Email adresinize bir doğrulama bağlantısı gönderdik. Giriş yapmak için önce emailinizi doğrulayın.
          </p>
        </div>
      )}

      {emailNotVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 space-y-1.5">
          <p className="text-sm font-medium text-amber-800">Email adresinizi doğrulamanız gerekiyor</p>
          <p className="text-xs text-amber-700">
            Kayıt olurken gönderilen doğrulama emailini kontrol edin.{" "}
            <Link href="/resend-verification" className="underline font-medium">
              Yeniden gönder
            </Link>
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ornek@email.com"
              {...register("email")}
              className={[
                "w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all",
                errors.email ? "border-red-500/60" : "border-input",
              ].join(" ")}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Şifre
              </label>
              <Link href="/password-reset" className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors">
                Şifremi unuttum
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                className={[
                  "w-full h-10 px-3 pr-10 rounded-xl border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all",
                  errors.password ? "border-red-500/60" : "border-input",
                ].join(" ")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
              Beni hatırla
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Hesabınız yok mu?{" "}
        <Link href="/register" className="font-medium text-foreground hover:underline">
          Ücretsiz Kayıt Ol
        </Link>
      </p>

    </div>
  );
}

export default function LoginPage() {
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains("dark");
    html.classList.remove("dark");
    return () => { if (hadDark) html.classList.add("dark"); };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Suspense fallback={null}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
