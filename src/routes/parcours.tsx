import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Card, Chip, Section, SectionTitle } from "@/components/ui-bits";

export const Route = createFileRoute("/parcours")({
  head: () => ({
    meta: [
      { title: "Le parcours SKILLIA — de la découverte à la carrière" },
      {
        name: "description",
        content:
          "Carnet de découverte, carnet de talents, passeport compétences, profil Talent puis profil professionnel : un seul compte qui évolue.",
      },
      { property: "og:title", content: "Le parcours SKILLIA" },
      {
        property: "og:description",
        content: "Un profil qui évolue avec l'âge sans perdre l'historique utile.",
      },
    ],
  }),
  component: JourneyPage,
});

function JourneyPage() {
  const { t } = useI18n();
  const stages = t<{ age: string; name: string; items: string[] }[]>("journey.stages");
  const orientation = t<{ a: string; q: string }[]>("journey.orientation");

  return (
    <Section>
      <SectionTitle
        eyebrow="SKILLIA"
        title={t("journey.title")}
        desc={t("journey.subtitle")}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stages.map((s, i) => (
          <Card key={s.name}>
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-hero-gradient text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <p className="text-sm font-medium text-muted-foreground">{s.age}</p>
            </div>
            <h3 className="mt-4 text-lg font-semibold">{s.name}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {s.items.map((it) => (
                <Chip key={it}>{it}</Chip>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-14">
        <SectionTitle title={t("journey.orientationTitle")} />
        <div className="grid gap-3">
          {orientation.map((o) => (
            <div
              key={o.a}
              className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-6"
            >
              <span className="w-32 shrink-0 font-display font-semibold text-primary">
                {o.a}
              </span>
              <span className="text-muted-foreground">{o.q}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-2">
        <Card className="border-destructive/30 bg-destructive/5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">
            {t("journey.neverTitle")}
          </p>
          <p className="mt-3 font-display text-xl">{t("journey.never")}</p>
        </Card>
        <Card className="border-success/30 bg-success/8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-success">
            {t("journey.alwaysTitle")}
          </p>
          <p className="mt-3 font-display text-xl">{t("journey.always")}</p>
        </Card>
      </div>
    </Section>
  );
}
