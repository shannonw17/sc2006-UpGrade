//view profile of selected user ie. when click "view profile" in homepage
// + only same educational level displayed in homepage

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function viewOtherProfile(formData:FormData){
    const userId = String(formData.get("userId"));
    const currentUser = await prisma.user.findUnique({where: {id: userId}});
    if (!currentUser) throw new Error("User is not found");

    //map enums to strings
    const eduLevelMap: Record<string, string> = {
        SEC: "Secondary",
        JC: "Junior College",
        POLY: "Polytechnic",
        UNI: "University",
    };

    //format gender to string
    const formatGender = (gender: string) =>
        gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();


    //return all attributes
    const profile = {
        email: currentUser.email,
        username: currentUser.username,
        eduLevel: eduLevelMap[currentUser.eduLevel],
        gender: formatGender(currentUser.gender),
        // add "relevant subjects/modules", "preferred study location(s)"
        preferredTiming: currentUser.preferredTiming,
        currentCourse: currentUser.currentCourse,
        relevantSubjects: currentUser.relevantSubjects,
        school: currentUser.school,
        academicGrades: currentUser.academicGrades,
        usualStudyPeriod: currentUser.usualStudyPeriod,
        emailReminder: currentUser.emailReminder,
    };
    revalidatePath("/myprofile");
    return profile;
}