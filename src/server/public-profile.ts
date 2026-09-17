import { createServerFn } from "@tanstack/react-start";
import { getDb } from "./db";
import { parseSkills, type TalentSkill } from "./talent-profile";

// Forme volontairement différente de TalentProfile : uniquement les champs
// qu'un visiteur anonyme est autorisé à voir. Un champ absent de cet objet
// ne doit tout simplement pas apparaître sur la page (pas de "Non renseigné").
export interface PublicTalentProfile {
  name: string;
  jobTitle?: string;
  domain?: string;
  photoDataUrl?: string;
  phone?: string;
  email?: string;
  website?: string;
  skills?: TalentSkill[];
  school?: string;
  bio?: string;
}

export const getPublicTalentProfileFn = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<PublicTalentProfile | null> => {
    const row = getDb()
      .prepare(
        `SELECT u.name, u.email, t.job_title, t.domain, t.photo_data_url, t.phone, t.website,
                t.skills, t.school, t.bio, t.public_show_skills, t.public_show_school, t.public_show_bio
         FROM users u JOIN talent_profiles t ON t.user_id = u.id
         WHERE u.id = ? AND u.role = 'talent'`,
      )
      .get(data.id) as
      | {
          name: string;
          email: string;
          job_title: string;
          domain: string;
          photo_data_url: string;
          phone: string;
          website: string;
          skills: string;
          school: string;
          bio: string;
          public_show_skills: number;
          public_show_school: number;
          public_show_bio: number;
        }
      | undefined;

    if (!row) return null;

    const profile: PublicTalentProfile = { name: row.name };

    if (row.photo_data_url) profile.photoDataUrl = row.photo_data_url;
    if (row.job_title) profile.jobTitle = row.job_title;
    if (row.domain) profile.domain = row.domain;
    if (row.phone) profile.phone = row.phone;
    if (row.email) profile.email = row.email;
    if (row.website) profile.website = row.website;

    if (row.public_show_skills === 1) {
      const skills = parseSkills(row.skills);
      if (skills.length > 0) profile.skills = skills;
    }
    if (row.public_show_school === 1 && row.school) profile.school = row.school;
    if (row.public_show_bio === 1 && row.bio) profile.bio = row.bio;

    return profile;
  });
