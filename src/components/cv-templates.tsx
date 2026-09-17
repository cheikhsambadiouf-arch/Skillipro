import type { CSSProperties } from "react";
import type { TalentCv } from "@/server/talent-cv";

// Les modèles de CV utilisent exclusivement des styles inline avec des
// couleurs littérales (hex/rgb), volontairement indépendants de la feuille
// de style de l'app (qui utilise des couleurs oklch()/color-mix() via une
// règle globale `* { border-color: ... }`). Deux raisons : un CV est un
// document destiné à être imprimé/partagé, il ne doit pas s'inverser en mode
// sombre comme le reste du site ; et le composant est capturé par
// html2canvas pour générer le PDF, qui ne sait pas parser ces couleurs
// modernes — l'isoler de toute feuille de style externe est ce qui rend
// cette capture fiable (voir downloadPdf dans talent-cv.tsx).

const neutral = {
  900: "#171717",
  700: "#404040",
  600: "#525252",
  500: "#737373",
  300: "#d4d4d4",
  200: "#e5e5e5",
  100: "#f5f5f5",
};

const teal = {
  800: "#115e59",
  700: "#0f766e",
  200: "#99f6e4",
  100: "#ccfbf1",
  50: "#f0fdfa",
};

const page: CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  backgroundColor: "#ffffff",
  color: neutral[900],
  boxSizing: "border-box",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function dateRange(startDate: string, endDate: string, current: boolean) {
  const end = current ? "Aujourd'hui" : endDate;
  if (startDate && end) return `${startDate} — ${end}`;
  return startDate || end || "";
}

function SectionTitle({ children, color = neutral[500] }: { children: string; color?: string }) {
  return (
    <h2
      style={{
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "1.4px",
        color,
        margin: 0,
      }}
    >
      {children}
    </h2>
  );
}

