"use server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/requireUser";

//deletes for both ends
export async function deleteChat(chatId: string) {
  const currentUser = await requireUser();
  const [user1Id, user2Id] = chatId.split("-");
  const otherUserId = user1Id === currentUser.id ? user2Id : user1Id;

  await prisma.message.deleteMany({
    where: {
      OR: [
        { senderId: currentUser.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUser.id },
      ],
    },
  });
  
  revalidatePath("/chats");
}