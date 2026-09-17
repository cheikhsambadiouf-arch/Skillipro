import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Card, Section, SectionTitle } from "@/components/ui-bits";
import { ClassicCvTemplate, VisualCvTemplate } from "@/components/cv-templates";
import {
  getTalentCvFn,
  updateTalentCvFn,
  type CvCertification,
  type CvExperience,
  type CvLanguage,
  type CvTemplate,
  type TalentCv,
  type TalentCvInput,
} from "@/server/talent-cv";

const SAVE_DEBOUNCE_MS = 1200;
const LANGUAGE_LEVELS = ["", "Débutant", "Intermédiaire", "Courant", "Langue maternelle"] as const;

const TEMPLATES: { id: CvTemplate; label: string; desc: string }[] = [
  { id: "classique", label: "Classique", desc: "Sobre, adapté aux candidatures en entreprise" },
  { id: "visuel", label: "Visuel", desc: "Plus visuel, avec bandeau de couleur" },
];

export const Route = createFileRoute("/talent-cv")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: "/connexion", search: { redirect: location.href } });
    }
    if (context.user.role !== "talent") {
      throw redirect({ to: `/${context.user.role}` });
    }
  },
  loader: () => getTalentCvFn(),
  head: () => ({
    meta: [{ title: "Mon CV — SKILLIA" }],
  }),
  component: TalentCvPage,
});

type SaveStatus = "idle" | "pending" | "saved" | "error";

function newId() {
  return crypto.randomUUID();
}

