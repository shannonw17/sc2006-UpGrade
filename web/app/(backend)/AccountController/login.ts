// app/(backend)/AccountController/login.ts
"use server";

import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    const raw = String(formData.get("identifier") || "").trim();
    const password = String(formData.get("password") || "");
    if (!raw || !password) return { error: "Please fill in both fields." };

    // normalize to lowercase for SQLite (no case-insensitive mode)
    const identifier = raw.toLowerCase();

    // if you like, branch by email-ish vs username:
    const looksLikeEmail = identifier.includes("@");
    const user = await prisma.user.findFirst({
      where: looksLikeEmail
        ? { email: identifier }
        : { name: identifier },
    });

    if (!user) return { error: "Invalid username/email or password." };

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return { error: "Invalid username/email or password." };

    await createSessionCookie({ userId: user.id, name: user.name });
    
  } catch (e) {
    console.error(e);
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/testHomepage");

}
