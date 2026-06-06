"use client";

import type { DeveloperProfile, User } from "@/types";

/* ── Types ────────────────────────────────────────────────────── */

type CvLang = "en" | "tr" | "de";

interface CvPreviewProps {
  user: User;
  profile: DeveloperProfile;
  language: string;
  includePhoto: boolean;
}

/* ── Translation labels ───────────────────────────────────────── */

const CV_LABELS = {
  en: {
    summary: "Summary",
    skills: "Skills",
    workExperience: "Work Experience",
    education: "Education",
    projects: "Projects",
    languages: "Languages",
    certificates: "Certificates",
    contact: "Contact",
    present: "Present",
  },
  tr: {
    summary: "Hakkımda",
    skills: "Yetenekler",
    workExperience: "İş Deneyimi",
    education: "Eğitim",
    projects: "Projeler",
    languages: "Diller",
    certificates: "Sertifikalar",
    contact: "İletişim",
    present: "Devam ediyor",
  },
  de: {
    summary: "Zusammenfassung",
    skills: "Fähigkeiten",
    workExperience: "Berufserfahrung",
    education: "Ausbildung",
    projects: "Projekte",
    languages: "Sprachen",
    certificates: "Zertifikate",
    contact: "Kontakt",
    present: "Heute",
  },
} as const;

/* ── Month abbreviations per language ────────────────────────── */

const MONTH_ABBR: Record<CvLang, string[]> = {
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  tr: ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"],
  de: ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"],
};

/* ── Language level → star mapping ───────────────────────────── */

const LEVEL_STARS: Record<string, string> = {
  BEGINNER:     "★☆☆☆☆",
  ELEMENTARY:   "★★☆☆☆",
  INTERMEDIATE: "★★★☆☆",
  FLUENT:       "★★★★☆",
  NATIVE:       "★★★★★",
};

/* ── Date helpers ─────────────────────────────────────────────── */

function formatMonth(value: string | undefined, lang: CvLang): string {
  if (!value) return "";
  const parts = value.split("-");
  const year = parts[0];
  const monthIdx = parseInt(parts[1] ?? "0", 10) - 1;
  if (!year || monthIdx < 0 || monthIdx > 11) return value;
  return `${MONTH_ABBR[lang][monthIdx]} ${year}`;
}

function formatRange(
  start: string | undefined,
  end: string | undefined,
  isCurrent: boolean | undefined,
  lang: CvLang,
  present: string,
): string {
  const s = formatMonth(start, lang);
  if (isCurrent) return s ? `${s} — ${present}` : present;
  const e = formatMonth(end, lang);
  if (s && e) return `${s} — ${e}`;
  return s || e;
}

/* ── Photo URL resolver ───────────────────────────────────────── */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const MEDIA_BASE = API_URL.replace(/\/api\/?$/, "");

function resolvePhotoUrl(photo: string | null | undefined): string | null {
  if (!photo) return null;
  if (photo.startsWith("http")) return photo;
  return `${MEDIA_BASE}${photo}`;
}

/* ── Sub-components ───────────────────────────────────────────── */

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">{title}</p>
      <div className="border-b border-blue-200 mb-2" />
      {children}
    </div>
  );
}

function MainSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">{title}</p>
      <div className="border-b border-blue-200 mb-3" />
      {children}
    </div>
  );
}

/* ── Main CvPreview component ─────────────────────────────────── */

