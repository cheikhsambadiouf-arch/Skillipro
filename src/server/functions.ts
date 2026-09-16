import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import { hashPassword, sessionConfig, verifyPassword } from "./auth";

export type Role = "talent" | "entreprise" | "kids";

export interface CurrentUser {
  id: string;
  role: Role;
  name: string;
  email: string;
}

interface SkilliaSessionData {
  userId: string;
}

function userSession() {
  return useSession<SkilliaSessionData>(sessionConfig());
}

function findUserById(id: string): CurrentUser | null {
  const row = getDb()
    .prepare("SELECT id, role, name, email FROM users WHERE id = ?")
    .get(id) as CurrentUser | undefined;
  return row ?? null;
}

export function roleHomePath(role: Role): "/talent" | "/entreprise" | "/kids" {
  return `/${role}` as const;
}

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<CurrentUser | null> => {
    const session = await userSession();
    const userId = session.data.userId;
    return userId ? findUserById(userId) : null;
  },
);

export interface RegisterInput {
  role: Role;
  name: string;
  email: string;
  password: string;
  domain?: string;
  location?: string;
  companyName?: string;
  sector?: string;
  age?: number;
  parentName?: string;
}

export const registerFn = createServerFn({ method: "POST" })
  .validator((data: RegisterInput) => data)
  .handler(async ({ data }): Promise<CurrentUser> => {
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();

    if (!name || !email || !data.password || data.password.length < 8) {
      throw new Error(
        "Nom, email et mot de passe (8 caractères minimum) sont obligatoires.",
      );
    }

    const db = getDb();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      throw new Error("Un compte existe déjà avec cet email.");
    }

    const id = randomUUID();
    const passwordHash = hashPassword(data.password);

    db.prepare(
      "INSERT INTO users (id, role, name, email, password_hash) VALUES (?, ?, ?, ?, ?)",
    ).run(id, data.role, name, email, passwordHash);

    if (data.role === "talent") {
      db.prepare(
        "INSERT INTO talent_profiles (user_id, domain, location, bio) VALUES (?, ?, ?, ?)",
      ).run(id, data.domain?.trim() || "Non précisé", data.location?.trim() || "Non précisée", "");
    } else if (data.role === "entreprise") {
      db.prepare(
        "INSERT INTO entreprise_profiles (user_id, company_name, sector, location) VALUES (?, ?, ?, ?)",
      ).run(
        id,
        data.companyName?.trim() || name,
        data.sector?.trim() || "Non précisé",
        data.location?.trim() || "Non précisée",
      );
    } else {
      db.prepare(
        "INSERT INTO kids_profiles (user_id, age, parent_name) VALUES (?, ?, ?)",
      ).run(id, data.age && data.age > 0 ? data.age : 8, data.parentName?.trim() || "Non précisé");
    }

    const session = await userSession();
    await session.update({ userId: id });

    return { id, role: data.role, name, email };
  });

export interface LoginInput {
  email: string;
  password: string;
}

export const loginFn = createServerFn({ method: "POST" })
  .validator((data: LoginInput) => data)
  .handler(async ({ data }): Promise<CurrentUser> => {
    const email = data.email.trim().toLowerCase();
    const row = getDb()
      .prepare("SELECT id, role, name, email, password_hash FROM users WHERE email = ?")
      .get(email) as
      | { id: string; role: Role; name: string; email: string; password_hash: string }
      | undefined;

    if (!row || !verifyPassword(data.password, row.password_hash)) {
      throw new Error("Email ou mot de passe incorrect.");
    }

    const session = await userSession();
    await session.update({ userId: row.id });

    return { id: row.id, role: row.role, name: row.name, email: row.email };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const session = await userSession();
  await session.clear();
  return null;
});
