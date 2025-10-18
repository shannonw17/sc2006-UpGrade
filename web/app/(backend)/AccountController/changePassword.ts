"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import bcrypt from "bcryptjs";
import { z } from "zod";

const ChangePwSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  const user = await requireUser();

  const parsed = ChangePwSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map(i => i.message).join("; ") };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.passwordHash) {
    return { error: "Account has no password set." };
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash);
  if (!ok) return { error: "Current password is incorrect." };

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return { ok: true };
}
