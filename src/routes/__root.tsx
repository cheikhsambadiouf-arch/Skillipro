/// <reference types="vite/client" />
import type { ReactNode } from "react";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";

// ⚠️ Chemins supposés — ajuste-les à l'emplacement réel de ces fichiers dans ton projet.
// D'après les fichiers que tu m'as envoyés, je n'ai pas leur chemin d'origine exact.
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { I18nProvider } from "@/lib/i18n";
import { getCurrentUserFn } from "@/server/functions";
import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    return { user };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SKILLIA — Transformer chaque compétence en opportunité" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { user } = Route.useRouteContext();

  return (
    <RootDocument>
      <I18nProvider>
        <SiteHeader user={user} />
        <main className="min-h-screen">
          <Outlet />
        </main>
        <SiteFooter />
      </I18nProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
