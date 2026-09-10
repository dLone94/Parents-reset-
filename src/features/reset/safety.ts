/**
 * Very small, conservative safety check.
 *
 * Purpose: if free text suggests immediate self-harm or danger, the interface
 * shows a safety pathway (local emergency services, a trusted person, crisis
 * support). This is not a diagnosis and the check must not over-medicalise
 * ordinary stress like "I'm exhausted" or "I can't cope with the laundry".
 *
 * Phrase lists are intentionally short and phrase-based (not single words).
 * They are a V1 baseline and should be reviewed by native speakers; a future
 * version can move this behind a moderation service.
 */
const PHRASES: string[] = [
  // English
  "kill myself",
  "end my life",
  "want to die",
  "don't want to be alive",
  "dont want to be alive",
  "hurt myself",
  "suicid",
  // German
  "umbringen",
  "nicht mehr leben",
  "mich verletzen",
  "selbstmord",
  "suizid",
  // Romanian
  "să mă omor",
  "sa ma omor",
  "nu mai vreau să trăiesc",
  "nu mai vreau sa traiesc",
  "sinucid",
  // French
  "me suicider",
  "me tuer",
  "envie de mourir",
  "plus envie de vivre",
  // Spanish
  "suicidarme",
  "matarme",
  "quiero morir",
  "no quiero vivir",
  // Italian
  "suicidarmi",
  "uccidermi",
  "voglio morire",
  // Portuguese
  "me matar",
  "suicidar",
  "quero morrer",
  // Dutch
  "zelfmoord",
  "mezelf pijn doen",
  "wil niet meer leven",
  // Polish
  "samobójstw",
  "zabić się",
  "nie chcę żyć",
  // Chinese
  "自杀",
  "不想活",
  "想死",
  // Japanese
  "自殺",
  "死にたい",
  "消えたい",
];

const DANGER_PHRASES: string[] = [
  "in danger",
  "not safe at home",
  "he hits me",
  "she hits me",
  "in gefahr",
  "en danger",
  "en peligro",
  "in pericolo",
  "em perigo",
  "în pericol",
];

export function detectSafetyConcern(...texts: Array<string | undefined>): boolean {
  const haystack = texts
    .filter((t): t is string => typeof t === "string" && t.length > 0)
    .join("\n")
    .toLocaleLowerCase()
    .normalize("NFC");
  if (!haystack) return false;
  return [...PHRASES, ...DANGER_PHRASES].some((phrase) => haystack.includes(phrase));
}
