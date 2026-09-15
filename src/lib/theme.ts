/**
 * Light, dark, and "auto".
 *
 * Auto is not only the system setting: late in the evening the app dims itself
 * even on a phone that never switches to dark mode. That is when this app is
 * used most, and a bright screen at 11pm is the opposite of what it is for.
 */
export const themeChoices = ["light", "dark", "auto"] as const;
export type ThemeChoice = (typeof themeChoices)[number];
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "parent-reset:theme";

/** Local hours from which "auto" goes dark, and at which it comes back. */
export const NIGHT_FROM_HOUR = 20;
export const NIGHT_UNTIL_HOUR = 6;

export function isNightHour(hour: number): boolean {
  return hour >= NIGHT_FROM_HOUR || hour < NIGHT_UNTIL_HOUR;
}

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return typeof value === "string" && (themeChoices as readonly string[]).includes(value);
}

export function resolveTheme(
  choice: ThemeChoice,
  context: { prefersDark: boolean; hour: number },
): ResolvedTheme {
  if (choice === "light") return "light";
  if (choice === "dark") return "dark";
  return context.prefersDark || isNightHour(context.hour) ? "dark" : "light";
}

/**
 * Runs before the first paint so the page never flashes the wrong palette.
 * Built from the constants above so the script cannot drift from the module.
 */
export const themeScript = `(function(){try{var c=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})||"auto";var h=new Date().getHours();var n=h>=${NIGHT_FROM_HOUR}||h<${NIGHT_UNTIL_HOUR};var d=c==="dark"||(c==="auto"&&(n||window.matchMedia("(prefers-color-scheme: dark)").matches));document.documentElement.dataset.theme=d?"dark":"light";}catch(e){}})();`;
