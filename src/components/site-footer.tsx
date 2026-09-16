import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-base font-semibold text-foreground">SKILLIA</p>
        <p>{t("footer.rights")}</p>
        <p>{t("footer.pilot")}</p>
      </div>
    </footer>
  );
}
