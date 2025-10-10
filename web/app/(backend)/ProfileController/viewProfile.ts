// TO IGNORE FOR NOW --> HAVE NO IDEA WHETHER NEED THIS FUNCTION OR CAN DIRECTLY ACCESS DATABASE WHEN VIEWING PROFILE VIA FRONTEND

//display all attributes of user
"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/requireUser";

export async function viewProfile(){
    const user = await requireUser();

    revalidatePath("/myprofile");
}

//if enum EducationalLevel = "UNI" --> display as "University" (?) or can js stay as it is

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, username: true, email: true,
      eduLevel: true, yearOfStudy: true, gender: true,
      preferredTiming: true, preferredLocations: true,
      school: true, academicGrades: true, usualStudyPeriod: true,
      createdAt: true, status: true
    }
  });
  if (!user) throw new Error("User not found");

  return {
    ...user,
    preferredTiming: user.preferredTiming ? user.preferredTiming.split(",") : [],
    preferredLocations: user.preferredLocations ? user.preferredLocations.split(",") : [],
  };
}
