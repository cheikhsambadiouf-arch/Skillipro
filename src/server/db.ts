import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DB_PATH = resolve(process.env.DATABASE_PATH || "./data/skillia.db");

let db: DatabaseSync | undefined;

// Ajoute une colonne si elle n'existe pas déjà : SQLite n'a pas de
// "ADD COLUMN IF NOT EXISTS", nécessaire pour faire évoluer le schéma
// sans casser les bases déjà créées par une version précédente du code.
function ensureColumn(database: DatabaseSync, table: string, column: string, definition: string) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((c) => c.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function getDb(): DatabaseSync {
  if (db) return db;

  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('talent', 'entreprise', 'kids')),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS talent_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      domain TEXT NOT NULL,
      location TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS entreprise_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      company_name TEXT NOT NULL,
      sector TEXT NOT NULL,
      location TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kids_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      age INTEGER NOT NULL,
      parent_name TEXT NOT NULL
    );
  `);

  // Brique 1 — Espace profil du talent : champs additionnels du profil.
  ensureColumn(db, "talent_profiles", "job_title", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "talent_profiles", "school", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "talent_profiles", "education_level", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "talent_profiles", "skills", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "talent_profiles", "phone", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "talent_profiles", "website", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "talent_profiles", "photo_data_url", "TEXT NOT NULL DEFAULT ''");

  return db;
}
