"use client";

import { Download, Eye, LayoutList, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import CvPreview from "@/components/profile/CvPreview";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { generateCvPdf } from "@/lib/cv-pdf";
import type {
  CvCertificate,
  CvEducation,
  CvLanguage,
  CvProject,
  CvWorkExperience,
  DeveloperProfile,
  User,
} from "@/types";

/* ══ Types ══════════════════════════════════════════════════════ */

interface LocalCv {
  id: string;
  fullName: string;
  language: string;
  includePhoto: boolean;
  skills: string[];
  education: CvEducation[];
  workExperience: CvWorkExperience[];
  projects: CvProject[];
  cvLanguages: CvLanguage[];
  certificates: CvCertificate[];
}

/* ══ Constants ══════════════════════════════════════════════════ */

const LS_KEY = "devyly:cv_list";

const CV_LANGS = [
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
  { value: "de", label: "Deutsch" },
] as const;

const LANG_LEVELS = [
  { value: "BEGINNER",     label: "Beginner"     },
  { value: "ELEMENTARY",   label: "Elementary"   },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "FLUENT",       label: "Fluent"       },
  { value: "NATIVE",       label: "Native"       },
] as const;

const currentYear = new Date().getFullYear();

const MONTH_OPTIONS = [
  { value: "01", label: "Ocak" },    { value: "02", label: "Şubat" },
  { value: "03", label: "Mart" },    { value: "04", label: "Nisan" },
  { value: "05", label: "Mayıs" },   { value: "06", label: "Haziran" },
  { value: "07", label: "Temmuz" },  { value: "08", label: "Ağustos" },
  { value: "09", label: "Eylül" },   { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" },   { value: "12", label: "Aralık" },
] as const;

/* ══ Helpers ════════════════════════════════════════════════════ */

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function cvLangLabel(v: string) {
  return CV_LANGS.find(l => l.value === v)?.label ?? v;
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return { first_name: parts[0] || "", last_name: parts.slice(1).join(" ") };
}

function toPreviewProfile(base: DeveloperProfile, cv: LocalCv): DeveloperProfile {
  return {
    ...base,
    education: cv.education,
    work_experience: cv.workExperience,
    projects: cv.projects,
    languages: cv.cvLanguages,
    certificates: cv.certificates,
    skills: cv.skills.join(", "),
    cv_language_preference: cv.language,
    include_profile_photo_in_cv: cv.includePhoto,
  };
}

function loadFromStorage(): LocalCv[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (raw) return JSON.parse(raw) as LocalCv[];
  } catch {}
  return [];
}

