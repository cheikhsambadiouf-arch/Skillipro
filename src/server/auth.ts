import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export const SESSION_COOKIE_NAME = "skillia_session";

// Secret de secours pour le développement uniquement : en production, SESSION_SECRET
// doit être défini (>= 32 caractères) sinon toutes les sessions seraient déchiffrables
// par quiconque lit ce fichier.
const DEV_FALLBACK_SECRET = "skillia-dev-only-session-secret-change-me-32c";

export function sessionConfig() {
  const configured = process.env.SESSION_SECRET;
  if (!configured || configured.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET doit être défini (chaîne d'au moins 32 caractères) en production.",
      );
    }
  }
  return {
    password: configured && configured.length >= 32 ? configured : DEV_FALLBACK_SECRET,
    name: SESSION_COOKIE_NAME,
    maxAge: 60 * 60 * 24 * 30,
  };
}
