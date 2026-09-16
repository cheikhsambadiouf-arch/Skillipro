import { createFileRoute, redirect } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Card, Chip, Progress, Section, SectionTitle } from "@/components/ui-bits";

export const Route = createFileRoute("/kids")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: "/connexion", search: { redirect: location.href } });
    }
    if (context.user.role !== "kids") {
      throw redirect({ to: `/${context.user.role}` });
    }
    return { user: context.user };
  },
  head: () => ({
    meta: [
      { title: "SKILLIA Kids — apprendre, découvrir et jouer" },
      {
        name: "description",
        content:
          "Défis découverte et culture, mini-activités, badges, grades et carnet de talents, dans un espace enfant sécurisé avec contrôle parental.",
      },
      { property: "og:title", content: "SKILLIA Kids" },
      {
        property: "og:description",
        content: "Éducation, culture, jeu et découverte des métiers pour les enfants.",
      },
    ],
  }),
  component: KidsPage,
});

function KidsPage() {
  const { t } = useI18n();
  const { user } = Route.useRouteContext();
  const steps = t<{ t: string; d: string }[]>("kids.steps");
  const interests = t<string[]>("kids.interests");
  const universes = t<{ n: string; v: number }[]>("kids.universes");
  const grades = t<string[]>("kids.grades");
  const badgeDetails = t<string[]>("kids.badgeDetails");
  const careers = t<string[]>("kids.careers");
  const safety = t<string[]>("kids.safety");

  return (
    <>
      <section className="bg-kids-gradient text-kids-foreground">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h1 className="text-4xl font-bold sm:text-5xl">{t("kids.title")}</h1>
          <p className="mt-2 text-lg font-semibold opacity-90">👋 {user.name}</p>
          <p className="mt-4 max-w-2xl text-lg opacity-90">{t("kids.subtitle")}</p>
        </div>
      </section>

      <Section>
        <SectionTitle title={t("kids.dayTitle")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <Card key={s.t}>
              <span className="grid size-9 place-items-center rounded-full bg-kids/15 text-sm font-bold text-kids">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <SectionTitle title={t("kids.interestsTitle")} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {interests.map((i) => (
            <button
              key={i}
              className="rounded-2xl border border-border bg-card px-5 py-4 text-left text-base font-medium shadow-soft transition-colors hover:border-kids hover:bg-kids/5"
            >
              {i}
            </button>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="text-lg font-semibold">{t("kids.universesTitle")}</h3>
            <div className="mt-5 grid gap-4">
              {universes.map((u) => (
                <div key={u.n}>
                  <div className="mb-1.5 flex justify-between text-sm font-medium">
                    <span>{u.n}</span>
                    <span className="text-muted-foreground">{u.v}%</span>
                  </div>
                  <Progress value={u.v} />
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-muted-foreground">{t("kids.universesNote")}</p>
          </Card>

          <div className="grid gap-6">
            <Card className="bg-sand/25">
              <p className="text-sm font-semibold">{t("kids.badgeTitle")}</p>
              <p className="mt-2 font-display text-xl font-bold">{t("kids.badgeName")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {badgeDetails.map((b) => (
                  <Chip key={b} tone="sand">
                    {b}
                  </Chip>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold">{t("kids.careersTitle")}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {careers.map((c) => (
                  <Chip key={c} tone="kids">
                    {c}
                  </Chip>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <SectionTitle title={t("kids.gradesTitle")} />
        <ol className="flex flex-wrap items-center gap-2">
          {grades.map((g, i) => (
            <li key={g} className="flex items-center gap-2">
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  i < 3 ? "bg-kids-gradient text-kids-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}. {g}
              </span>
              {i < grades.length - 1 && <span className="text-muted-foreground">→</span>}
            </li>
          ))}
        </ol>
      </Section>

      <Section className="pt-0">
        <Card className="border-success/30 bg-success/8">
          <h3 className="text-lg font-semibold">🛡️ {t("kids.safetyTitle")}</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {safety.map((s) => (
              <div key={s} className="rounded-xl bg-background px-4 py-3 text-sm font-medium">
                {s}
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </>
  );
}
