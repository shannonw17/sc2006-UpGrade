// web/app/(backend)/AccountController/validateEmail.ts
// FIXED: Changed .edu,sg to .edu.sg

"use server";

export async function validateEmail(email: string): Promise<boolean> {
  if (!email || typeof email !== "string") return false;
  return email.toLowerCase().trim().endsWith(".edu.sg");
}
