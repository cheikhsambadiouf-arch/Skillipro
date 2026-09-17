import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Card, Section, SectionTitle } from "@/components/ui-bits";
import { ClassicLetterTemplate, ModernLetterTemplate, type LetterPreviewData } from "@/components/letter-templates";
import {
  getTalentLettersFn,
  updateTalentLettersFn,
  type CoverLetter,
  type LetterProfileSummary,
  type LetterTemplate,
} from "@/server/talent-letters";

const SAVE_DEBOUNCE_MS = 1200;

const TEMPLATES: { id: LetterTemplate; label: string; desc: string }[] = [
  { id: "classique", label: "Classique", desc: "Formel, adapté à une candidature en entreprise" },
  { id: "moderne", label: "Moderne", desc: "Direct, adapté à une candidature spontanée ou startup" },
];

export const Route = createFileRoute("/talent-lettre")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: "/connexion", search: { redirect: location.href } });
    }
    if (context.user.role !== "talent") {
      throw redirect({ to: `/${context.user.role}` });
    }
  },
  loader: () => getTalentLettersFn(),
  head: () => ({
    meta: [{ title: "Lettres de motivation — SKILLIA" }],
  }),
  component: TalentLettrePage,
});

type SaveStatus = "idle" | "pending" | "saved" | "error";

function newId() {
  return crypto.randomUUID();
}

function formatFrenchDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

interface DraftInput {
  profile: LetterProfileSummary;
  jobTitle: string;
  companyName: string;
  recruiterName: string;
  highlights: string;
}

// Modèle "Classique" : formulations formelles et traditionnelles.
function buildClassicDraft({ profile, jobTitle, companyName, recruiterName, highlights }: DraftInput): string {
  const paragraphs: string[] = [];
  paragraphs.push(recruiterName ? `À l'attention de ${recruiterName},` : "Madame, Monsieur,");

  paragraphs.push(
    `${profile.jobTitle ? `Actuellement ${profile.jobTitle}, je` : "Je"} me permets de vous adresser ma candidature pour le poste de ${
      jobTitle || "[poste]"
    } au sein de ${companyName || "votre entreprise"}, poste qui correspond pleinement à mon projet professionnel.`,
  );

  const lastExp = profile.experiences[0];
  const topSkills = profile.skills.map((s) => s.name).filter(Boolean).slice(0, 3);
  if (lastExp && (lastExp.title || lastExp.company)) {
    const roleBit = [lastExp.title, lastExp.company && `chez ${lastExp.company}`].filter(Boolean).join(" ");
    const skillsBit = topSkills.length ? ` en ${topSkills.join(", ")}` : "";
    paragraphs.push(
      `Fort de mon expérience en tant que ${roleBit}, j'ai développé des compétences solides${skillsBit}, que je souhaite aujourd'hui mettre au service de votre structure.`,
    );
  } else if (topSkills.length) {
    paragraphs.push(
      `Mes compétences en ${topSkills.join(", ")} me permettront, je l'espère, de contribuer rapidement aux projets de votre équipe.`,
    );
  }

  if (highlights.trim()) {
    paragraphs.push(highlights.trim());
  }

  paragraphs.push(
    "Convaincu(e) que mon profil saura répondre à vos attentes, je reste à votre disposition pour un entretien au cours duquel je pourrai vous exposer plus en détail ma motivation.",
  );
  paragraphs.push("Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.");

  return paragraphs.join("\n\n");
}

// Modèle "Moderne" : formulations plus directes et informelles.
function buildModernDraft({ profile, jobTitle, companyName, recruiterName, highlights }: DraftInput): string {
  const paragraphs: string[] = [];
  paragraphs.push(recruiterName ? `Bonjour ${recruiterName},` : "Bonjour,");

  paragraphs.push(
    `Je m'appelle ${profile.name || "[votre nom]"}${
      profile.jobTitle ? `, ${profile.jobTitle}` : ""
    }, et je souhaite rejoindre ${companyName || "votre équipe"} en tant que ${jobTitle || "[poste]"}.`,
  );

  if (highlights.trim()) {
    paragraphs.push(`Ce qui m'anime dans cette candidature : ${highlights.trim()}`);
  }

  const lastExp = profile.experiences[0];
  const topSkills = profile.skills.map((s) => s.name).filter(Boolean).slice(0, 3);
  if (lastExp && (lastExp.title || lastExp.company)) {
    const roleBit = [lastExp.title, lastExp.company && `chez ${lastExp.company}`].filter(Boolean).join(" ");
    const skillsBit = topSkills.length ? ` et des compétences en ${topSkills.join(", ")}` : "";
    paragraphs.push(
      `Avec une expérience en tant que ${roleBit}${skillsBit}, je pense pouvoir apporter rapidement une vraie valeur ajoutée à votre équipe.`,
    );
  } else if (topSkills.length) {
    paragraphs.push(`Mes compétences en ${topSkills.join(", ")} sont, je pense, un bon atout pour ce poste.`);
  }

  paragraphs.push("Je serais ravi(e) d'échanger avec vous pour vous en dire plus.");
  paragraphs.push("Au plaisir d'échanger,");

  return paragraphs.join("\n\n");
}

