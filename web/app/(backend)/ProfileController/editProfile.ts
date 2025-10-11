// when click on "edit profile" button in profile page --> can edit all fields (but check that mandatory fields are all filled) --> else prompt error message

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/requireUser";
import { EducationLevel, YearOfStudy } from "@prisma/client";

const yearOptions: Record<EducationLevel, YearOfStudy[]> = {
    SEC: ["S1", "S2", "S3", "S4"],
    JC: ["J1", "J2"],
    POLY: ["P1", "P2", "P3"],
    UNI: ["U1", "U2", "U3", "U4"],
}

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
}){
    const user = await requireUser();
    if (!user) throw new Error("User not authenticateed");
    const existing = await prisma.user.findUnique({where: {id: user.id}});
    if (!existing) throw new Error("User not found");

    //validate yearOfStudy based on eduLevel
    const eduLevel = existing.eduLevel as EducationLevel;
    if (!yearOptions[eduLevel].includes(formData.yearOfStudy as YearOfStudy)) {
        throw new Error(`Invalid year of study for ${eduLevel}`);
    }

    //check if all mandatory fields are filled
    if (!formData.yearOfStudy || !formData.preferredTiming || !formData.preferredLocations) {
        throw new Error("Please fill in all mandatory fields!");
    }

    const normLocations = formData.preferredLocations.map(
        loc => loc.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()))
        .filter(Boolean); //remove empty entries?

    //update user profile (for fields allowed to be edited only)
    const updatedUser = await prisma.user.update({
        where: {id: existing.id},
        data: {
            yearOfStudy: formData.yearOfStudy as YearOfStudy,
            preferredTiming: formData.preferredTiming.join(","),
            preferredLocations: normLocations.join(","),
            currentCourse: formData.currentCourse,
            relevantSubjects: formData.relevantSubjects,
            school: formData.school || null,
            academicGrades: formData.academicGrades || null,
            usualStudyPeriod: formData.usualStudyPeriod || null,
            emailReminder: formData.emailReminder,
        }
    })
    revalidatePath("/myprofile");
    return {sucess: true, message: "Profile updated successfully!", user: updatedUser};
}