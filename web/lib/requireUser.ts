// lib/requireUser.ts
import { readSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await readSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, email: true, eduLevel: true },
  });

  if (!user) redirect("/login"); // stale session
  return user;
}
