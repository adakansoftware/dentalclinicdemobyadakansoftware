import { getServiceImage } from "@/lib/service-images";
import { sanitizeAssetReference } from "@/lib/upload-assets";

const specialistImageMap: Record<string, string> = {
  "dr-ayse-kaya": "/images/specialists/doctor-ayse.jpg",
  "dr-mehmet-yilmaz": "/images/specialists/doctor-mehmet.jpg",
  "dr-fatma-demir": "/images/specialists/doctor-fatma.jpg",
};

function isBrokenDeploymentUpload(value?: string | null) {
  return Boolean(value?.startsWith("/uploads/"));
}

export function resolveServiceImageUrl(slug: string, imageUrl?: string | null) {
  const fallback = getServiceImage(slug);

  if (!imageUrl || isBrokenDeploymentUpload(imageUrl)) {
    return fallback;
  }

  return sanitizeAssetReference(imageUrl, fallback);
}

export function resolveSpecialistPhotoUrl(slug: string, photoUrl?: string | null) {
  const fallback = specialistImageMap[slug] ?? "";

  if (!photoUrl || isBrokenDeploymentUpload(photoUrl)) {
    return fallback;
  }

  return sanitizeAssetReference(photoUrl, fallback);
}
