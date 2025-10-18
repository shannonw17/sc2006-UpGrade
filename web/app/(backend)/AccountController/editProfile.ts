"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const EditProfileSchema = z.object({
  yearOfStudy: z.string().min(1, "Year of study is required"),
  preferredTiming: z.array(z.string()).min(1, "Select at least one timing"),
  preferredLocations: z.array(z.string()).min(1, "Enter at least one location"),
  currentCourse: z.string().trim().min(1, "Current course is required").nullable(),
  relevantSubjects: z.string().trim().optional().nullable(),
  school: z.string().trim().optional().nullable(),
  academicGrades: z.string().trim().optional().nullable(),
  usualStudyPeriod: z.string().trim().optional().nullable(),
  emailReminder: z.boolean(),
});

export type EditProfileInput = z.infer<typeof EditProfileSchema>;

export async function editProfile(input: EditProfileInput) {
  const user = await requireUser();

  const parsed = EditProfileSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues.map(i => i.message).join("; ");
    return { success: false, message };
  }

  // join arrays as comma-separated strings, matching your current storage
  const preferredTimingStr = parsed.data.preferredTiming.join(", ");
  const preferredLocationsStr = parsed.data.preferredLocations.join(", ");

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        yearOfStudy: parsed.data.yearOfStudy as any,        // enum in Prisma
        preferredTiming: preferredTimingStr,
        preferredLocations: preferredLocationsStr,
        currentCourse: parsed.data.currentCourse ?? null,
        relevantSubjects: parsed.data.relevantSubjects ?? null,
        school: parsed.data.school ?? null,
        academicGrades: parsed.data.academicGrades ?? null,
        usualStudyPeriod: parsed.data.usualStudyPeriod ?? null,
        emailReminder: parsed.data.emailReminder,
      },
    });

    // Ensure profile page shows fresh data after mutation
    revalidatePath("/myprofile");

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message ?? "Failed to update profile" };
  }
}
