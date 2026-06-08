"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import type { DeveloperProfile } from "@/types";

const schema = z.object({
  title: z.string().optional(),
  bio: z.string().optional(),
  github_url: z.string().url("Geçerli URL girin").optional().or(z.literal("")),
  linkedin_url: z.string().url("Geçerli URL girin").optional().or(z.literal("")),
  portfolio_url: z.string().url("Geçerli URL girin").optional().or(z.literal("")),
  location: z.string().optional(),
  is_open_to_work: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  profile: DeveloperProfile;
  onSaved: (updated: DeveloperProfile) => void;
}

export default function DeveloperProfileForm({ profile, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: profile.title,
      bio: profile.bio,
      github_url: profile.github_url,
      linkedin_url: profile.linkedin_url,
      portfolio_url: profile.portfolio_url,
      location: profile.location,
      is_open_to_work: profile.is_open_to_work,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.patch<DeveloperProfile>("/developer-profile/me/", data);
      onSaved(res.data);
      toast.success("Profil güncellendi.");
    } catch {
      toast.error("Profil güncellenemedi.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Geliştirici Profili</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Ünvan</Label>
              <Input placeholder="Full-Stack Developer" {...register("title")} />
            </div>
            <div className="space-y-1">
              <Label>Lokasyon</Label>
              <Input placeholder="İstanbul, Türkiye" {...register("location")} />
            </div>
            <div className="space-y-1">
              <Label>GitHub URL</Label>
              <Input placeholder="https://github.com/..." {...register("github_url")} />
              {errors.github_url && <p className="text-xs text-red-500">{errors.github_url.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>LinkedIn URL</Label>
              <Input placeholder="https://linkedin.com/in/..." {...register("linkedin_url")} />
              {errors.linkedin_url && <p className="text-xs text-red-500">{errors.linkedin_url.message}</p>}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Portfolio URL</Label>
              <Input placeholder="https://example.dev" {...register("portfolio_url")} />
              {errors.portfolio_url && <p className="text-xs text-red-500">{errors.portfolio_url.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Hakkımda</Label>
            <Textarea rows={4} placeholder="Kendinizi tanıtın..." {...register("bio")} />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_open_to_work"
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-primary"
              {...register("is_open_to_work")}
            />
            <Label htmlFor="is_open_to_work" className="cursor-pointer">
              İş fırsatlarına açığım
            </Label>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
