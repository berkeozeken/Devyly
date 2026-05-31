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
import type { Application } from "@/types";

const schema = z.object({
  application: z.number().min(1, "Başvuru seçin"),
  title: z.string().min(1, "Başlık zorunludur"),
  content: z.string().min(1, "İçerik zorunludur"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  applications: Application[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function NoteForm({ applications, onSuccess, onCancel }: Props) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { application: 0 },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post("/notes/", data);
      toast.success("Not eklendi.");
      reset();
      onSuccess();
    } catch {
      toast.error("Not eklenemedi.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Yeni Not</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Application */}
          <div className="space-y-1">
            <Label>Başvuru</Label>
            <Controller
              control={control}
              name="application"
              render={({ field }) => (
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={field.value ? String(field.value) : ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Başvuru seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.position} — {a.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.application && (
              <p className="text-xs text-red-500">{errors.application.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label>Başlık</Label>
            <Input placeholder="Not başlığı" {...register("title")} />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-1">
            <Label>İçerik</Label>
            <Textarea placeholder="Not içeriği..." rows={4} {...register("content")} />
            {errors.content && (
              <p className="text-xs text-red-500">{errors.content.message}</p>
            )}
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
