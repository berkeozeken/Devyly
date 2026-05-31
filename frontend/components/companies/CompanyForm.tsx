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

const schema = z.object({
  name: z.string().min(1, "Şirket adı zorunludur"),
  website: z.string().url("Geçerli URL girin").optional().or(z.literal("")),
  industry: z.string().optional(),
  location: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email("Geçerli email girin").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CompanyForm({ onSuccess, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post("/companies/", data);
      toast.success("Şirket eklendi.");
      reset();
      onSuccess();
    } catch {
      toast.error("Şirket eklenemedi.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Yeni Şirket</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Şirket Adı *</Label>
              <Input placeholder="Google" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Website</Label>
              <Input placeholder="https://google.com" {...register("website")} />
              {errors.website && <p className="text-xs text-red-500">{errors.website.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Sektör</Label>
              <Input placeholder="Technology" {...register("industry")} />
            </div>

            <div className="space-y-1">
              <Label>Lokasyon</Label>
              <Input placeholder="İstanbul" {...register("location")} />
            </div>

            <div className="space-y-1">
              <Label>İletişim Kişisi</Label>
              <Input placeholder="John Doe" {...register("contact_person")} />
            </div>

            <div className="space-y-1">
              <Label>İletişim Email</Label>
              <Input placeholder="hr@google.com" {...register("contact_email")} />
              {errors.contact_email && (
                <p className="text-xs text-red-500">{errors.contact_email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notlar</Label>
            <Textarea placeholder="Ek notlar..." rows={2} {...register("notes")} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              İptal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
