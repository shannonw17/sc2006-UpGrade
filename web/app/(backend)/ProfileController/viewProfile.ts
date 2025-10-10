//display all attributes of user
"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function viewProfile(){


    revalidatePath("/myprofile");
}

//if enum EducationalLevel = "UNI" --> display as "University" (?) or can js stay as it is