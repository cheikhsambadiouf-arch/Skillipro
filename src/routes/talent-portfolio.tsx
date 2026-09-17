import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card, Section, SectionTitle } from "@/components/ui-bits";
import {
  getTalentPortfolioFn,
  updatePersonalNotesFn,
  updatePortfolioItemsFn,
  type PersonalNote,
  type PortfolioItem,
  type PortfolioItemType,
} from "@/server/talent-portfolio";

const MAX_PHOTO_FILE_BYTES = 1.5 * 1024 * 1024;
const SAVE_DEBOUNCE_MS = 1200;

export const Route = createFileRoute("/talent-portfolio")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: "/connexion", search: { redirect: location.href } });
    }
    if (context.user.role !== "talent") {
      throw redirect({ to: `/${context.user.role}` });
    }
  },
  loader: () => getTalentPortfolioFn(),
  head: () => ({
    meta: [{ title: "Portfolio & notes — SKILLIA" }],
  }),
  component: TalentPortfolioPage,
});

type SaveStatus = "idle" | "pending" | "saved" | "error";
type Tab = "portfolio" | "notes";

function newId() {
  return crypto.randomUUID();
}

function getVideoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }
  return null;
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

function TalentPortfolioPage() {
  const initial = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>("portfolio");

  return (
    <Section className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          eyebrow="SKILLIA Talent"
          title="Portfolio & notes"
          desc="Deux espaces privés : vos réalisations et vos notes personnelles ne sont jamais visibles sur votre profil public."
        />
      </div>

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("portfolio")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "portfolio" ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary"
          }`}
        >
          Portfolio
        </button>
        <button
          type="button"
          onClick={() => setTab("notes")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "notes" ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary"
          }`}
        >
          Notes
        </button>
      </div>

      {tab === "portfolio" ? (
        <PortfolioTab initialItems={initial.items} />
      ) : (
        <NotesTab initialNotes={initial.notes} />
      )}
    </Section>
  );
}

