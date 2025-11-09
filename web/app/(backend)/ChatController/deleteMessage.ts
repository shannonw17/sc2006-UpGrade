"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";


//delete a message (only allowed for the sender)
//if message already deleted or not found, it safely ignores it

export async function deleteMessage(messageId: string, userId: string) {
  if (!messageId) throw new Error("Missing message");

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  //handle if already deleted or nonexistent
  if (!message) {
    console.warn(`Message ${messageId} not found — skipping delete`);
    return;
  }

  if (message.senderId !== userId) {
    throw new Error("Not authorised to delete this message");
  }

  await prisma.message.delete({
    where: { id: messageId },
  });

  //revalidate the chat view to reflect changes
  revalidatePath("/chats");
}