function TalentCvPage() {
  const initial = Route.useLoaderData();
  const [profile] = useState(initial.profile);
  const [cvData, setCvData] = useState<TalentCvInput>({
    experiences: initial.experiences,
    languages: initial.languages,
    certifications: initial.certifications,
    template: initial.template,
  });
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const isFirstRender = useRef(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef(cvData);
  latestData.current = cvData;
  const previewRef = useRef<HTMLDivElement>(null);

  async function save() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setStatus("pending");
    setErrorMessage(null);
    try {
      const saved = await updateTalentCvFn({ data: latestData.current });
      setCvData(saved);
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
    debounceTimer.current = setTimeout(() => {
      save();
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvData]);

  function updateExperience(index: number, next: CvExperience) {
    setCvData((d) => ({ ...d, experiences: d.experiences.map((e, i) => (i === index ? next : e)) }));
  }
  function addExperience() {
    setCvData((d) => ({
      ...d,
      experiences: [
        ...d.experiences,
        { id: newId(), title: "", company: "", startDate: "", endDate: "", current: false, description: "" },
      ],
    }));
  }
  function removeExperience(index: number) {
    setCvData((d) => ({ ...d, experiences: d.experiences.filter((_, i) => i !== index) }));
  }

  function updateLanguage(index: number, next: CvLanguage) {
    setCvData((d) => ({ ...d, languages: d.languages.map((l, i) => (i === index ? next : l)) }));
  }
  function addLanguage() {
    setCvData((d) => ({ ...d, languages: [...d.languages, { id: newId(), name: "", level: "" }] }));
  }
  function removeLanguage(index: number) {
    setCvData((d) => ({ ...d, languages: d.languages.filter((_, i) => i !== index) }));
  }

  function updateCertification(index: number, next: CvCertification) {
    setCvData((d) => ({
      ...d,
      certifications: d.certifications.map((c, i) => (i === index ? next : c)),
    }));
  }
  function addCertification() {
    setCvData((d) => ({
      ...d,
      certifications: [...d.certifications, { id: newId(), name: "", issuer: "", date: "" }],
    }));
  }
  function removeCertification(index: number) {
    setCvData((d) => ({ ...d, certifications: d.certifications.filter((_, i) => i !== index) }));
  }

  async function downloadPdf() {
    setDownloading(true);

    // La capture ne se fait pas sur l'aperçu affiché à l'écran, mais sur une
    // copie rendue dans un iframe isolé, sans aucune feuille de style de l'app
    // (qui utilise des couleurs oklch()/color-mix() que html2canvas ne sait pas
    // parser et sur lesquelles il plante en parcourant tout le document). Les
    // modèles de CV n'utilisent que des styles inline avec des couleurs
    // littérales, donc ce rendu isolé est visuellement identique à l'aperçu.
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-99999px";
    iframe.style.top = "0";
    iframe.style.border = "0";
    iframe.style.width = cvData.template === "visuel" ? "900px" : "800px";
    iframe.style.height = "1600px";
    document.body.appendChild(iframe);

    try {
      const TemplateComponent = cvData.template === "visuel" ? VisualCvTemplate : ClassicCvTemplate;
      const html = renderToStaticMarkup(<TemplateComponent cv={{ profile, ...cvData }} />);

      const doc = iframe.contentDocument;
      if (!doc) throw new Error("Impossible de préparer le PDF.");
      doc.open();
      doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body style="margin:0">${html}</body></html>`);
      doc.close();

      await new Promise<void>((resolve) => {
        const images = Array.from(doc.images);
        if (images.length === 0) {
          resolve();
          return;
        }
        let remaining = images.length;
        const done = () => {
          remaining -= 1;
          if (remaining <= 0) resolve();
        };
        images.forEach((img) => {
          if (img.complete) done();
          else {
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          }
        });
      });

      const target = doc.body.firstElementChild as HTMLElement | null;
      if (!target) throw new Error("Impossible de préparer le PDF.");

      const [{ default: html2canvas }, { default: JsPdf }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
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

      const fileName = `CV-${profile.name.trim().replace(/\s+/g, "-") || "SKILLIA"}.pdf`;
      pdf.save(fileName);
    } finally {
      document.body.removeChild(iframe);
      setDownloading(false);
    }
  }

  const cvForPreview: TalentCv = { profile, ...cvData };
  const TemplateComponent = cvData.template === "visuel" ? VisualCvTemplate : ClassicCvTemplate;

  const statusLabel: Record<SaveStatus, string> = {
    idle: "",
    pending: "Enregistrement…",
    saved: "✓ Enregistré",
    error: "✕ Échec de l'enregistrement",
  };

  return (
    <Section className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          eyebrow="SKILLIA Talent"
          title="Mon CV"
          desc="Identité, formation, compétences et bio viennent automatiquement de votre profil."
        />
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-sm font-semibold ${
              status === "error" ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {statusLabel[status]}
          </span>
          <Link to="/talent-tableau-de-bord" className="text-sm font-semibold text-primary hover:underline">
            ← Modifier mon profil
          </Link>
        </div>
      </div>

      {errorMessage && (
        <p className="mb-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid gap-6">
          <Card>
            <h3 className="text-lg font-semibold">Modèle</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setCvData((d) => ({ ...d, template: tpl.id }))}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                    cvData.template === tpl.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="text-sm font-semibold">{tpl.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{tpl.desc}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold">Expériences professionnelles</h3>
            <div className="mt-4 grid gap-4">
              {cvData.experiences.map((exp, i) => (
                <div key={exp.id} className="grid gap-3 rounded-xl border border-border p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={exp.title}
                      onChange={(e) => updateExperience(i, { ...exp, title: e.target.value })}
                      className="input-field"
                      placeholder="Poste (ex. Technicien)"
                    />
                    <input
                      value={exp.company}
                      onChange={(e) => updateExperience(i, { ...exp, company: e.target.value })}
                      className="input-field"
                      placeholder="Entreprise"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
                    <input
                      value={exp.startDate}
                      onChange={(e) => updateExperience(i, { ...exp, startDate: e.target.value })}
                      className="input-field"
                      placeholder="Début (ex. 2022)"
                    />
                    <input
                      value={exp.endDate}
                      disabled={exp.current}
                      onChange={(e) => updateExperience(i, { ...exp, endDate: e.target.value })}
                      className="input-field disabled:opacity-50"
                      placeholder="Fin (ex. 2024)"
                    />
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => updateExperience(i, { ...exp, current: e.target.checked, endDate: "" })}
                        className="size-4 rounded border-border"
                      />
                      Poste actuel
                    </label>
                  </div>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(i, { ...exp, description: e.target.value })}
                    rows={2}
                    className="input-field resize-none"
                    placeholder="Description (facultatif)"
                  />
                  <button
                    type="button"
                    onClick={() => removeExperience(i)}
                    className="justify-self-start rounded-full border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
                  >
                    ✕ Supprimer
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addExperience}
              className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              + Ajouter une expérience
            </button>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold">Langues</h3>
            <div className="mt-4 grid gap-3">
              {cvData.languages.map((lang, i) => (
                <div key={lang.id} className="flex flex-wrap items-center gap-2">
                  <input
                    value={lang.name}
                    onChange={(e) => updateLanguage(i, { ...lang, name: e.target.value })}
                    className="input-field flex-1"
                    placeholder="Ex. Français"
                  />
                  <select
                    value={lang.level}
                    onChange={(e) => updateLanguage(i, { ...lang, level: e.target.value })}
                    className="input-field w-auto"
                  >
                    {LANGUAGE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level || "Niveau (optionnel)"}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeLanguage(i)}
                    aria-label="Supprimer cette langue"
                    className="rounded-full border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addLanguage}
              className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              + Ajouter une langue
            </button>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold">Certifications</h3>
            <div className="mt-4 grid gap-3">
              {cvData.certifications.map((cert, i) => (
                <div key={cert.id} className="grid gap-2 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-center">
                  <input
                    value={cert.name}
                    onChange={(e) => updateCertification(i, { ...cert, name: e.target.value })}
                    className="input-field"
                    placeholder="Nom de la certification"
                  />
                  <input
                    value={cert.issuer}
                    onChange={(e) => updateCertification(i, { ...cert, issuer: e.target.value })}
                    className="input-field"
                    placeholder="Organisme (optionnel)"
                  />
                  <input
                    value={cert.date}
                    onChange={(e) => updateCertification(i, { ...cert, date: e.target.value })}
                    className="input-field"
                    placeholder="Date (optionnel)"
                  />
                  <button
                    type="button"
                    onClick={() => removeCertification(i)}
                    aria-label="Supprimer cette certification"
                    className="rounded-full border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addCertification}
              className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              + Ajouter une certification
            </button>
          </Card>
        </div>

        <div className="grid gap-4 self-start lg:sticky lg:top-20">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={save}
              disabled={status === "pending"}
              className="rounded-full border border-border px-6 py-3 text-base font-semibold transition-colors hover:bg-secondary disabled:opacity-60"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={downloading}
              className="flex-1 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {downloading ? "Génération du PDF…" : "📄 Télécharger en PDF"}
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Vos modifications sont aussi enregistrées automatiquement.
          </p>
          <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
            <div className="max-h-[80vh] overflow-auto bg-neutral-100 p-4">
              <div ref={previewRef}>
                <TemplateComponent cv={cvForPreview} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
