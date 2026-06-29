import { z } from "zod";

const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeTextInput(value: string) {
  return value
    .normalize("NFKC")
    .replace(CONTROL_CHAR_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeTextareaInput(value: string) {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHAR_PATTERN, "")
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizePhoneInput(value: string) {
  return sanitizeTextInput(value);
}

export function sanitizeEmailInput(value: string) {
  return sanitizeTextInput(value).toLowerCase();
}

export function sanitizeSlugInput(value: string) {
  return sanitizeTextInput(value).toLowerCase();
}

export function sanitizeIdentifierInput(value: string) {
  return sanitizeTextInput(value);
}

export const recordIdSchema = z
  .string()
  .trim()
  .min(1, "ID gerekli")
  .max(191, "Invalid ID")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid ID")
  .transform(sanitizeIdentifierInput);
