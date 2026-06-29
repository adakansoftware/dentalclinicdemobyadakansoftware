export const SOCIAL_IMAGE_PATH = "/opengraph-image";
export const TWITTER_IMAGE_PATH = "/twitter-image";
export const SOCIAL_IMAGE_WIDTH = 1200;
export const SOCIAL_IMAGE_HEIGHT = 630;

export function getSocialImageMimeType(path: string) {
  const normalized = path.toLowerCase();

  if (normalized.endsWith("/opengraph-image") || normalized.endsWith("/twitter-image")) {
    return "image/png";
  }

  if (normalized.endsWith(".png")) {
    return "image/png";
  }

  if (normalized.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}
