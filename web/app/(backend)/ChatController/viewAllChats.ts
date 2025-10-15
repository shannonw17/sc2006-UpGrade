"use server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/requireUser";

// in chat page, can view all the chats the current user has with other users

export async function viewAllChats(userId: string) {
    const chats = await prisma.message.findMany({
        where: {
            OR: [
                {senderId: userId},
                {receiverId: userId},
            ],
        },
        orderBy: {createdAt: "desc"} //display most recent chat at top
    });
}