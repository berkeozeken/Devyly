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
import type { RecruiterProfile } from "@/types";

const schema = z.object({
  company_name: z.string().optional(),
  company_website: z.string().url("Geçerli URL girin").optional().or(z.literal("")),
  company_industry: z.string().optional(),
  company_location: z.string().optional(),
  position_title: z.string().optional(),
  bio: z.string().optional(),
  linkedin_url: z.string().url("Geçerli URL girin").optional().or(z.literal("")),
  is_hiring: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  profile: RecruiterProfile;
  onSaved: (updated: RecruiterProfile) => void;
}

export default function RecruiterProfileForm({ profile, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      company_name: profile.company_name,
      company_website: profile.company_website,
      company_industry: profile.company_industry,
      company_location: profile.company_location,
      position_title: profile.position_title,
      bio: profile.bio,
      linkedin_url: profile.linkedin_url,
      is_hiring: profile.is_hiring,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.patch<RecruiterProfile>("/recruiter-profile/me/", data);
      onSaved(res.data);
      toast.success("Profil güncellendi.");
    } catch {
      toast.error("Profil güncellenemedi.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recruiter Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Şirket Adı</Label>
              <Input placeholder="Tech Hiring Co." {...register("company_name")} />
            </div>
            <div className="space-y-1">
              <Label>Sektör</Label>
              <Input placeholder="Software" {...register("company_industry")} />
            </div>
            <div className="space-y-1">
              <Label>Şirket Lokasyonu</Label>
              <Input placeholder="Turkey" {...register("company_location")} />
            </div>
            <div className="space-y-1">
              <Label>Şirket Website</Label>
              <Input placeholder="https://company.com" {...register("company_website")} />
              {errors.company_website && <p className="text-xs text-red-500">{errors.company_website.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Pozisyon Ünvanı</Label>
              <Input placeholder="Technical Recruiter" {...register("position_title")} />
            </div>
            <div className="space-y-1">
              <Label>LinkedIn URL</Label>
              <Input placeholder="https://linkedin.com/in/..." {...register("linkedin_url")} />
              {errors.linkedin_url && <p className="text-xs text-red-500">{errors.linkedin_url.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Hakkımda</Label>
            <Textarea rows={4} placeholder="Kendinizi tanıtın..." {...register("bio")} />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_hiring"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              {...register("is_hiring")}
            />
            <Label htmlFor="is_hiring" className="cursor-pointer">
              Aktif olarak işe alım yapıyorum
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
