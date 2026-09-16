import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n";
import { Card, Section, SectionTitle } from "@/components/ui-bits";
import { loginFn } from "@/server/functions";

export const Route = createFileRoute("/connexion")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: `/${context.user.role}` });
    }
  },
  head: () => ({
    meta: [{ title: "Connexion — SKILLIA" }],
  }),
  component: ConnexionPage,
});

function ConnexionPage() {
  const { t } = useI18n();
  const search = Route.useSearch();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await loginFn({ data: { email, password } });
      await router.invalidate();
      router.navigate({ to: search.redirect || `/${user.role}` });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Section className="max-w-md">
      <SectionTitle eyebrow="SKILLIA" title={t("auth.loginTitle")} desc={t("auth.loginSubtitle")} />

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-muted-foreground">{t("auth.email")}</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="nom@exemple.com"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-muted-foreground">{t("auth.password")}</span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder={t("auth.passwordPlaceholder")}
            />
          </label>

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
            {submitting ? t("auth.submitting") : t("auth.loginSubmit")}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <a href="/inscription" className="font-semibold text-primary">
              {t("nav.signup")}
            </a>
          </p>
        </form>
      </Card>
    </Section>
  );
}
