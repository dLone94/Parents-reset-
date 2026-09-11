// Captures screenshots of the landing page, mobile menu, reset flow and result
// page in several locales at mobile (375px) and desktop (1440px) widths.
//
// Usage: start the app first (npm run dev, or npm run build && npm run start):
//   BASE_URL=http://localhost:3000 npm run screenshots
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.OUT_DIR ?? "docs/screenshots";
const executablePath = process.env.CHROMIUM_PATH; // optional override

mkdirSync(OUT, { recursive: true });

const viewports = {
  mobile: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};

// Locales chosen for text-expansion (de, bg, fi, fr) and CJK (zh, ja) checks.
const locales = ["en", "de", "bg", "fr", "fi", "zh", "ja"];
const flowLocales = { mobile: ["en", "de", "bg", "fr", "fi", "zh", "ja"], desktop: ["en", "de", "ja"] };

const en = JSON.parse(readFileSync("messages/en.json", "utf8"));
const messagesFor = (locale) => {
  if (locale === "en") return en;
  const data = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
  return { ...en, ...data, common: { ...en.common, ...data.common }, reset: { ...en.reset, ...data.reset } };
};

const sampleMust = {
  en: "Pay the electricity bill\nPick up the kids at 4\nCall the dentist\nReturn the library books",
  de: "Stromrechnung bezahlen\nKinder um 16 Uhr abholen\nZahnarzt anrufen",
  bg: "Плащане на тока\nВземане на децата в 16 ч\nОбаждане на зъболекаря",
  fr: "Payer la facture d'électricité\nRécupérer les enfants à 16h\nAppeler le dentiste",
  fi: "Maksa sähkölasku\nHae lapset neljältä\nSoita hammaslääkärille",
  zh: "支付电费，下午四点接孩子，给牙医打电话",
  ja: "電気代を払う、四時に子どもを迎えに行く、歯医者に電話する",
};
const sampleOnMind = {
  en: "Feeling behind on everything at work. Birthday party still not planned.",
  de: "Im Job hänge ich überall hinterher. Die Geburtstagsfeier ist noch nicht geplant.",
  bg: "Изоставам с всичко в работата.",
  fr: "Je me sens en retard sur tout au travail.",
  fi: "Tuntuu, että olen jäljessä kaikessa töissä.",
  zh: "感觉工作上什么都落后了。",
  ja: "仕事で何もかも遅れている気がします。",
};

const sampleLoad = {
  en: { kids: ["Buy new shoes", "School payment", "Dentist appointment"], money: ["Electricity bill", "Car insurance"], home: ["Laundry"] },
  de: { kids: ["Neue Schuhe kaufen", "Schulgeld überweisen", "Zahnarzttermin"], money: ["Stromrechnung", "Autoversicherung"], home: ["Wäsche"] },
  bg: { kids: ["Нови обувки", "Училищна такса"], money: ["Сметка за ток"], home: ["Пране"] },
  fr: { kids: ["Nouvelles chaussures", "Paiement de l'école"], money: ["Facture d'électricité"], home: ["Lessive"] },
  fi: { kids: ["Uudet kengät", "Koulumaksu"], money: ["Sähkölasku"], home: ["Pyykit"] },
  zh: { kids: ["买新鞋", "学费"], money: ["电费"], home: ["洗衣服"] },
  ja: { kids: ["新しい靴を買う", "学校の支払い", "歯医者の予約"], money: ["電気代", "自動車保険"], home: ["洗濯"] },
};

async function runLoad(page, locale, prefix) {
  const m = messagesFor(locale);
  const load = { ...en.load, ...(m.load ?? {}) };
  const categories = { ...en.load.categories, ...(m.load?.categories ?? {}) };
  await page.goto(`${BASE_URL}/${locale}/load`, { waitUntil: "networkidle" });
  await shot(page, `${prefix}${locale}-load-empty`);
  const samples = sampleLoad[locale] ?? sampleLoad.en;
  for (const [category, titles] of Object.entries(samples)) {
    await page.getByRole("button", { name: new RegExp(`^${categories[category]}`) }).click();
    for (const title of titles) {
      await page.getByRole("textbox").fill(title);
      await page.getByRole("button", { name: load.add.button, exact: true }).click();
      await page.getByText(title, { exact: true }).waitFor();
    }
  }
  // Show one postponed and one done item in Kids.
  await page.getByRole("button", { name: new RegExp(`^${categories.kids}`) }).click();
  const rows = page.locator("li");
  await rows.nth(0).getByRole("button", { name: load.actions.postpone, exact: true }).click();
  await rows.nth(0).getByRole("button", { name: load.actions.done, exact: true }).click();
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, `${prefix}${locale}-load`, true);
}