function StatusLabel({ status }: { status: SaveStatus }) {
  const label: Record<SaveStatus, string> = {
    idle: "",
    pending: "Enregistrement…",
    saved: "✓ Enregistré",
    error: "✕ Échec de l'enregistrement",
  };
  return (
    <span className={`text-sm font-semibold ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
      {label[status]}
    </span>
  );
}

function TalentLettrePage() {
  const initial = Route.useLoaderData();
  const [letters, setLetters] = useState<CoverLetter[]>(initial.letters);
  const [selectedId, setSelectedId] = useState<string | null>(initial.letters[0]?.id ?? null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const isFirstRender = useRef(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestLetters = useRef(letters);
  latestLetters.current = letters;

  const selected = letters.find((l) => l.id === selectedId) ?? null;

  async function save() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setStatus("pending");
    setErrorMessage(null);
    try {
      const saved = await updateTalentLettersFn({ data: { letters: latestLetters.current } });
      setLetters(saved);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    }
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(save, SAVE_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letters]);

  function updateSelected(patch: Partial<CoverLetter>) {
    if (!selectedId) return;
    setLetters((list) =>
      list.map((l) => (l.id === selectedId ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l)),
    );
  }

  function addLetter() {
    const now = new Date().toISOString();
    const letter: CoverLetter = {
      id: newId(),
      jobTitle: "",
      companyName: "",
      recruiterName: "",
      highlights: "",
      content: "",
      template: "classique",
      createdAt: now,
      updatedAt: now,
    };
    setLetters((list) => [letter, ...list]);
    setSelectedId(letter.id);
  }

  function deleteLetter(id: string) {
    setLetters((list) => list.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function generateDraft() {
    if (!selected) return;
    if (
      selected.content.trim() &&
      !window.confirm("Remplacer le texte actuel par un nouveau brouillon ? Vos modifications seront perdues.")
    ) {
      return;
    }
    const builder = selected.template === "moderne" ? buildModernDraft : buildClassicDraft;
    const content = builder({
      profile: initial.profile,
      jobTitle: selected.jobTitle,
      companyName: selected.companyName,
      recruiterName: selected.recruiterName,
      highlights: selected.highlights,
    });
    updateSelected({ content });
  }

  async function downloadPdf() {
    if (!selected) return;
    setDownloading(true);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-99999px";
    iframe.style.top = "0";
    iframe.style.border = "0";
    iframe.style.width = "800px";
    iframe.style.height = "1600px";
    document.body.appendChild(iframe);

    try {
      const previewData: LetterPreviewData = {
        senderName: initial.profile.name,
        senderLocation: initial.profile.location,
        companyName: selected.companyName,
        recruiterName: selected.recruiterName,
        dateLabel: `le ${formatFrenchDate(selected.updatedAt)}`,
        content: selected.content,
      };
      const TemplateComponent = selected.template === "moderne" ? ModernLetterTemplate : ClassicLetterTemplate;
      const html = renderToStaticMarkup(<TemplateComponent letter={previewData} />);

      const doc = iframe.contentDocument;
      if (!doc) throw new Error("Impossible de préparer le PDF.");
      doc.open();
      doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body style="margin:0">${html}</body></html>`);
      doc.close();

      const target = doc.body.firstElementChild as HTMLElement | null;
      if (!target) throw new Error("Impossible de préparer le PDF.");

      const [{ default: html2canvas }, { default: JsPdf }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new JsPdf({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const company = selected.companyName.trim().replace(/\s+/g, "-") || "SKILLIA";
      pdf.save(`Lettre-de-motivation-${company}.pdf`);
    } finally {
      document.body.removeChild(iframe);
      setDownloading(false);
    }
  }

  return (
    <Section className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          eyebrow="SKILLIA Talent"
          title="Lettres de motivation"
          desc="Une lettre par candidature, assemblée depuis votre profil, entièrement modifiable."
        />
        <StatusLabel status={status} />
      </div>

      {errorMessage && (
        <p className="mb-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr_1.1fr]">
        <div className="grid gap-3 self-start">
          <button
            type="button"
            onClick={addLetter}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            + Nouvelle lettre
          </button>
          <div className="grid gap-2">
            {letters.map((letter) => (
              <button
                key={letter.id}
                type="button"
                onClick={() => setSelectedId(letter.id)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                  letter.id === selectedId
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="font-semibold">{letter.jobTitle || "Sans titre"}</p>
                <p className="text-xs text-muted-foreground">{letter.companyName || "Entreprise non précisée"}</p>
              </button>
            ))}
            {letters.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune lettre pour le moment.</p>
            )}
          </div>
        </div>

        {selected ? (
          <div className="grid gap-6">
            <Card>
              <h3 className="text-lg font-semibold">Candidature</h3>
              <div className="mt-4 grid gap-3">
                <Field label="Poste visé">
                  <input
                    value={selected.jobTitle}
                    onChange={(e) => updateSelected({ jobTitle: e.target.value })}
                    className="input-field"
                    placeholder="Ex. Développeur front-end"
                  />
                </Field>
                <Field label="Entreprise">
                  <input
                    value={selected.companyName}
                    onChange={(e) => updateSelected({ companyName: e.target.value })}
                    className="input-field"
                    placeholder="Ex. SKILLIA SARL"
                  />
                </Field>
                <Field label="Nom du recruteur (optionnel)">
                  <input
                    value={selected.recruiterName}
                    onChange={(e) => updateSelected({ recruiterName: e.target.value })}
                    className="input-field"
                  />
                </Field>
                <Field label="Points à mettre en avant (optionnel)">
                  <textarea
                    value={selected.highlights}
                    onChange={(e) => updateSelected({ highlights: e.target.value })}
                    rows={2}
                    className="input-field resize-none"
                    placeholder="Ex. mon intérêt pour vos projets d'énergie solaire…"
                  />
                </Field>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold">Modèle</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => updateSelected({ template: tpl.id })}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      selected.template === tpl.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="text-sm font-semibold">{tpl.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{tpl.desc}</p>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={generateDraft}
                className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:-translate-y-0.5"
              >
                ✨ {selected.content.trim() ? "Régénérer le brouillon" : "Générer un brouillon"}
              </button>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold">Texte de la lettre</h3>
              <textarea
                value={selected.content}
                onChange={(e) => updateSelected({ content: e.target.value })}
                rows={16}
                className="input-field mt-4 resize-y font-mono text-sm"
                placeholder="Générez un brouillon ci-dessus, ou écrivez directement ici…"
              />
            </Card>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={status === "pending"}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => deleteLetter(selected.id)}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
              >
                ✕ Supprimer cette lettre
              </button>
            </div>
          </div>
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">
              Sélectionnez une lettre à gauche, ou créez-en une nouvelle.
            </p>
          </Card>
        )}

        <div className="grid gap-4 self-start lg:sticky lg:top-20">
          <button
            type="button"
            onClick={downloadPdf}
            disabled={!selected || downloading}
            className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {downloading ? "Génération du PDF…" : "📄 Télécharger en PDF"}
          </button>
          <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
            <div className="max-h-[80vh] overflow-auto bg-neutral-100 p-4">
              {selected ? (
                selected.template === "moderne" ? (
                  <ModernLetterTemplate
                    letter={{
                      senderName: initial.profile.name,
                      senderLocation: initial.profile.location,
                      companyName: selected.companyName,
                      recruiterName: selected.recruiterName,
                      dateLabel: `le ${formatFrenchDate(selected.updatedAt)}`,
                      content: selected.content || "Votre lettre apparaîtra ici.",
                    }}
                  />
                ) : (
                  <ClassicLetterTemplate
                    letter={{
                      senderName: initial.profile.name,
                      senderLocation: initial.profile.location,
                      companyName: selected.companyName,
                      recruiterName: selected.recruiterName,
                      dateLabel: `le ${formatFrenchDate(selected.updatedAt)}`,
                      content: selected.content || "Votre lettre apparaîtra ici.",
                    }}
                  />
                )
              ) : (
                <div className="flex aspect-[210/297] w-full items-center justify-center text-sm text-muted-foreground">
                  Aucune lettre sélectionnée
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
