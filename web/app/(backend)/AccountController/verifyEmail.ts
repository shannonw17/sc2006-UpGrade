//call sendVerifyCode and validateVerifyCode
//return boolean true?

// app/(backend)/AccountController/verifyEmail.ts
"use server";

import prisma from "@/lib/db";
import { sendEmail } from "@/lib/emailer";

export async function sendVerificationCode(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Invalid user id");

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiry

  // Save code in DB
  await prisma.verificationToken.upsert({
    where: { userId },
    update: { code, expiresAt, createdAt: new Date() },
    create: { userId, code, expiresAt },
  });

  // Send email
  try {
    await sendEmail(
      user.email,
      "Verification code for UpGrade",
      `Hi ${user.username},\n\nYour verification code is ${code}.\nIt expires in 1 hour.\n\nRegards,\nUpGrade Team`
    );
    console.log("Verification email sent to", user.email, "code:", code);
  } catch (err) {
    console.error("Failed to send verification email:", err);
    throw new Error("Could not send verification email.");
  }

  return true;
}

export async function verifyCode(userId: string, inputCode: string) {
  const token = await prisma.verificationToken.findUnique({ where: { userId } });
  if (!token) return false;

  if (token.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { userId } }).catch(() => {});
    return false;
  }

  if (token.code !== inputCode) return false;

  await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
  await prisma.verificationToken.delete({ where: { userId } });

  return true;
}
