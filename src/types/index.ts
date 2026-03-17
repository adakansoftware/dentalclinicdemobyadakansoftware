export type Lang = "tr" | "en";

export interface SiteSettings {
  clinicName: string;
  clinicNameEn: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  addressEn: string;
  mapEmbedUrl: string;
  instagram: string;
  facebook: string;
  twitter: string;
  heroTitleTr: string;
  heroTitleEn: string;
  heroSubtitleTr: string;
  heroSubtitleEn: string;
  aboutTitleTr: string;
  aboutTitleEn: string;
  aboutTextTr: string;
  aboutTextEn: string;
  seoTitleTr: string;
  seoTitleEn: string;
  seoDescTr: string;
  seoDescEn: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
}

export interface ServiceData {
  id: string;
  slug: string;
  nameTr: string;
  nameEn: string;
  shortDescTr: string;
  shortDescEn: string;
  descriptionTr: string;
  descriptionEn: string;
  iconName: string;
  durationMinutes: number;
  order: number;
  isActive: boolean;
}

export interface SpecialistData {
  id: string;
  slug: string;
  nameTr: string;
  nameEn: string;
  titleTr: string;
  titleEn: string;
  biographyTr: string;
  biographyEn: string;
  photoUrl: string;
  order: number;
  isActive: boolean;
  services?: ServiceData[];
}

export interface WorkingHourData {
  id: string;
  specialistId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  isOpen: boolean;
}

export interface BlockedSlotData {
  id: string;
  specialistId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface AppointmentData {
  id: string;
  serviceId: string;
  specialistId: string;
  date: string;
  startTime: string;
  endTime: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientNote: string;
  patientLanguage: "TR" | "EN";
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  adminNote: string;
  smsSent: boolean;
  createdAt: string;
  service?: ServiceData;
  specialist?: SpecialistData;
}

export interface ReviewData {
  id: string;
  patientName: string;
  ratingStars: number;
  contentTr: string;
  contentEn: string;
  isApproved: boolean;
  isVisible: boolean;
  createdAt: string;
}

export interface FAQData {
  id: string;
  questionTr: string;
  questionEn: string;
  answerTr: string;
  answerEn: string;
  order: number;
  isActive: boolean;
}

export interface ContactRequestData {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

// ActionResult - always a flat object for useActionState compatibility
export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
  message?: string;
}
