"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";

import api from "@/lib/api";
import type { AuthTokens, UserRole } from "@/types";

const schema = z
  .object({
    email: z.string().email("Geçerli bir email adresi girin"),
    first_name: z.string().min(1, "Ad zorunludur"),
    last_name: z.string().min(1, "Soyad zorunludur"),
    password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
    password_confirm: z.string().min(1, "Şifre tekrarı zorunludur"),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Şifreler eşleşmiyor",
    path: ["password_confirm"],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  initialRole?: UserRole;
}

export default function RegisterForm({ initialRole = "DEVELOPER" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains("dark");
    html.classList.remove("dark");
    return () => { if (hadDark) html.classList.add("dark"); };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post<AuthTokens>("/auth/register/", { ...data, role: initialRole });
      router.push("/login?registered=true");
    } catch (err: unknown) {
      const errorData = (
        err as { response?: { data?: Record<string, string | string[]> } }
      )?.response?.data;
      const message = errorData
        ? Object.values(errorData).flat().join(" ")
        : "Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isRecruiter = initialRole === "RECRUITER";

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
          <p className="text-sm text-muted-foreground">
            {isRecruiter ? "Recruiter / HR hesabı oluşturun" : "Geliştirici hesabı oluşturun"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="first_name" className="text-sm font-medium text-foreground">Ad</label>
                <input
                  id="first_name"
                  autoComplete="given-name"
                  placeholder="Ad"
                  {...register("first_name")}
                  className={[
                    "w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all",
                    errors.first_name ? "border-red-500/60" : "border-input",
                  ].join(" ")}
                />
                {errors.first_name && (
                  <p className="text-xs text-red-500">{errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="last_name" className="text-sm font-medium text-foreground">Soyad</label>
                <input
                  id="last_name"
                  autoComplete="family-name"
                  placeholder="Soyad"
                  {...register("last_name")}
                  className={[
                    "w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all",
                    errors.last_name ? "border-red-500/60" : "border-input",
                  ].join(" ")}
                />
                {errors.last_name && (
                  <p className="text-xs text-red-500">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
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
              <label htmlFor="password" className="text-sm font-medium text-foreground">Şifre</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="En az 8 karakter"
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

            <div className="space-y-1.5">
              <label htmlFor="password_confirm" className="text-sm font-medium text-foreground">Şifre Tekrarı</label>
              <div className="relative">
                <input
                  id="password_confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register("password_confirm")}
                  className={[
                    "w-full h-10 px-3 pr-10 rounded-xl border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all",
                    errors.password_confirm ? "border-red-500/60" : "border-input",
                  ].join(" ")}
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
              {errors.password_confirm && (
                <p className="text-xs text-red-500">{errors.password_confirm.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading
                ? "Kayıt yapılıyor..."
                : isRecruiter
                  ? "Recruiter / HR Hesabı Oluştur"
                  : "Geliştirici Hesabı Oluştur"}
            </button>

          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Giriş Yap
          </Link>
        </p>

      </div>
    </div>
  );
}
