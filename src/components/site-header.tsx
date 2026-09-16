import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { logoutFn, type CurrentUser } from "@/server/functions";

const publicLinks = [
  { to: "/", key: "nav.home" },
  { to: "/parcours", key: "nav.journey" },
  { to: "/recherche", key: "nav.search" },
] as const;

export function SiteHeader({ user }: { user: CurrentUser | null }) {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const dashboardLink = user ? (`/${user.role}` as const) : null;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logoutFn();
      await router.invalidate();
      router.navigate({ to: "/" });
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-hero-gradient font-display text-lg font-bold text-primary-foreground">
            S
          </span>
          <span className="font-display text-lg font-bold tracking-tight">SKILLIA</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {publicLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
            >
              {t(l.key)}
            </Link>
          ))}
          {dashboardLink && (
            <Link
              to={dashboardLink}
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
            >
              {t("nav.dashboard")}
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <div className="hidden rounded-full border border-border p-0.5 sm:flex">
            {(["fr", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
                  lang === l
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-sm font-medium text-muted-foreground">
                {t("nav.greeting")} {user.name.split(" ")[0]}
              </span>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary disabled:opacity-60"
              >
                {t("nav.logout")}
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/connexion"
                className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
              >
                {t("nav.login")}
              </Link>
              <Link
                to="/inscription"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                {t("nav.signup")}
              </Link>
            </div>
          )}

          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-xl border border-border md:hidden"
          >
            <span className="text-base">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="grid gap-1 border-t border-border px-4 pb-4 pt-2 md:hidden">
          {publicLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
              className="rounded-xl px-3 py-3 text-base font-medium text-muted-foreground"
            >
              {t(l.key)}
            </Link>
          ))}
          {dashboardLink && (
            <Link
              to={dashboardLink}
              onClick={() => setOpen(false)}
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
              className="rounded-xl px-3 py-3 text-base font-medium text-muted-foreground"
            >
              {t("nav.dashboard")}
            </Link>
          )}
          <div className="mt-2 flex items-center gap-1 rounded-full border border-border p-0.5 sm:hidden">
            {(["fr", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 rounded-full px-2.5 py-1.5 text-xs font-semibold uppercase transition-colors ${
                  lang === l
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          {user ? (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-2 rounded-xl border border-border px-3 py-3 text-base font-semibold disabled:opacity-60"
            >
              {t("nav.logout")}
            </button>
          ) : (
            <div className="mt-2 grid gap-2">
              <Link
                to="/connexion"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-border px-3 py-3 text-center text-base font-semibold"
              >
                {t("nav.login")}
              </Link>
              <Link
                to="/inscription"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-primary px-3 py-3 text-center text-base font-semibold text-primary-foreground"
              >
                {t("nav.signup")}
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
