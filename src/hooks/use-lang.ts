import { useEffect, useState } from "react";

import type { Lang } from "@/lib/copy";

const STORAGE_KEY = "aron-mod:lang";

function readStoredLang(): Lang | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "it" || value === "en" ? value : null;
  } catch {
    return null;
  }
}

function detectBrowserLang(): Lang {
  try {
    const candidate = navigator.languages?.[0] ?? navigator.language ?? "";
    return candidate.toLowerCase().startsWith("it") ? "it" : "en";
  } catch {
    return "en";
  }
}

/**
 * Language state: manual choice (localStorage) wins, otherwise the browser language.
 * SSR-safe: navigator/localStorage are only touched after hydration.
 */
export function useLang(defaultLang: Lang = "it") {
  const [lang, setLangState] = useState<Lang>(defaultLang);

  useEffect(() => {
    const resolved = readStoredLang() ?? detectBrowserLang();
    setLangState(resolved);
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage unavailable: keep in-memory choice only */
    }
  };

  return [lang, setLang] as const;
}
