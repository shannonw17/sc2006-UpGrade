// when click on "edit profile" button in profile page --> can edit all fields (but check that mandatory fields are all filled) --> else prompt error message

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function editProfile(){

    revalidatePath("/myprofile");
}
