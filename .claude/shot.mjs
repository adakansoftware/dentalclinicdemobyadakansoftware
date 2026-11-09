import { chromium } from "playwright";
const browser = await chromium.launch();
const url = process.argv[2];
const views = [[1366, 768, "1366"], [1920, 1080, "1920"], [375, 812, "375"]];
for (const [w, h, name] of views) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(url, { waitUntil: "networkidle" });
  const header = await page.locator("header").screenshot({ path: `C:/Users/adaka/Desktop/aktif projeler/clinicdemobyadakansoftware/.claude/navbar-${name}.png` }).catch(async () => {
    return page.screenshot({ path: `C:/Users/adaka/Desktop/aktif projeler/clinicdemobyadakansoftware/.claude/full-${name}.png`, clip: { x: 0, y: 0, width: w, height: Math.min(h, 400) } });
  });
  await page.close();
  console.log(`done ${name}`);
}
await browser.close();