function Avatar({
  photoDataUrl,
  name,
  size,
  bg,
  color,
}: {
  photoDataUrl: string;
  name: string;
  size: number;
  bg: string;
  color: string;
}) {
  if (photoDataUrl) {
    return (
      <img
        src={photoDataUrl}
        alt={name}
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: 9999,
          objectFit: "cover",
        }}
      />
    );
  }
  return (
    <span
      style={{
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 9999,
        backgroundColor: bg,
        color,
        fontSize: size * 0.28,
        fontWeight: 600,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function ClassicCvTemplate({ cv }: { cv: TalentCv }) {
  const { profile } = cv;
  return (
    <div style={{ ...page, maxWidth: "210mm", margin: "0 auto", width: "100%", padding: 40 }} lang="fr">
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          borderBottom: `1px solid ${neutral[300]}`,
          paddingBottom: 24,
        }}
      >
        <Avatar photoDataUrl={profile.photoDataUrl} name={profile.name} size={80} bg={neutral[200]} color={neutral[600]} />
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{profile.name}</h1>
          {profile.jobTitle && (
            <p style={{ marginTop: 4, fontSize: 16, color: neutral[600] }}>{profile.jobTitle}</p>
          )}
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexWrap: "wrap",
              columnGap: 16,
              rowGap: 4,
              fontSize: 13,
              color: neutral[500],
            }}
          >
            {profile.location && <span>📍 {profile.location}</span>}
            {profile.phone && <span>📞 {profile.phone}</span>}
            {profile.email && <span>✉️ {profile.email}</span>}
            {profile.website && <span>🔗 {profile.website}</span>}
          </div>
        </div>
      </header>

      {profile.bio && (
        <section style={{ marginTop: 24 }}>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: neutral[700], margin: 0 }}>{profile.bio}</p>
        </section>
      )}

      {cv.experiences.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <SectionTitle>Expérience professionnelle</SectionTitle>
          <div style={{ marginTop: 8, display: "grid", gap: 16 }}>
            {cv.experiences.map((exp) => (
              <div key={exp.id}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                  <h3 style={{ fontWeight: 600, color: neutral[900], margin: 0, fontSize: 14 }}>
                    {exp.title}
                    {exp.company && <span style={{ fontWeight: 400, color: neutral[600] }}> — {exp.company}</span>}
                  </h3>
                  <span style={{ fontSize: 12, color: neutral[500], whiteSpace: "nowrap" }}>
                    {dateRange(exp.startDate, exp.endDate, exp.current)}
                  </span>
                </div>
                {exp.description && (
                  <p style={{ marginTop: 4, whiteSpace: "pre-line", fontSize: 13, color: neutral[700], margin: "4px 0 0" }}>
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {(profile.domain || profile.school || profile.educationLevel) && (
        <section style={{ marginTop: 24 }}>
          <SectionTitle>Formation</SectionTitle>
          <p style={{ marginTop: 8, fontSize: 13, color: neutral[700] }}>
            {[profile.domain, profile.school, profile.educationLevel].filter(Boolean).join(" · ")}
          </p>
        </section>
      )}

      {profile.skills.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <SectionTitle>Compétences</SectionTitle>
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {profile.skills.map((s) => (
              <span
                key={s.name}
                style={{
                  borderRadius: 9999,
                  backgroundColor: neutral[100],
                  padding: "4px 12px",
                  fontSize: 12,
                  color: neutral[700],
                }}
              >
                {s.name}
                {s.level ? ` · ${s.level}` : ""}
              </span>
            ))}
          </div>
        </section>
      )}

      {cv.languages.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <SectionTitle>Langues</SectionTitle>
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", columnGap: 24, rowGap: 4, fontSize: 13, color: neutral[700] }}>
            {cv.languages.map((l) => (
              <span key={l.id}>
                {l.name}
                {l.level ? ` — ${l.level}` : ""}
              </span>
            ))}
          </div>
        </section>
      )}

      {cv.certifications.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <SectionTitle>Certifications</SectionTitle>
          <div style={{ marginTop: 6, display: "grid", gap: 4, fontSize: 13, color: neutral[700] }}>
            {cv.certifications.map((c) => (
              <p key={c.id} style={{ margin: 0 }}>
                {c.name}
                {c.issuer ? ` — ${c.issuer}` : ""}
                {c.date ? ` (${c.date})` : ""}
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function VisualCvTemplate({ cv }: { cv: TalentCv }) {
  const { profile } = cv;
  return (
    <div style={{ ...page, maxWidth: "210mm", margin: "0 auto", width: "100%", display: "flex" }} lang="fr">
      <aside style={{ width: "35%", flexShrink: 0, backgroundColor: teal[800], color: "#ffffff", padding: 32 }}>
        <Avatar
          photoDataUrl={profile.photoDataUrl}
          name={profile.name}
          size={96}
          bg="rgba(255,255,255,0.15)"
          color="#ffffff"
        />
        <h1 style={{ marginTop: 20, fontSize: 20, fontWeight: 700, lineHeight: 1.25 }}>{profile.name}</h1>
        {profile.jobTitle && <p style={{ marginTop: 4, fontSize: 13, color: teal[100] }}>{profile.jobTitle}</p>}

        <div style={{ marginTop: 24, display: "grid", gap: 8, fontSize: 13, color: teal[50] }}>
          {profile.location && <p style={{ margin: 0 }}>📍 {profile.location}</p>}
          {profile.phone && <p style={{ margin: 0 }}>📞 {profile.phone}</p>}
          {profile.email && <p style={{ margin: 0, wordBreak: "break-all" }}>✉️ {profile.email}</p>}
          {profile.website && <p style={{ margin: 0, wordBreak: "break-all" }}>🔗 {profile.website}</p>}
        </div>

        {profile.skills.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <SectionTitle color={teal[200]}>Compétences</SectionTitle>
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {profile.skills.map((s) => (
                <span
                  key={s.name}
                  style={{
                    borderRadius: 9999,
                    backgroundColor: "rgba(255,255,255,0.15)",
                    padding: "4px 10px",
                    fontSize: 11,
                  }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {cv.languages.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <SectionTitle color={teal[200]}>Langues</SectionTitle>
            <div style={{ marginTop: 12, display: "grid", gap: 4, fontSize: 13, color: teal[50] }}>
              {cv.languages.map((l) => (
                <p key={l.id} style={{ margin: 0 }}>
                  {l.name}
                  {l.level ? ` — ${l.level}` : ""}
                </p>
              ))}
            </div>
          </div>
        )}
      </aside>

      <div style={{ flex: 1, padding: 32 }}>
        {profile.bio && (
          <section>
            <SectionTitle color={teal[700]}>Profil</SectionTitle>
            <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: neutral[700], margin: "8px 0 0" }}>
              {profile.bio}
            </p>
          </section>
        )}

        {cv.experiences.length > 0 && (
          <section style={{ marginTop: 28 }}>
            <SectionTitle color={teal[700]}>Expérience professionnelle</SectionTitle>
            <div style={{ marginTop: 12, display: "grid", gap: 16 }}>
              {cv.experiences.map((exp) => (
                <div key={exp.id} style={{ borderLeft: `2px solid ${teal[200]}`, paddingLeft: 16 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                    <h3 style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>
                      {exp.title}
                      {exp.company && <span style={{ fontWeight: 400, color: neutral[600] }}> — {exp.company}</span>}
                    </h3>
                    <span style={{ fontSize: 11, color: neutral[500], whiteSpace: "nowrap" }}>
                      {dateRange(exp.startDate, exp.endDate, exp.current)}
                    </span>
                  </div>
                  {exp.description && (
                    <p style={{ marginTop: 4, whiteSpace: "pre-line", fontSize: 13, color: neutral[700], margin: "4px 0 0" }}>
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {(profile.domain || profile.school || profile.educationLevel) && (
          <section style={{ marginTop: 28 }}>
            <SectionTitle color={teal[700]}>Formation</SectionTitle>
            <p style={{ marginTop: 8, fontSize: 13, color: neutral[700] }}>
              {[profile.domain, profile.school, profile.educationLevel].filter(Boolean).join(" · ")}
            </p>
          </section>
        )}

        {cv.certifications.length > 0 && (
          <section style={{ marginTop: 28 }}>
            <SectionTitle color={teal[700]}>Certifications</SectionTitle>
            <div style={{ marginTop: 8, display: "grid", gap: 4, fontSize: 13, color: neutral[700] }}>
              {cv.certifications.map((c) => (
                <p key={c.id} style={{ margin: 0 }}>
                  {c.name}
                  {c.issuer ? ` — ${c.issuer}` : ""}
                  {c.date ? ` (${c.date})` : ""}
                </p>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
