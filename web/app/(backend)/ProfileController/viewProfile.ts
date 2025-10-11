// TO IGNORE FOR NOW --> HAVE NO IDEA WHETHER NEED THIS FUNCTION OR CAN DIRECTLY ACCESS DATABASE WHEN VIEWING PROFILE VIA FRONTEND

//display all attributes of user
//note: profile page calls { resetPassword } from "../AccountController/resetPassword"; //see UI Mockup "change password" section

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/requireUser";

export async function viewProfile(){
    const user = await requireUser();
    const userId = user.id;
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
        preferredTiming: currentUser.preferredTiming, //already a astring
        school: currentUser.school,
        currentCourse: currentUser.currentCourse,
        relevantSubjects: currentUser.relevantSubjects,
        academicGrades: currentUser.academicGrades,
        usualStudyPeriod: currentUser.usualStudyPeriod,
        emailReminder: currentUser.emailReminder,
    };
    revalidatePath("/myprofile");
    return profile;
}