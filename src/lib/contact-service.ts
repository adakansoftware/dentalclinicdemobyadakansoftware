import { prisma } from "@/lib/prisma";
import { BackendError } from "@/lib/backend-errors";

export interface CreateContactRequestRecordInput {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

export async function createContactRequestRecord(input: CreateContactRequestRecordInput) {
  return prisma.contactRequest.create({ data: input });
}

export async function markContactRequestReadRecord(id: string) {
  const existing = await prisma.contactRequest.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new BackendError("CONTACT_REQUEST_NOT_FOUND", "Contact request not found", {
      contactRequestId: id,
    });
  }

  if (existing.isRead) {
    return existing;
  }

  return prisma.contactRequest.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function deleteContactRequestRecord(id: string) {
  const existing = await prisma.contactRequest.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new BackendError("CONTACT_REQUEST_NOT_FOUND", "Contact request not found", {
      contactRequestId: id,
    });
  }

  await prisma.contactRequest.delete({
    where: { id },
  });

  return existing;
}
