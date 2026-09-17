import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Card, Section, SectionTitle } from "@/components/ui-bits";
import {
  ClassicCardBack,
  ClassicCardFront,
  ModernCardBack,
  ModernCardFront,
  type CardBackData,
  type CardFrontData,
} from "@/components/card-templates";
import {
  getTalentCardFn,
  updateTalentCardFn,
  type CardKind,
  type CardTemplate,
  type TalentCardInput,
} from "@/server/talent-card";

const MAX_LOGO_FILE_BYTES = 1.5 * 1024 * 1024;
const SAVE_DEBOUNCE_MS = 1200;
const CARD_MM_WIDTH = 85;
const CARD_MM_HEIGHT = 55;

const TEMPLATES: { id: CardTemplate; label: string; desc: string }[] = [
  { id: "classique", label: "Classique", desc: "Fond blanc, liseré de couleur" },
  { id: "moderne", label: "Moderne", desc: "Fond de couleur, look plus affirmé" },
];

export const Route = createFileRoute("/talent-carte")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: "/connexion", search: { redirect: location.href } });
    }
    if (context.user.role !== "talent") {
      throw redirect({ to: `/${context.user.role}` });
    }
  },
  loader: () => getTalentCardFn(),
  head: () => ({
    meta: [{ title: "Carte de visite — SKILLIA" }],
  }),
  component: TalentCartePage,
});

type SaveStatus = "idle" | "pending" | "saved" | "error";

