import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Card, Chip, Section, SectionTitle } from "@/components/ui-bits";
import heroImage from "@/assets/skillia-hero.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SKILLIA — Transformer chaque compétence en opportunité" },
      {
        name: "description",
        content:
          "SKILLIA accompagne le parcours de l'enfant au professionnel : compétences, orientation, portfolio, CV automatique et recherche de talents.",
      },
      { property: "og:title", content: "SKILLIA — Compétences et opportunités" },
      {
        property: "og:description",
        content:
          "Une plateforme qui grandit avec vous : découverte, compétences, orientation, talents et opportunités.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();
  const spaces = t<{ name: string; desc: string }[]>("home.spaces");
  const values = t<string[]>("home.values");
  const options = t<string[]>("home.eveningOptions");

  return (
    <>
      <section className="relative overflow-hidden bg-hero-gradient text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
              {t("home.eyebrow")}
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
              {t("home.title")}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-primary-foreground/90">
              {t("home.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/inscription"
                search={{ role: "talent" }}
                className="rounded-full bg-background px-6 py-3 text-base font-semibold text-foreground shadow-lift transition-transform hover:-translate-y-0.5"
              >
                {t("cta.seeTalent")}
              </Link>
              <Link
                to="/inscription"
                search={{ role: "entreprise" }}
                className="rounded-full border border-primary-foreground/50 px-6 py-3 text-base font-semibold transition-colors hover:bg-primary-foreground/10"
              >
                {t("cta.seeCompany")}
              </Link>
              <Link
                to="/recherche"
                className="rounded-full px-6 py-3 text-base font-semibold text-primary-foreground underline-offset-4 hover:underline"
              >
                {t("cta.searchNoAccount")}
              </Link>
            </div>
          </div>
          <img
            src={heroImage}
            alt="Jeunes et professionnels africains construisant leur parcours de compétences"
            className="w-full rounded-3xl shadow-lift"
            loading="eager"
          />
        </div>
      </section>

      <Section>
        <Card className="bg-sand/20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {t("home.principleTitle")}
          </p>
          <p className="mt-3 font-display text-xl leading-snug sm:text-2xl">
            {t("home.principle")}
          </p>
        </Card>
      </Section>

      <Section className="pt-0">
        <SectionTitle title={t("home.spacesTitle")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {spaces.map((s, i) => (
            <Card key={s.name} className="transition-transform hover:-translate-y-1">
              <div
                className={`mb-4 grid size-11 place-items-center rounded-xl text-xl ${
                  i === 0 ? "bg-kids-gradient" : i === 3 ? "bg-warm-gradient" : "bg-hero-gradient"
                }`}
              >
                <span>{["🎈", "🚀", "🎯", "🏢"][i]}</span>
              </div>
              <h3 className="text-lg font-semibold">{s.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/inscription"
            search={{ role: "kids" }}
            className="rounded-full bg-kids-gradient px-5 py-2.5 text-sm font-semibold text-kids-foreground"
          >
            {t("cta.seeKids")}
          </Link>
          <Link
            to="/parcours"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
          >
            {t("cta.discover")}
          </Link>
        </div>
      </Section>

      <Section className="pt-0">
        <SectionTitle title={t("home.valuesTitle")} />
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <Chip key={v} tone="primary">
              {v}
            </Chip>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <SectionTitle title={t("home.eveningTitle")} desc={t("home.eveningIntro")} />
            <div className="rounded-2xl bg-secondary p-4 text-secondary-foreground">
              {t("home.eveningBubble")}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {options.map((o) => (
                <button
                  key={o}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5"
                >
                  {o}
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{t("home.eveningNote")}</p>
          </Card>
          <Card className="bg-warm-gradient text-accent-foreground">
            <h3 className="font-display text-2xl font-bold">{t("home.uxTitle")}</h3>
            <p className="mt-4 text-base opacity-90">{t("home.uxDesc")}</p>
          </Card>
        </div>
      </Section>
    </>
  );
}
