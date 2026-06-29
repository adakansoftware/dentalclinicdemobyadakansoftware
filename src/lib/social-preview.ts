export const SOCIAL_IMAGE_PATH = "/images/hero.jpg";
export const TWITTER_IMAGE_PATH = "/images/hero.jpg";
export const SOCIAL_IMAGE_WIDTH = 1344;
export const SOCIAL_IMAGE_HEIGHT = 768;

export function getSocialImageMimeType(path: string) {
  const normalized = path.toLowerCase();

  if (normalized.endsWith(".png")) {
    return "image/png";
  }

  if (normalized.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}
