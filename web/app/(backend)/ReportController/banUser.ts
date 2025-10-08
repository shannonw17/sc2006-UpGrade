//differentiate b/w host user vs. reporting user --> email to inform them

import prisma from "@/lib/db";
//import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/emailer";

export async function banUser(userId: string, isHost: boolean){
    //set user status from ACTIVE to BANNED
    const user = await prisma.user.update({ 
        where: { id: userId},
        data: { status: "BANNED"}, 
    });
    
    if (isHost) {
        //send email informing host
        await sendEmail(
            user.email,
            "Banning of account due to inappropriate group conduct",
            `Dear ${user.username},\n\nYour account has been banned for violating community guidelines. You will no longer have access to our website.\n\nRegards,\nUpGrade Admin Team`
        );
    } else {
        //send email informing user
        await sendEmail(
            user.email,
            "Banning of account due to misuse of report group function",
            `Dear ${user.username},\n\nYour account has been banned for violating community guidelines. You will no longer have access to our website.\n\nRegards,\nUpGrade Admin Team`
        );
    }
}