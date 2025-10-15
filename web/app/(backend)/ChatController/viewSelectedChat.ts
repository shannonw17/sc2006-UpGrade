"use server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
//when user clicks into a specific chat

//@frontend :
//check if senderId is userId or otherId for each message:messages for diff appearance of message

export async function viewSelectedChat(userId: string, otherId: string) {    
    const messages = await prisma.message.findMany({
        where: {
            OR: [
                {senderId: userId, receiverId: otherId},
                {senderId: otherId, receiverId: userId},
            ],
        },
        orderBy: {createdAt: "asc"} //earlier msgs first ie. at top
    });
    revalidatePath("/chats");
    return messages;
}