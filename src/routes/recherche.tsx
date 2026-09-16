import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Card, Chip, Section, SectionTitle } from "@/components/ui-bits";
import { demoTalents } from "@/data/demo-talents";

export const Route = createFileRoute("/recherche")({
  head: () => ({
    meta: [
      { title: "Rechercher un talent — SKILLIA" },
      {
        name: "description",
        content:
          "Recherchez un profil par domaine et localité, sans créer de compte. Résultats de démonstration SKILLIA.",
      },
    ],
  }),
  component: RecherchePage,
});

function RecherchePage() {
  const { t } = useI18n();
  const [domain, setDomain] = useState("");
  const [location, setLocation] = useState("");

  const results = useMemo(() => {
    const d = domain.trim().toLowerCase();
    const l = location.trim().toLowerCase();
    return demoTalents.filter(
      (talent) =>
        (d === "" || talent.domain.toLowerCase().includes(d)) &&
        (l === "" || talent.location.toLowerCase().includes(l)),
    );
  }, [domain, location]);

  return (
    <Section>
      <SectionTitle
        eyebrow="SKILLIA"
        title={t("search.title")}
        desc={t("search.subtitle")}
      />

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-muted-foreground">{t("search.domainLabel")}</span>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="input-field"
              placeholder={t("search.domainPlaceholder")}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-muted-foreground">{t("search.locationLabel")}</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-field"
              placeholder={t("search.locationPlaceholder")}
            />
          </label>
        </div>
      </Card>

      <div className="mt-6 grid gap-4">
        <p className="text-sm text-muted-foreground">
          {results.length} {t("search.resultsCount")}
        </p>

        {results.map((talent) => (
          <Card key={talent.id} className="transition-transform hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">👤 {talent.name}</h3>
                <p className="text-sm text-muted-foreground">{talent.role}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  📍 {talent.location} · 💼 {talent.years} {t("company.years")}
                </p>
              </div>
              <Chip tone="primary">{talent.domain}</Chip>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {talent.skills.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          </Card>
        ))}

        {results.length === 0 && (
          <Card>
            <p className="text-sm text-muted-foreground">{t("search.noResults")}</p>
          </Card>
        )}
      </div>

      <Card className="mt-8 bg-warm-gradient text-accent-foreground">
        <h3 className="font-display text-xl font-bold">{t("search.ctaTitle")}</h3>
        <p className="mt-2 opacity-90">{t("search.ctaDesc")}</p>
        <Link
          to="/inscription"
          search={{ role: "entreprise" }}
          className="mt-4 inline-block rounded-full bg-background/90 px-5 py-2.5 text-sm font-semibold text-foreground"
        >
          {t("search.ctaButton")}
        </Link>
      </Card>
    </Section>
  );
}
