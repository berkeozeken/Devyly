"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import type { Company } from "@/types";

const schema = z.object({
  company: z.number().min(1, "Şirket seçin"),
  position: z.string().min(1, "Pozisyon zorunludur"),
  job_url: z.string().url("Geçerli URL girin").optional().or(z.literal("")),
  status: z.enum(["APPLIED", "IN_REVIEW", "INTERVIEW", "OFFER", "REJECTED", "ACCEPTED"]),
  applied_date: z.string().min(1, "Başvuru tarihi zorunludur"),
  interview_date: z.string().optional(),
  location: z.string().optional(),
  work_type: z.enum(["REMOTE", "HYBRID", "ONSITE", ""]).optional(),
  salary_range: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  companies: Company[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ApplicationForm({ companies, onSuccess, onCancel }: Props) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "APPLIED", work_type: "", company: 0 },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post("/applications/", data);
      toast.success("Başvuru eklendi.");
      reset();
      onSuccess();
    } catch {
      toast.error("Başvuru eklenemedi.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Yeni Başvuru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company */}
            <div className="space-y-1">
              <Label>Şirket</Label>
              <Controller
                control={control}
                name="company"
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value ? String(field.value) : ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Şirket seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.company && <p className="text-xs text-red-500">{errors.company.message}</p>}
            </div>

            {/* Position */}
            <div className="space-y-1">
              <Label>Pozisyon</Label>
              <Input placeholder="Backend Engineer" {...register("position")} />
              {errors.position && <p className="text-xs text-red-500">{errors.position.message}</p>}
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label>Durum</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["APPLIED","IN_REVIEW","INTERVIEW","OFFER","REJECTED","ACCEPTED"].map((s) => (
                        <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Work Type */}
            <div className="space-y-1">
              <Label>Çalışma Şekli</Label>
              <Controller
                control={control}
                name="work_type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REMOTE">Remote</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                      <SelectItem value="ONSITE">Onsite</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Applied Date */}
            <div className="space-y-1">
              <Label>Başvuru Tarihi</Label>
              <Input type="date" {...register("applied_date")} />
              {errors.applied_date && <p className="text-xs text-red-500">{errors.applied_date.message}</p>}
            </div>

            {/* Interview Date */}
            <div className="space-y-1">
              <Label>Mülakat Tarihi</Label>
              <Input type="date" {...register("interview_date")} />
            </div>

            {/* Job URL */}
            <div className="space-y-1">
              <Label>İş İlanı URL</Label>
              <Input placeholder="https://..." {...register("job_url")} />
              {errors.job_url && <p className="text-xs text-red-500">{errors.job_url.message}</p>}
            </div>

            {/* Location */}
            <div className="space-y-1">
              <Label>Lokasyon</Label>
              <Input placeholder="İstanbul" {...register("location")} />
            </div>

            {/* Salary Range */}
            <div className="space-y-1">
              <Label>Maaş Aralığı</Label>
              <Input placeholder="80k-100k" {...register("salary_range")} />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label>Notlar</Label>
            <Textarea placeholder="Ek notlar..." rows={3} {...register("notes")} />
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
