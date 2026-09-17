import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { getDb } from "./db";
import { sessionConfig } from "./auth";

export type PortfolioItemType = "photo" | "video";

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  type: PortfolioItemType;
  photoDataUrl: string;
  videoUrl: string;
  date: string;
}

export interface PersonalNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Même limite que la photo de profil (Brique 1) : ~1.5 Mo de binaire une fois
// décodé, pour éviter qu'un upload trop lourd ne gonfle le fichier SQLite.
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

function parseJsonArray<T>(raw: string): T[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export const getTalentPortfolioFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ items: PortfolioItem[]; notes: PersonalNote[] }> => {
    const userId = await requireTalentUserId();
    const row = getDb()
      .prepare("SELECT portfolio_items, personal_notes FROM talent_profiles WHERE user_id = ?")
      .get(userId) as { portfolio_items: string; personal_notes: string } | undefined;

    if (!row) {
      throw new Error("Profil introuvable.");
    }

    return {
      items: parseJsonArray<PortfolioItem>(row.portfolio_items),
      notes: parseJsonArray<PersonalNote>(row.personal_notes),
    };
  },
);

export const updatePortfolioItemsFn = createServerFn({ method: "POST" })
  .validator((data: { items: PortfolioItem[] }) => data)
  .handler(async ({ data }): Promise<PortfolioItem[]> => {
    const userId = await requireTalentUserId();

    const items = (Array.isArray(data.items) ? data.items : [])
      .filter((item) => item.title.trim() !== "")
      .map((item) => {
        if (item.photoDataUrl && item.photoDataUrl.length > MAX_PHOTO_DATA_URL_LENGTH) {
          throw new Error("Une photo est trop lourde (1.5 Mo maximum).");
        }
        return {
          id: item.id,
          title: item.title.trim(),
          description: item.description?.trim() ?? "",
          type: item.type === "video" ? "video" : ("photo" as PortfolioItemType),
          photoDataUrl: item.type === "photo" ? item.photoDataUrl || "" : "",
          videoUrl: item.type === "video" ? (item.videoUrl || "").trim() : "",
          date: item.date?.trim() ?? "",
        };
      });

    getDb()
      .prepare("UPDATE talent_profiles SET portfolio_items = ? WHERE user_id = ?")
      .run(JSON.stringify(items), userId);

    return items;
  });

export const updatePersonalNotesFn = createServerFn({ method: "POST" })
  .validator((data: { notes: PersonalNote[] }) => data)
  .handler(async ({ data }): Promise<PersonalNote[]> => {
    const userId = await requireTalentUserId();

    const notes = (Array.isArray(data.notes) ? data.notes : [])
      .filter((note) => note.content.trim() !== "" || note.title.trim() !== "")
      .map((note) => ({
        id: note.id,
        title: note.title?.trim() ?? "",
        content: note.content ?? "",
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }));

    getDb()
      .prepare("UPDATE talent_profiles SET personal_notes = ? WHERE user_id = ?")
      .run(JSON.stringify(notes), userId);

    return notes;
  });
