"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/requireUser";
import { EducationLevel, YearOfStudy } from "@prisma/client";

const yearOptions: Record<EducationLevel, YearOfStudy[]> = {
  SEC: ["S1", "S2", "S3", "S4", "S5"],
  JC: ["J1", "J2"],
  POLY: ["P1", "P2", "P3"],
  UNI: ["U1", "U2", "U3", "U4"],
};

export async function editProfile(formData: {
  yearOfStudy: string;
  preferredTiming: string[];
  preferredLocations: string[];
  currentCourse?: string | null;
  relevantSubjects?: string | null;
  school?: string | null;
  academicGrades?: string | null;
  usualStudyPeriod?: string | null;
  emailReminder: boolean;
}) {
  try {
    const user = await requireUser();
    if (!user) throw new Error("User not authenticated");

    const existing = await prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!existing) throw new Error("User not found");

    // Validate yearOfStudy based on eduLevel
    const eduLevel = existing.eduLevel as EducationLevel;
    if (!yearOptions[eduLevel].includes(formData.yearOfStudy as YearOfStudy)) {
      throw new Error(`Invalid year of study for ${eduLevel}`);
    }

    // Check mandatory fields
    if (
      !formData.yearOfStudy ||
      !formData.preferredTiming ||
      formData.preferredTiming.length === 0 ||
      !formData.preferredLocations ||
      formData.preferredLocations.length === 0 ||
      !formData.currentCourse
    ) {
      throw new Error("Please fill in all mandatory fields!");
    }

    // Clean and normalize data - remove empty strings and trim
    const cleanLocations = formData.preferredLocations
      .map((loc) => loc.trim())
      .filter((loc) => loc.length > 0)
      .map((loc) => loc.replace(/\b\w/g, (c) => c.toUpperCase()));

    const cleanTiming = formData.preferredTiming
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Join without spaces after comma for consistency
    const normLocations = cleanLocations.join(",");
    const normTiming = cleanTiming.join(",");

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: existing.id },
      data: {
        yearOfStudy: formData.yearOfStudy as YearOfStudy,
        preferredTiming: normTiming,
        preferredLocations: normLocations,
        currentCourse: formData.currentCourse,
        relevantSubjects: formData.relevantSubjects || null,
        school: formData.school || null,
        academicGrades: formData.academicGrades || null,
        usualStudyPeriod: formData.usualStudyPeriod || null,
        emailReminder: formData.emailReminder,
      },
    });

    revalidatePath("/myprofile");
    return {
      success: true,
      message: "Profile updated successfully!",
      user: updatedUser,
    };
  } catch (error: any) {
    console.error("Error in editProfile:", error);
    return {
      success: false,
      message: error.message || "Failed to update profile.",
    };
  }
}