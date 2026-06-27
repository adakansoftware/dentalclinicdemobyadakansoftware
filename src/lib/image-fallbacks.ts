import { getServiceImage } from "@/lib/service-images";

const specialistImageMap: Record<string, string> = {
  "dr-ayse-kaya": "/images/specialists/doctor-ayse.jpg",
  "dr-mehmet-yilmaz": "/images/specialists/doctor-mehmet.jpg",
  "dr-fatma-demir": "/images/specialists/doctor-fatma.jpg",
};

function isBrokenDeploymentUpload(value?: string | null) {
  return Boolean(value?.startsWith("/uploads/"));
}

export function resolveServiceImageUrl(slug: string, imageUrl?: string | null) {
  if (!imageUrl || isBrokenDeploymentUpload(imageUrl)) {
    return getServiceImage(slug);
  }

  return imageUrl;
}

export function resolveSpecialistPhotoUrl(slug: string, photoUrl?: string | null) {
  if (!photoUrl || isBrokenDeploymentUpload(photoUrl)) {
    return specialistImageMap[slug] ?? "";
  }

  return photoUrl;
}