function TalentCartePage() {
  const initial = Route.useLoaderData();
  const [card, setCard] = useState<TalentCardInput>({
    kind: initial.kind,
    companyName: initial.companyName,
    companyLogoDataUrl: initial.companyLogoDataUrl,
    address: initial.address,
    template: initial.template,
  });
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [downloading, setDownloading] = useState(false);

  const isFirstRender = useRef(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCard = useRef(card);
  latestCard.current = card;

  useEffect(() => {
    let cancelled = false;
    const profileUrl = `${window.location.origin}/profil/${initial.id}`;
    import("qrcode").then(async (QRCode) => {
      const url = await QRCode.toDataURL(profileUrl, { width: 240, margin: 1 });
      if (!cancelled) setQrCodeDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id]);

  async function save() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setStatus("pending");
    setErrorMessage(null);
    try {
      const saved = await updateTalentCardFn({ data: latestCard.current });
      setCard(saved);
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
  }, [card]);

  function update<K extends keyof TalentCardInput>(key: K, value: TalentCardInput[K]) {
    setCard((c) => ({ ...c, [key]: value }));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogoError(null);
    if (!file.type.startsWith("image/")) {
      setLogoError("Le fichier doit être une image.");
      return;
    }
    if (file.size > MAX_LOGO_FILE_BYTES) {
      setLogoError("Logo trop lourd (1.5 Mo maximum).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("companyLogoDataUrl", String(reader.result));
    reader.readAsDataURL(file);
  }

  const frontData: CardFrontData = {
    name: initial.name,
    jobTitle: initial.jobTitle,
    kind: card.kind,
    companyName: card.companyName,
    companyLogoDataUrl: card.companyLogoDataUrl,
    phone: initial.phone,
    address: card.address,
  };
  const backData: CardBackData = { qrCodeDataUrl: qrCodeDataUrl };
  const FrontComponent = card.template === "moderne" ? ModernCardFront : ClassicCardFront;
  const BackComponent = card.template === "moderne" ? ModernCardBack : ClassicCardBack;

  async function downloadPdf() {
    setDownloading(true);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-99999px";
    iframe.style.top = "0";
    iframe.style.border = "0";
    iframe.style.width = "400px";
    iframe.style.height = "300px";
    document.body.appendChild(iframe);

    try {
      const frontHtml = renderToStaticMarkup(<FrontComponent data={frontData} />);
      const backHtml = renderToStaticMarkup(<BackComponent data={backData} />);

      const doc = iframe.contentDocument;
      if (!doc) throw new Error("Impossible de préparer le PDF.");
      doc.open();
      doc.write(
        `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body style="margin:0">` +
          `<div id="front">${frontHtml}</div><div id="back">${backHtml}</div></body></html>`,
      );
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

      const frontEl = doc.getElementById("front")?.firstElementChild as HTMLElement | null;
      const backEl = doc.getElementById("back")?.firstElementChild as HTMLElement | null;
      if (!frontEl || !backEl) throw new Error("Impossible de préparer le PDF.");

      const [{ default: html2canvas }, { default: JsPdf }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const pdf = new JsPdf({ orientation: "landscape", unit: "mm", format: [CARD_MM_WIDTH, CARD_MM_HEIGHT] });

      const frontCanvas = await html2canvas(frontEl, { scale: 4, useCORS: true, backgroundColor: "#ffffff" });
      pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", 0, 0, CARD_MM_WIDTH, CARD_MM_HEIGHT);

      pdf.addPage([CARD_MM_WIDTH, CARD_MM_HEIGHT], "landscape");
      const backCanvas = await html2canvas(backEl, { scale: 4, useCORS: true, backgroundColor: "#ffffff" });
      pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", 0, 0, CARD_MM_WIDTH, CARD_MM_HEIGHT);

      const name = initial.name.trim().replace(/\s+/g, "-") || "SKILLIA";
      pdf.save(`Carte-de-visite-${name}.pdf`);
    } finally {
      document.body.removeChild(iframe);
      setDownloading(false);
    }
  }

  const statusLabel: Record<SaveStatus, string> = {
    idle: "",
    pending: "Enregistrement…",
    saved: "✓ Enregistré",
    error: "✕ Échec de l'enregistrement",
  };

  return (
    <Section className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          eyebrow="SKILLIA Talent"
          title="Carte de visite"
          desc="Générée depuis votre profil, au format standard 85 × 55 mm."
        />
        <span
          className={`text-sm font-semibold ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
        >
          {statusLabel[status]}
        </span>
      </div>

      {errorMessage && (
        <p className="mb-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-6">
          <Card>
            <h3 className="text-lg font-semibold">Type de profil</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => update("kind", "freelance" as CardKind)}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  card.kind === "freelance" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
              >
                <p className="text-sm font-semibold">Je suis freelance / indépendant</p>
                <p className="mt-1 text-xs text-muted-foreground">Nom, statut, téléphone, adresse</p>
              </button>
              <button
                type="button"
                onClick={() => update("kind", "entreprise" as CardKind)}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  card.kind === "entreprise" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
              >
                <p className="text-sm font-semibold">Je représente une entreprise</p>
                <p className="mt-1 text-xs text-muted-foreground">Nom, statut, logo et nom d'entreprise</p>
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {card.kind === "freelance" ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Téléphone (issu de votre profil) : {initial.phone || "non renseigné — à ajouter dans le tableau de bord"}
                  </p>
                  <Field label="Adresse">
                    <input
                      value={card.address}
                      onChange={(e) => update("address", e.target.value)}
                      className="input-field"
                      placeholder="Ex. Sacré-Cœur 3, Dakar"
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Nom de l'entreprise">
                    <input
                      value={card.companyName}
                      onChange={(e) => update("companyName", e.target.value)}
                      className="input-field"
                      placeholder="Ex. SKILLIA SARL"
                    />
                  </Field>
                  <div>
                    <label className="inline-block cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary">
                      {card.companyLogoDataUrl ? "Changer le logo" : "Choisir un logo"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </label>
                    {logoError && <p className="mt-2 text-sm text-destructive">{logoError}</p>}
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold">Modèle</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => update("template", tpl.id)}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                    card.template === tpl.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="text-sm font-semibold">{tpl.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{tpl.desc}</p>
                </button>
              ))}
            </div>
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
              onClick={downloadPdf}
              disabled={downloading || !qrCodeDataUrl}
              className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {downloading ? "Génération du PDF…" : "📄 Télécharger en PDF"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 self-start lg:sticky lg:top-20">
          <p className="text-sm font-semibold text-muted-foreground">Aperçu (recto / verso)</p>
          <div className="grid gap-6 rounded-2xl border border-border bg-neutral-100 p-6 shadow-soft">
            <div className="mx-auto" style={{ zoom: 2 } as React.CSSProperties}>
              <FrontComponent data={frontData} />
            </div>
            <div className="mx-auto" style={{ zoom: 2 } as React.CSSProperties}>
              <BackComponent data={backData} />
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
