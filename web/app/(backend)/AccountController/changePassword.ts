"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { compare, hash } from "bcryptjs";

export async function changePassword(
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
) {
  const user = await requireUser();

  // Check match
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  // Match forgot password rules: min 12 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
  const strongPwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{12,}$/;
  if (!strongPwdRegex.test(newPassword)) {
    return {
      ok: false,
      error:
        "Password must be at least 12 characters long and include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
    };
  }

  // Verify old password
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    return { ok: false, error: "User not found." };
  }

  const valid = await compare(oldPassword, dbUser.passwordHash);
  if (!valid) {
    return { ok: false, error: "Current password is incorrect." };
  }

  const newHash = await hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return { ok: true, message: "Password updated successfully." };
}
