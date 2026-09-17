import { createFileRoute } from "@tanstack/react-router";
import { Card, Chip, Section, SectionTitle } from "@/components/ui-bits";
import { getPublicTalentProfileFn } from "@/server/public-profile";

export const Route = createFileRoute("/profil/$id")({
  loader: ({ params }) => getPublicTalentProfileFn({ data: { id: params.id } }),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.name} — Profil SKILLIA`
          : "Profil introuvable — SKILLIA",
      },
    ],
  }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const profile = Route.useLoaderData();

  if (!profile) {
    return (
      <Section className="max-w-xl">
        <Card>
          <p className="text-base text-muted-foreground">
            Ce profil n'existe pas ou n'est plus disponible.
          </p>
        </Card>
      </Section>
    );
  }

  const hasExtras = Boolean(profile.skills?.length || profile.school || profile.bio);

  return (
    <Section className="max-w-2xl">
      <SectionTitle eyebrow="SKILLIA" title="Profil" />

      <Card>
        <div className="flex items-center gap-4">
          {profile.photoDataUrl ? (
            <img
              src={profile.photoDataUrl}
              alt={profile.name}
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <span className="grid size-20 place-items-center rounded-full bg-hero-gradient text-2xl text-primary-foreground">
              {profile.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-xl font-semibold">{profile.name}</h1>
            {profile.jobTitle && <p className="text-sm text-muted-foreground">{profile.jobTitle}</p>}
            {profile.domain && (
              <div className="mt-2">
                <Chip tone="primary">{profile.domain}</Chip>
              </div>
            )}
          </div>
        </div>

        {(profile.phone || profile.email || profile.website) && (
          <div className="mt-6 grid gap-2 text-sm">
            {profile.phone && (
              <p>
                <span className="text-muted-foreground">📞 </span>
                {profile.phone}
              </p>
            )}
            {profile.email && (
              <p>
                <span className="text-muted-foreground">✉️ </span>
                {profile.email}
              </p>
            )}
            {profile.website && (
              <p>
                <span className="text-muted-foreground">🔗 </span>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {profile.website}
                </a>
              </p>
            )}
          </div>
        )}
      </Card>

      {hasExtras && (
        <div className="mt-6 grid gap-6">
          {profile.bio && (
            <Card>
              <h3 className="text-lg font-semibold">Présentation</h3>
              <p className="mt-3 whitespace-pre-line text-base text-muted-foreground">{profile.bio}</p>
            </Card>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold">Compétences</h3>
              <div className="mt-4 grid gap-2">
                {profile.skills.map((s) => (
                  <div
                    key={s.name}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary/60 px-4 py-3"
                  >
                    <span className="font-medium">{s.name}</span>
                    {s.level && <Chip tone="success">{s.level}</Chip>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {profile.school && (
            <Card>
              <h3 className="text-lg font-semibold">Formation</h3>
              <p className="mt-2 text-base text-muted-foreground">{profile.school}</p>
            </Card>
          )}
        </div>
      )}
    </Section>
  );
}
