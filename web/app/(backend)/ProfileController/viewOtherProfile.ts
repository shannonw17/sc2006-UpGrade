//view profile of selected user ie. when click "view profile" in homepage
// + only same educational level displayed in homepage

// web/app/(backend)/ProfileController/viewOtherProfile.ts
"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function viewOtherProfile(targetUserId: string) {
  try {
    const viewer = await requireUser();

    // Get viewer's education level
    const viewerData = await prisma.user.findUnique({
      where: { id: viewer.id },
      select: { eduLevel: true },
    });

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        email: true,
        eduLevel: true,
        yearOfStudy: true,
        gender: true,
        preferredTiming: true,
        preferredLocations: true,
        currentCourse: true,
        relevantSubjects: true,
        school: true,
        academicGrades: true,
        usualStudyPeriod: true,
      },
    });

    if (!targetUser) {
      throw new Error("User not found");
    }

    // Check: Same education level (per your requirements)
    if (viewerData?.eduLevel !== targetUser.eduLevel) {
      throw new Error("Can only view profiles from same education level");
    }

    // Map enums to readable strings
    const eduLevelMap: Record<string, string> = {
      SEC: "Secondary",
      JC: "Junior College",
      POLY: "Polytechnic",
      UNI: "University",
    };

    const yearMap: Record<string, string> = {
      S1: "Sec 1",
      S2: "Sec 2",
      S3: "Sec 3",
      S4: "Sec 4",
      J1: "Year 1",
      J2: "Year 2",
      P1: "Poly 1",
      P2: "Poly 2",
      P3: "Poly 3",
      U1: "Year 1",
      U2: "Year 2",
      U3: "Year 3",
      U4: "Year 4",
    };

    const genderMap: Record<string, string> = {
      MALE: "Male",
      FEMALE: "Female",
      OTHER: "Other",
    };

    return {
      success: true,
      profile: {
        id: targetUser.id, // ✅ ADDED THIS LINE!
        username: targetUser.username,
        email: targetUser.email,
        eduLevel: eduLevelMap[targetUser.eduLevel] || targetUser.eduLevel,
        yearOfStudy: yearMap[targetUser.yearOfStudy] || targetUser.yearOfStudy,
        gender: genderMap[targetUser.gender] || targetUser.gender,
        preferredTiming: targetUser.preferredTiming,
        preferredLocations: targetUser.preferredLocations,
        currentCourse: targetUser.currentCourse,
        relevantSubjects: targetUser.relevantSubjects,
        school: targetUser.school,
        academicGrades: targetUser.academicGrades,
        usualStudyPeriod: targetUser.usualStudyPeriod,
      },
    };
  } catch (error: any) {
    console.error("View profile error:", error);
    return {
      success: false,
      message: error.message || "Failed to load profile",
    };
  }
}