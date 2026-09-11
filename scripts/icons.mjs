// Renders the app icon at the sizes a PWA needs. Run once after changing the mark.
//   CHROMIUM_PATH=/path/to/chromium node scripts/icons.mjs
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const OUT = "public/icons";
mkdirSync(OUT, { recursive: true });
const executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage();

const html = (size, maskable) => `<!doctype html><html><body style="margin:0">
<div style="width:${size}px;height:${size}px;background:#faf6ef;display:flex;align-items:center;justify-content:center;border-radius:${maskable ? 0 : size * 0.22}px">
  <div style="position:relative;width:${size * (maskable ? 0.5 : 0.62)}px;height:${size * (maskable ? 0.5 : 0.62)}px">
    <div style="position:absolute;inset:0;border-radius:50%;background:#f6e5dc"></div>
    <div style="position:absolute;inset:26%;border-radius:50%;background:#c4664a"></div>
  </div>
</div></body></html>`;

for (const [name, size, maskable] of [["icon-192", 192, false], ["icon-512", 512, false], ["icon-512-maskable", 512, true], ["apple-touch-icon", 180, true]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html(size, maskable));
  await page.screenshot({ path: `${OUT}/${name}.png`, omitBackground: !maskable });
  console.log(`saved ${OUT}/${name}.png`);
}
await browser.close();
