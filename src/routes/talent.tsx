import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Card, Chip, Progress, Section, SectionTitle } from "@/components/ui-bits";

export const Route = createFileRoute("/talent")({
  head: () => ({
    meta: [
      { title: "Espace Talent SKILLIA — profil vivant et CV automatique" },
      {
        name: "description",
        content:
          "Compétences, projets, portfolio et CV généré automatiquement : le profil Talent SKILLIA se construit au fil de votre parcours.",
      },
      { property: "og:title", content: "Espace Talent SKILLIA" },
      {
        property: "og:description",
        content: "Un profil vivant, un CV toujours à jour, des opportunités ciblées.",
      },
    ],
  }),
  component: TalentPage,
});

function TalentPage() {
  const { t } = useI18n();
  const dash = t<string[]>("talent.dashboardItems");
  const sections = t<string[]>("talent.sections");
  const skills = t<{ name: string; level: string }[]>("talent.skills");
  const actions = t<string[]>("talent.cvActions");
  const suggestSkills = t<string[]>("talent.suggestSkills");

  return (
    <Section>
      <SectionTitle eyebrow="SKILLIA Talent" title={t("talent.title")} desc={t("talent.subtitle")} />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-hero-gradient text-xl text-primary-foreground">
              MD
            </span>
            <div>
              <h3 className="text-lg font-semibold">Mamadou Diop</h3>
              <p className="text-sm text-muted-foreground">
                Technicien électromécanicien · Thiès
              </p>
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">{t("talent.completion")}</span>
              <span className="font-semibold">78 %</span>
            </div>
            <Progress value={78} />
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {dash.map((d) => (
              <div
                key={d}
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium"
              >
                {d}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">{t("talent.skillsTitle")}</h3>
          <div className="mt-4 grid gap-3">
            {skills.map((s) => (
              <div
                key={s.name}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary/60 px-4 py-3"
              >
                <span className="font-medium">{s.name}</span>
                <Chip tone="success">{s.level}</Chip>
              </div>
            ))}
          </div>
          <h3 className="mt-8 text-lg font-semibold">{t("talent.sectionsTitle")}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {sections.map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="bg-warm-gradient text-accent-foreground">
          <h3 className="font-display text-2xl font-bold">{t("talent.cvTitle")}</h3>
          <p className="mt-3 opacity-90">{t("talent.cvDesc")}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {actions.map((a) => (
              <button
                key={a}
                className="rounded-full bg-background/90 px-4 py-2 text-sm font-semibold text-foreground"
              >
                {a}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {t("talent.suggestTitle")}
          </p>
          <p className="mt-3 text-base">{t("talent.suggestText")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestSkills.map((s) => (
              <Chip key={s} tone="primary">
                {s}
              </Chip>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <button className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              {t("talent.suggestAdd")}
            </button>
            <button className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">
              ✕
            </button>
          </div>
        </Card>
      </div>
    </Section>
  );
}
