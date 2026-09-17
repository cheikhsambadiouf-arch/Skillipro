import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { getDb } from "./db";
import { sessionConfig } from "./auth";
import { parseSkills, type TalentSkill } from "./talent-profile";
import type { CvExperience } from "./talent-cv";

export type LetterTemplate = "classique" | "moderne";

export interface CoverLetter {
  id: string;
  jobTitle: string;
  companyName: string;
  recruiterName: string;
  highlights: string;
  content: string;
  template: LetterTemplate;
  createdAt: string;
  updatedAt: string;
}

// Résumé du profil + CV nécessaire pour assembler un brouillon de lettre.
// Lecture seule ici : ces champs se modifient dans le tableau de bord
// (Brique 1) ou le CV (Brique 3), jamais depuis cette page.
export interface LetterProfileSummary {
  name: string;
  jobTitle: string;
  location: string;
  skills: TalentSkill[];
  experiences: CvExperience[];
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

function isLetterTemplate(value: unknown): value is LetterTemplate {
  return value === "classique" || value === "moderne";
}

export const getTalentLettersFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ letters: CoverLetter[]; profile: LetterProfileSummary }> => {
    const userId = await requireTalentUserId();
    const row = getDb()
      .prepare(
        `SELECT u.name, t.job_title, t.location, t.skills, t.experiences, t.cover_letters
         FROM users u JOIN talent_profiles t ON t.user_id = u.id
         WHERE u.id = ?`,
      )
      .get(userId) as
      | {
          name: string;
          job_title: string;
          location: string;
          skills: string;
          experiences: string;
          cover_letters: string;
        }
      | undefined;

    if (!row) {
      throw new Error("Profil introuvable.");
    }

    const letters = parseJsonArray<CoverLetter>(row.cover_letters).map((letter) => ({
      ...letter,
      template: isLetterTemplate(letter.template) ? letter.template : "classique",
    }));

    return {
      letters,
      profile: {
        name: row.name,
        jobTitle: row.job_title,
        location: row.location,
        skills: parseSkills(row.skills),
        experiences: parseJsonArray<CvExperience>(row.experiences),
      },
    };
  },
);

export const updateTalentLettersFn = createServerFn({ method: "POST" })
  .validator((data: { letters: CoverLetter[] }) => data)
  .handler(async ({ data }): Promise<CoverLetter[]> => {
    const userId = await requireTalentUserId();

    const letters = (Array.isArray(data.letters) ? data.letters : [])
      .filter((l) => l.companyName.trim() !== "" || l.jobTitle.trim() !== "" || l.content.trim() !== "")
      .map((l) => ({
        id: l.id,
        jobTitle: l.jobTitle?.trim() ?? "",
        companyName: l.companyName?.trim() ?? "",
        recruiterName: l.recruiterName?.trim() ?? "",
        highlights: l.highlights ?? "",
        content: l.content ?? "",
        template: isLetterTemplate(l.template) ? l.template : "classique",
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      }));

    getDb()
      .prepare("UPDATE talent_profiles SET cover_letters = ? WHERE user_id = ?")
      .run(JSON.stringify(letters), userId);

    return letters;
  });
