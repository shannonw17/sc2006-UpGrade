// app/(backend)/ProfileController/createProfile.ts
"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { validateEmail } from "../AccountController/validateEmail";
import { sendVerificationCode } from "../AccountController/verifyEmail";
import bcrypt from "bcryptjs";
import { validatePassword } from "../AccountController/helper";
import { EducationLevel, Gender, YearOfStudy } from "@prisma/client";

const yearOptions: Record<EducationLevel, YearOfStudy[]> = {
  SEC: ["S1", "S2", "S3", "S4"],
  JC: ["J1", "J2"],
  POLY: ["P1", "P2", "P3"],
  UNI: ["U1", "U2", "U3", "U4"],
};

export async function createProfile(formData: FormData) {
  try {
    const username = String(formData.get("username") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");
    const eduLevel = String(formData.get("eduLevel") || "");
    const yearOfStudy = String(formData.get("yearOfStudy") || "");
    const gender = String(formData.get("gender") || "");
    const preferredTimingArray = formData.getAll("preferredTiming") as string[];
    const preferredTiming = preferredTimingArray.join(",");
    const preferredLocations = String(formData.get("preferredLocations") || "").trim();
    const currentCourse = String(formData.get("currentCourse") || "").trim();
    const school = String(formData.get("school") || "").trim();
    const relevantSubjects = formData.get("relevantSubjects") ? String(formData.get("relevantSubjects")).trim() : null;
    const academicGrades = formData.get("academicGrades") ? String(formData.get("academicGrades")).trim() : null;
    const usualStudyPeriod = formData.get("usualStudyPeriod") ? String(formData.get("usualStudyPeriod")).trim() : null;

    // Required field validation
    if (!username || !email || !password || !currentCourse || !school) {
      return { success: false, message: "Please fill in all required fields" };
    }

    if (!validateEmail(email)) {
      return { success: false, message: "Invalid email. Must be a school email ending with .edu.sg" };
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.success) return { success: false, message: pwCheck.message || "Invalid password" };
    if (password !== confirmPassword) return { success: false, message: "Passwords do not match" };

    if (!Object.values(EducationLevel).includes(eduLevel as EducationLevel)) return { success: false, message: "Invalid education level" };
    if (!yearOptions[eduLevel as EducationLevel].includes(yearOfStudy as YearOfStudy)) return { success: false, message: "Year of study mismatch" };
    if (!Object.values(Gender).includes(gender as Gender)) return { success: false, message: "Invalid gender" };
    if (preferredTimingArray.length === 0) return { success: false, message: "Select at least one preferred timing" };

    const normLocations = preferredLocations.split(",").map(loc => loc.trim().replace(/\b\w/g, c => c.toUpperCase())).filter(Boolean);
    if (normLocations.length === 0) return { success: false, message: "Enter at least one preferred location" };
    const formattedLocations = normLocations.join(", ");

    const existingUser = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
    if (existingUser) return { success: false, message: "Username or email already exists" };

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username, email, passwordHash, eduLevel: eduLevel as EducationLevel,
        yearOfStudy: yearOfStudy as YearOfStudy, gender: gender as Gender,
        preferredTiming, preferredLocations: formattedLocations,
        currentCourse, relevantSubjects, school, academicGrades, usualStudyPeriod,
        status: "INACTIVE",
      },
    });

    try {
      await sendVerificationCode(newUser.id);
    } catch (err) {
      console.error("Email sending failed:", err);
      return { success: false, message: "Account created but failed to send verification email." };
    }

    revalidatePath("/login");
    return { success: true, userId: newUser.id, message: "Account created! Verification code sent to your email." };
  } catch (err: any) {
    console.error("Registration error:", err);
    return { success: false, message: err.message || "Registration failed" };
  }
}
