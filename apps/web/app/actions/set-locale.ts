"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales, type Locale } from "@/lib/i18n/config";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/server";

export async function setLocale(locale: Locale) {
  if (!(locales as readonly string[]).includes(locale)) return;
  const c = await cookies();
  c.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
