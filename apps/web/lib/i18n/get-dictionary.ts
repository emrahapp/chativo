import { defaultLocale, type Locale } from "./config";
import tr from "@/messages/tr.json";
import en from "@/messages/en.json";

const dictionaries = { tr, en } as const;

export type Dictionary = typeof tr;

export function getDictionary(locale?: string | null): Dictionary {
  const l = (locale === "en" ? "en" : "tr") as Locale;
  return dictionaries[l] ?? dictionaries[defaultLocale];
}
