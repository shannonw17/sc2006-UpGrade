//call sendResetCode and validate ResetCode

"use server";

import prisma from "@/lib/db";
import { sendEmail } from "@/lib/emailer";
import bcrypt from "bcryptjs";
import { validatePassword } from "./helper";

export async function sendResetCode(username: string, email: string) {
    const user = await prisma.user.findUnique({ where: {username: username} });
    if (!user) throw new Error("Invalid username");
    const userId = user.id;

    const code = Math.floor(100000 + Math.random()*900000).toString();
    const expiresAt = new Date(Date.now() + 1000*60*60); 
    
    await prisma.verificationToken.upsert({ //update or create new
        where: {userId},
        update: {code, expiresAt, createdAt: new Date() },
        create: {userId, code, expiresAt}, //why is this not working
    });
    await sendEmail(
        email,
        "Verification code to reset password for UpGrade account",
        `Dear ${username},\n\nyour verification code is ${code}. It expires in 1 hour. PLease reply to this email if you did not request to reset your password.\n\nRegards,\nUpGrade Admin Team`
    );
}

//validate code --> allow to change password
//idk whether this works or to split the function
export async function validateResetCode(userId: string, inputCode: string, newPwd: string, cfmPwd: string) {
    const token = await prisma.verificationToken.findUnique({ where: { userId } });
    if (!token) return false;

    if (token.expiresAt < new Date()) {
        await prisma.verificationToken.delete({ where: {userId} }).catch(()=>{});
        return false;
    }
    if (token.code !== inputCode) return false;
    
    await prisma.verificationToken.delete({ where: {userId}});

    //else if reset code is correct --> allow editing of password
    await resetPassword(userId, newPwd, cfmPwd);
}

export async function resetPassword(userId: string, newPwd: string, cfmPwd: string){
    //get new password input from user in frontend
    const pwCheck = validatePassword(newPwd);
    if (!pwCheck.success) {
        throw new Error(pwCheck.message||"Invalid password!");
    }

    if (newPwd !== cfmPwd) {
        throw new Error("Passwords do not match!");
    }

    const passwordHash = await bcrypt.hash(cfmPwd, 10)

    await prisma.user.update({
        where: {id: userId},
        data: {passwordHash},
    });

    return {success: true, message: "Password successfully reset. Please login again."};
}