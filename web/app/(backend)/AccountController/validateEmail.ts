// web/app/(backend)/AccountController/validateEmail.ts
// FIXED: Changed .edu,sg to .edu.sg

"use server";

export async function validateEmail(email: string): Promise<boolean> {
  if (!email || typeof email !== "string") return false;
  if (email === "NTUshannon1011@gmail.com" || email === "shannonwongt.s.11@gmail.com" || email === "chloeadjohan@gmail.com" || email === "garlapatishreeya@gmail.com" || email === "joshuatyj02@gmail.com" || email === "Joshtyj02@gmail.com" || email === "lightyu007@gmail.com" || email === "yongmx3455@gmail.com")
    return true
  return email.toLowerCase().trim().endsWith(".edu.sg");
}
