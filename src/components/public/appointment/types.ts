import type { ServiceData } from "@/types";

export interface SpecialistItem {
  id: string;
  nameTr: string;
  nameEn: string;
  titleTr: string;
  titleEn: string;
  photoUrl: string;
  specialistServices: { serviceId: string }[];
}

export interface SummaryRow {
  label: string;
  value: string;
}

export interface StepServiceProps {
  lang: "tr" | "en";
  services: ServiceData[];
  selectedServiceId?: string;
  onSelect: (service: ServiceData) => void;
}