export default function CvPreview({ user, profile, language, includePhoto }: CvPreviewProps) {
  const lang = (["en", "tr", "de"].includes(language) ? language : "en") as CvLang;
  const labels = CV_LABELS[lang];

  const fullName  = `${user.first_name} ${user.last_name}`.trim();
  const photoUrl  = includePhoto ? resolvePhotoUrl(user.profile_photo) : null;

  const education = profile.education      ?? [];
  const workExp   = profile.work_experience ?? [];
  const projects  = profile.projects       ?? [];
  const langs     = profile.languages      ?? [];
  const certs     = profile.certificates   ?? [];
  const skills    = (profile.skills || "").split(",").map(s => s.trim()).filter(Boolean);

  const contacts = [
    user.email,
    profile.phone,
    profile.location,
    profile.website,
    profile.linkedin_url,
    profile.github_url,
    profile.portfolio_url,
  ].filter(Boolean) as string[];

  const hasAnyContent =
    fullName || profile.bio || skills.length ||
    workExp.length || education.length || projects.length ||
    langs.length   || certs.length;

  if (!hasAnyContent) {
    return (
      <div className="bg-white border rounded-md p-8 text-center">
        <p className="text-sm text-gray-400">
          CV önizlemesi için profil bilgilerinizi doldurun.
        </p>
      </div>
    );
  }

  const g = user.gender?.toUpperCase();
  const avatarClasses =
    g === "MALE"   ? "bg-blue-100 text-blue-700"  :
    g === "FEMALE" ? "bg-pink-100 text-pink-700"  :
                     "bg-gray-200 text-gray-600";

  return (
    <div className="mx-auto max-w-198.5 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm text-[13px]">
      <div className="grid grid-cols-[230px_1fr]">

        {/* ── Sidebar ── */}
        <aside className="bg-[#f3f4f6] p-6 flex flex-col gap-5 min-h-225">

          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-2 pb-4 border-b border-gray-300">
            {includePhoto && (
              photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={fullName}
                  crossOrigin="anonymous"
                  className="w-20 h-20 rounded-full object-cover border-2 border-white shadow"
                />
              ) : (
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${avatarClasses}`}>
                  {user.first_name.charAt(0).toUpperCase() || "?"}
                </div>
              )
            )}
            <p className="text-xs font-semibold text-center text-gray-800 leading-tight">{fullName}</p>
            {profile.title && (
              <p className="text-[11px] text-blue-600 text-center leading-tight">{profile.title}</p>
            )}
          </div>

          {/* Contact */}
          {contacts.length > 0 && (
            <SidebarSection title={labels.contact}>
              <div className="space-y-1">
                {contacts.map((c, i) => (
                  <p key={i} className="text-[11px] text-gray-500 break-all leading-snug">{c}</p>
                ))}
              </div>
            </SidebarSection>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <SidebarSection title={labels.skills}>
              <div className="flex flex-wrap gap-1">
                {skills.map((sk, i) => (
                  <span
                    key={i}
                    className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </SidebarSection>
          )}

          {/* Languages */}
          {langs.length > 0 && (
            <SidebarSection title={labels.languages}>
              <div className="space-y-2">
                {langs.map((l, i) => (
                  <div key={i}>
                    <p className="text-xs font-semibold text-gray-800">{l.language}</p>
                    <p className="text-[11px] text-gray-500 tracking-wide leading-none mt-0.5">
                      {LEVEL_STARS[l.level] ?? l.level}
                    </p>
                  </div>
                ))}
              </div>
            </SidebarSection>
          )}

          {/* Certificates */}
          {certs.length > 0 && (
            <SidebarSection title={labels.certificates}>
              <div className="space-y-2.5">
                {certs.map((cert, i) => (
                  <div key={i}>
                    <p className="text-xs font-semibold text-gray-800 leading-tight">{cert.name}</p>
                    {cert.issuer && (
                      <p className="text-[11px] text-gray-500 leading-tight">{cert.issuer}</p>
                    )}
                    {cert.year && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatMonth(cert.year, lang)}</p>
                    )}
                  </div>
                ))}
              </div>
            </SidebarSection>
          )}
        </aside>

        {/* ── Main ── */}
        <main className="p-8 bg-white">

          {/* Header */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{fullName}</h1>
            {profile.title && (
              <p className="text-sm text-blue-600 mt-0.5">{profile.title}</p>
            )}
            <div className="mt-3 border-b border-gray-200" />
          </div>

          {/* Summary */}
          {profile.bio && (
            <MainSection title={labels.summary}>
              <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
            </MainSection>
          )}

          {/* Work Experience */}
          {workExp.length > 0 && (
            <MainSection title={labels.workExperience}>
              <div className="space-y-3.5">
                {workExp.map((exp, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-900">{exp.position}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {formatRange(exp.start_date, exp.end_date, exp.is_current, lang, labels.present)}
                      </span>
                    </div>
                    {exp.company && <p className="text-xs text-gray-500 mt-0.5">{exp.company}</p>}
                    {exp.description && (
                      <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </MainSection>
          )}

          {/* Education */}
          {education.length > 0 && (
            <MainSection title={labels.education}>
              <div className="space-y-3.5">
                {education.map((edu, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-900">{edu.school}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {formatRange(edu.start_year, edu.end_year, edu.is_current, lang, labels.present)}
                      </span>
                    </div>
                    {edu.degree && <p className="text-xs text-gray-500 mt-0.5">{edu.degree}</p>}
                    {edu.description && (
                      <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </MainSection>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <MainSection title={labels.projects}>
              <div className="space-y-3.5">
                {projects.map((proj, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-900">{proj.name}</span>
                      {(proj.start_date || proj.end_date || proj.is_current) && (
                        <span className="text-[11px] text-gray-400 shrink-0">
                          {formatRange(proj.start_date, proj.end_date, proj.is_current, lang, labels.present)}
                        </span>
                      )}
                    </div>
                    {proj.technologies && <p className="text-xs text-gray-500 mt-0.5">{proj.technologies}</p>}
                    {proj.url && <p className="text-xs text-blue-500 break-all mt-0.5">{proj.url}</p>}
                    {proj.description && (
                      <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{proj.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </MainSection>
          )}
        </main>
      </div>
    </div>
  );
}
