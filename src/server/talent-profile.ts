import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { getDb } from "./db";
import { sessionConfig } from "./auth";

export interface TalentSkill {
  name: string;
  level?: string;
}

export interface TalentProfile {
  name: string;
  email: string;
  jobTitle: string;
  photoDataUrl: string;
  domain: string;
  school: string;
  educationLevel: string;
  skills: TalentSkill[];
  location: string;
  phone: string;
  website: string;
  bio: string;
}

// Le contenu d'une photo encodée en data URL est stocké tel quel en base :
// cette limite (environ 1.5 Mo de binaire une fois décodé) évite qu'un
// upload trop lourd ne gonfle démesurément le fichier SQLite.
const MAX_PHOTO_DATA_URL_LENGTH = 2_000_000;

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

function parseSkills(raw: string): TalentSkill[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s): s is TalentSkill => s && typeof s.name === "string" && s.name.trim() !== "")
      .map((s) => ({ name: s.name, level: typeof s.level === "string" ? s.level : undefined }));
  } catch {
    return [];
  }
}

export const getTalentProfileFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<TalentProfile> => {
    const userId = await requireTalentUserId();
    const row = getDb()
      .prepare(
        `SELECT u.name, u.email, t.domain, t.location, t.bio, t.job_title, t.school,
                t.education_level, t.skills, t.phone, t.website, t.photo_data_url
         FROM users u JOIN talent_profiles t ON t.user_id = u.id
         WHERE u.id = ?`,
      )
      .get(userId) as
      | {
          name: string;
          email: string;
          domain: string;
          location: string;
          bio: string;
          job_title: string;
          school: string;
          education_level: string;
          skills: string;
          phone: string;
          website: string;
          photo_data_url: string;
        }
      | undefined;

    if (!row) {
      throw new Error("Profil introuvable.");
    }

    return {
      name: row.name,
      email: row.email,
      jobTitle: row.job_title,
      photoDataUrl: row.photo_data_url,
      domain: row.domain,
      school: row.school,
      educationLevel: row.education_level,
      skills: parseSkills(row.skills),
      location: row.location,
      phone: row.phone,
      website: row.website,
      bio: row.bio,
    };
  },
);

export const updateTalentProfileFn = createServerFn({ method: "POST" })
  .validator((data: TalentProfile) => data)
  .handler(async ({ data }): Promise<TalentProfile> => {
    const userId = await requireTalentUserId();

    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    if (!name) {
      throw new Error("Le nom ne peut pas être vide.");
    }
    if (!email || !email.includes("@")) {
      throw new Error("Email invalide.");
    }
    if (data.photoDataUrl && data.photoDataUrl.length > MAX_PHOTO_DATA_URL_LENGTH) {
      throw new Error("La photo est trop lourde (1.5 Mo maximum).");
    }

    const db = getDb();

    const existingWithEmail = db
      .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
      .get(email, userId);
    if (existingWithEmail) {
      throw new Error("Cet email est déjà utilisé par un autre compte.");
    }

    const skills = Array.isArray(data.skills)
      ? data.skills.filter((s) => s.name && s.name.trim() !== "")
      : [];

    db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(name, email, userId);
    db.prepare(
      `UPDATE talent_profiles
       SET domain = ?, location = ?, bio = ?, job_title = ?, school = ?,
           education_level = ?, skills = ?, phone = ?, website = ?, photo_data_url = ?
       WHERE user_id = ?`,
    ).run(
      data.domain.trim(),
      data.location.trim(),
      data.bio.trim(),
      data.jobTitle.trim(),
      data.school.trim(),
      data.educationLevel.trim(),
      JSON.stringify(skills),
      data.phone.trim(),
      data.website.trim(),
      data.photoDataUrl,
      userId,
    );

    return { ...data, name, email, skills };
  });
