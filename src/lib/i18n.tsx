import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dict, type Lang } from "./i18n-dict";

const STORAGE_KEY = "skillia.lang";
const DEFAULT_LANG: Lang = "fr";

function getPath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) =>
        acc != null && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined,
      obj,
    );
}

function readInitialLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "fr" ? stored : DEFAULT_LANG;
}

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  // Le cast générique <T> sert uniquement à typer la valeur de retour côté appelant
  // (ex: t<{k:string;v:string}[]>("company.criteria")) ; la valeur vient telle quelle du dictionnaire.
  t: <T = string>(key: string) => T;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
    }
  }, []);

  const t = useCallback(
    <T,>(key: string): T => {
      const value = getPath(dict[lang], key) ?? getPath(dict[DEFAULT_LANG], key);
      if (value === undefined && import.meta.env?.DEV) {
        // Clé absente du dictionnaire : on le signale au lieu d'afficher un écran vide.
        console.warn(`[i18n] Clé de traduction manquante : "${key}"`);
      }
      return (value ?? key) as T;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n() doit être appelé à l'intérieur d'un <I18nProvider>.");
  }
  return ctx;
}
