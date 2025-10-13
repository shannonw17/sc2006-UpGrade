"use server";

import prisma from "@/lib/db";
import { sendEmail } from "@/lib/emailer";
import bcrypt from "bcryptjs";
import { validatePassword } from "./helper";

/**
 * Step 1: Send reset code to user's email
 */
export async function sendResetCode(username: string, email: string) {
  if (!username || !email) {
    throw new Error("Username and email are required");
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || user.email.toLowerCase() !== email.toLowerCase().trim()) {
    throw new Error("Invalid username or email");
  }

  // Rate limit: max 3 requests in 15 minutes
  const recentTokens = await prisma.verificationToken.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
    },
  });

  if (recentTokens.length >= 3) {
    throw new Error("Too many reset attempts. Please wait 15 minutes.");
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.verificationToken.upsert({
    where: { userId: user.id },
    update: { code, expiresAt, createdAt: new Date() },
    create: { userId: user.id, code, expiresAt },
  });

  // Send reset code
  await sendEmail(
    user.email,
    "Password Reset Code for UpGrade",
    `Dear ${user.username},\n\nYour password reset code is: ${code}\n\nThis code will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nUpGrade Team`
  );

  return { userId: user.id };
}

/**
 * Step 2: Reset password after verifying code
 */
export async function resetPassword(
  userId: string,
  code: string,
  newPassword: string,
  confirmPassword: string
) {
  if (!userId || !code || !newPassword || !confirmPassword) {
    throw new Error("All fields are required");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.success) {
    throw new Error(pwCheck.message || "Invalid password");
  }

  const token = await prisma.verificationToken.findUnique({ where: { userId } });

  if (!token) {
    throw new Error("Invalid or expired reset code");
  }

  if (token.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { userId } });
    throw new Error("Reset code has expired. Please request a new one.");
  }

  if (token.code !== code.trim()) {
    throw new Error("Invalid reset code");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await prisma.verificationToken.delete({ where: { userId } });

  return { success: true };
}
