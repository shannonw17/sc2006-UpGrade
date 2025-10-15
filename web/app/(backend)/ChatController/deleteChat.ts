"use server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

//deletes for both ends
export async function deleteChat(userId: string, otherId: string) {
    await prisma.message.deleteMany({
        where: {
            OR: [
                {senderId: userId, receiverId: otherId},
                {senderId: otherId, receiverId: userId},
            ],
        },
    });
    revalidatePath("/chats");
}