"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import api from "@/lib/api";
import { getUser, isAuthenticated } from "@/lib/auth";
import type { CvCertificate, CvEducation, CvLanguage, CvProject, CvWorkExperience, PublicProfile, User } from "@/types";

/* ── Date helpers ─────────────────────────────────────────────── */

const MONTH_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

function fmtMonth(val: string | undefined): string {
  if (!val) return "";
  const parts = val.split("-");
  const yr = parts[0];
  const mi = parseInt(parts[1] ?? "0", 10) - 1;
  if (!yr || mi < 0 || mi > 11) return val;
  return `${MONTH_TR[mi]} ${yr}`;
}

function fmtRange(start?: string, end?: string, isCurrent?: boolean): string {
  const s = fmtMonth(start);
  if (isCurrent) return s ? `${s} — Devam ediyor` : "Devam ediyor";
  const e = fmtMonth(end);
  if (s && e) return `${s} — ${e}`;
  return s || e || "";
}

/* ── Avatar ───────────────────────────────────────────────────── */

function Avatar({
  name,
  photo,
  gender,
  size = "md",
}: {
  name: string;
  photo?: string | null;
  gender?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "w-20 h-20 text-2xl" :
    size === "sm" ? "w-8 h-8 text-sm"   : "w-12 h-12 text-lg";
  const g = gender?.toUpperCase();
  const colorClass =
    g === "MALE"   ? "bg-blue-100 text-blue-700"  :
    g === "FEMALE" ? "bg-pink-100 text-pink-700"  :
                     "bg-gray-200 text-gray-600";
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photo} alt={name} className={`${sizeClass} rounded-full object-cover shrink-0`} />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold shrink-0 ${colorClass}`}>
      {name.charAt(0).toUpperCase() || "?"}
    </div>
  );
}

/* ── Language level → stars ───────────────────────────────────── */

const LEVEL_STARS: Record<string, string> = {
  BEGINNER:     "★☆☆☆☆",
  ELEMENTARY:   "★★☆☆☆",
  INTERMEDIATE: "★★★☆☆",
  FLUENT:       "★★★★☆",
  NATIVE:       "★★★★★",
};

/* ── Section wrapper ──────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg p-5 bg-white space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 border-b pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ── Developer profile view ───────────────────────────────────── */

function DeveloperProfileView({
  publicProfile,
  currentUserId,
}: {
  publicProfile: PublicProfile;
  currentUserId: number | null;
}) {
  const { user, developer_profile: dp } = publicProfile;
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const isOwn = currentUserId === user.id;

  const workExp   = (dp?.work_experience  ?? []) as CvWorkExperience[];
  const education = (dp?.education        ?? []) as CvEducation[];
  const projects  = (dp?.projects         ?? []) as CvProject[];
  const langs     = (dp?.languages        ?? []) as CvLanguage[];
  const certs     = (dp?.certificates     ?? []) as CvCertificate[];
  const skills    = (dp?.skills ?? "").split(",").map(s => s.trim()).filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

      {/* Header card */}
      <div className="border rounded-lg p-6 bg-white flex items-start gap-5">
        <Avatar name={fullName} photo={user.profile_photo} gender={user.gender} size="lg" />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
            {isOwn && (
              <Link href="/profile" className="text-xs text-blue-600 hover:underline shrink-0">
                Profili düzenle
              </Link>
            )}
          </div>
          {dp?.title && <p className="text-sm text-blue-600">{dp.title}</p>}
          {dp?.location && <p className="text-xs text-gray-500">{dp.location}</p>}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              Developer
            </span>
            {dp?.is_open_to_work && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Open to work
              </span>
            )}
            {dp?.years_of_experience != null && (
              <span className="text-xs text-gray-500">{dp.years_of_experience} yıl deneyim</span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {dp?.linkedin_url && (
              <a href={dp.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">LinkedIn</a>
            )}
            {dp?.github_url && (
              <a href={dp.github_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">GitHub</a>
            )}
            {dp?.portfolio_url && (
              <a href={dp.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Portfolio</a>
            )}
            {dp?.website && (
              <a href={dp.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Website</a>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {dp?.bio && (
        <Section title="Hakkında">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{dp.bio}</p>
        </Section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Section title="Yetenekler">
          <div className="flex flex-wrap gap-2">
            {skills.map((sk, i) => (
              <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                {sk}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Work Experience */}
      {workExp.length > 0 && (
        <Section title="İş Deneyimi">
          <div className="space-y-4">
            {workExp.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-900">{exp.position}</span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {fmtRange(exp.start_date, exp.end_date, exp.is_current)}
                  </span>
                </div>
                {exp.company && <p className="text-xs text-gray-500 mt-0.5">{exp.company}</p>}
                {exp.description && (
                  <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <Section title="Eğitim">
          <div className="space-y-4">
            {education.map((edu, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-900">{edu.school}</span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {fmtRange(edu.start_year, edu.end_year, edu.is_current)}
                  </span>
                </div>
                {edu.degree && <p className="text-xs text-gray-500 mt-0.5">{edu.degree}</p>}
                {edu.description && (
                  <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <Section title="Projeler">
          <div className="space-y-4">
            {projects.map((proj, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-900">{proj.name}</span>
                  {(proj.start_date || proj.end_date || proj.is_current) && (
                    <span className="text-xs text-gray-400 shrink-0">
                      {fmtRange(proj.start_date, proj.end_date, proj.is_current)}
                    </span>
                  )}
                </div>
                {proj.technologies && <p className="text-xs text-gray-500 mt-0.5">{proj.technologies}</p>}
                {proj.url && (
                  <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 break-all mt-0.5 block">{proj.url}</a>
                )}
                {proj.description && (
                  <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{proj.description}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Languages */}
      {langs.length > 0 && (
        <Section title="Diller">
          <div className="space-y-2">
            {langs.map((l, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-gray-800">{l.language}</span>
                <span className="text-gray-300">—</span>
                <span className="text-gray-500 tracking-wide text-sm">{LEVEL_STARS[l.level] ?? l.level}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Certificates */}
      {certs.length > 0 && (
        <Section title="Sertifikalar">
          <div className="space-y-3">
            {certs.map((cert, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-900">{cert.name}</span>
                  {cert.year && (
                    <span className="text-xs text-gray-400 shrink-0">{fmtMonth(cert.year)}</span>
                  )}
                </div>
                {cert.issuer && <p className="text-xs text-gray-500 mt-0.5">{cert.issuer}</p>}
                {cert.url && (
                  <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 break-all mt-0.5 block">{cert.url}</a>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Empty state */}
      {!dp?.bio && skills.length === 0 && workExp.length === 0 &&
       education.length === 0 && projects.length === 0 &&
       langs.length === 0 && certs.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          Bu kullanıcı henüz profil detaylarını doldurmamış.
        </p>
      )}
    </div>
  );
}

/* ── Recruiter profile view ───────────────────────────────────── */

function RecruiterProfileView({
  publicProfile,
  currentUserId,
}: {
  publicProfile: PublicProfile;
  currentUserId: number | null;
}) {
  const { user, recruiter_profile: rp } = publicProfile;
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const isOwn = currentUserId === user.id;

  const hasCompanyInfo = !!(rp?.company_name || rp?.company_industry || rp?.company_location || rp?.company_website);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

      {/* Header card */}
      <div className="border rounded-lg p-6 bg-white flex items-start gap-5">
        <Avatar name={fullName} photo={user.profile_photo} gender={user.gender} size="lg" />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
            {isOwn && (
              <Link href="/profile" className="text-xs text-blue-600 hover:underline shrink-0">
                Profili düzenle
              </Link>
            )}
          </div>
          {rp?.position_title && <p className="text-sm text-blue-600">{rp.position_title}</p>}
          {rp?.company_name && <p className="text-xs text-gray-700 font-medium">{rp.company_name}</p>}
          {rp?.company_location && <p className="text-xs text-gray-500">{rp.company_location}</p>}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              Recruiter
            </span>
            {rp?.is_hiring && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Hiring
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {rp?.linkedin_url && (
              <a href={rp.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">LinkedIn</a>
            )}
            {rp?.company_website && (
              <a href={rp.company_website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Website</a>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {rp?.bio && (
        <Section title="Hakkında">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{rp.bio}</p>
        </Section>
      )}

      {/* Company info */}
      {hasCompanyInfo && (
        <Section title="Şirket Bilgileri">
          <div className="space-y-2">
            {rp?.company_name && (
              <div className="flex gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">Şirket</span>
                <span className="text-sm text-gray-800">{rp.company_name}</span>
              </div>
            )}
            {rp?.company_industry && (
              <div className="flex gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">Sektör</span>
                <span className="text-sm text-gray-800">{rp.company_industry}</span>
              </div>
            )}
            {rp?.company_location && (
              <div className="flex gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">Konum</span>
                <span className="text-sm text-gray-800">{rp.company_location}</span>
              </div>
            )}
            {rp?.company_website && (
              <div className="flex gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">Website</span>
                <a
                  href={rp.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline break-all"
                >
                  {rp.company_website}
                </a>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Empty state */}
      {!rp?.bio && !hasCompanyInfo && (
        <p className="text-sm text-gray-400 text-center py-4">
          Bu kullanıcı henüz şirket/profil detaylarını doldurmamış.
        </p>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;

  const [ready, setReady] = useState(false);
  const [auth, setAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const user = isAuthenticated() ? getUser() : null;
    setCurrentUser(user);
    setAuth(!!user);
    setReady(true);

    api
      .get<PublicProfile>(`/users/${userId}/public-profile/`)
      .then((res) => setPublicProfile(res.data))
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (!ready && !userId) return null;

  const body = (
    <div className="min-h-screen">
      {loading ? (
        <div className="max-w-2xl mx-auto px-6 py-8">
          <p className="text-sm text-gray-400">Yükleniyor...</p>
        </div>
      ) : notFound || !publicProfile ? (
        <div className="max-w-2xl mx-auto px-6 py-8">
          <p className="text-sm text-gray-400">Kullanıcı bulunamadı.</p>
        </div>
      ) : publicProfile.user.role === "DEVELOPER" ? (
        <DeveloperProfileView
          publicProfile={publicProfile}
          currentUserId={currentUser?.id ?? null}
        />
      ) : (
        <RecruiterProfileView
          publicProfile={publicProfile}
          currentUserId={currentUser?.id ?? null}
        />
      )}
    </div>
  );

  return auth ? <AppLayout>{body}</AppLayout> : <PublicLayout>{body}</PublicLayout>;
}
