// lib/requireAdmin.ts
"use server";

import prisma from "@/lib/db";
import { readAdminSession } from "@/lib/auth";

export async function requireAdmin() {
  const session = await readAdminSession();
  if (!session) throw new Error("UNAUTHENTICATED");

  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
    select: { id: true, username: true, email: true },
  });

  if (!admin) throw new Error("FORBIDDEN");

  return admin;
}
