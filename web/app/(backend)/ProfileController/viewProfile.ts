"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function viewProfile(){

    revalidatePath("/myprofile");
}