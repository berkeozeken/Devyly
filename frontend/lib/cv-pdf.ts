import type { DeveloperProfile, User } from "@/types";

/* ── Types & constants ───────────────────────────────────────── */

type CvLang = "en" | "tr" | "de";

const CV_LABELS = {
  en: { summary: "Summary", skills: "Skills", workExperience: "Work Experience", education: "Education", projects: "Projects", languages: "Languages", certificates: "Certificates", contact: "Contact", present: "Present" },
  tr: { summary: "Hakkımda", skills: "Yetenekler", workExperience: "İş Deneyimi", education: "Eğitim", projects: "Projeler", languages: "Diller", certificates: "Sertifikalar", contact: "İletişim", present: "Devam ediyor" },
  de: { summary: "Zusammenfassung", skills: "Fähigkeiten", workExperience: "Berufserfahrung", education: "Ausbildung", projects: "Projekte", languages: "Sprachen", certificates: "Zertifikate", contact: "Kontakt", present: "Heute" },
} as const;

const MONTH_ABBR: Record<CvLang, string[]> = {
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  tr: ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"],
  de: ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"],
};

const LEVEL_MAP: Record<string, string> = {
  BEGINNER: "1/5", ELEMENTARY: "2/5", INTERMEDIATE: "3/5", FLUENT: "4/5", NATIVE: "5/5",
};

/* ── Format helpers ──────────────────────────────────────────── */

function fmtMonth(val: string | undefined, lang: CvLang): string {
  if (!val) return "";
  const p = val.split("-");
  const yr = p[0];
  const mi = parseInt(p[1] ?? "0", 10) - 1;
  if (!yr || mi < 0 || mi > 11) return val;
  return `${MONTH_ABBR[lang][mi]} ${yr}`;
}

function fmtRange(
  start: string | undefined,
  end: string | undefined,
  isCurrent: boolean | undefined,
  lang: CvLang,
  present: string,
): string {
  const s = fmtMonth(start, lang);
  if (isCurrent) return s ? `${s} — ${present}` : present;
  const e = fmtMonth(end, lang);
  if (s && e) return `${s} — ${e}`;
  return s || e || "";
}

/* ── Photo loading ───────────────────────────────────────────── */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const MEDIA_BASE = API_URL.replace(/\/api\/?$/, "");

function resolvePhotoUrl(photo: string | null | undefined): string | null {
  if (!photo) return null;
  if (photo.startsWith("http")) return photo;
  return `${MEDIA_BASE}${photo}`;
}

