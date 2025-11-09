// app/(backend)/AccountController/verifyEmail.ts
"use server";

import prisma from "@/lib/db";
import { sendEmail } from "@/lib/emailer";

export async function sendVerificationCode(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Invalid user id");

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.verificationToken.upsert({
    where: { userId },
    update: { code, expiresAt, createdAt: new Date() },
    create: { userId, code, expiresAt },
  });

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

export type ResendVerificationState = {
  ok?: boolean;
  message?: string;
  presetEmail?: string;
  userId?: string;
};

export async function resendVerificationAction(
  _prev: ResendVerificationState,
  formData: FormData
): Promise<ResendVerificationState> {
  const raw = String(formData.get("email") ?? "").trim().toLowerCase();
  const userId = String(formData.get("userId") ?? "").trim();
  const identifier = String(formData.get("identifier") ?? "").trim();

  let user = null as Awaited<ReturnType<typeof prisma.user.findUnique>>;

  if (raw) user = await prisma.user.findUnique({ where: { email: raw } });
  else if (userId) user = await prisma.user.findUnique({ where: { id: userId } });
  else if (identifier) user = await prisma.user.findFirst({ where: { OR: [ { email: identifier }, { username: identifier } ] } });

  if (!user) return { ok: false, message: "No account found for that email/user." };

  try {
    await sendVerificationCode(user.id);
    console.log("Resent verification code to", user.email);
    return { ok: true, message: "Verification code sent. Please check your inbox.", presetEmail: user.email, userId: user.id };
  } catch (e) {
    return { ok: false, message: (e as Error)?.message || "Failed to send verification email." };
  }
}

export type VerifyCodeState = {
  ok?: boolean;
  message?: string;
};

export async function verifyCodeAction(
  _prev: VerifyCodeState,
  formData: FormData
): Promise<VerifyCodeState> {
  const userId = String(formData.get("userId") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  if (!userId || !code) {
    return { ok: false, message: "Please provide user and 6-digit code." };
  }

  const ok = await verifyCode(userId, code);
  return ok
    ? { ok: true, message: "Account verified." }
    : { ok: false, message: "Invalid or expired code." };
}

export type FindUserByEmailState = {
  ok?: boolean;
  message?: string;
  userId?: string;
  normalizedEmail?: string;
};

export async function findUserByEmailAction(
  _prev: FindUserByEmailState,
  formData: FormData
): Promise<FindUserByEmailState> {
  const raw = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!raw) return { ok: false, message: "Email is required." };

  const user = await prisma.user.findUnique({ where: { email: raw } });
  if (!user) return { ok: false, message: "No account found for that email." };
  
  return { ok: true, userId: user.id, normalizedEmail: user.email };
}