function PortfolioTab({ initialItems }: { initialItems: PortfolioItem[] }) {
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const isFirstRender = useRef(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestItems = useRef(items);
  latestItems.current = items;

  async function save() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setStatus("pending");
    setErrorMessage(null);
    try {
      const saved = await updatePortfolioItemsFn({ data: { items: latestItems.current } });
      setItems(saved);
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
  }, [items]);

  function updateItem(index: number, next: PortfolioItem) {
    setItems((list) => list.map((it, i) => (i === index ? next : it)));
  }

  function addItem() {
    setItems((list) => [
      ...list,
      { id: newId(), title: "", description: "", type: "photo", photoDataUrl: "", videoUrl: "", date: "" },
    ]);
  }

  function removeItem(index: number) {
    setItems((list) => list.filter((_, i) => i !== index));
  }

  function handlePhotoChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError("Le fichier doit être une image.");
      return;
    }
    if (file.size > MAX_PHOTO_FILE_BYTES) {
      setPhotoError("Image trop lourde (1.5 Mo maximum).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateItem(index, { ...items[index], photoDataUrl: String(reader.result) });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <StatusLabel status={status} />
        <button
          type="button"
          onClick={save}
          disabled={status === "pending"}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
        >
          Enregistrer
        </button>
      </div>

      {errorMessage && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{errorMessage}</p>
      )}
      {photoError && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{photoError}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item, i) => {
          const embedUrl = item.type === "video" ? getVideoEmbedUrl(item.videoUrl) : null;
          return (
            <Card key={item.id}>
              <div className="mb-3 overflow-hidden rounded-xl bg-secondary/40">
                {item.type === "photo" && item.photoDataUrl && (
                  <img src={item.photoDataUrl} alt={item.title} className="aspect-video w-full object-cover" />
                )}
                {item.type === "video" && embedUrl && (
                  <iframe
                    src={embedUrl}
                    title={item.title || "Vidéo"}
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                )}
                {item.type === "video" && item.videoUrl && !embedUrl && (
                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex aspect-video w-full items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    🎬 Voir la vidéo ↗
                  </a>
                )}
                {((item.type === "photo" && !item.photoDataUrl) || (item.type === "video" && !item.videoUrl)) && (
                  <div className="flex aspect-video w-full items-center justify-center text-sm text-muted-foreground">
                    Aucun aperçu
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                <input
                  value={item.title}
                  onChange={(e) => updateItem(i, { ...item, title: e.target.value })}
                  className="input-field"
                  placeholder="Titre"
                />

                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name={`type-${item.id}`}
                      checked={item.type === "photo"}
                      onChange={() => updateItem(i, { ...item, type: "photo" as PortfolioItemType })}
                    />
                    Photo
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name={`type-${item.id}`}
                      checked={item.type === "video"}
                      onChange={() => updateItem(i, { ...item, type: "video" as PortfolioItemType })}
                    />
                    Vidéo (lien)
                  </label>
                </div>

                {item.type === "photo" ? (
                  <label className="inline-block w-fit cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary">
                    {item.photoDataUrl ? "Changer la photo" : "Choisir une photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoChange(i, e)}
                    />
                  </label>
                ) : (
                  <input
                    value={item.videoUrl}
                    onChange={(e) => updateItem(i, { ...item, videoUrl: e.target.value })}
                    className="input-field"
                    placeholder="Lien YouTube, Vimeo, Google Drive…"
                  />
                )}

                <textarea
                  value={item.description}
                  onChange={(e) => updateItem(i, { ...item, description: e.target.value })}
                  rows={2}
                  className="input-field resize-none"
                  placeholder="Description (optionnelle)"
                />

                <input
                  type="date"
                  value={item.date}
                  onChange={(e) => updateItem(i, { ...item, date: e.target.value })}
                  className="input-field"
                />

                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="justify-self-start rounded-full border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
                >
                  ✕ Supprimer
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="justify-self-start rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
      >
        + Ajouter une réalisation
      </button>
    </div>
  );
}

function formatTimestamp(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function NotesTab({ initialNotes }: { initialNotes: PersonalNote[] }) {
  const [notes, setNotes] = useState<PersonalNote[]>(initialNotes);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFirstRender = useRef(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestNotes = useRef(notes);
  latestNotes.current = notes;

  async function save() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setStatus("pending");
    setErrorMessage(null);
    try {
      const saved = await updatePersonalNotesFn({ data: { notes: latestNotes.current } });
      setNotes(saved);
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
  }, [notes]);

  function updateNote(index: number, next: PersonalNote) {
    setNotes((list) => list.map((n, i) => (i === index ? { ...next, updatedAt: new Date().toISOString() } : n)));
  }

  function addNote() {
    const now = new Date().toISOString();
    setNotes((list) => [{ id: newId(), title: "", content: "", createdAt: now, updatedAt: now }, ...list]);
  }

  function removeNote(index: number) {
    setNotes((list) => list.filter((_, i) => i !== index));
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <StatusLabel status={status} />
        <button
          type="button"
          onClick={save}
          disabled={status === "pending"}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
        >
          Enregistrer
        </button>
      </div>

      {errorMessage && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{errorMessage}</p>
      )}

      <button
        type="button"
        onClick={addNote}
        className="justify-self-start rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
      >
        + Ajouter une note
      </button>

      <div className="grid gap-4">
        {notes.map((note, i) => (
          <Card key={note.id}>
            <input
              value={note.title}
              onChange={(e) => updateNote(i, { ...note, title: e.target.value })}
              className="input-field mb-3"
              placeholder="Titre (optionnel)"
            />
            <textarea
              value={note.content}
              onChange={(e) => updateNote(i, { ...note, content: e.target.value })}
              rows={4}
              className="input-field resize-none"
              placeholder="Écrivez librement…"
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {note.createdAt === note.updatedAt
                  ? `Créée le ${formatTimestamp(note.createdAt)}`
                  : `Modifiée le ${formatTimestamp(note.updatedAt)}`}
              </p>
              <button
                type="button"
                onClick={() => removeNote(i)}
                className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
              >
                ✕ Supprimer
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
