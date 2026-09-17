import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card, Section, SectionTitle } from "@/components/ui-bits";
import {
  getTalentProfileFn,
  updateTalentProfileFn,
  type TalentProfile,
  type TalentSkill,
} from "@/server/talent-profile";

const MAX_PHOTO_FILE_BYTES = 1.5 * 1024 * 1024;
const SKILL_LEVELS = ["", "Débutant", "Intermédiaire", "Avancé", "Expert"] as const;
const SAVE_DEBOUNCE_MS = 1200;

export const Route = createFileRoute("/talent-tableau-de-bord")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: "/connexion", search: { redirect: location.href } });
    }
    if (context.user.role !== "talent") {
      throw redirect({ to: `/${context.user.role}` });
    }
  },
  loader: () => getTalentProfileFn(),
  head: () => ({
    meta: [{ title: "Mon profil Talent — SKILLIA" }],
  }),
  component: TalentDashboardPage,
});

type SaveStatus = "idle" | "pending" | "saved" | "error";

function TalentDashboardPage() {
  const initialProfile = Route.useLoaderData();
  const [profile, setProfile] = useState<TalentProfile>(initialProfile);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const isFirstRender = useRef(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestProfile = useRef(profile);
  latestProfile.current = profile;

  async function save() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setStatus("pending");
    setErrorMessage(null);
    try {
      const saved = await updateTalentProfileFn({ data: latestProfile.current });
      setProfile(saved);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    }
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      save();
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  function update<K extends keyof TalentProfile>(key: K, value: TalentProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function updateSkill(index: number, next: TalentSkill) {
    setProfile((p) => ({
      ...p,
      skills: p.skills.map((s, i) => (i === index ? next : s)),
    }));
  }

  function addSkill() {
    setProfile((p) => ({ ...p, skills: [...p.skills, { name: "", level: "" }] }));
  }

  function removeSkill(index: number) {
    setProfile((p) => ({ ...p, skills: p.skills.filter((_, i) => i !== index) }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError("Le fichier doit être une image.");
      return;
    }
    if (file.size > MAX_PHOTO_FILE_BYTES) {
      setPhotoError("Image trop lourde (1.5 Mo maximum).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update("photoDataUrl", String(reader.result));
    };
    reader.readAsDataURL(file);
  }

  const statusLabel: Record<SaveStatus, string> = {
    idle: "",
    pending: "Enregistrement…",
    saved: "✓ Enregistré",
    error: "✕ Échec de l'enregistrement",
  };

  return (
    <Section className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          eyebrow="SKILLIA Talent"
          title="Mon profil"
          desc="Ces informations alimentent votre CV automatique et votre visibilité auprès des entreprises."
        />
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-sm font-semibold ${
              status === "error" ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {statusLabel[status]}
          </span>
          <Link
            to="/profil/$id"
            params={{ id: profile.id }}
            target="_blank"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Voir mon profil public ↗
          </Link>
          <Link to="/talent-cv" className="text-sm font-semibold text-primary hover:underline">
            Mon CV →
          </Link>
          <Link to="/talent-portfolio" className="text-sm font-semibold text-primary hover:underline">
            Portfolio & notes →
          </Link>
          <Link to="/talent-lettre" className="text-sm font-semibold text-primary hover:underline">
            Lettres de motivation →
          </Link>
        </div>
      </div>

      {errorMessage && (
        <p className="mb-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-6">
        <Card>
          <h3 className="text-lg font-semibold">Identité</h3>
          <div className="mt-4 flex items-center gap-4">
            {profile.photoDataUrl ? (
              <img
                src={profile.photoDataUrl}
                alt="Photo de profil"
                className="size-20 rounded-full object-cover"
              />
            ) : (
              <span className="grid size-20 place-items-center rounded-full bg-hero-gradient text-2xl text-primary-foreground">
                {profile.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "?"}
              </span>
            )}
            <div>
              <label className="inline-block cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary">
                Changer la photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
              {photoError && <p className="mt-2 text-sm text-destructive">{photoError}</p>}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Nom et prénom">
              <input
                required
                value={profile.name}
                onChange={(e) => update("name", e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="Statut / titre professionnel">
              <input
                value={profile.jobTitle}
                onChange={(e) => update("jobTitle", e.target.value)}
                className="input-field"
                placeholder="Ex. Développeur web, Étudiant en gestion…"
              />
            </Field>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Formation</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Métier / domaine">
              <input
                value={profile.domain}
                onChange={(e) => update("domain", e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="École ou université">
              <input
                value={profile.school}
                onChange={(e) => update("school", e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="Niveau de formation (optionnel)">
              <input
                value={profile.educationLevel}
                onChange={(e) => update("educationLevel", e.target.value)}
                className="input-field"
                placeholder="Ex. Licence, BTS, Terminale…"
              />
            </Field>
          </div>
          <VisibilityToggle
            checked={profile.publicShowSchool}
            onChange={(v) => update("publicShowSchool", v)}
          />
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Compétences</h3>
          <div className="mt-4 grid gap-3">
            {profile.skills.map((skill, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input
                  value={skill.name}
                  onChange={(e) => updateSkill(i, { ...skill, name: e.target.value })}
                  className="input-field flex-1"
                  placeholder="Ex. Électricité bâtiment"
                />
                <select
                  value={skill.level ?? ""}
                  onChange={(e) => updateSkill(i, { ...skill, level: e.target.value })}
                  className="input-field w-auto"
                >
                  {SKILL_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level || "Niveau (optionnel)"}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeSkill(i)}
                  aria-label="Supprimer cette compétence"
                  className="rounded-full border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSkill}
            className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            + Ajouter une compétence
          </button>
          <VisibilityToggle
            checked={profile.publicShowSkills}
            onChange={(v) => update("publicShowSkills", v)}
          />
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Contact</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Localité">
              <input
                value={profile.location}
                onChange={(e) => update("location", e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="Téléphone">
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => update("email", e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="Site web (optionnel)">
              <input
                value={profile.website}
                onChange={(e) => update("website", e.target.value)}
                className="input-field"
                placeholder="https://…"
              />
            </Field>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Présentation</h3>
          <div className="mt-4">
            <textarea
              value={profile.bio}
              onChange={(e) => update("bio", e.target.value)}
              rows={4}
              className="input-field resize-none"
              placeholder="Présentez-vous en quelques phrases…"
            />
          </div>
          <VisibilityToggle
            checked={profile.publicShowBio}
            onChange={(v) => update("publicShowBio", v)}
          />
        </Card>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={status === "pending"}
            className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            Enregistrer
          </button>
          <span className="text-sm text-muted-foreground">
            Vos modifications sont aussi enregistrées automatiquement.
          </span>
        </div>
      </div>
    </Section>
  );
}

function VisibilityToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-border"
      />
      Visible sur mon profil public
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
