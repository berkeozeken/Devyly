"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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
import type { Company, JobPost } from "@/types";

const schema = z.object({
  company: z.number().min(1, "Şirket seçin"),
  title: z.string().min(1, "Başlık zorunludur"),
  description: z.string().min(1, "Açıklama zorunludur"),
  requirements: z.string().optional(),
  location: z.string().optional(),
  work_type: z.enum(["REMOTE", "HYBRID", "ONSITE", ""]).optional(),
  salary_range: z.string().optional(),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  companies: Company[];
  onSuccess: (post: JobPost) => void;
  onCancel: () => void;
}

export default function JobPostForm({ companies, onSuccess, onCancel }: Props) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { company: 0, is_active: true, work_type: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post<JobPost>("/job-posts/", data);
      toast.success("İlan oluşturuldu.");
      reset();
      onSuccess(res.data);
    } catch {
      toast.error("İlan oluşturulamadı.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company */}
            <div className="space-y-1 sm:col-span-2">
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

            {/* Title */}
            <div className="space-y-1 sm:col-span-2">
              <Label>İlan Başlığı</Label>
              <Input placeholder="Backend Developer" {...register("title")} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            {/* Location */}
            <div className="space-y-1">
              <Label>Lokasyon</Label>
              <Input placeholder="Turkey" {...register("location")} />
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

            {/* Salary */}
            <div className="space-y-1">
              <Label>Maaş Aralığı</Label>
              <Input placeholder="80k-100k" {...register("salary_range")} />
            </div>

            {/* is_active */}
            <div className="flex items-center gap-2 pt-5">
              <input
                id="is_active"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                {...register("is_active")}
              />
              <Label htmlFor="is_active" className="cursor-pointer">Yayında</Label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>Açıklama</Label>
            <Textarea rows={3} placeholder="Pozisyon hakkında açıklama..." {...register("description")} />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          {/* Requirements */}
          <div className="space-y-1">
            <Label>Gereksinimler</Label>
            <Textarea rows={2} placeholder="Python, Django, PostgreSQL..." {...register("requirements")} />
          </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Oluşturuluyor..." : "İlan Oluştur"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>İptal</Button>
      </div>
    </form>
  );
}
