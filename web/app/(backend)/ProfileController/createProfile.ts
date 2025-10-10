//call validateEmail() --> return true, then set status to active

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache"; 
import { validateEmail } from "../AccountController/validateEmail";
import { sendVerificationCode } from "../AccountController/verifyEmail";
import bcrypt from "bcryptjs";
import { validatePassword } from "../AccountController/helper";
import { EducationLevel, Gender, YearOfStudy } from "@prisma/client";

// to note for register page: 
//in frontend user inputs in separate fields username (check if unique, not already in database), email, password (check if meet all requirement), select eduLvl, select year of study, select gender, select preferred timing (can select multiple options of morning, afternoon, evening), 

// also optionally enters school, academicGrades, usualStudyPeriod String? //to store as eg. "16:00-18:00" --> if user dont fill up, save as null

const yearOptions: Record<EducationLevel, YearOfStudy[]> = {
    SEC: ["S1", "S2", "S3", "S4"],
    JC: ["J1", "J2"],
    POLY: ["P1", "P2", "P3"],
    UNI: ["U1", "U2", "U3", "U4"],
}

export async function createProfile(formData: FormData) {
    //compulsory fields
    const username = String(formData.get("username") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const eduLevel = String(formData.get("eduLevel") || "");
    const yearOfStudy = String(formData.get("yearOfStudy") || "");
    const gender = String(formData.get("gender") || "");
    const preferredTiming = String(formData.get("preferredTiming") || "");
    //optional fields --> set as null if not filled in
    const school = formData.get("school") ? String(formData.get("school")) : null;
    const academicGrades = formData.get("academicGrades") ? String(formData.get("academicGrades")) : null;
    const usualStudyPeriod = formData.get("usualStudyPeriod") ? String(formData.get("usualStudyPeriod")) : null;
  
    //validateEmail b4 creating "user" in database ie. a profile/account
    if (!validateEmail(email)) {
        return {success: false, message: "Invalid email. Please enter a valid school email (ending with '.edu.sg')"};
    }

    //validate enums
    if (!Object.values(EducationLevel).includes(eduLevel as EducationLevel)) {
        throw new Error("Invalid education level");
    }

    if (!yearOptions[eduLevel as EducationLevel].includes(yearOfStudy as YearOfStudy)) {
        throw new Error("Year of study does not match education level");
    }

    if (!Object.values(Gender).includes(gender as Gender)) {
        throw new Error("Invalid gender");
    }

    //check if username is unique or if email already being used in database
    const existingUser = await prisma.user.findFirst({
        where: { OR: [{username}, {email}]},
    })
    if (existingUser) {
        return {success: false, message: "Username or email already exists. Please enter a new username or email"};
    }

    //validate password
    const pwCheck = validatePassword(password);
    if (!pwCheck.success) {
        throw new Error(pwCheck.message || "Invalid password!");
    }

    //hash the password
    const passwordHash = await bcrypt.hash(password, 10)

    //create user with default inactive statuus
    const newUser = await prisma.user.create({
        data: {
            username,
            email,
            passwordHash,
            eduLevel: eduLevel as EducationLevel, 
            yearOfStudy: yearOfStudy as YearOfStudy,
            gender: gender as Gender,
            preferredTiming, 
            school,
            academicGrades,
            usualStudyPeriod,
            status: "INACTIVE",
        }
    })

    await sendVerificationCode(newUser.id); //front end to call verifyCode() when user submits code or sendVerificationCode() if user request for new verification code

    revalidatePath("/login");
    return{
        success: true, 
        message: "Account created successfully! A verification code has been sent to the registered email address."
    }
}