async function loadImageBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise<string>((ok, fail) => {
      const r = new FileReader();
      r.onload = () => ok(r.result as string);
      r.onerror = fail;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/* ── Main export ─────────────────────────────────────────────── */

export async function generateCvPdf(params: {
  filename: string;
  user: User;
  profile: DeveloperProfile;
  language: string;
  includePhoto: boolean;
}): Promise<void> {
  const { filename, user, profile, language, includePhoto } = params;
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p", "mm", "a4");

  // ── Layout constants
  const pH = 297;
  const mg = 12;
  const sbW = 60;       // sidebar width
  const sbIX = 5;       // sidebar inner X
  const sbCW = sbW - sbIX * 2; // sidebar content width
  const mX = sbW + 4;   // main content start X
  const mW = 210 - mX - mg; // main content width

  const lang = (["en", "tr", "de"].includes(language) ? language : "en") as CvLang;
  const L = CV_LABELS[lang];

  // ── Color helpers (RGB tuples)
  type RGB = [number, number, number];
  const DARK:    RGB = [31, 41, 55];
  const MUTED:   RGB = [107, 114, 128];
  const PRIMARY: RGB = [37, 99, 235];
  const SBBG:    RGB = [243, 244, 246];
  const CHIPBG:  RGB = [219, 234, 254];
  const CHIPFG:  RGB = [29, 78, 216];
  const BORDER:  RGB = [209, 213, 219];

  const fc = (c: RGB) => pdf.setFillColor(c[0], c[1], c[2]);
  const tc = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2]);
  const dc = (c: RGB) => pdf.setDrawColor(c[0], c[1], c[2]);

  // ── Metric helpers (pt → mm, factor 0.352778)
  // lh: visual line-height for n-pt font; boff: baseline offset from top-of-line
  const lh   = (pt: number) => pt * 0.352778 * 1.2;
  const boff = (pt: number) => pt * 0.352778 * 0.78;

  // ── Y trackers
  let sY = mg;
  let mY = mg;

  // ── Sidebar background
  const drawSb = () => { fc(SBBG); pdf.rect(0, 0, sbW, pH, "F"); };
  drawSb();

  const fullName = `${user.first_name} ${user.last_name}`.trim();

  // ── Avatar (sidebar top)
  const avR  = 14;
  const avCX = sbW / 2;
  const avCY = sY + avR;

  if (includePhoto) {
    let photoOk = false;
    if (user.profile_photo) {
      const url = resolvePhotoUrl(user.profile_photo);
      if (url) {
        const imgData = await loadImageBase64(url);
        if (imgData) {
          try {
            pdf.addImage(imgData, "JPEG", avCX - avR, avCY - avR, avR * 2, avR * 2);
            photoOk = true;
          } catch (e) {
            console.warn("PDF: photo add failed, using initial avatar", e);
          }
        }
      }
    }

    if (!photoOk) {
      const g = user.gender?.toUpperCase();
      let bg: RGB = [229, 231, 235];
      let fg: RGB = [75, 85, 99];
      if (g === "MALE")   { bg = [219, 234, 254]; fg = [29, 78, 216]; }
      if (g === "FEMALE") { bg = [252, 231, 243]; fg = [190, 24, 93]; }

      fc(bg); pdf.ellipse(avCX, avCY, avR, avR, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(17);
      tc(fg);
      const init = user.first_name.charAt(0).toUpperCase() || "?";
      pdf.text(init, avCX, avCY + boff(17) * 0.3, { align: "center" });
    }
    sY += avR * 2 + 5;
  }

  // ── Sidebar: Name
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  tc(DARK);
  const nameLines = pdf.splitTextToSize(fullName, sbCW);
  pdf.text(nameLines as string[], sbW / 2, sY + boff(9), { align: "center" });
  sY += (nameLines as string[]).length * lh(9) + 1;

  if (profile.title) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    tc(PRIMARY);
    const titleLines = pdf.splitTextToSize(profile.title, sbCW);
    pdf.text(titleLines as string[], sbW / 2, sY + boff(7.5), { align: "center" });
    sY += (titleLines as string[]).length * lh(7.5);
  }
  sY += 3;

  // Sidebar divider
  dc(BORDER); pdf.setLineWidth(0.3); pdf.line(sbIX, sY, sbW - sbIX, sY); sY += 4;

  // ── Sidebar section heading helper
  const sbSection = (title: string): boolean => {
    if (sY + 9 > pH - mg) return false;
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(7); tc(PRIMARY);
    pdf.text(title.toUpperCase(), sbIX, sY + boff(7));
    sY += lh(7) + 0.5;
    dc(PRIMARY); pdf.setLineWidth(0.25); pdf.line(sbIX, sY, sbW - sbIX, sY); sY += 3;
    return true;
  };

  // ── Sidebar small text
  const sbText = (text: string, bold = false, color: RGB = DARK) => {
    if (!text || sY + lh(8) > pH - mg) return;
    pdf.setFont("helvetica", bold ? "bold" : "normal"); pdf.setFontSize(8); tc(color);
    const lines = pdf.splitTextToSize(text, sbCW);
    pdf.text(lines as string[], sbIX, sY + boff(8));
    sY += (lines as string[]).length * lh(8) + 0.5;
  };

  // ── Contact
  const contacts = [
    user.email, profile.phone ?? "", profile.location,
    profile.website ?? "", profile.linkedin_url, profile.github_url, profile.portfolio_url,
  ].filter(Boolean) as string[];

  if (contacts.length > 0 && sbSection(L.contact)) {
    for (const c of contacts) {
      if (sY + lh(7.5) > pH - mg) break;
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5); tc(MUTED);
      const ls = pdf.splitTextToSize(c, sbCW);
      pdf.text(ls as string[], sbIX, sY + boff(7.5));
      sY += (ls as string[]).length * lh(7.5) + 0.5;
    }
    sY += 2;
  }

  // ── Skills chips
  const skills = (profile.skills || "").split(",").map(s => s.trim()).filter(Boolean);
  if (skills.length > 0 && sbSection(L.skills)) {
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(7);
    const chipH = 4.5;
    let cx = sbIX;
    let lineTop = sY;

    for (const sk of skills) {
      const tw = pdf.getTextWidth(sk);
      const cw = tw + 3.5;
      if (cx + cw > sbW - sbIX) { cx = sbIX; lineTop += chipH + 1.5; }
      if (lineTop + chipH > pH - mg) break;
      fc(CHIPBG); pdf.roundedRect(cx, lineTop, cw, chipH, 1, 1, "F");
      tc(CHIPFG); pdf.text(sk, cx + 1.75, lineTop + chipH * 0.74);
      cx += cw + 2;
    }
    sY = lineTop + chipH + 4;
  }

  // ── Languages
  const langs = profile.languages ?? [];
  if (langs.length > 0 && sbSection(L.languages)) {
    for (const l of langs) {
      if (sY + lh(8) * 2 + 2 > pH - mg) break;
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); tc(DARK);
      pdf.text(l.language || "", sbIX, sY + boff(8));
      sY += lh(8);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5); tc(MUTED);
      pdf.text(LEVEL_MAP[l.level] || l.level, sbIX, sY + boff(7.5));
      sY += lh(7.5) + 2;
    }
    sY += 1;
  }

  // ── Certificates (sidebar)
  const certs = profile.certificates ?? [];
  if (certs.length > 0 && sbSection(L.certificates)) {
    for (const cert of certs) {
      if (sY + lh(8) + 4 > pH - mg) break;
      sbText(cert.name || "", true);
      if (cert.issuer) sbText(cert.issuer, false, MUTED);
      if (cert.year) {
        const fd = fmtMonth(cert.year, lang);
        if (fd) { pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); tc(MUTED); pdf.text(fd, sbIX, sY + boff(7)); sY += lh(7); }
      }
      sY += 2;
    }
  }

  // ── MAIN: Header
  mY = mg;
  pdf.setFont("helvetica", "bold");
  let nfs = 22;
  pdf.setFontSize(nfs);
  if (pdf.getTextWidth(fullName) > mW) nfs = 17;
  pdf.setFontSize(nfs); tc(DARK);
  pdf.text(fullName, mX, mY + boff(nfs));
  mY += lh(nfs) + 1;

  if (profile.title) {
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(11); tc(PRIMARY);
    pdf.text(profile.title, mX, mY + boff(11));
    mY += lh(11) + 1;
  }

  dc(BORDER); pdf.setLineWidth(0.35); pdf.line(mX, mY + 1, mX + mW, mY + 1); mY += 6;

  // ── Main section helpers
  const ensureM = (h: number) => {
    if (mY + h > pH - mg) { pdf.addPage(); drawSb(); mY = mg; }
  };

  const mainSection = (title: string) => {
    ensureM(12);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(8.5); tc(PRIMARY);
    pdf.text(title.toUpperCase(), mX, mY + boff(8.5));
    mY += lh(8.5) + 0.5;
    dc(PRIMARY); pdf.setLineWidth(0.35); pdf.line(mX, mY, mX + mW, mY); mY += 4;
  };

  const mainItem = (
    title: string,
    subtitle: string,
    dateRange: string,
    desc: string,
  ) => {
    ensureM(14);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); tc(DARK);
    pdf.text(title, mX, mY + boff(9));

    if (dateRange) {
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5); tc(MUTED);
      pdf.text(dateRange, mX + mW, mY + boff(9), { align: "right" });
    }
    mY += lh(9) + 0.5;

    if (subtitle) {
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); tc(MUTED);
      const sl = pdf.splitTextToSize(subtitle, mW);
      pdf.text(sl as string[], mX, mY + boff(8));
      mY += (sl as string[]).length * lh(8) + 0.5;
    }

    if (desc) {
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); tc(DARK);
      const dl = pdf.splitTextToSize(desc, mW);
      ensureM(dl.length * lh(8) + 2);
      pdf.text(dl as string[], mX, mY + boff(8));
      mY += (dl as string[]).length * lh(8) + 1;
    }
    mY += 3;
  };

  // ── Summary
  if (profile.bio) {
    mainSection(L.summary);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.5); tc(DARK);
    const bl = pdf.splitTextToSize(profile.bio, mW);
    ensureM((bl as string[]).length * lh(8.5) + 2);
    pdf.text(bl as string[], mX, mY + boff(8.5));
    mY += (bl as string[]).length * lh(8.5) + 6;
  }

  // ── Work Experience
  const workExp = profile.work_experience ?? [];
  if (workExp.length > 0) {
    mainSection(L.workExperience);
    for (const exp of workExp) {
      mainItem(
        exp.position || "",
        exp.company || "",
        fmtRange(exp.start_date, exp.end_date, exp.is_current, lang, L.present),
        exp.description || "",
      );
    }
  }

  // ── Education
  const edu = profile.education ?? [];
  if (edu.length > 0) {
    mainSection(L.education);
    for (const e of edu) {
      mainItem(
        e.school || "",
        e.degree || "",
        fmtRange(e.start_year, e.end_year, e.is_current, lang, L.present),
        e.description || "",
      );
    }
  }

  // ── Projects
  const projs = profile.projects ?? [];
  if (projs.length > 0) {
    mainSection(L.projects);
    for (const p of projs) {
      const sub = [p.technologies, p.url].filter(Boolean).join(" · ");
      mainItem(
        p.name || "",
        sub,
        fmtRange(p.start_date, p.end_date, p.is_current, lang, L.present),
        p.description || "",
      );
    }
  }

  // ── Save
  const fname = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  pdf.save(fname);
}
