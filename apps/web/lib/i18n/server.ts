import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";
import { getDictionary } from "./get-dictionary";

const LOCALE_COOKIE = "chativo-locale";

function isLocale(v: string | undefined): v is Locale {
  return !!v && (locales as readonly string[]).includes(v);
}

export async function detectLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const h = await headers();
  const acceptLanguage = h.get("accept-language") ?? "";
  // Crude detection: if TR appears, default tr; otherwise en.
  if (/\btr\b/i.test(acceptLanguage)) return "tr";
  if (/\ben\b/i.test(acceptLanguage)) return "en";
  return defaultLocale;
}

export async function getServerDictionary() {
  const locale = await detectLocale();
  return { locale, t: getDictionary(locale) };
}

export const LOCALE_COOKIE_NAME = LOCALE_COOKIE;
