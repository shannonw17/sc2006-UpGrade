// app/(backend)/AccountController/login.ts
"use server";

import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import {
  createSessionCookie,   // user cookie: "session"
  createAdminSession,    // admin cookie: "admin_session"
} from "@/lib/auth";

export type LoginState = { error?: string };

function normalizeIdForSqlite(s: string) {
  return s.toLowerCase();
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const raw = String(formData.get("identifier") || "").trim();
  const password = String(formData.get("password") || "");
  const as = String(formData.get("as") || "user") === "admin" ? "admin" : "user";

  if (!raw || !password) {
    return { error: "Please fill in both fields." };
  }

  const identifier = normalizeIdForSqlite(raw);
  const looksLikeEmail = identifier.includes("@");

  if (as === "admin") {
    // --- ADMIN LOGIN ---
    const admin = looksLikeEmail
      ? await prisma.admin.findUnique({ where: { email: identifier } })
      : await prisma.admin.findUnique({ where: { username: identifier } });

    if (!admin) return { error: "Invalid admin credentials." };

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return { error: "Invalid admin credentials." };

    await createAdminSession({ adminId: admin.id, username: admin.username });
    redirect("/homepage"); // let it throw; do NOT wrap in try/catch
  } else {
    // --- USER LOGIN ---
    const user = looksLikeEmail
      ? await prisma.user.findUnique({ where: { email: identifier } })
      : await prisma.user.findUnique({ where: { username: identifier } });

    if (!user) return { error: "Invalid username/email or password." };

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return { error: "Invalid username/email or password." };

    await createSessionCookie({ userId: user.id, name: user.username });
    redirect("/homepage"); // let it throw; do NOT wrap in try/catch
  }

  // Unreachable, but satisfies return type
  return {};
}
