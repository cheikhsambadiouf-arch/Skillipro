import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n";
import { Card, Section, SectionTitle } from "@/components/ui-bits";
import { registerFn, type Role } from "@/server/functions";

const ROLES: Role[] = ["talent", "entreprise", "kids"];

function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}

export const Route = createFileRoute("/inscription")({
  validateSearch: (search: Record<string, unknown>): { role?: Role } => ({
    role: isRole(search.role) ? search.role : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: `/${context.user.role}` });
    }
  },
  head: () => ({
    meta: [{ title: "Créer un compte — SKILLIA" }],
  }),
  component: InscriptionPage,
});

function InscriptionPage() {
  const { t } = useI18n();
  const search = Route.useSearch();
  const router = useRouter();

  const [role, setRole] = useState<Role>(search.role ?? "talent");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [domain, setDomain] = useState("");
  const [location, setLocation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [age, setAge] = useState("");
  const [parentName, setParentName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const roleLabels: Record<Role, string> = {
    talent: t("auth.roleTalent"),
    entreprise: t("auth.roleEntreprise"),
    kids: t("auth.roleKids"),
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await registerFn({
        data: {
          role,
          name,
          email,
          password,
          domain: role === "talent" ? domain : undefined,
          location: role === "talent" || role === "entreprise" ? location : undefined,
          companyName: role === "entreprise" ? companyName : undefined,
          sector: role === "entreprise" ? sector : undefined,
          age: role === "kids" ? Number(age) : undefined,
          parentName: role === "kids" ? parentName : undefined,
        },
      });
      await router.invalidate();
      router.navigate({ to: `/${user.role}` });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Section className="max-w-2xl">
      <SectionTitle eyebrow="SKILLIA" title={t("auth.signupTitle")} desc={t("auth.signupSubtitle")} />

      <Card>
        <div className="mb-6 grid gap-2 sm:grid-cols-3">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                role === r
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label={role === "kids" ? t("auth.childName") : t("auth.fullName")}>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder={role === "kids" ? t("auth.childNamePlaceholder") : t("auth.fullNamePlaceholder")}
            />
          </Field>

          {role === "talent" && (
            <>
              <Field label={t("auth.domain")}>
                <input
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="input-field"
                  placeholder={t("auth.domainPlaceholder")}
                />
              </Field>
              <Field label={t("auth.location")}>
                <input
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                  placeholder={t("auth.locationPlaceholder")}
                />
              </Field>
            </>
          )}

          {role === "entreprise" && (
            <>
              <Field label={t("auth.companyName")}>
                <input
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input-field"
                  placeholder={t("auth.companyNamePlaceholder")}
                />
              </Field>
              <Field label={t("auth.sector")}>
                <input
                  required
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="input-field"
                  placeholder={t("auth.sectorPlaceholder")}
                />
              </Field>
              <Field label={t("auth.location")}>
                <input
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                  placeholder={t("auth.locationPlaceholder")}
                />
              </Field>
            </>
          )}

          {role === "kids" && (
            <>
              <Field label={t("auth.age")}>
                <input
                  required
                  type="number"
                  min={4}
                  max={17}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="input-field"
                />
              </Field>
              <Field label={t("auth.parentName")}>
                <input
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="input-field"
                  placeholder={t("auth.parentNamePlaceholder")}
                />
              </Field>
              <p className="text-xs text-muted-foreground">{t("auth.kidsNote")}</p>
            </>
          )}

          <Field label={role === "kids" ? t("auth.parentEmail") : t("auth.email")}>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="nom@exemple.com"
            />
          </Field>

          <Field label={t("auth.password")}>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder={t("auth.passwordPlaceholder")}
            />
          </Field>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {submitting ? t("auth.submitting") : t("auth.signupSubmit")}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <a href="/connexion" className="font-semibold text-primary">
              {t("nav.login")}
            </a>
          </p>
        </form>
      </Card>
    </Section>
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
