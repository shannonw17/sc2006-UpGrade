"use server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

//send 1st message to group host via button at GroupPage (public) OR when view details of group at InboxPage (private)
    //receiverId = hostId

//afterwards send message within private 1-to-1 chat

export async function sendMessage(senderId: string, receiverId: string, text: string) {
    if (!text.trim()) throw new Error("Message cannot be empty.");

    const messsage = await prisma.message.create({
        data: {
            senderId,
            receiverId,
            message: text.trim() //remove whitespace at front and end
        },
    });
    revalidatePath("/chats");
}