function persistToStorage(list: LocalCv[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function isAfterMonth(a?: string, b?: string) {
  if (!a || !b) return false;
  return a > b;
}

function parseMonthYear(raw: string) {
  const parts = (raw ?? "").split("-");
  return { year: parts[0] ?? "", month: parts[1] ?? "" };
}

/* ══ LangSelect (shows labels, not raw values) ══════════════════ */

function LangSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={v => { if (v) onChange(v); }}>
      <SelectTrigger className={`h-10 rounded-xl border-border bg-muted/40 ${className ?? ""}`}>
        <span className="text-sm text-foreground">
          {cvLangLabel(value)}
        </span>
      </SelectTrigger>
      <SelectContent>
        {CV_LANGS.map(l => (
          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ══ MonthPickerField ═══════════════════════════════════════════ */

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function MonthPickerField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { year: selYear, month: selMonth } = parseMonthYear(value);
  const [pickerYear, setPickerYear] = useState(() =>
    selYear ? parseInt(selYear, 10) : currentYear,
  );

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const displayText = (() => {
    if (!selMonth && !selYear) return null;
    if (selMonth) {
      const mLabel = MONTH_OPTIONS.find(m => m.value === selMonth)?.label ?? selMonth;
      return `${mLabel} ${selYear || pickerYear}`;
    }
    return selYear;
  })();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (open) { setOpen(false); return; }
          const p = selYear ? parseInt(selYear, 10) : currentYear;
          setPickerYear(Number.isNaN(p) ? currentYear : p);
          setOpen(true);
        }}
        className="h-9 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm flex items-center justify-between gap-2 text-left disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <span className={displayText ? "text-foreground" : "text-muted-foreground text-xs"}>
          {displayText ?? "Tarih seçin"}
        </span>
        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>
      {open && !disabled && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-card border border-border rounded-xl shadow-lg p-3 w-52">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => setPickerYear(y => Math.max(1950, y - 1))} className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted text-lg leading-none">‹</button>
            <span className="text-sm font-semibold text-foreground">{pickerYear}</span>
            <button type="button" onClick={() => setPickerYear(y => Math.min(currentYear + 10, y + 1))} className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted text-lg leading-none">›</button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {MONTH_OPTIONS.map(m => {
              const isSel = selYear === String(pickerYear) && selMonth === m.value;
              return (
                <button key={m.value} type="button" onClick={() => { onChange(`${pickerYear}-${m.value}`); setOpen(false); }}
                  className={`text-xs py-1.5 rounded transition-colors ${isSel ? "bg-primary text-primary-foreground font-semibold" : "text-foreground hover:bg-muted"}`}>
                  {m.label}
                </button>
              );
            })}
          </div>
          {value && (
            <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="mt-2 w-full text-xs text-center text-muted-foreground hover:text-foreground py-0.5">
              Temizle
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ══ Shared section UI ══════════════════════════════════════════ */

function SectionHeader({ title, onAdd, showAdd }: { title: string; onAdd: () => void; showAdd: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-foreground">{title}</span>
      {showAdd && (
        <button type="button" onClick={onAdd} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          + Ekle
        </button>
      )}
    </div>
  );
}

function SectionEmpty({ text, addLabel, onAdd }: { text: string; addLabel: string; onAdd: () => void }) {
  return (
    <div className="border border-dashed border-border rounded-xl px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
      <span>{text}</span>
      <button type="button" onClick={onAdd} className="text-xs text-primary hover:text-primary/80 font-medium ml-3 shrink-0">
        + {addLabel}
      </button>
    </div>
  );
}

function ItemCard({ summary, onEdit, onDelete }: { summary: React.ReactNode; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-background border border-border rounded-xl px-4 py-3 flex items-start justify-between gap-3">
      <div className="text-sm min-w-0 flex-1">{summary}</div>
      <div className="flex items-center gap-2 shrink-0">
        <button type="button" onClick={onEdit} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
          <Pencil size={11} className="mr-0.5" />Düzenle
        </button>
        <button type="button" onClick={onDelete} className="text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-0.5">
          <Trash2 size={11} className="mr-0.5" />Sil
        </button>
      </div>
    </div>
  );
}

function FormActions({ onSave, onCancel, saveLabel = "Kaydet" }: { onSave: () => void; onCancel: () => void; saveLabel?: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onSave}
        className="h-10 px-5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
      >
        {saveLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="h-10 px-4 rounded-xl border border-border bg-transparent text-foreground font-medium text-sm hover:bg-muted active:scale-[0.98] transition-all"
      >
        İptal
      </button>
    </div>
  );
}

/* ══ CreateCvForm ═══════════════════════════════════════════════ */

function CreateCvForm({ onSave, onCancel }: { onSave: (cv: LocalCv) => void; onCancel: () => void }) {
  const [fullName, setFullName] = useState("");
  const [language, setLanguage] = useState("en");
  const [includePhoto, setIncludePhoto] = useState(true);

  const handleSave = () => {
    if (!fullName.trim()) { toast.error("İsim Soyisim zorunludur."); return; }
    onSave({ id: newId(), fullName: fullName.trim(), language, includePhoto, skills: [], education: [], workExperience: [], projects: [], cvLanguages: [], certificates: [] });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <p className="text-sm font-semibold text-foreground">Yeni CV</p>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">İsim Soyisim</Label>
        <Input className="h-9" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Berke Özeken" autoFocus />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">CV Dili</Label>
        <LangSelect value={language} onChange={setLanguage} className="w-full" />
      </div>
      <div className="flex items-center gap-2">
        <input id="ncv_photo" type="checkbox" checked={includePhoto} onChange={e => setIncludePhoto(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
        <Label htmlFor="ncv_photo" className="text-sm cursor-pointer text-muted-foreground">Profil fotoğrafımı CV&apos;ye ekle</Label>
      </div>
      <FormActions onSave={handleSave} onCancel={onCancel} saveLabel="CV Bilgilerini Kaydet" />
    </div>
  );
}

function EditCvForm({ cv, onSave, onCancel }: { cv: LocalCv; onSave: (u: Partial<LocalCv>) => void; onCancel: () => void }) {
  const [fullName, setFullName] = useState(cv.fullName);
  const [language, setLanguage] = useState(cv.language);
  const [includePhoto, setIncludePhoto] = useState(cv.includePhoto);

  const handleSave = () => {
    if (!fullName.trim()) { toast.error("İsim Soyisim zorunludur."); return; }
    onSave({ fullName: fullName.trim(), language, includePhoto });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground">CV Bilgilerini Düzenle</p>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">İsim Soyisim</Label>
        <Input className="h-9" value={fullName} onChange={e => setFullName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">CV Dili</Label>
        <LangSelect value={language} onChange={setLanguage} className="w-full" />
      </div>
      <div className="flex items-center gap-2">
        <input id="ecv_photo" type="checkbox" checked={includePhoto} onChange={e => setIncludePhoto(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
        <Label htmlFor="ecv_photo" className="text-sm cursor-pointer text-muted-foreground">Profil fotoğrafımı CV&apos;ye ekle</Label>
      </div>
      <FormActions onSave={handleSave} onCancel={onCancel} saveLabel="CV Bilgilerini Kaydet" />
    </div>
  );
}

/* ══ Skills section ═════════════════════════════════════════════ */

function SkillsSection({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [input, setInput] = useState("");

  const add = () => {
    const val = input.trim();
    if (!val) return;
    if (skills.map(s => s.toLowerCase()).includes(val.toLowerCase())) { toast.error("Bu yetenek zaten ekli."); return; }
    onChange([...skills, val]);
    setInput("");
    setShowForm(false);
  };

  const cancel = () => { setShowForm(false); setInput(""); };

  return (
    <div className="space-y-2">
      <SectionHeader title="Yetenekler" onAdd={() => setShowForm(true)} showAdd={!showForm && skills.length > 0} />

      {/* Chips */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 py-1">
          {skills.map(skill => (
            <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-muted border border-border text-foreground">
              {skill}
              <button type="button" onClick={() => onChange(skills.filter(s => s !== skill))} className="text-muted-foreground hover:text-foreground transition-colors ml-0.5">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
          <div className="space-y-0.5">
            <Label className="text-xs text-muted-foreground">Yetenek</Label>
            <Input
              className="h-9"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="React"
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            />
          </div>
          <FormActions onSave={add} onCancel={cancel} />
        </div>
      )}

      {/* Empty state */}
      {!showForm && skills.length === 0 && (
        <SectionEmpty text="Henüz yetenek eklenmedi." addLabel="Yetenek Ekle" onAdd={() => setShowForm(true)} />
      )}
    </div>
  );
}

/* ══ Education section ══════════════════════════════════════════ */

const EMPTY_EDU: CvEducation = { school: "", degree: "", start_year: "", end_year: "", is_current: false, description: "" };

function EducationForm({ initial, onSave, onCancel }: { initial: CvEducation; onSave: (v: CvEducation) => void; onCancel: () => void }) {
  const [d, setD] = useState({ ...initial, is_current: initial.is_current ?? false });
  const up = (p: Partial<typeof d>) => setD(prev => ({ ...prev, ...p }));

  const save = () => {
    const cm = getCurrentMonthValue();
    if (isAfterMonth(d.start_year, cm)) { toast.error("Başlangıç tarihi gelecekte olamaz."); return; }
    if (!d.is_current && isAfterMonth(d.start_year, d.end_year)) { toast.error("Başlangıç bitiş tarihinden sonra olamaz."); return; }
    onSave(d);
  };

  return (
    <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Okul</Label>
          <Input className="h-9" value={d.school} onChange={e => up({ school: e.target.value })} placeholder="Üniversite adı" /></div>
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Bölüm / Derece</Label>
          <Input className="h-9" value={d.degree} onChange={e => up({ degree: e.target.value })} placeholder="Bilgisayar Mühendisliği" /></div>
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Başlangıç</Label>
          <MonthPickerField value={d.start_year} onChange={v => up({ start_year: v })} /></div>
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Bitiş</Label>
          <MonthPickerField value={d.end_year} disabled={d.is_current} onChange={v => up({ end_year: v })} /></div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id={`edu_cur_${d.school}`} checked={d.is_current} onChange={e => up({ is_current: e.target.checked, end_year: e.target.checked ? "" : d.end_year })} className="h-3.5 w-3.5 rounded border-border accent-primary" />
        <Label htmlFor={`edu_cur_${d.school}`} className="text-xs text-muted-foreground cursor-pointer">Hâlâ okuyorum</Label>
      </div>
      <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Açıklama</Label>
        <Textarea rows={2} className="text-sm" value={d.description} onChange={e => up({ description: e.target.value })} placeholder="Kısa açıklama..." /></div>
      <FormActions onSave={save} onCancel={onCancel} />
    </div>
  );
}

function EducationSection({ items, onChange }: { items: CvEducation[]; onChange: (v: CvEducation[]) => void }) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const save = (item: CvEducation, idx: number) => { onChange(idx === -1 ? [...items, item] : items.map((x, i) => i === idx ? item : x)); setEditIdx(null); };
  return (
    <div className="space-y-2">
      <SectionHeader title="Eğitim" onAdd={() => setEditIdx(-1)} showAdd={editIdx === null && items.length > 0} />
      {items.map((item, i) => editIdx === i
        ? <EducationForm key={i} initial={item} onSave={v => save(v, i)} onCancel={() => setEditIdx(null)} />
        : <ItemCard key={i} summary={<div><p className="font-medium text-foreground leading-tight">{item.school || "—"}</p><p className="text-xs text-muted-foreground">{item.degree}</p></div>} onEdit={() => { if (editIdx === null) setEditIdx(i); }} onDelete={() => onChange(items.filter((_, j) => j !== i))} />
      )}
      {editIdx === -1 && <EducationForm initial={{ ...EMPTY_EDU }} onSave={v => save(v, -1)} onCancel={() => setEditIdx(null)} />}
      {editIdx === null && items.length === 0 && <SectionEmpty text="Henüz eğitim bilgisi eklenmedi." addLabel="Eğitim Ekle" onAdd={() => setEditIdx(-1)} />}
    </div>
  );
}

/* ══ Work Experience ════════════════════════════════════════════ */

const EMPTY_WORK: CvWorkExperience = { company: "", position: "", start_date: "", end_date: "", is_current: false, description: "" };

function WorkForm({ initial, onSave, onCancel }: { initial: CvWorkExperience; onSave: (v: CvWorkExperience) => void; onCancel: () => void }) {
  const [d, setD] = useState({ ...initial });
  const up = (p: Partial<typeof d>) => setD(prev => ({ ...prev, ...p }));

  const save = () => {
    const cm = getCurrentMonthValue();
    if (isAfterMonth(d.start_date, cm)) { toast.error("Başlangıç tarihi gelecekte olamaz."); return; }
    if (!d.is_current && isAfterMonth(d.start_date, d.end_date)) { toast.error("Başlangıç bitiş tarihinden sonra olamaz."); return; }
    onSave(d);
  };

  return (
    <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Şirket</Label>
          <Input className="h-9" value={d.company} onChange={e => up({ company: e.target.value })} placeholder="Şirket adı" /></div>
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Pozisyon</Label>
          <Input className="h-9" value={d.position} onChange={e => up({ position: e.target.value })} placeholder="Full-Stack Developer" /></div>
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Başlangıç</Label>
          <MonthPickerField value={d.start_date} onChange={v => up({ start_date: v })} /></div>
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Bitiş</Label>
          <MonthPickerField value={d.end_date} disabled={d.is_current} onChange={v => up({ end_date: v })} /></div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id={`work_cur_${d.company}`} checked={d.is_current} onChange={e => up({ is_current: e.target.checked, end_date: e.target.checked ? "" : d.end_date })} className="h-3.5 w-3.5 rounded border-border accent-primary" />
        <Label htmlFor={`work_cur_${d.company}`} className="text-xs text-muted-foreground cursor-pointer">Hâlâ burada çalışıyorum</Label>
      </div>
      <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Açıklama</Label>
        <Textarea rows={2} className="text-sm" value={d.description} onChange={e => up({ description: e.target.value })} placeholder="Görev ve sorumluluklarınız..." /></div>
      <FormActions onSave={save} onCancel={onCancel} />
    </div>
  );
}

function WorkSection({ items, onChange }: { items: CvWorkExperience[]; onChange: (v: CvWorkExperience[]) => void }) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const save = (item: CvWorkExperience, idx: number) => { onChange(idx === -1 ? [...items, item] : items.map((x, i) => i === idx ? item : x)); setEditIdx(null); };
  return (
    <div className="space-y-2">
      <SectionHeader title="İş Deneyimi" onAdd={() => setEditIdx(-1)} showAdd={editIdx === null && items.length > 0} />
      {items.map((item, i) => editIdx === i
        ? <WorkForm key={i} initial={item} onSave={v => save(v, i)} onCancel={() => setEditIdx(null)} />
        : <ItemCard key={i} summary={<div><p className="font-medium text-foreground leading-tight">{item.position || "—"}</p><p className="text-xs text-muted-foreground">{item.company}</p></div>} onEdit={() => { if (editIdx === null) setEditIdx(i); }} onDelete={() => onChange(items.filter((_, j) => j !== i))} />
      )}
      {editIdx === -1 && <WorkForm initial={{ ...EMPTY_WORK }} onSave={v => save(v, -1)} onCancel={() => setEditIdx(null)} />}
      {editIdx === null && items.length === 0 && <SectionEmpty text="Henüz iş deneyimi eklenmedi." addLabel="İş Deneyimi Ekle" onAdd={() => setEditIdx(-1)} />}
    </div>
  );
}

/* ══ Projects ════════════════════════════════════════════════════ */

const EMPTY_PROJ: CvProject = { name: "", description: "", technologies: "", url: "", start_date: "", end_date: "", is_current: false };

function ProjectForm({ initial, onSave, onCancel }: { initial: CvProject; onSave: (v: CvProject) => void; onCancel: () => void }) {
  const [d, setD] = useState({ start_date: "", end_date: "", is_current: false, ...initial });
  const up = (p: Partial<typeof d>) => setD(prev => ({ ...prev, ...p }));

  const save = () => {
    const cm = getCurrentMonthValue();
    if (isAfterMonth(d.start_date, cm)) { toast.error("Başlangıç tarihi gelecekte olamaz."); return; }
    if (!d.is_current && isAfterMonth(d.start_date, d.end_date)) { toast.error("Başlangıç bitiş tarihinden sonra olamaz."); return; }
    onSave(d);
  };

  return (
    <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Proje Adı</Label>
          <Input className="h-9" value={d.name} onChange={e => up({ name: e.target.value })} placeholder="Proje adı" /></div>
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Teknolojiler</Label>
          <Input className="h-9" value={d.technologies} onChange={e => up({ technologies: e.target.value })} placeholder="React, Django..." /></div>
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Başlangıç</Label>
          <MonthPickerField value={d.start_date ?? ""} onChange={v => up({ start_date: v })} /></div>
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Bitiş</Label>
          <MonthPickerField value={d.end_date ?? ""} disabled={d.is_current} onChange={v => up({ end_date: v })} /></div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id={`proj_cur_${d.name}`} checked={d.is_current ?? false} onChange={e => up({ is_current: e.target.checked, end_date: e.target.checked ? "" : d.end_date })} className="h-3.5 w-3.5 rounded border-border accent-primary" />
        <Label htmlFor={`proj_cur_${d.name}`} className="text-xs text-muted-foreground cursor-pointer">Hâlâ devam ediyor</Label>
      </div>
      <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">URL</Label>
        <Input type="url" className="h-9" value={d.url} onChange={e => up({ url: e.target.value })} placeholder="https://github.com/..." /></div>
      <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Açıklama</Label>
        <Textarea rows={2} className="text-sm" value={d.description} onChange={e => up({ description: e.target.value })} placeholder="Proje hakkında kısa açıklama..." /></div>
      <FormActions onSave={save} onCancel={onCancel} />
    </div>
  );
}

function ProjectsSection({ items, onChange }: { items: CvProject[]; onChange: (v: CvProject[]) => void }) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const save = (item: CvProject, idx: number) => { onChange(idx === -1 ? [...items, item] : items.map((x, i) => i === idx ? item : x)); setEditIdx(null); };
  return (
    <div className="space-y-2">
      <SectionHeader title="Projeler" onAdd={() => setEditIdx(-1)} showAdd={editIdx === null && items.length > 0} />
      {items.map((item, i) => editIdx === i
        ? <ProjectForm key={i} initial={item} onSave={v => save(v, i)} onCancel={() => setEditIdx(null)} />
        : <ItemCard key={i} summary={<div><p className="font-medium text-foreground leading-tight">{item.name || "—"}</p><p className="text-xs text-muted-foreground">{item.technologies}</p></div>} onEdit={() => { if (editIdx === null) setEditIdx(i); }} onDelete={() => onChange(items.filter((_, j) => j !== i))} />
      )}
      {editIdx === -1 && <ProjectForm initial={{ ...EMPTY_PROJ }} onSave={v => save(v, -1)} onCancel={() => setEditIdx(null)} />}
      {editIdx === null && items.length === 0 && <SectionEmpty text="Henüz proje eklenmedi." addLabel="Proje Ekle" onAdd={() => setEditIdx(-1)} />}
    </div>
  );
}

/* ══ Languages ══════════════════════════════════════════════════ */

const EMPTY_LANG: CvLanguage = { language: "", level: "" };

function LanguageForm({ initial, onSave, onCancel }: { initial: CvLanguage; onSave: (v: CvLanguage) => void; onCancel: () => void }) {
  const [d, setD] = useState({ ...initial });
  return (
    <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Dil</Label>
          <Input className="h-9" value={d.language} onChange={e => setD(p => ({ ...p, language: e.target.value }))} placeholder="French" /></div>
        <div className="space-y-0.5">
          <Label className="text-xs text-muted-foreground">Seviye</Label>
          <Select value={d.level} onValueChange={v => setD(p => ({ ...p, level: v ?? "" }))}>
            <SelectTrigger className="h-9 rounded-xl border-border bg-muted/40">
              <span className="text-sm text-foreground">
                {LANG_LEVELS.find(l => l.value === d.level)?.label ?? (d.level || "Seviye seçin")}
              </span>
            </SelectTrigger>
            <SelectContent>
              {LANG_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <FormActions onSave={() => onSave(d)} onCancel={onCancel} />
    </div>
  );
}

function LanguagesSection({ items, onChange }: { items: CvLanguage[]; onChange: (v: CvLanguage[]) => void }) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const save = (item: CvLanguage, idx: number) => { onChange(idx === -1 ? [...items, item] : items.map((x, i) => i === idx ? item : x)); setEditIdx(null); };
  return (
    <div className="space-y-2">
      <SectionHeader title="Diller" onAdd={() => setEditIdx(-1)} showAdd={editIdx === null && items.length > 0} />
      {items.map((item, i) => editIdx === i
        ? <LanguageForm key={i} initial={item} onSave={v => save(v, i)} onCancel={() => setEditIdx(null)} />
        : <ItemCard key={i} summary={<div><p className="font-medium text-foreground">{item.language}</p><p className="text-xs text-muted-foreground">{LANG_LEVELS.find(l => l.value === item.level)?.label ?? item.level}</p></div>} onEdit={() => { if (editIdx === null) setEditIdx(i); }} onDelete={() => onChange(items.filter((_, j) => j !== i))} />
      )}
      {editIdx === -1 && <LanguageForm initial={{ ...EMPTY_LANG }} onSave={v => save(v, -1)} onCancel={() => setEditIdx(null)} />}
      {editIdx === null && items.length === 0 && <SectionEmpty text="Henüz dil eklenmedi." addLabel="Dil Ekle" onAdd={() => setEditIdx(-1)} />}
    </div>
  );
}

/* ══ Certificates ════════════════════════════════════════════════ */

const EMPTY_CERT: CvCertificate = { name: "", issuer: "", year: "", url: "" };

function CertificateForm({ initial, onSave, onCancel }: { initial: CvCertificate; onSave: (v: CvCertificate) => void; onCancel: () => void }) {
  const [d, setD] = useState({ ...initial });
  const up = (p: Partial<typeof d>) => setD(prev => ({ ...prev, ...p }));
  return (
    <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Sertifika Adı</Label>
          <Input className="h-9" value={d.name} onChange={e => up({ name: e.target.value })} placeholder="AWS Certified Developer" /></div>
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Veren Kurum</Label>
          <Input className="h-9" value={d.issuer} onChange={e => up({ issuer: e.target.value })} placeholder="Amazon" /></div>
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">Tarih</Label>
          <MonthPickerField value={d.year} onChange={v => up({ year: v })} /></div>
        <div className="space-y-0.5"><Label className="text-xs text-muted-foreground">URL</Label>
          <Input type="url" className="h-9" value={d.url} onChange={e => up({ url: e.target.value })} placeholder="https://..." /></div>
      </div>
      <FormActions onSave={() => onSave(d)} onCancel={onCancel} />
    </div>
  );
}

function CertificatesSection({ items, onChange }: { items: CvCertificate[]; onChange: (v: CvCertificate[]) => void }) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const save = (item: CvCertificate, idx: number) => { onChange(idx === -1 ? [...items, item] : items.map((x, i) => i === idx ? item : x)); setEditIdx(null); };
  return (
    <div className="space-y-2">
      <SectionHeader title="Sertifikalar" onAdd={() => setEditIdx(-1)} showAdd={editIdx === null && items.length > 0} />
      {items.map((item, i) => editIdx === i
        ? <CertificateForm key={i} initial={item} onSave={v => save(v, i)} onCancel={() => setEditIdx(null)} />
        : <ItemCard key={i} summary={<div><p className="font-medium text-foreground">{item.name}</p><p className="text-xs text-muted-foreground">{item.issuer}</p></div>} onEdit={() => { if (editIdx === null) setEditIdx(i); }} onDelete={() => onChange(items.filter((_, j) => j !== i))} />
      )}
      {editIdx === -1 && <CertificateForm initial={{ ...EMPTY_CERT }} onSave={v => save(v, -1)} onCancel={() => setEditIdx(null)} />}
      {editIdx === null && items.length === 0 && <SectionEmpty text="Henüz sertifika eklenmedi." addLabel="Sertifika Ekle" onAdd={() => setEditIdx(-1)} />}
    </div>
  );
}

/* ══ Main page ══════════════════════════════════════════════════ */

function CvBuilderContent() {
  const [user, setUser] = useState<User | null>(null);
  const [baseProfile, setBaseProfile] = useState<DeveloperProfile | null>(null);
  const [cvList, setCvList] = useState<LocalCv[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingSectionsId, setEditingSectionsId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCvId, setEditingCvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [userRes, profileRes] = await Promise.all([
          api.get<User>("/auth/me/"),
          api.get<DeveloperProfile>("/developer-profile/me/"),
        ]);
        setUser(userRes.data);
        setBaseProfile(profileRes.data);

        const stored = loadFromStorage();
        if (stored.length === 0) {
          const p = profileRes.data;
          const hasData =
            (p.education?.length ?? 0) > 0 ||
            (p.work_experience?.length ?? 0) > 0 ||
            (p.skills || "").trim() !== "";
          if (hasData) {
            const u = userRes.data;
            const imported: LocalCv = {
              id: newId(),
              fullName: `${u.first_name} ${u.last_name}`.trim(),
              language: p.cv_language_preference ?? "en",
              includePhoto: p.include_profile_photo_in_cv ?? true,
              skills: (p.skills || "").split(",").map(s => s.trim()).filter(Boolean),
              education: (p.education ?? []).map(e => ({ is_current: false, ...e })),
              workExperience: p.work_experience ?? [],
              projects: (p.projects ?? []).map(pr => ({ start_date: "", end_date: "", is_current: false, ...pr })),
              cvLanguages: p.languages ?? [],
              certificates: p.certificates ?? [],
            };
            setCvList([imported]);
            persistToStorage([imported]);
          }
        } else {
          setCvList(stored);
        }
      } catch {
        toast.error("Profil yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const syncToBackend = async (cv: LocalCv) => {
    try {
      await api.patch<DeveloperProfile>("/developer-profile/me/", {
        education: cv.education,
        work_experience: cv.workExperience,
        projects: cv.projects,
        languages: cv.cvLanguages,
        certificates: cv.certificates,
        skills: cv.skills.join(", "),
        cv_language_preference: cv.language,
        include_profile_photo_in_cv: cv.includePhoto,
      });
    } catch {}
  };

  const updateCv = (id: string, updates: Partial<LocalCv>) => {
    setCvList(prev => {
      const updated = prev.map(cv => cv.id === id ? { ...cv, ...updates } : cv);
      persistToStorage(updated);
      const target = updated.find(cv => cv.id === id);
      if (target) syncToBackend(target);
      return updated;
    });
  };

  const handleCreateSave = (newCv: LocalCv) => {
    const updated = [...cvList, newCv];
    setCvList(updated);
    persistToStorage(updated);
    setShowCreateForm(false);
  };

  const selectedCv = cvList.find(cv => cv.id === selectedId) ?? null;
  const editingSectionsCv = cvList.find(cv => cv.id === editingSectionsId) ?? null;

  const handleDeleteCv = (id: string) => {
    const updated = cvList.filter(cv => cv.id !== id);
    setCvList(updated);
    persistToStorage(updated);
    if (selectedId === id) setSelectedId(null);
    if (editingSectionsId === id) setEditingSectionsId(null);
  };

  const handleSaveContentAndClose = async () => {
    if (!editingSectionsCv) return;
    try {
      await api.patch<DeveloperProfile>("/developer-profile/me/", {
        education: editingSectionsCv.education,
        work_experience: editingSectionsCv.workExperience,
        projects: editingSectionsCv.projects,
        languages: editingSectionsCv.cvLanguages,
        certificates: editingSectionsCv.certificates,
        skills: editingSectionsCv.skills.join(", "),
        cv_language_preference: editingSectionsCv.language,
        include_profile_photo_in_cv: editingSectionsCv.includePhoto,
      });
      toast.success("CV bilgileri kaydedildi.");
    } catch {
      toast.error("CV bilgileri kaydedilemedi.");
    }
    setEditingSectionsId(null);
  };

  const previewUser: User | null =
    user && selectedCv
      ? (() => { const { first_name, last_name } = splitName(selectedCv.fullName); return { ...user, first_name, last_name }; })()
      : null;

  const previewProfile: DeveloperProfile | null =
    baseProfile && selectedCv ? toPreviewProfile(baseProfile, selectedCv) : null;

  const handleDownloadPdf = async () => {
    if (!previewUser || !previewProfile || !selectedCv) return;
    setDownloading(true);
    try {
      await generateCvPdf({
        filename: `CV_${selectedCv.fullName.replace(/\s+/g, "_")}.pdf`,
        user: previewUser,
        profile: previewProfile,
        language: selectedCv.language,
        includePhoto: selectedCv.includePhoto,
      });
    } catch {
      toast.error("PDF oluşturulamadı.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">CV Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">CV&apos;lerinizi oluşturun, düzenleyin ve PDF olarak indirin.</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] gap-6 items-start">

            {/* ── Left panel ── */}
            <div>
              {/* CV list */}
              <div className="space-y-3">
                {cvList.length === 0 && !showCreateForm && (
                  <p className="text-sm text-muted-foreground py-1">Henüz CV oluşturulmadı.</p>
                )}

                {cvList.map(cv => (
                  editingCvId === cv.id ? (
                    <EditCvForm
                      key={cv.id}
                      cv={cv}
                      onSave={updates => { updateCv(cv.id, updates); setEditingCvId(null); }}
                      onCancel={() => setEditingCvId(null)}
                    />
                  ) : (
                    <div
                      key={cv.id}
                      className={[
                        "bg-card border rounded-2xl px-4 py-3.5 transition-all",
                        selectedId === cv.id || editingSectionsId === cv.id
                          ? "border-primary ring-1 ring-primary/20 shadow-sm"
                          : "border-border",
                      ].join(" ")}
                    >
                      <div className="min-w-0 mb-3">
                        <p className="text-sm font-semibold text-foreground leading-tight">{cv.fullName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{cvLangLabel(cv.language)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setSelectedId(cv.id); setEditingSectionsId(null); }}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium bg-muted/60 border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Eye size={12} />Önizle
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSelectedId(cv.id); setEditingSectionsId(cv.id); }}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 transition-colors"
                        >
                          <LayoutList size={12} />CV İçeriğini Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingCvId(cv.id); setShowCreateForm(false); }}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium bg-muted/60 border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Pencil size={12} />CV Bilgilerini Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCv(cv.id)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />Sil
                        </button>
                      </div>
                    </div>
                  )
                ))}

                {showCreateForm && (
                  <CreateCvForm onSave={handleCreateSave} onCancel={() => setShowCreateForm(false)} />
                )}

                {!showCreateForm && (
                  <button type="button" onClick={() => { setShowCreateForm(true); setEditingCvId(null); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
                    <Plus size={15} />Yeni CV Ekle
                  </button>
                )}
              </div>

              {/* CV content sections — visible only when "CV İçeriğini Düzenle" is clicked */}
              {editingSectionsCv && (
                <div className="space-y-6 mt-6 pt-6 border-t border-border">
                  <SkillsSection skills={editingSectionsCv.skills} onChange={skills => updateCv(editingSectionsCv.id, { skills })} />
                  <hr className="border-border" />
                  <EducationSection items={editingSectionsCv.education} onChange={education => updateCv(editingSectionsCv.id, { education })} />
                  <hr className="border-border" />
                  <WorkSection items={editingSectionsCv.workExperience} onChange={workExperience => updateCv(editingSectionsCv.id, { workExperience })} />
                  <hr className="border-border" />
                  <ProjectsSection items={editingSectionsCv.projects} onChange={projects => updateCv(editingSectionsCv.id, { projects })} />
                  <hr className="border-border" />
                  <LanguagesSection items={editingSectionsCv.cvLanguages} onChange={cvLanguages => updateCv(editingSectionsCv.id, { cvLanguages })} />
                  <hr className="border-border" />
                  <CertificatesSection items={editingSectionsCv.certificates} onChange={certificates => updateCv(editingSectionsCv.id, { certificates })} />
                  <hr className="border-border" />
                  <div className="flex justify-end pt-1 pb-2">
                    <button
                      type="button"
                      onClick={handleSaveContentAndClose}
                      className="h-10 px-5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 shadow-sm active:scale-[0.98] transition-all"
                    >
                      CV Bilgilerini Kaydet
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right panel ── */}
            <div className="lg:sticky lg:top-24 space-y-3">
              {selectedCv && previewUser && previewProfile ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Önizleme</span>
                    <Button size="sm" variant="outline" disabled={downloading} onClick={handleDownloadPdf} className="gap-1.5">
                      <Download size={14} />
                      {downloading ? "Hazırlanıyor..." : "PDF İndir"}
                    </Button>
                  </div>
                  <div className="rounded-xl border border-border overflow-auto max-h-[75vh] bg-white shadow-sm">
                    <div style={{ minWidth: "800px" }}>
                      <CvPreview user={previewUser} profile={previewProfile} language={selectedCv.language} includePhoto={selectedCv.includePhoto} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border flex items-center justify-center p-16 min-h-70">
                  <p className="text-sm text-muted-foreground text-center">Önizleme için bir CV seçin.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function CvBuilderPage() {
  return (
    <ProtectedRoute allowedRoles={["DEVELOPER"]}>
      <CvBuilderContent />
    </ProtectedRoute>
  );
}
