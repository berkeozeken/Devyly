"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
import type {
  CvCertificate,
  CvEducation,
  CvLanguage,
  CvProject,
  CvWorkExperience,
  DeveloperProfile,
} from "@/types";

interface Props {
  profile: DeveloperProfile;
  onSaved: (updated: DeveloperProfile) => void;
}

/* ── Data constants (defined first, used by components below) ─── */

const currentYear = new Date().getFullYear();

const MONTH_OPTIONS = [
  { value: "01", label: "Ocak"    },
  { value: "02", label: "Şubat"   },
  { value: "03", label: "Mart"    },
  { value: "04", label: "Nisan"   },
  { value: "05", label: "Mayıs"   },
  { value: "06", label: "Haziran" },
  { value: "07", label: "Temmuz"  },
  { value: "08", label: "Ağustos" },
  { value: "09", label: "Eylül"   },
  { value: "10", label: "Ekim"    },
  { value: "11", label: "Kasım"   },
  { value: "12", label: "Aralık"  },
] as const;

export const LANGUAGE_LEVELS = [
  { value: "BEGINNER",     label: "Beginner",     stars: "★☆☆☆☆" },
  { value: "ELEMENTARY",   label: "Elementary",   stars: "★★☆☆☆" },
  { value: "INTERMEDIATE", label: "Intermediate", stars: "★★★☆☆" },
  { value: "FLUENT",       label: "Fluent",       stars: "★★★★☆" },
  { value: "NATIVE",       label: "Native",       stars: "★★★★★" },
] as const;

/* ── Date validation helpers ─────────────────────────────────── */

function getCurrentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function isAfterMonth(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return a > b;
}

/* ── Empty templates ──────────────────────────────────────────── */

const EMPTY_EDUCATION: CvEducation     = { school: "", degree: "", start_year: "", end_year: "", is_current: false, description: "" };
const EMPTY_WORK: CvWorkExperience     = { company: "", position: "", start_date: "", end_date: "", is_current: false, description: "" };
const EMPTY_PROJECT: CvProject         = { name: "", description: "", technologies: "", url: "", start_date: "", end_date: "", is_current: false };
const EMPTY_LANGUAGE: CvLanguage       = { language: "", level: "" };
const EMPTY_CERTIFICATE: CvCertificate = { name: "", issuer: "", year: "", url: "" };

/* ── Normalisers for backward-compat ─────────────────────────── */

const normalizeEdu  = (e: CvEducation): CvEducation => ({ is_current: false, ...e });
const normalizeProj = (p: CvProject):   CvProject   => ({ start_date: "", end_date: "", is_current: false, ...p });

/* ── UI helpers ───────────────────────────────────────────────── */

