"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { setTokens, setUser } from "@/lib/auth";
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
  role: UserRole;
}

const CONFIG: Record<UserRole, { title: string; description: string; switchText: string; switchHref: string }> = {
  DEVELOPER: {
    title: "Devyly",
    description: "Geliştirici hesabı oluşturun",
    switchText: "İşe alımcı olarak kaydol",
    switchHref: "/register/recruiter",
  },
  RECRUITER: {
    title: "Devyly",
    description: "İşe alımcı hesabı oluşturun",
    switchText: "Geliştirici olarak kaydol",
    switchHref: "/register/developer",
  },
};

export default function RegisterForm({ role }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const config = CONFIG[role];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post<AuthTokens>("/auth/register/", { ...data, role });
      setTokens(res.data.access, res.data.refresh);
      setUser(res.data.user);
      toast.success("Kayıt başarılı! Hoş geldiniz.");
      router.push("/feed");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="first_name">Ad</Label>
                <Input id="first_name" placeholder="Ad" {...register("first_name")} />
                {errors.first_name && (
                  <p className="text-sm text-red-500">{errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="last_name">Soyad</Label>
                <Input id="last_name" placeholder="Soyad" {...register("last_name")} />
                {errors.last_name && (
                  <p className="text-sm text-red-500">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="En az 8 karakter"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password_confirm">Şifre Tekrarı</Label>
              <Input
                id="password_confirm"
                type="password"
                placeholder="••••••••"
                {...register("password_confirm")}
              />
              {errors.password_confirm && (
                <p className="text-sm text-red-500">{errors.password_confirm.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
            </Button>
          </form>

          <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Zaten hesabınız var mı?{" "}
              <Link href="/login" className="text-blue-500 hover:underline">
                Giriş Yap
              </Link>
            </p>
            <p>
              <Link href={config.switchHref} className="text-muted-foreground/70 hover:text-foreground hover:underline">
                {config.switchText}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
