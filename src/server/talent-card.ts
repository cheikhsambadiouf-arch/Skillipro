import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { getDb } from "./db";
import { sessionConfig } from "./auth";

export type CardKind = "freelance" | "entreprise";
export type CardTemplate = "classique" | "moderne";

// Champs propres à la carte, éditables ici. name/jobTitle/phone sont repris
// en lecture seule du profil (Brique 1) — jamais dupliqués/modifiables ici.
export interface TalentCardInput {
  kind: CardKind;
  companyName: string;
  companyLogoDataUrl: string;
  address: string;
  template: CardTemplate;
}

export interface TalentCard extends TalentCardInput {
  id: string;
  name: string;
  jobTitle: string;
  phone: string;
}

// Même limite que la photo de profil (Brique 1).
const MAX_LOGO_DATA_URL_LENGTH = 2_000_000;

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

function isCardKind(value: unknown): value is CardKind {
  return value === "freelance" || value === "entreprise";
}

function isCardTemplate(value: unknown): value is CardTemplate {
  return value === "classique" || value === "moderne";
}

export const getTalentCardFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<TalentCard> => {
    const userId = await requireTalentUserId();
    const row = getDb()
      .prepare(
        `SELECT u.id, u.name, t.job_title, t.phone, t.card_kind, t.company_name,
                t.company_logo_data_url, t.address, t.card_template
         FROM users u JOIN talent_profiles t ON t.user_id = u.id
         WHERE u.id = ?`,
      )
      .get(userId) as
      | {
          id: string;
          name: string;
          job_title: string;
          phone: string;
          card_kind: string;
          company_name: string;
          company_logo_data_url: string;
          address: string;
          card_template: string;
        }
      | undefined;

    if (!row) {
      throw new Error("Profil introuvable.");
    }

    return {
      id: row.id,
      name: row.name,
      jobTitle: row.job_title,
      phone: row.phone,
      kind: isCardKind(row.card_kind) ? row.card_kind : "freelance",
      companyName: row.company_name,
      companyLogoDataUrl: row.company_logo_data_url,
      address: row.address,
      template: isCardTemplate(row.card_template) ? row.card_template : "classique",
    };
  },
);

export const updateTalentCardFn = createServerFn({ method: "POST" })
  .validator((data: TalentCardInput) => data)
  .handler(async ({ data }): Promise<TalentCardInput> => {
    const userId = await requireTalentUserId();

    if (data.companyLogoDataUrl && data.companyLogoDataUrl.length > MAX_LOGO_DATA_URL_LENGTH) {
      throw new Error("Le logo est trop lourd (1.5 Mo maximum).");
    }

    const kind = isCardKind(data.kind) ? data.kind : "freelance";
    const template = isCardTemplate(data.template) ? data.template : "classique";

    getDb()
      .prepare(
        `UPDATE talent_profiles
         SET card_kind = ?, company_name = ?, company_logo_data_url = ?, address = ?, card_template = ?
         WHERE user_id = ?`,
      )
      .run(kind, data.companyName.trim(), data.companyLogoDataUrl, data.address.trim(), template, userId);

    return { kind, companyName: data.companyName.trim(), companyLogoDataUrl: data.companyLogoDataUrl, address: data.address.trim(), template };
  });