function CvSection({
  title,
  emptyText,
  addLabel,
  onAdd,
  hasItems,
  children,
}: {
  title: string;
  emptyText: string;
  addLabel: string;
  onAdd: () => void;
  hasItems: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        {hasItems && (
          <button
            type="button"
            onClick={onAdd}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            + {addLabel}
          </button>
        )}
      </div>
      {hasItems ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <div className="border border-dashed rounded-md px-4 py-3 text-sm text-gray-400 flex items-center justify-between">
          <span>{emptyText}</span>
          <button
            type="button"
            onClick={onAdd}
            className="text-xs text-blue-500 hover:text-blue-700 font-medium ml-3 shrink-0"
          >
            + {addLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-red-400 hover:text-red-600 transition-colors"
    >
      Kaldır
    </button>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

/* ── MonthPickerField ─────────────────────────────────────────── */

type MonthPickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function parseMonthYear(raw: string): { year: string; month: string } {
  const parts = (raw ?? "").split("-");
  return { year: parts[0] ?? "", month: parts[1] ?? "" };
}

function MonthPickerField({ value, onChange, disabled }: MonthPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { year: selYear, month: selMonth } = parseMonthYear(value);

  const [pickerYear, setPickerYear] = useState(
    () => selYear ? parseInt(selYear, 10) : currentYear,
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const displayText = (() => {
    if (!selMonth && !selYear) return null;
    if (selMonth) {
      const mLabel = MONTH_OPTIONS.find(m => m.value === selMonth)?.label ?? selMonth;
      return `${mLabel} ${selYear || pickerYear}`;
    }
    return selYear;
  })();

  const handleMonthClick = (monthValue: string) => {
    onChange(`${pickerYear}-${monthValue}`);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            const parsed = selYear ? parseInt(selYear, 10) : currentYear;
            setPickerYear(Number.isNaN(parsed) ? currentYear : parsed);
            setOpen(true);
          }
        }}
        className="h-8 w-full rounded-md border border-gray-300 bg-white px-3 text-sm flex items-center justify-between gap-2 text-left disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
      >
        <span className={displayText ? "text-gray-900" : "text-gray-400 text-xs"}>
          {displayText ?? "Tarih seçin"}
        </span>
        <CalendarIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
      </button>

      {open && !disabled && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-52">

          {/* Year navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setPickerYear(y => Math.max(1950, y - 1))}
              className="h-6 w-6 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 text-lg leading-none"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-gray-800">{pickerYear}</span>
            <button
              type="button"
              onClick={() => setPickerYear(y => Math.min(currentYear + 10, y + 1))}
              className="h-6 w-6 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 text-lg leading-none"
            >
              ›
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1">
            {MONTH_OPTIONS.map(m => {
              const isSelected = selYear === String(pickerYear) && selMonth === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => handleMonthClick(m.value)}
                  className={`text-xs py-1.5 rounded transition-colors ${
                    isSelected
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Clear */}
          {value && (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="mt-2 w-full text-xs text-center text-gray-400 hover:text-gray-600 py-0.5"
            >
              Temizle
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────── */

export default function CvForm({ profile, onSaved }: Props) {
  const [education,      setEducation]      = useState<CvEducation[]>((profile.education ?? []).map(normalizeEdu));
  const [workExperience, setWorkExperience] = useState<CvWorkExperience[]>(profile.work_experience ?? []);
  const [projects,       setProjects]       = useState<CvProject[]>((profile.projects ?? []).map(normalizeProj));
  const [languages,      setLanguages]      = useState<CvLanguage[]>(profile.languages ?? []);
  const [certificates,   setCertificates]   = useState<CvCertificate[]>(profile.certificates ?? []);
  const [cvLanguage,     setCvLanguage]     = useState(profile.cv_language_preference ?? "en");
  const [includePhoto,   setIncludePhoto]   = useState(profile.include_profile_photo_in_cv ?? true);
  const [saving,         setSaving]         = useState(false);

  const updateEdu  = (i: number, p: Partial<CvEducation>)      => setEducation(prev      => prev.map((x, idx) => idx === i ? { ...x, ...p } : x));
  const updateWork = (i: number, p: Partial<CvWorkExperience>) => setWorkExperience(prev => prev.map((x, idx) => idx === i ? { ...x, ...p } : x));
  const updateProj = (i: number, p: Partial<CvProject>)        => setProjects(prev       => prev.map((x, idx) => idx === i ? { ...x, ...p } : x));
  const updateLang = (i: number, p: Partial<CvLanguage>)       => setLanguages(prev      => prev.map((x, idx) => idx === i ? { ...x, ...p } : x));
  const updateCert = (i: number, p: Partial<CvCertificate>)    => setCertificates(prev   => prev.map((x, idx) => idx === i ? { ...x, ...p } : x));

  const removeAt = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, i: number) =>
    setter(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    const currentMonth = getCurrentMonthValue();

    for (const edu of education) {
      if (isAfterMonth(edu.start_year, currentMonth)) {
        toast.error("Eğitim başlangıç tarihi günümüzden ileri olamaz.");
        return;
      }
      if (!edu.is_current && isAfterMonth(edu.start_year, edu.end_year)) {
        toast.error("Eğitim başlangıç tarihi bitiş tarihinden sonra olamaz.");
        return;
      }
    }

    for (const exp of workExperience) {
      if (isAfterMonth(exp.start_date, currentMonth)) {
        toast.error("İş deneyimi başlangıç tarihi günümüzden ileri olamaz.");
        return;
      }
      if (!exp.is_current && isAfterMonth(exp.start_date, exp.end_date)) {
        toast.error("İş deneyimi başlangıç tarihi bitiş tarihinden sonra olamaz.");
        return;
      }
    }

    for (const proj of projects) {
      if (isAfterMonth(proj.start_date, currentMonth)) {
        toast.error("Proje başlangıç tarihi günümüzden ileri olamaz.");
        return;
      }
      if (!proj.is_current && isAfterMonth(proj.start_date, proj.end_date)) {
        toast.error("Proje başlangıç tarihi bitiş tarihinden sonra olamaz.");
        return;
      }
    }

    for (const cert of certificates) {
      if (isAfterMonth(cert.year, currentMonth)) {
        toast.error("Sertifika tarihi günümüzden ileri olamaz.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await api.patch<DeveloperProfile>("/developer-profile/me/", {
        education,
        work_experience: workExperience,
        projects,
        languages,
        certificates,
        cv_language_preference: cvLanguage,
        include_profile_photo_in_cv: includePhoto,
      });
      onSaved(res.data);
      toast.success("CV bilgileri güncellendi.");
    } catch {
      toast.error("CV bilgileri güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">CV İçeriği</CardTitle>
        <p className="text-xs text-gray-400 mt-0.5">
          CV oluştururken kullanılacak eğitim, deneyim, proje ve diğer bilgileri buradan yönetebilirsiniz.
        </p>
      </CardHeader>

      <CardContent className="space-y-5 pt-0">

        {/* ── Education ── */}
        <CvSection
          title="Eğitim"
          emptyText="Henüz eğitim bilgisi eklenmedi."
          addLabel="Eğitim Ekle"
          onAdd={() => setEducation(prev => [...prev, { ...EMPTY_EDUCATION }])}
          hasItems={education.length > 0}
        >
          {education.map((edu, i) => (
            <div key={i} className="bg-gray-50 rounded-md p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">Okul</Label>
                  <Input className="h-8 text-sm" placeholder="Üniversite / okul adı"
                    value={edu.school}
                    onChange={e => updateEdu(i, { school: e.target.value })} />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">Bölüm / Derece</Label>
                  <Input className="h-8 text-sm" placeholder="Bölüm veya derece"
                    value={edu.degree}
                    onChange={e => updateEdu(i, { degree: e.target.value })} />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">Başlangıç</Label>
                  <MonthPickerField
                    value={edu.start_year}
                    onChange={v => updateEdu(i, { start_year: v })}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">Bitiş</Label>
                  <MonthPickerField
                    value={edu.end_year}
                    disabled={!!edu.is_current}
                    onChange={v => updateEdu(i, { end_year: v })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`edu_current_${i}`}
                  className="h-3.5 w-3.5 rounded border-gray-300"
                  checked={!!edu.is_current}
                  onChange={e =>
                    updateEdu(i, {
                      is_current: e.target.checked,
                      end_year: e.target.checked ? "" : edu.end_year,
                    })
                  }
                />
                <Label htmlFor={`edu_current_${i}`} className="text-xs text-gray-500 cursor-pointer">
                  Hâlâ okuyorum
                </Label>
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs text-gray-500">Açıklama</Label>
                <Textarea className="text-sm" rows={2} placeholder="Eğitimle ilgili kısa açıklama..."
                  value={edu.description}
                  onChange={e => updateEdu(i, { description: e.target.value })} />
              </div>
              <div className="flex justify-end">
                <RemoveBtn onClick={() => removeAt(setEducation, i)} />
              </div>
            </div>
          ))}
        </CvSection>

        <hr className="border-gray-100" />

        {/* ── Work Experience ── */}
        <CvSection
          title="İş Deneyimi"
          emptyText="Henüz iş deneyimi eklenmedi."
          addLabel="İş Deneyimi Ekle"
          onAdd={() => setWorkExperience(prev => [...prev, { ...EMPTY_WORK }])}
          hasItems={workExperience.length > 0}
        >
          {workExperience.map((exp, i) => (
            <div key={i} className="bg-gray-50 rounded-md p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">Şirket</Label>
                  <Input className="h-8 text-sm" placeholder="Şirket adı"
                    value={exp.company}
                    onChange={e => updateWork(i, { company: e.target.value })} />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">Pozisyon</Label>
                  <Input className="h-8 text-sm" placeholder="Pozisyon adı"
                    value={exp.position}
                    onChange={e => updateWork(i, { position: e.target.value })} />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">Başlangıç</Label>
                  <MonthPickerField
                    value={exp.start_date}
                    onChange={v => updateWork(i, { start_date: v })}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">Bitiş</Label>
                  <MonthPickerField
                    value={exp.end_date}
                    disabled={exp.is_current}
                    onChange={v => updateWork(i, { end_date: v })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`work_current_${i}`}
                  className="h-3.5 w-3.5 rounded border-gray-300"
                  checked={exp.is_current}
                  onChange={e =>
                    updateWork(i, {
                      is_current: e.target.checked,
                      end_date: e.target.checked ? "" : exp.end_date,
                    })
                  }
                />
                <Label htmlFor={`work_current_${i}`} className="text-xs text-gray-500 cursor-pointer">
                  Hâlâ burada çalışıyorum
                </Label>
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs text-gray-500">Açıklama</Label>
                <Textarea className="text-sm" rows={2}
                  placeholder="Sorumluluklarınızı ve yaptığınız işleri yazın..."
                  value={exp.description}
                  onChange={e => updateWork(i, { description: e.target.value })} />
              </div>
              <div className="flex justify-end">
                <RemoveBtn onClick={() => removeAt(setWorkExperience, i)} />
              </div>
            </div>
          ))}
        </CvSection>

        <hr className="border-gray-100" />

        {/* ── Projects ── */}
        <CvSection
          title="Projeler"
          emptyText="Henüz proje eklenmedi."
          addLabel="Proje Ekle"
          onAdd={() => setProjects(prev => [...prev, { ...EMPTY_PROJECT }])}
          hasItems={projects.length > 0}
        >
          {projects.map((proj, i) => (
            <div key={i} className="bg-gray-50 rounded-md p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">Proje Adı</Label>
                  <Input className="h-8 text-sm" placeholder="Proje adı"
                    value={proj.name}
                    onChange={e => updateProj(i, { name: e.target.value })} />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">Teknolojiler</Label>
                  <Input className="h-8 text-sm" placeholder="Kullanılan teknolojiler"
                    value={proj.technologies}
                    onChange={e => updateProj(i, { technologies: e.target.value })} />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">Başlangıç</Label>
                  <MonthPickerField
                    value={proj.start_date ?? ""}
                    onChange={v => updateProj(i, { start_date: v })}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">Bitiş</Label>
                  <MonthPickerField
                    value={proj.end_date ?? ""}
                    disabled={!!proj.is_current}
                    onChange={v => updateProj(i, { end_date: v })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`proj_current_${i}`}
                  className="h-3.5 w-3.5 rounded border-gray-300"
                  checked={!!proj.is_current}
                  onChange={e =>
                    updateProj(i, {
                      is_current: e.target.checked,
                      end_date: e.target.checked ? "" : proj.end_date ?? "",
                    })
                  }
                />
                <Label htmlFor={`proj_current_${i}`} className="text-xs text-gray-500 cursor-pointer">
                  Hâlâ devam ediyor
                </Label>
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs text-gray-500">URL</Label>
                <Input type="url" className="h-8 text-sm"
                  placeholder="Proje veya GitHub bağlantısı"
                  value={proj.url}
                  onChange={e => updateProj(i, { url: e.target.value })} />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs text-gray-500">Açıklama</Label>
                <Textarea className="text-sm" rows={2} placeholder="Projeyi kısaca açıklayın..."
                  value={proj.description}
                  onChange={e => updateProj(i, { description: e.target.value })} />
              </div>
              <div className="flex justify-end">
                <RemoveBtn onClick={() => removeAt(setProjects, i)} />
              </div>
            </div>
          ))}
        </CvSection>

        <hr className="border-gray-100" />

        {/* ── Languages ── */}
        <CvSection
          title="Diller"
          emptyText="Henüz dil eklenmedi."
          addLabel="Dil Ekle"
          onAdd={() => setLanguages(prev => [...prev, { ...EMPTY_LANGUAGE }])}
          hasItems={languages.length > 0}
        >
          {languages.map((lang, i) => (
            <div key={i} className="bg-gray-50 rounded-md p-3">
              <div className="flex items-end gap-2">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-xs text-gray-500">Dil</Label>
                  <Input className="h-8 text-sm" placeholder="Dil"
                    value={lang.language}
                    onChange={e => updateLang(i, { language: e.target.value })} />
                </div>
                <div className="space-y-0.5 w-40">
                  <Label className="text-xs text-gray-500">Seviye</Label>
                  <Select
                    value={lang.level}
                    onValueChange={v => updateLang(i, { level: v ?? "" })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Seviye seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_LEVELS.map(lvl => (
                        <SelectItem key={lvl.value} value={lvl.value}>
                          {lvl.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pb-0.5 shrink-0">
                  <RemoveBtn onClick={() => removeAt(setLanguages, i)} />
                </div>
              </div>
            </div>
          ))}
        </CvSection>

        <hr className="border-gray-100" />

        {/* ── Certificates ── */}
        <CvSection
          title="Sertifikalar"
          emptyText="Henüz sertifika eklenmedi."
          addLabel="Sertifika Ekle"
          onAdd={() => setCertificates(prev => [...prev, { ...EMPTY_CERTIFICATE }])}
          hasItems={certificates.length > 0}
        >
          {certificates.map((cert, i) => (
            <div key={i} className="bg-gray-50 rounded-md p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">Sertifika Adı</Label>
                  <Input className="h-8 text-sm" placeholder="Sertifika adı"
                    value={cert.name}
                    onChange={e => updateCert(i, { name: e.target.value })} />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">Veren Kurum</Label>
                  <Input className="h-8 text-sm" placeholder="Kurum adı"
                    value={cert.issuer}
                    onChange={e => updateCert(i, { issuer: e.target.value })} />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">Tarih</Label>
                  <MonthPickerField
                    value={cert.year}
                    onChange={v => updateCert(i, { year: v })}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs text-gray-500">URL</Label>
                  <Input type="url" className="h-8 text-sm" placeholder="Sertifika bağlantısı"
                    value={cert.url}
                    onChange={e => updateCert(i, { url: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end">
                <RemoveBtn onClick={() => removeAt(setCertificates, i)} />
              </div>
            </div>
          ))}
        </CvSection>

        <hr className="border-gray-100" />

        {/* ── CV Preferences ── */}
        <p className="text-xs text-gray-400 italic">
          CV önizleme ve PDF indirme bir sonraki adımda eklenecek.
        </p>
        <div className="space-y-3">
          <span className="text-sm font-medium text-gray-700">CV Tercihleri</span>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="space-y-0.5">
              <Label className="text-xs text-gray-500">CV Dili</Label>
              <Select value={cvLanguage} onValueChange={v => setCvLanguage(v ?? "en")}>
                <SelectTrigger className="w-40 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="tr">Turkish</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <input
                id="include_photo_in_cv"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={includePhoto}
                onChange={e => setIncludePhoto(e.target.checked)}
              />
              <Label htmlFor="include_photo_in_cv" className="text-sm cursor-pointer text-gray-600">
                Profil fotoğrafımı CV&apos;ye ekle
              </Label>
            </div>
          </div>
        </div>

        {/* ── Save ── */}
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <Button onClick={handleSave} disabled={saving} size="sm" className="mt-3">
            {saving ? "Kaydediliyor..." : "CV Bilgilerini Kaydet"}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