const loadLocales = { mobile: ["en", "de", "bg", "fi", "ja"], desktop: ["en", "de", "ja"] };

// Milestone 3 screens. History and the welcome-back hub need saved data, so we
// run a reset first and then visit the pages in the same browser context.
const m3Locales = { mobile: ["en", "de", "ja"], desktop: ["en", "de"] };

async function runMilestone3(context, locale, prefix) {
  const m = messagesFor(locale);
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });

  // Account (signed out or "not switched on" state) and community list.
  await page.goto(`${BASE_URL}/${locale}/account`, { waitUntil: "networkidle" });
  await shot(page, `${prefix}${locale}-account`);
  await page.goto(`${BASE_URL}/${locale}/community`, { waitUntil: "networkidle" });
  await shot(page, `${prefix}${locale}-community`);

  // Run a reset so history and the hub have something to show.
  await runFlow(page, locale, `${prefix}m3-`);
  // Tick one item, then open focus mode.
  const result = { ...en.result, ...(m.result ?? {}), today: { ...en.result.today, ...(m.result?.today ?? {}) } };
  await page.getByRole("button", { name: result.today.markDone }).first().click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: result.today.focus }).click();
  await page.waitForTimeout(300);
  await shot(page, `${prefix}${locale}-focus`);
  await page.keyboard.press("Escape");

  await page.goto(`${BASE_URL}/${locale}/history`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await shot(page, `${prefix}${locale}-history`, true);

  await page.goto(`${BASE_URL}/${locale}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await shot(page, `${prefix}${locale}-home-returning`);
  await page.close();
}

const browser = await chromium.launch(executablePath ? { executablePath } : {});

async function shot(page, name, fullPage = false) {
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path, fullPage });
  console.log(`saved ${path}`);
}

async function runFlow(page, locale, prefix) {
  const m = messagesFor(locale);
  const next = () => page.getByRole("button", { name: m.common.continue, exact: true }).click();

  await page.goto(`${BASE_URL}/${locale}/reset`, { waitUntil: "networkidle" });
  await shot(page, `${prefix}${locale}-reset-1-overwhelm`);
  await page.getByRole("radio", { name: "8", exact: true }).click();
  await next();

  await shot(page, `${prefix}${locale}-reset-2-areas`);
  const chips = page.locator("button[aria-pressed]");
  await chips.nth(0).click();
  await chips.nth(1).click();
  await chips.nth(3).click();
  await next();

  await shot(page, `${prefix}${locale}-reset-3-time`);
  await page.getByRole("radio").nth(1).click();
  await next();

  await shot(page, `${prefix}${locale}-reset-4-money`);
  await page.getByRole("radio").first().click();
  await next();

  await page.getByRole("textbox").fill(sampleMust[locale]);
  await shot(page, `${prefix}${locale}-reset-5-must`);
  await next();

  await page.getByRole("textbox").fill(sampleOnMind[locale]);
  await shot(page, `${prefix}${locale}-reset-6-onmind`);
  await page.getByRole("button", { name: m.reset.submit, exact: true }).click();

  await page.waitForURL(/\/reset\/[^/]+$/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
  await shot(page, `${prefix}${locale}-result`, true);
}

for (const [device, options] of Object.entries(viewports)) {
  for (const locale of locales) {
    const context = await browser.newContext({ ...options, locale });
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: "reduce" });
    const prefix = `${device}-`;

    await page.goto(`${BASE_URL}/${locale}`, { waitUntil: "networkidle" });
    await shot(page, `${prefix}${locale}-landing`, true);

    if (device === "mobile") {
      await page.getByRole("button", { name: messagesFor(locale).common.openMenu }).click();
      await page.waitForTimeout(250);
      await shot(page, `${prefix}${locale}-menu`);
    }

    if (flowLocales[device].includes(locale)) {
      const flowPage = await context.newPage();
      await flowPage.emulateMedia({ reducedMotion: "reduce" });
      await runFlow(flowPage, locale, prefix);
      await flowPage.close();
    }

    if (loadLocales[device].includes(locale)) {
      const loadPage = await context.newPage();
      await loadPage.emulateMedia({ reducedMotion: "reduce" });
      await runLoad(loadPage, locale, prefix);
      await loadPage.close();
    }

    if (m3Locales[device].includes(locale)) {
      await runMilestone3(context, locale, prefix);
    }
    await context.close();
  }
}

await browser.close();
