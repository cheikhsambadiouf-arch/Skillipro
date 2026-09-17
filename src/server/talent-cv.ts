import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { getDb } from "./db";
import { sessionConfig } from "./auth";
import { parseSkills, type TalentSkill } from "./talent-profile";

export interface CvExperience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface CvLanguage {
  id: string;
  name: string;
  level: string;
}

export interface CvCertification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export type CvTemplate = "classique" | "visuel";

export interface TalentCvProfile {
  name: string;
  jobTitle: string;
  photoDataUrl: string;
  domain: string;
  school: string;
  educationLevel: string;
  skills: TalentSkill[];
  location: string;
  phone: string;
  email: string;
  website: string;
  bio: string;
}

export interface TalentCv {
  profile: TalentCvProfile;
  experiences: CvExperience[];
  languages: CvLanguage[];
  certifications: CvCertification[];
  template: CvTemplate;
}

export interface TalentCvInput {
  experiences: CvExperience[];
  languages: CvLanguage[];
  certifications: CvCertification[];
  template: CvTemplate;
}

interface SkilliaSessionData {
  userId: string;
}

function talentSession() {
  return useSession<SkilliaSessionData>(sessionConfig());
}

async function requireTalentUserId(): Promise<string> {
  const session = await talentSession();
  const userId = session.data.userId;
  if (!userId) {
    throw new Error("Non authentifié.");
  }
  const row = getDb().prepare("SELECT role FROM users WHERE id = ?").get(userId) as
    | { role: string }
    | undefined;
  if (!row || row.role !== "talent") {
    throw new Error("Accès réservé aux comptes Talent.");
  }
  return userId;
}

function parseJsonArray<T>(raw: string): T[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function isCvTemplate(value: unknown): value is CvTemplate {
  return value === "classique" || value === "visuel";
}

export const getTalentCvFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<TalentCv> => {
    const userId = await requireTalentUserId();
    const row = getDb()
      .prepare(
        `SELECT u.name, u.email, t.job_title, t.photo_data_url, t.domain, t.school,
                t.education_level, t.skills, t.location, t.phone, t.website, t.bio,
                t.experiences, t.languages, t.certifications, t.cv_template
         FROM users u JOIN talent_profiles t ON t.user_id = u.id
         WHERE u.id = ?`,
      )
      .get(userId) as
      | {
          name: string;
          email: string;
          job_title: string;
          photo_data_url: string;
          domain: string;
          school: string;
          education_level: string;
          skills: string;
          location: string;
          phone: string;
          website: string;
          bio: string;
          experiences: string;
          languages: string;
          certifications: string;
          cv_template: string;
        }
      | undefined;

    if (!row) {
      throw new Error("Profil introuvable.");
    }

    return {
      profile: {
        name: row.name,
        jobTitle: row.job_title,
        photoDataUrl: row.photo_data_url,
        domain: row.domain,
        school: row.school,
        educationLevel: row.education_level,
        skills: parseSkills(row.skills),
        location: row.location,
        phone: row.phone,
        email: row.email,
        website: row.website,
        bio: row.bio,
      },
      experiences: parseJsonArray<CvExperience>(row.experiences),
      languages: parseJsonArray<CvLanguage>(row.languages),
      certifications: parseJsonArray<CvCertification>(row.certifications),
      template: isCvTemplate(row.cv_template) ? row.cv_template : "classique",
    };
  },
);

export const updateTalentCvFn = createServerFn({ method: "POST" })
  .validator((data: TalentCvInput) => data)
  .handler(async ({ data }): Promise<TalentCvInput> => {
    const userId = await requireTalentUserId();

    const experiences = Array.isArray(data.experiences)
      ? data.experiences.filter((e) => e.title.trim() !== "" || e.company.trim() !== "")
      : [];
    const languages = Array.isArray(data.languages)
      ? data.languages.filter((l) => l.name.trim() !== "")
      : [];
    const certifications = Array.isArray(data.certifications)
      ? data.certifications.filter((c) => c.name.trim() !== "")
      : [];
    const template = isCvTemplate(data.template) ? data.template : "classique";

    getDb()
      .prepare(
        `UPDATE talent_profiles
         SET experiences = ?, languages = ?, certifications = ?, cv_template = ?
         WHERE user_id = ?`,
      )
      .run(
        JSON.stringify(experiences),
        JSON.stringify(languages),
        JSON.stringify(certifications),
        template,
        userId,
      );

    return { experiences, languages, certifications, template };
  });
