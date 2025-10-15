"use server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

//deletes for both ends, user can only delete the message they sent, cannot delete message from other sender
export async function deleteMessage(messageId: string, userId: string) {
    if (!messageId) throw new Error("Missing message");
    const message = await prisma.message.findUnique({where: {id: messageId}});
    if (!message) throw new Error("Message not found");
    if (message.senderId !== userId) throw new Error ("Not authorised to delete this message");

    await prisma.message.delete({
        where: {id: messageId},
    });
    revalidatePath("/chats");
}