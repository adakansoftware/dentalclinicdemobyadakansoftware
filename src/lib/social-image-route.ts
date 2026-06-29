import { readFile } from "fs/promises";
import path from "path";

let cachedHeroDataUrl: Promise<string> | null = null;

async function readHeroDataUrl() {
  const filePath = path.join(process.cwd(), "public", "images", "hero.jpg");
  const buffer = await readFile(filePath);
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

export function getHeroImageDataUrl() {
  if (!cachedHeroDataUrl) {
    cachedHeroDataUrl = readHeroDataUrl();
  }

  return cachedHeroDataUrl;
}
