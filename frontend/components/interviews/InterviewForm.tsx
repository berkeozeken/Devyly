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
  interview_date: z.string().min(1, "Tarih zorunludur"),
  interview_type: z.enum(["HR", "TECHNICAL", "CASE_STUDY", "FINAL"]),
  interviewer_name: z.string().optional(),
  meeting_link: z.string().url("Geçerli URL girin").optional().or(z.literal("")),
  notes: z.string().optional(),
  result: z.enum(["PENDING", "PASSED", "FAILED", "CANCELLED"]),
  reminder_enabled: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  applications: Application[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function InterviewForm({ applications, onSuccess, onCancel }: Props) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      application: 0,
      interview_type: "TECHNICAL",
      result: "PENDING",
      reminder_enabled: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post("/interviews/", data);
      toast.success("Mülakat eklendi.");
      reset();
      onSuccess();
    } catch {
      toast.error("Mülakat eklenemedi.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Yeni Mülakat</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Application */}
            <div className="space-y-1 sm:col-span-2">
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

            {/* Interview Date */}
            <div className="space-y-1">
              <Label>Tarih ve Saat</Label>
              <Input type="datetime-local" {...register("interview_date")} />
              {errors.interview_date && (
                <p className="text-xs text-red-500">{errors.interview_date.message}</p>
              )}
            </div>

            {/* Interview Type */}
            <div className="space-y-1">
              <Label>Mülakat Türü</Label>
              <Controller
                control={control}
                name="interview_type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="TECHNICAL">Technical</SelectItem>
                      <SelectItem value="CASE_STUDY">Case Study</SelectItem>
                      <SelectItem value="FINAL">Final</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Result */}
            <div className="space-y-1">
              <Label>Sonuç</Label>
              <Controller
                control={control}
                name="result"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PASSED">Passed</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Interviewer */}
            <div className="space-y-1">
              <Label>Görüşmeci</Label>
              <Input placeholder="John Doe" {...register("interviewer_name")} />
            </div>

            {/* Meeting Link */}
            <div className="space-y-1">
              <Label>Toplantı Linki</Label>
              <Input placeholder="https://meet.google.com/..." {...register("meeting_link")} />
              {errors.meeting_link && (
                <p className="text-xs text-red-500">{errors.meeting_link.message}</p>
              )}
            </div>

            {/* Reminder */}
            <div className="flex items-center gap-2 pt-5">
              <input
                id="reminder_enabled"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                {...register("reminder_enabled")}
              />
              <Label htmlFor="reminder_enabled" className="cursor-pointer">
                Hatırlatıcı etkinleştir
              </Label>
            </div>
          </div>

          {/* Notes */}
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
