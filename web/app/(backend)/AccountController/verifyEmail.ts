//call sendVerifyCode and validateVerifyCode
//return boolean true?

"use server";

import prisma from "@/lib/db";
import { sendEmail } from "@/lib/emailer";

export async function sendVerificationCode(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Invalid user id");

    //generate 6 digit code
    const code = Math.floor(100000 + Math.random()*900000).toString();

    const expiresAt = new Date(Date.now() + 1000*60*60); //expire in 1 hr

    await prisma.verificationToken.upsert({
        where: { userId },
        update: { code, expiresAt, createdAt: new Date() },
        create: { userId, code, expiresAt },
    });

    await sendEmail(
        user.email,
        "Verification code for activation of account in UpGrade", 
        `Your verification code is ${code}. It expires in 1 hour.\n\nRegards,\nUpGrade Admin Team`
    );

    return true;
}

export async function verifyCode(userId: string, inputCode: string) {
    const token = await prisma.verificationToken.findUnique({ where: { userId } });
    if (!token) return false;

    if (token.expiresAt < new Date()) { //expired
        await prisma.verificationToken.delete({ where: {userId} }).catch(()=>{});
        return false;
    }
    if (token.code !== inputCode) return false; //wrong

    await prisma.user.update({
        where: {id: userId},
        data: { status: "ACTIVE"},
    });

    await prisma.verificationToken.delete({ where: {userId}});

    return true;
}