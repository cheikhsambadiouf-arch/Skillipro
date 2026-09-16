import { createFileRoute, redirect } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Card, Chip, Section, SectionTitle } from "@/components/ui-bits";

export const Route = createFileRoute("/entreprise")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: "/connexion", search: { redirect: location.href } });
    }
    if (context.user.role !== "entreprise") {
      throw redirect({ to: `/${context.user.role}` });
    }
    return { user: context.user };
  },
  head: () => ({
    meta: [
      { title: "Espace Entreprise SKILLIA — trouver les bonnes compétences" },
      {
        name: "description",
        content:
          "Décrivez votre besoin en une phrase : SKILLIA extrait les critères, filtre les talents et explique chaque compatibilité.",
      },
      { property: "og:title", content: "Espace Entreprise SKILLIA" },
      {
        property: "og:description",
        content: "Recherche de talents par besoin, filtres avancés et matching expliqué.",
      },
    ],
  }),
  component: CompanyPage,
});

const candidates = [
  {
    name: "Mamadou Diop",
    role: "Technicien électromécanicien",
    city: "Thiès",
    years: 5,
    score: 96,
    skills: ["⚡ Électricité", "⚙️ Maintenance", "🔧 Électromécanique"],
  },
  {
    name: "Fatou Ndiaye",
    role: "Technicienne de maintenance",
    city: "Dakar",
    years: 3,
    score: 88,
    skills: ["⚙️ Maintenance", "🛠️ Mécanique", "📋 HSE"],
  },
  {
    name: "Ibrahima Sarr",
    role: "Électricien industriel",
    city: "Thiès",
    years: 7,
    score: 84,
    skills: ["⚡ Électricité", "🔌 Câblage", "🏗️ Chantier"],
  },
];

const filters = [
  "Métier",
  "Compétences",
  "Ville",
  "Distance",
  "Expérience",
  "Disponibilité",
  "Diplôme vérifié",
  "Mobilité",
  "CDI",
  "Mission",
  "Freelance",
  "Télétravail",
];

function CompanyPage() {
  const { t } = useI18n();
  const { user } = Route.useRouteContext();
  const criteria = t<{ k: string; v: string }[]>("company.criteria");
  const why = t<string[]>("company.why");
  const pipeline = t<string[]>("company.pipeline");

  return (
    <Section>
      <SectionTitle
        eyebrow={`SKILLIA Entreprise · ${user.name}`}
        title={t("company.title")}
        desc={t("company.subtitle")}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <label className="text-sm font-semibold text-muted-foreground">
            {t("company.needLabel")}
          </label>
          <div className="mt-3 rounded-2xl border border-border bg-background p-4 text-base">
            {t("company.needExample")}
          </div>
          <div className="mt-5 rounded-2xl bg-primary/8 p-4">
            <p className="font-semibold text-primary">{t("company.understood")}</p>
            <dl className="mt-3 grid gap-2 text-sm">
              {criteria.map((c) => (
                <div key={c.k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{c.k}</dt>
                  <dd className="font-medium">{c.v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {filters.map((f) => (
              <Chip key={f}>{f}</Chip>
            ))}
          </div>
        </Card>

        <div className="grid gap-4">
          <h3 className="font-display text-xl font-bold">{t("company.resultsTitle")}</h3>
          {candidates.map((c) => (
            <Card key={c.name} className="transition-transform hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-base font-semibold">👤 {c.name}</h4>
                  <p className="text-sm text-muted-foreground">{c.role}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    📍 {c.city} · 💼 {c.years} {t("company.years")}
                  </p>
                </div>
                <span className="rounded-full bg-success/15 px-3 py-1 text-sm font-bold text-success">
                  {c.score} % {t("company.match")}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.skills.map((s) => (
                  <Chip key={s} tone="primary">
                    {s}
                  </Chip>
                ))}
                <Chip tone="success">🟢 {t("company.verified")}</Chip>
              </div>
              <button className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                {t("cta.viewProfile")}
              </button>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold">{t("company.whyTitle")}</h3>
          <ul className="mt-4 grid gap-2 text-sm">
            {why.map((w) => (
              <li key={w} className="flex items-start gap-2">
                <span className="text-success">✓</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold">{t("company.pipelineTitle")}</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {pipeline.map((p, i) => (
              <Chip key={p} tone={i < 3 ? "primary" : "muted"}>
                {p}
              </Chip>
            ))}
          </div>
          <div className="mt-6 grid gap-2 text-sm">
            <div className="rounded-xl bg-sand/25 px-4 py-3">📌 Relancer Mamadou dans 2 jours.</div>
            <div className="rounded-xl bg-sand/25 px-4 py-3">📌 Entretien demain à 10h.</div>
          </div>
        </Card>
      </div>
    </Section>
  );
}
