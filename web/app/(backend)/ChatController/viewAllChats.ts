"use server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

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
    const chatFriends = Array.from(
        new Set(
            chats.map(m=> (m.senderId === userId? m.receiverId : m.senderId))
        )
    ); //return ids of users that current user have chat with
    const friends = await prisma.user.findMany({
        where: {id: {in: chatFriends}},
        select: {username: true},
    });
    revalidatePath("/chats");
    return friends;
}