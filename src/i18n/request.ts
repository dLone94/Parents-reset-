import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { loadMessages } from "./messages";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
    timeZone: "UTC",
    onError(error) {
      // Missing translations are recoverable: we fall back to English (see
      // loadMessages) and log clearly in development so they get fixed.
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[i18n] ${error.code}: ${error.message}`);
      }
    },
    getMessageFallback({ namespace, key }) {
      // Never crash: render the key path so it is visible during review.
      return [namespace, key].filter(Boolean).join(".");
    },
  };
});
